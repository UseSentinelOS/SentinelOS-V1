import { storage } from "./storage";
import type { InsertDiscoveredToken } from "@shared/schema";

const AXIOM_PULSE_API = "https://axiom.trade/api/pulse";

interface AxiomToken {
  mint: string;
  symbol?: string;
  name?: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  holders?: number;
  liquidity?: number;
  createdAt?: string;
}

interface AxiomPulseResponse {
  tokens?: AxiomToken[];
  data?: AxiomToken[];
  success?: boolean;
}

const FALLBACK_TOKENS: AxiomToken[] = [
  {
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    price: 0.000018,
    priceChange24h: 5.2,
    volume24h: 12000000,
    marketCap: 950000000,
    liquidity: 8500000,
    holders: 850000,
  },
  {
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    price: 0.85,
    priceChange24h: -2.1,
    volume24h: 45000000,
    marketCap: 1200000000,
    liquidity: 25000000,
    holders: 450000,
  },
  {
    mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    symbol: "WIF",
    name: "dogwifhat",
    price: 2.15,
    priceChange24h: 8.5,
    volume24h: 180000000,
    marketCap: 2150000000,
    liquidity: 35000000,
    holders: 320000,
  },
  {
    mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    symbol: "POPCAT",
    name: "Popcat",
    price: 0.42,
    priceChange24h: 12.3,
    volume24h: 25000000,
    marketCap: 420000000,
    liquidity: 12000000,
    holders: 180000,
  },
  {
    mint: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
    symbol: "RENDER",
    name: "Render Token",
    price: 4.25,
    priceChange24h: -1.8,
    volume24h: 35000000,
    marketCap: 1650000000,
    liquidity: 28000000,
    holders: 125000,
  },
];

function calculateRiskScore(token: AxiomToken): number {
  let score = 5;
  
  if (token.holders !== undefined) {
    if (token.holders < 50) score += 3;
    else if (token.holders < 200) score += 1;
    else if (token.holders > 1000) score -= 2;
  }
  
  if (token.liquidity !== undefined) {
    if (token.liquidity < 1000) score += 3;
    else if (token.liquidity < 10000) score += 1;
    else if (token.liquidity > 100000) score -= 2;
  }
  
  if (token.volume24h !== undefined) {
    if (token.volume24h < 100) score += 2;
    else if (token.volume24h > 10000) score -= 1;
  }
  
  const ageHours = token.createdAt 
    ? (Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60)
    : 0;
  if (ageHours < 1) score += 2;
  else if (ageHours < 24) score += 1;
  else if (ageHours > 168) score -= 1;
  
  return Math.max(1, Math.min(10, score));
}

export async function fetchAxiomPulseTokens(): Promise<AxiomToken[]> {
  try {
    const response = await fetch(`${AXIOM_PULSE_API}?chain=sol`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "SentinelOS/1.0",
      },
    });
    
    if (!response.ok) {
      console.error(`Axiom API error: ${response.status} - using fallback token data`);
      return FALLBACK_TOKENS;
    }
    
    const data: AxiomPulseResponse = await response.json();
    return data.tokens || data.data || [];
  } catch (error) {
    console.error("Error fetching Axiom Pulse tokens - using fallback:", error);
    return FALLBACK_TOKENS;
  }
}

export async function ingestAxiomTokens(): Promise<number> {
  const tokens = await fetchAxiomPulseTokens();
  let ingested = 0;
  
  for (const token of tokens) {
    if (!token.mint) continue;
    
    try {
      const existing = await storage.getDiscoveredToken(token.mint);
      const riskScore = calculateRiskScore(token);
      
      const tokenData: InsertDiscoveredToken = {
        mintAddress: token.mint,
        symbol: token.symbol || null,
        name: token.name || null,
        price: token.price || null,
        priceChange24h: token.priceChange24h || null,
        volume24h: token.volume24h || null,
        marketCap: token.marketCap || null,
        holders: token.holders || null,
        riskScore,
        source: "axiom",
        metadata: {
          liquidity: token.liquidity,
          createdAt: token.createdAt,
        },
      };
      
      if (existing) {
        await storage.updateDiscoveredToken(existing.id, tokenData);
      } else {
        await storage.createDiscoveredToken(tokenData);
        ingested++;
      }
    } catch (error) {
      console.error(`Error processing token ${token.mint}:`, error);
    }
  }
  
  console.log(`Axiom Pulse: Ingested ${ingested} new tokens, updated ${tokens.length - ingested} existing`);
  return ingested;
}

let pulseInterval: NodeJS.Timeout | null = null;

export function startAxiomPulsePolling(intervalMs: number = 60000): void {
  if (pulseInterval) {
    clearInterval(pulseInterval);
  }
  
  console.log(`Starting Axiom Pulse polling every ${intervalMs / 1000}s`);
  
  ingestAxiomTokens().catch(console.error);
  
  pulseInterval = setInterval(() => {
    ingestAxiomTokens().catch(console.error);
  }, intervalMs);
}

export function stopAxiomPulsePolling(): void {
  if (pulseInterval) {
    clearInterval(pulseInterval);
    pulseInterval = null;
    console.log("Stopped Axiom Pulse polling");
  }
}
