import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertAgentSchema, insertTransactionSchema, insertActivityLogSchema, insertWatchlistSchema } from "@shared/schema";
import { z } from "zod";
import { getAgentDecision, analyzeMarketConditions, processAutoTrades } from "./ai-agent";
import { getQuote, getSwapTransaction, getTokenPrice, POPULAR_TOKENS, SOL_MINT } from "./jupiter";
import { ZKEngine, createPrivateTransaction, verifyPrivateTransaction, generateBalanceProof, verifyBalanceProof } from "./zk-engine";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { generateNonce, createSignMessage, authenticateUser } from "./auth";
import { ingestAxiomTokens, startAxiomPulsePolling } from "./axiom-pulse";

const clients = new Set<WebSocket>();

function broadcast(type: string, data: unknown) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("WebSocket client connected");

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ type: "connected", data: { message: "Connected to SentinelOS" }, timestamp: Date.now() }));
  });

  app.post("/api/auth/nonce", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      const nonce = generateNonce();
      const message = createSignMessage(nonce, walletAddress);
      
      let user = await storage.getUserByWallet(walletAddress);
      if (user) {
        await storage.updateUser(user.id, { nonce });
      } else {
        user = await storage.createUser({ walletAddress, nonce });
      }
      
      res.json({ nonce, message });
    } catch (error) {
      console.error("Error generating nonce:", error);
      res.status(500).json({ error: "Failed to generate nonce" });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { walletAddress, signature, message } = req.body;
      if (!walletAddress || !signature || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const user = await authenticateUser(walletAddress, signature, message);
      const managedWallet = await storage.getManagedWalletByUser(user.id);
      
      res.json({
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
        managedWallet: managedWallet ? {
          id: managedWallet.id,
          publicKey: managedWallet.publicKey,
          balance: managedWallet.balance,
          status: managedWallet.status,
        } : null,
      });
    } catch (error) {
      console.error("Auth verification error:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const managedWallet = await storage.getManagedWalletByUser(user.id);
      
      res.json({
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
        managedWallet: managedWallet ? {
          id: managedWallet.id,
          publicKey: managedWallet.publicKey,
          balance: managedWallet.balance,
          status: managedWallet.status,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/profile", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { username, avatarUrl } = req.body;
      const updated = await storage.updateUser(user.id, { username, avatarUrl });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/managed-wallet", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const managedWallet = await storage.getManagedWalletByUser(user.id);
      if (!managedWallet) {
        return res.status(404).json({ error: "No managed wallet found" });
      }
      
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      try {
        const balance = await connection.getBalance(new PublicKey(managedWallet.publicKey));
        const solBalance = balance / LAMPORTS_PER_SOL;
        await storage.updateManagedWallet(managedWallet.id, { balance: solBalance });
        managedWallet.balance = solBalance;
      } catch (e) {
        console.error("Error fetching managed wallet balance:", e);
      }
      
      res.json({
        id: managedWallet.id,
        publicKey: managedWallet.publicKey,
        balance: managedWallet.balance,
        status: managedWallet.status,
      });
    } catch (error) {
      console.error("Error fetching managed wallet:", error);
      res.status(500).json({ error: "Failed to fetch managed wallet" });
    }
  });

  app.get("/api/managed-wallet/transactions", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const managedWallet = await storage.getManagedWalletByUser(user.id);
      if (!managedWallet) {
        return res.status(404).json({ error: "No managed wallet found" });
      }
      
      const transactions = await storage.getWalletTransactions(managedWallet.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/tokens/discovered", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const tokens = await storage.getDiscoveredTokens(limit);
      res.json(tokens);
    } catch (error) {
      console.error("Error fetching discovered tokens:", error);
      res.status(500).json({ error: "Failed to fetch discovered tokens" });
    }
  });
  
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const validatedData = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(validatedData);
      
      await storage.createActivityLog({
        agentId: agent.id,
        action: "Agent deployed",
        details: `${agent.name} has been created with task type: ${agent.taskType}`,
        level: "success",
      });
      
      broadcast("agent_created", agent);
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid agent data", details: error.errors });
      }
      console.error("Error creating agent:", error);
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.updateAgent(id, req.body);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      if (req.body.status) {
        await storage.createActivityLog({
          agentId: agent.id,
          action: `Agent status changed to ${req.body.status}`,
          details: `${agent.name} is now ${req.body.status}`,
          level: "info",
        });
        broadcast("agent_status_changed", { agent, newStatus: req.body.status });
      }
      
      broadcast("agent_updated", agent);
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      const deleted = await storage.deleteAgent(id);
      if (deleted) {
        broadcast("agent_deleted", { id, name: agent.name });
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete agent" });
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const transactions = await storage.getTransactions(agentId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      const agent = await storage.getAgent(transaction.agentId);
      if (agent) {
        await storage.updateAgent(agent.id, {
          totalTransactions: (agent.totalTransactions || 0) + 1,
        });
        
        await storage.createActivityLog({
          agentId: agent.id,
          action: `Transaction ${transaction.txType}`,
          details: `${transaction.amount || 0} ${transaction.tokenSymbol || "SOL"}`,
          level: "info",
        });
      }
      
      broadcast("transaction_created", transaction);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/activity-logs", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getActivityLogs(agentId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/activity-logs/recent", async (req, res) => {
    try {
      const logs = await storage.getActivityLogs(undefined, 20);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching recent activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.post("/api/activity-logs", async (req, res) => {
    try {
      const validatedData = insertActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid log data", details: error.errors });
      }
      console.error("Error creating activity log:", error);
      res.status(500).json({ error: "Failed to create activity log" });
    }
  });

  app.post("/api/agents/:id/decide", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const marketData = req.body.marketData;
      const decision = await getAgentDecision(agent, marketData);
      
      res.json(decision);
    } catch (error) {
      console.error("Error getting agent decision:", error);
      res.status(500).json({ error: "Failed to get agent decision" });
    }
  });

  app.post("/api/agents/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const { action, parameters } = req.body;

      if (agent.status !== "running") {
        return res.status(400).json({ error: "Agent must be running to execute actions" });
      }

      const tokenMints: Record<string, string> = {
        "SOL": "So11111111111111111111111111111111111111112",
        "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        "JUP": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        "ORCA": "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
      };

      let result: Record<string, unknown> = {};

      switch (action) {
        case "swap": {
          const inputToken = parameters?.inputToken || "SOL";
          const outputToken = parameters?.outputToken || "USDC";
          const amount = parameters?.amount || 0.01;
          
          const inputMint = tokenMints[inputToken] || tokenMints["SOL"];
          const outputMint = tokenMints[outputToken] || tokenMints["USDC"];
          const inputDecimals = inputToken === "SOL" ? 9 : 6;
          const amountLamports = Math.floor(amount * Math.pow(10, inputDecimals));
          
          const quote = await getQuote(inputMint, outputMint, amountLamports, 50);
          const outputDecimals = outputToken === "SOL" ? 9 : 6;
          const outputAmount = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);
          
          result = {
            action: "swap",
            inputToken,
            outputToken,
            inputAmount: amount,
            outputAmount: outputAmount.toFixed(6),
            quote,
            status: "quote_ready",
            message: "Swap quote ready - awaiting wallet signature for execution",
          };

          await storage.createActivityLog({
            agentId: agent.id,
            action: `Swap quote`,
            details: `Quote: ${amount} ${inputToken} -> ${outputAmount.toFixed(4)} ${outputToken}`,
            level: "success",
          });
          break;
        }
        case "stake": {
          const token = parameters?.token || "SOL";
          const amount = parameters?.amount || 0.01;
          const apy = 5.5 + Math.random() * 3;
          
          result = {
            action: "stake",
            token,
            amount,
            apy: apy.toFixed(2),
            status: "pending",
            message: "Staking action prepared - awaiting execution",
          };

          await storage.createActivityLog({
            agentId: agent.id,
            action: `Stake prepared`,
            details: `Ready to stake ${amount} ${token} at ~${apy.toFixed(2)}% APY`,
            level: "info",
          });
          break;
        }
        case "monitor":
        case "wait": {
          result = {
            action,
            status: "acknowledged",
            message: "Agent is monitoring market conditions",
          };

          await storage.createActivityLog({
            agentId: agent.id,
            action: `Agent ${action}ing`,
            details: `${agent.name} is ${action === "monitor" ? "monitoring" : "waiting for"} optimal conditions`,
            level: "info",
          });
          break;
        }
        default: {
          result = {
            action,
            status: "unknown_action",
          };
        }
      }

      await storage.updateAgent(id, {
        totalTransactions: (agent.totalTransactions || 0) + (action === "swap" || action === "stake" ? 1 : 0),
      });

      broadcast("agent_action_executed", { agent, action, result });
      res.json(result);
    } catch (error) {
      console.error("Error executing agent action:", error);
      res.status(500).json({ error: "Failed to execute agent action" });
    }
  });

  app.get("/api/market/analyze", async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || "SOL";
      const analysis = await analyzeMarketConditions(symbol);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing market:", error);
      res.status(500).json({ error: "Failed to analyze market" });
    }
  });

  app.get("/api/swap/tokens", async (req, res) => {
    try {
      res.json(POPULAR_TOKENS);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      res.status(500).json({ error: "Failed to fetch tokens" });
    }
  });

  app.get("/api/swap/price/:mint", async (req, res) => {
    try {
      const { mint } = req.params;
      const price = await getTokenPrice(mint);
      res.json({ mint, price });
    } catch (error) {
      console.error("Error fetching price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  app.post("/api/swap/quote", async (req, res) => {
    try {
      const { inputMint, outputMint, amount, slippageBps } = req.body;
      
      if (!inputMint || !outputMint || !amount) {
        return res.status(400).json({ error: "Missing required fields: inputMint, outputMint, amount" });
      }

      const quote = await getQuote(inputMint, outputMint, amount, slippageBps || 50);
      broadcast("swap_quote", { inputMint, outputMint, amount, quote });
      res.json(quote);
    } catch (error) {
      console.error("Error getting swap quote:", error);
      res.status(500).json({ error: "Failed to get swap quote" });
    }
  });

  app.post("/api/swap/transaction", async (req, res) => {
    try {
      const { quoteResponse, userPublicKey } = req.body;
      
      if (!quoteResponse || !userPublicKey) {
        return res.status(400).json({ error: "Missing required fields: quoteResponse, userPublicKey" });
      }

      const swapTx = await getSwapTransaction(quoteResponse, userPublicKey);
      broadcast("swap_transaction_created", { userPublicKey });
      res.json(swapTx);
    } catch (error) {
      console.error("Error creating swap transaction:", error);
      res.status(500).json({ error: "Failed to create swap transaction" });
    }
  });

  app.post("/api/zk/commitment", async (req, res) => {
    try {
      const { amount, recipient } = req.body;
      
      if (!amount || !recipient) {
        return res.status(400).json({ error: "Missing required fields: amount, recipient" });
      }

      const secret = require("crypto").randomBytes(32).toString("hex");
      const commitment = ZKEngine.generateCommitment(amount, recipient, secret);
      
      res.json({ commitment, secret });
    } catch (error) {
      console.error("Error generating commitment:", error);
      res.status(500).json({ error: "Failed to generate commitment" });
    }
  });

  app.post("/api/zk/generate-proof", async (req, res) => {
    try {
      const { statement, publicInputs } = req.body;
      
      if (!statement) {
        return res.status(400).json({ error: "Missing statement" });
      }

      const proof = ZKEngine.generateZKProof(statement, publicInputs || {});
      res.json(proof);
    } catch (error) {
      console.error("Error generating proof:", error);
      res.status(500).json({ error: "Failed to generate proof" });
    }
  });

  app.post("/api/zk/verify-proof", async (req, res) => {
    try {
      const { proof, statement } = req.body;
      
      if (!proof || !statement) {
        return res.status(400).json({ error: "Missing proof or statement" });
      }

      const isValid = ZKEngine.verifyZKProof(proof, statement);
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error verifying proof:", error);
      res.status(500).json({ error: "Failed to verify proof" });
    }
  });

  app.post("/api/wallet/deposit", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const managedWallet = await storage.getManagedWalletByUser(user.id);
      if (!managedWallet) {
        return res.status(404).json({ error: "No managed wallet found" });
      }
      
      const { amount, txHash } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      const tx = await storage.createWalletTransaction({
        userId: user.id,
        walletId: managedWallet.id,
        txHash: txHash || null,
        txType: "deposit",
        direction: "in",
        amount,
        tokenMint: SOL_MINT,
        tokenSymbol: "SOL",
        status: txHash ? "pending" : "awaiting_deposit",
      });
      
      broadcast("deposit_initiated", { 
        userId: user.id, 
        amount, 
        managedWalletAddress: managedWallet.publicKey,
        transactionId: tx.id,
      });
      
      res.json({
        transactionId: tx.id,
        depositAddress: managedWallet.publicKey,
        amount,
        status: tx.status,
        message: `Send ${amount} SOL to ${managedWallet.publicKey} to complete deposit`,
      });
    } catch (error) {
      console.error("Error initiating deposit:", error);
      res.status(500).json({ error: "Failed to initiate deposit" });
    }
  });

  app.post("/api/wallet/deposit/confirm", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const managedWallet = await storage.getManagedWalletByUser(user.id);
      if (!managedWallet) {
        return res.status(404).json({ error: "No managed wallet found" });
      }
      
      const { transactionId, txHash } = req.body;
      if (!transactionId) {
        return res.status(400).json({ error: "Transaction ID required" });
      }
      
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const balance = await connection.getBalance(new PublicKey(managedWallet.publicKey));
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      await storage.updateManagedWallet(managedWallet.id, { balance: solBalance });
      await storage.updateWalletTransaction(transactionId, { 
        status: "confirmed",
        txHash: txHash || null,
      });
      
      broadcast("deposit_confirmed", { userId: user.id, balance: solBalance });
      
      res.json({
        success: true,
        balance: solBalance,
        message: "Deposit confirmed",
      });
    } catch (error) {
      console.error("Error confirming deposit:", error);
      res.status(500).json({ error: "Failed to confirm deposit" });
    }
  });

  app.post("/api/wallet/withdraw", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const managedWallet = await storage.getManagedWalletByUser(user.id);
      if (!managedWallet) {
        return res.status(404).json({ error: "No managed wallet found" });
      }
      
      const { amount, destinationAddress } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      const destination = destinationAddress || walletAddress;
      
      if ((managedWallet.balance || 0) < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const tx = await storage.createWalletTransaction({
        userId: user.id,
        walletId: managedWallet.id,
        txHash: null,
        txType: "withdraw",
        direction: "out",
        amount,
        tokenMint: SOL_MINT,
        tokenSymbol: "SOL",
        status: "pending",
      });
      
      broadcast("withdraw_initiated", { 
        userId: user.id, 
        amount,
        destination,
        transactionId: tx.id,
      });
      
      res.json({
        transactionId: tx.id,
        amount,
        destination,
        status: "pending",
        message: "Withdrawal request submitted. Please sign the transaction to complete.",
      });
    } catch (error) {
      console.error("Error initiating withdrawal:", error);
      res.status(500).json({ error: "Failed to initiate withdrawal" });
    }
  });

  app.get("/api/watchlist", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const watchlist = await storage.getWatchlist(user.id);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const data = insertWatchlistSchema.parse({ ...req.body, userId: user.id });
      const item = await storage.createWatchlistItem(data);
      
      broadcast("watchlist_added", { userId: user.id, item });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  app.patch("/api/watchlist/:id", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const item = await storage.getWatchlistItem(id);
      if (!item) {
        return res.status(404).json({ error: "Watchlist item not found" });
      }
      
      const updated = await storage.updateWatchlistItem(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating watchlist item:", error);
      res.status(500).json({ error: "Failed to update watchlist item" });
    }
  });

  app.delete("/api/watchlist/:id", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWatchlistItem(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Watchlist item not found" });
      }
    } catch (error) {
      console.error("Error deleting watchlist item:", error);
      res.status(500).json({ error: "Failed to delete watchlist item" });
    }
  });

  app.post("/api/tokens/refresh", async (req, res) => {
    try {
      const count = await ingestAxiomTokens();
      res.json({ success: true, ingestedCount: count });
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      res.status(500).json({ error: "Failed to refresh tokens" });
    }
  });

  app.post("/api/trades/auto-execute", async (req, res) => {
    try {
      const walletAddress = req.headers["x-wallet-address"] as string;
      if (!walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const results = await processAutoTrades(user.id);
      broadcast("auto_trades_processed", { userId: user.id, results });
      res.json({ success: true, trades: results });
    } catch (error) {
      console.error("Error processing auto trades:", error);
      res.status(500).json({ error: "Failed to process auto trades" });
    }
  });

  startAxiomPulsePolling(120000);

  app.post("/api/zk/balance-proof", async (req, res) => {
    try {
      const { actualBalance, minRequired, publicKey } = req.body;
      
      if (actualBalance === undefined || minRequired === undefined || !publicKey) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const proof = generateBalanceProof(actualBalance, minRequired, publicKey);
      res.json(proof);
    } catch (error) {
      console.error("Error generating balance proof:", error);
      res.status(500).json({ error: "Failed to generate balance proof" });
    }
  });

  app.post("/api/zk/verify-balance", async (req, res) => {
    try {
      const { proof, minRequired } = req.body;
      
      if (!proof || minRequired === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const isValid = verifyBalanceProof(proof, minRequired);
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error verifying balance:", error);
      res.status(500).json({ error: "Failed to verify balance" });
    }
  });

  app.post("/api/zk/encrypt", async (req, res) => {
    try {
      const { data, publicKey } = req.body;
      
      if (!data || !publicKey) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const encrypted = ZKEngine.encryptData(data, publicKey);
      res.json({ encrypted });
    } catch (error) {
      console.error("Error encrypting data:", error);
      res.status(500).json({ error: "Failed to encrypt data" });
    }
  });

  app.get("/api/wallet/balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ error: "Missing wallet address" });
      }

      const rpcEndpoints = [
        "https://api.mainnet-beta.solana.com",
        "https://rpc.ankr.com/solana",
        "https://solana-api.projectserum.com",
      ];

      let lastError: Error | null = null;
      
      for (const rpc of rpcEndpoints) {
        try {
          const connection = new Connection(rpc, "confirmed");
          const publicKey = new PublicKey(address);
          const balance = await connection.getBalance(publicKey);
          const solBalance = balance / LAMPORTS_PER_SOL;
          
          return res.json({ 
            balance: solBalance,
            address,
            network: "mainnet-beta",
            rpc
          });
        } catch (error) {
          console.error(`RPC ${rpc} failed:`, error);
          lastError = error as Error;
        }
      }

      res.status(503).json({ 
        error: "Unable to fetch balance - all RPC endpoints unavailable",
        message: "Network connectivity issue in development environment. Balance will work when app is published."
      });
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      res.status(500).json({ error: "Failed to fetch wallet balance" });
    }
  });

  return httpServer;
}
