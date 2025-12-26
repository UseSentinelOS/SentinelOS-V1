import fetch from "node-fetch";

const JUPITER_API_BASE = "https://lite-api.jup.ag/swap/v1";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

export interface SwapRequest {
  userPublicKey: string;
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

export interface SwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number | bigint | string,
  slippageBps: number = 50
): Promise<JupiterQuote> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
  });

  const response = await fetch(`${JUPITER_API_BASE}/quote?${params}`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter quote failed: ${error}`);
  }

  return response.json() as Promise<JupiterQuote>;
}

export async function getSwapTransaction(
  quoteResponse: JupiterQuote,
  userPublicKey: string
): Promise<SwapTransaction> {
  const response = await fetch(`${JUPITER_API_BASE}/swap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 5000000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter swap failed: ${error}`);
  }

  return response.json() as Promise<SwapTransaction>;
}

export async function getTokenPrice(mint: string): Promise<number> {
  try {
    const response = await fetch(
      `https://price.jup.ag/v6/price?ids=${mint}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch price");
    }

    const data = await response.json() as { data: Record<string, { price: number }> };
    return data.data[mint]?.price || 0;
  } catch (error) {
    console.error("Error fetching token price:", error);
    return 0;
  }
}

export async function getSupportedTokens(): Promise<Array<{ address: string; symbol: string; name: string; decimals: number; logoURI?: string }>> {
  try {
    const response = await fetch("https://token.jup.ag/strict");
    
    if (!response.ok) {
      throw new Error("Failed to fetch tokens");
    }

    return response.json() as Promise<Array<{ address: string; symbol: string; name: string; decimals: number; logoURI?: string }>>;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return [];
  }
}

export const POPULAR_TOKENS = [
  { symbol: "SOL", mint: SOL_MINT, decimals: 9, name: "Solana" },
  { symbol: "USDC", mint: USDC_MINT, decimals: 6, name: "USD Coin" },
  { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, name: "Tether USD" },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5, name: "Bonk" },
  { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6, name: "Jupiter" },
  { symbol: "RAY", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", decimals: 6, name: "Raydium" },
  { symbol: "ORCA", mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", decimals: 6, name: "Orca" },
];
