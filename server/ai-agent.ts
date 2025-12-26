import OpenAI from "openai";
import { storage } from "./storage";
import type { Agent, WatchlistItem, DiscoveredToken } from "@shared/schema";
import { getQuote, getSwapTransaction, getTokenPrice, SOL_MINT } from "./jupiter";
import { Connection, Keypair, VersionedTransaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as crypto from "crypto";

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "sentinel-default-key-change-me!!!";
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

function decryptPrivateKey(encryptedKey: string): Uint8Array {
  try {
    const parts = encryptedKey.split(":");
    if (parts.length !== 2) throw new Error("Invalid encrypted key format");
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return new Uint8Array(JSON.parse(decrypted.toString()));
  } catch (error) {
    console.error("Error decrypting private key:", error);
    throw new Error("Failed to decrypt wallet key");
  }
}

async function getTokenBalance(
  connection: Connection,
  walletAddress: string,
  tokenMint: string
): Promise<{ balance: bigint; decimals: number; hasAccount: boolean }> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(tokenMint);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
      mint: mintPubkey,
    });
    
    if (tokenAccounts.value.length === 0) {
      return { balance: BigInt(0), decimals: 9, hasAccount: false };
    }
    
    const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
    return {
      balance: BigInt(accountInfo.tokenAmount.amount),
      decimals: accountInfo.tokenAmount.decimals,
      hasAccount: true,
    };
  } catch (error) {
    console.error("Error getting token balance:", error);
    return { balance: BigInt(0), decimals: 9, hasAccount: false };
  }
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface AgentDecision {
  action: "swap" | "stake" | "wait" | "monitor" | "alert";
  confidence: number;
  reasoning: string;
  parameters?: Record<string, unknown>;
}

export async function getAgentDecision(
  agent: Agent,
  marketData?: Record<string, unknown>
): Promise<AgentDecision> {
  const systemPrompt = `You are an AI agent for the SentinelOS DeFi platform on Solana. You are managing an autonomous trading agent.

Agent Configuration:
- Name: ${agent.name}
- Task Type: ${agent.taskType}
- Budget Limit: ${agent.budgetLimit} SOL
- Current Balance: ${agent.currentBalance} SOL
- Total Transactions: ${agent.totalTransactions}
- Success Rate: ${agent.successRate}%

Your task is to analyze the current situation and make a decision for this agent.
Available actions:
- swap: Execute a token swap
- stake: Stake tokens for yield
- wait: Wait for better conditions
- monitor: Continue monitoring without action
- alert: Alert the user about important conditions

Respond with a JSON object containing:
{
  "action": "one of the available actions",
  "confidence": 0-100 (how confident you are in this decision),
  "reasoning": "brief explanation of your decision",
  "parameters": {} (optional parameters for the action)
}`;

  const userPrompt = marketData
    ? `Current market conditions: ${JSON.stringify(marketData)}\n\nWhat action should the agent take?`
    : "What action should the agent take based on its current configuration?";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const decision = JSON.parse(content) as AgentDecision;
    
    await storage.createActivityLog({
      agentId: agent.id,
      action: `AI Decision: ${decision.action}`,
      details: decision.reasoning,
      level: "info",
    });

    return decision;
  } catch (error) {
    console.error("Error getting agent decision:", error);
    
    return {
      action: "wait",
      confidence: 50,
      reasoning: "Unable to make decision due to an error. Waiting for next cycle.",
    };
  }
}

export interface TradeExecution {
  success: boolean;
  action: "buy" | "sell" | "skip";
  tokenMint: string;
  tokenSymbol: string;
  amount?: number;
  price?: number;
  reason: string;
  txId?: string;
}

