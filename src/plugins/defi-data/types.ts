/**
 * DeFi Data Plugin — Shared Types
 * API response shapes for DeFiLlama and CoinGecko.
 */

// DeFiLlama yields API — https://yields.llama.fi/pools
export interface DefiLlamaPool {
  pool: string; // pool address / id
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
}

export interface DefiLlamaYieldsResponse {
  status: string;
  data: DefiLlamaPool[];
}

// DeFiLlama protocols API — https://api.llama.fi/protocols
export interface DefiLlamaProtocol {
  name: string;
  slug: string;
  symbol: string;
  category: string;
  chain: string;
  chains: string[];
  tvl: number;
}

// DeFiLlama fees API — https://api.llama.fi/summary/fees/{slug}
export interface DefiLlamaFees {
  total24h: number | null;
  total7d: number | null;
  total30d: number | null;
  totalAllTime: number | null;
}

// DeFiLlama protocol detail — https://api.llama.fi/protocol/{slug}
export interface DefiLlamaProtocolDetail {
  name: string;
  slug: string;
  symbol: string;
  category: string;
  chains: string[];
  tvl: number;
  currentChainTvls?: Record<string, number>;
  tvlHistory?: Array<{ date: number; totalLiquidityUSD: number }>;
}

// CoinGecko prices — https://api.coingecko.com/api/v3/simple/price
export type CoinGeckoPriceResponse = Record<
  string,
  { usd: number; usd_24h_change?: number }
>;
