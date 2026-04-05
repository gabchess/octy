/**
 * CoinGecko Service — Price data for Section 4 (Market Context).
 * Free public API, no auth needed.
 */

import type { CoinGeckoPriceResponse, CoinGeckoServiceResult } from "../types";

const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";

// Map protocol/topic names to CoinGecko IDs
const COINGECKO_ID_MAP: Readonly<Record<string, string>> = {
  aave: "aave",
  compound: "compound-governance-token",
  uniswap: "uniswap",
  curve: "curve-dao-token",
  lido: "lido-dao",
  maker: "maker",
  pendle: "pendle",
  yearn: "yearn-finance",
  convex: "convex-finance",
  morpho: "morpho",
  spark: "spark",
  eigenlayer: "eigenlayer",
  ethena: "ethena-usde",
  ethereum: "ethereum",
  solana: "solana",
  arbitrum: "arbitrum",
  optimism: "optimism",
  polygon: "matic-network",
  avalanche: "avalanche-2",
  base: "base-protocol",
  sky: "sky-utility",
};

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function resolveCoinGeckoId(topic: string): string | null {
  const lower = topic.toLowerCase();
  for (const [key, id] of Object.entries(COINGECKO_ID_MAP)) {
    if (lower.includes(key)) return id;
  }
  return null;
}

export async function fetchCoinGeckoData(
  topic: string,
): Promise<CoinGeckoServiceResult> {
  const coinId = resolveCoinGeckoId(topic);
  if (!coinId) {
    return { marketContext: "" };
  }

  const url = `${COINGECKO_URL}?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

  const response = await fetch(url, {
    headers: { "User-Agent": "octy-agent/0.1.0" },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    return { marketContext: "" };
  }

  const json = (await response.json()) as CoinGeckoPriceResponse;
  const data = json[coinId];
  if (!data) {
    return { marketContext: "" };
  }

  const lines: string[] = [];
  lines.push(`**${topic}** Token Price:`);
  lines.push(`- Current Price: ${formatUSD(data.usd)}`);

  if (data.usd_24h_change != null) {
    const sign = data.usd_24h_change >= 0 ? "+" : "";
    lines.push(`- 24h Change: ${sign}${data.usd_24h_change.toFixed(2)}%`);
  }

  if (data.usd_market_cap != null && data.usd_market_cap > 0) {
    lines.push(`- Market Cap: ${formatUSD(data.usd_market_cap)}`);
  }

  return { marketContext: lines.join("\n") };
}