export async function analyzeWatchlistToken(
  watchlistItem: WatchlistItem,
  discoveredToken: DiscoveredToken | null
): Promise<TradeExecution> {
  if (!watchlistItem.autoTradeEnabled) {
    return {
      success: false,
      action: "skip",
      tokenMint: watchlistItem.tokenMint,
      tokenSymbol: watchlistItem.symbol || "UNKNOWN",
      reason: "Auto-trade not enabled for this token",
    };
  }

  const currentPrice = discoveredToken?.price || 0;
  if (!currentPrice) {
    return {
      success: false,
      action: "skip",
      tokenMint: watchlistItem.tokenMint,
      tokenSymbol: watchlistItem.symbol || "UNKNOWN",
      reason: "Unable to determine current price",
    };
  }

  if (watchlistItem.targetBuyPrice && currentPrice <= watchlistItem.targetBuyPrice) {
    return {
      success: true,
      action: "buy",
      tokenMint: watchlistItem.tokenMint,
      tokenSymbol: watchlistItem.symbol || "UNKNOWN",
      amount: watchlistItem.maxBuyAmount || 0.1,
      price: currentPrice,
      reason: `Price ${currentPrice} is at or below target buy price ${watchlistItem.targetBuyPrice}`,
    };
  }

  if (watchlistItem.targetSellPrice && currentPrice >= watchlistItem.targetSellPrice) {
    return {
      success: true,
      action: "sell",
      tokenMint: watchlistItem.tokenMint,
      tokenSymbol: watchlistItem.symbol || "UNKNOWN",
      amount: watchlistItem.maxBuyAmount || 0.1,
      price: currentPrice,
      reason: `Price ${currentPrice} is at or above target sell price ${watchlistItem.targetSellPrice}`,
    };
  }

  return {
    success: false,
    action: "skip",
    tokenMint: watchlistItem.tokenMint,
    tokenSymbol: watchlistItem.symbol || "UNKNOWN",
    reason: `Current price ${currentPrice} does not meet target conditions`,
  };
}

export async function executeAgentTrade(
  agent: Agent,
  tokenMint: string,
  action: "buy" | "sell",
  amount: number
): Promise<TradeExecution> {
  try {
    if (!agent.userId) {
      return {
        success: false,
        action,
        tokenMint,
        tokenSymbol: "UNKNOWN",
        reason: "Agent has no associated user",
      };
    }
    const managedWallet = await storage.getManagedWalletByUser(agent.userId);
    if (!managedWallet) {
      return {
        success: false,
        action,
        tokenMint,
        tokenSymbol: "UNKNOWN",
        reason: "No managed wallet found for user",
      };
    }

    if ((managedWallet.balance || 0) < amount && action === "buy") {
      return {
        success: false,
        action,
        tokenMint,
        tokenSymbol: "UNKNOWN",
        reason: `Insufficient balance: ${managedWallet.balance} SOL available, ${amount} SOL needed`,
      };
    }

    const inputMint = action === "buy" ? SOL_MINT : tokenMint;
    const outputMint = action === "buy" ? tokenMint : SOL_MINT;
    
    let inputAmount: number | bigint;
    const connection = new Connection(SOLANA_RPC);
    
    if (action === "buy") {
      inputAmount = Math.floor(amount * LAMPORTS_PER_SOL);
    } else {
      const { balance: tokenBalance, decimals, hasAccount } = await getTokenBalance(
        connection,
        managedWallet.publicKey,
        tokenMint
      );
      
      if (!hasAccount) {
        await storage.createActivityLog({
          agentId: agent.id,
          action: `Sell Skipped: ${tokenMint.slice(0, 8)}...`,
          details: `No token account found in wallet for this token`,
          level: "warning",
        });
        return {
          success: false,
          action,
          tokenMint,
          tokenSymbol: "UNKNOWN",
          reason: "No token account found. Token has never been held in this wallet.",
        };
      }
      
      if (tokenBalance === BigInt(0)) {
        await storage.createActivityLog({
          agentId: agent.id,
          action: `Sell Skipped: ${tokenMint.slice(0, 8)}...`,
          details: `Token account exists but balance is zero`,
          level: "warning",
        });
        return {
          success: false,
          action,
          tokenMint,
          tokenSymbol: "UNKNOWN",
          reason: "Token balance is zero. Nothing to sell.",
        };
      }
      
      inputAmount = tokenBalance;
      
      const divisor = BigInt(10) ** BigInt(decimals);
      const wholePart = tokenBalance / divisor;
      const fractionalPart = tokenBalance % divisor;
      const humanReadable = `${wholePart}.${fractionalPart.toString().padStart(decimals, '0').slice(0, 6)}`;
      
      await storage.createActivityLog({
        agentId: agent.id,
        action: `Sell Prepare: ${tokenMint.slice(0, 8)}...`,
        details: `Found ${humanReadable} tokens (${decimals} decimals) to sell`,
        level: "info",
      });
    }

    const quote = await getQuote(inputMint, outputMint, inputAmount);
    if (!quote) {
      return {
        success: false,
        action,
        tokenMint,
        tokenSymbol: "UNKNOWN",
        reason: "Failed to get quote from Jupiter",
      };
    }

    if (!managedWallet.encryptedSecretKey) {
      await storage.createActivityLog({
        agentId: agent.id,
        action: `Trade Signal: ${action.toUpperCase()} ${tokenMint.slice(0, 8)}...`,
        details: `Quote obtained but no private key available for execution. Manual execution required.`,
        level: "warning",
      });
      return {
        success: true,
        action,
        tokenMint,
        tokenSymbol: "UNKNOWN",
        amount,
        reason: `${action.toUpperCase()} quote ready. Awaiting manual approval for execution.`,
      };
    }

    try {
      const swapResult = await getSwapTransaction(quote, managedWallet.publicKey);
      if (!swapResult || !swapResult.swapTransaction) {
        throw new Error("Failed to get swap transaction from Jupiter");
      }

      const privateKeyBytes = decryptPrivateKey(managedWallet.encryptedSecretKey);
      const keypair = Keypair.fromSecretKey(privateKeyBytes);
      
      const connection = new Connection(SOLANA_RPC);
      const txBuffer = Buffer.from(swapResult.swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(txBuffer);
      transaction.sign([keypair]);
      
      const txId = await connection.sendTransaction(transaction, {
        skipPreflight: false,
        maxRetries: 3,
      });
      
      const confirmation = await connection.confirmTransaction(txId, "confirmed");
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      const newBalance = await connection.getBalance(keypair.publicKey);
      await storage.updateManagedWallet(managedWallet.id, { 
        balance: newBalance / LAMPORTS_PER_SOL 
      });

      await storage.createActivityLog({
        agentId: agent.id,
        action: `Trade Executed: ${action.toUpperCase()} ${tokenMint.slice(0, 8)}...`,
        details: `Successfully executed ${action} for ${amount} SOL. TX: ${txId}`,
        level: "success",
      });

      await storage.updateAgent(agent.id, {
        totalTransactions: (agent.totalTransactions || 0) + 1,
        currentBalance: newBalance / LAMPORTS_PER_SOL,
      });

      return {
        success: true,
        action,
        tokenMint,
        tokenSymbol: "UNKNOWN",
        amount,
        txId,
        reason: `${action.toUpperCase()} executed successfully. TX: ${txId}`,
      };
    } catch (execError) {
      console.error("Trade execution error:", execError);
      await storage.createActivityLog({
        agentId: agent.id,
        action: `Trade Failed: ${action.toUpperCase()} ${tokenMint.slice(0, 8)}...`,
        details: `Execution failed: ${execError instanceof Error ? execError.message : "Unknown error"}`,
        level: "error",
      });
      return {
        success: false,
        action,
        tokenMint,
        tokenSymbol: "UNKNOWN",
        amount,
        reason: `Execution failed: ${execError instanceof Error ? execError.message : "Unknown error"}`,
      };
    }
  } catch (error) {
    console.error(`Error executing agent trade:`, error);
    return {
      success: false,
      action,
      tokenMint,
      tokenSymbol: "UNKNOWN",
      reason: `Trade execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function processAutoTrades(userId: string): Promise<TradeExecution[]> {
  const watchlist = await storage.getWatchlist(userId);
  const results: TradeExecution[] = [];

  for (const item of watchlist) {
    if (!item.autoTradeEnabled) continue;

    const discoveredToken = await storage.getDiscoveredToken(item.tokenMint) || null;
    const analysis = await analyzeWatchlistToken(item, discoveredToken);

    if (analysis.action !== "skip" && analysis.success) {
      const agents = await storage.getAgentsByUser(userId);
      const activeAgent = agents.find(a => a.status === "active" && a.taskType === "token_sniper");
      
      if (activeAgent) {
        const execution = await executeAgentTrade(
          activeAgent,
          item.tokenMint,
          analysis.action,
          analysis.amount || 0.1
        );
        results.push(execution);
      } else {
        results.push({
          ...analysis,
          success: false,
          reason: "No active token_sniper agent found to execute trade",
        });
      }
    } else {
      results.push(analysis);
    }
  }

  return results;
}

export async function analyzeMarketConditions(
  tokenSymbol: string = "SOL"
): Promise<Record<string, unknown>> {
  const systemPrompt = `You are a market analysis AI for the SentinelOS DeFi platform. Generate realistic mock market data for demonstration purposes.

Generate a JSON object with current market conditions for ${tokenSymbol} including:
{
  "symbol": "${tokenSymbol}",
  "price": number (realistic SOL price in USD),
  "change24h": number (percentage change),
  "volume24h": number (in millions USD),
  "marketCap": number (in billions USD),
  "trend": "bullish" | "bearish" | "neutral",
  "signals": ["array of trading signals"],
  "recommendation": "brief recommendation"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Provide current market analysis for ${tokenSymbol}` },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing market:", error);
    return {
      symbol: tokenSymbol,
      price: 100,
      change24h: 0,
      volume24h: 1000,
      trend: "neutral",
      signals: [],
      recommendation: "Unable to analyze market conditions",
    };
  }
}
