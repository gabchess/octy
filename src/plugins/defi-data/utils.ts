/**
 * DeFi Data Plugin — Shared Utilities
 * Chain extraction, keyword matching, and formatting helpers.
 */

import type { DefiLlamaPool } from "./types";

// Supported chains — maps common user phrases to DeFiLlama chain names
const CHAIN_MAP: Record<string, string> = {
  ethereum: "Ethereum",
  eth: "Ethereum",
  arbitrum: "Arbitrum",
  arb: "Arbitrum",
  base: "Base",
  optimism: "Optimism",
  op: "Optimism",
  polygon: "Polygon",
  matic: "Polygon",
  solana: "Solana",
  sol: "Solana",
  avalanche: "Avalanche",
  avax: "Avalanche",
  bsc: "BSC",
  bnb: "BSC",
};

// DeFi category keywords
const DEFI_KEYWORDS = [
  "vault",
  "vaults",
  "lending",
  "lend",
  "borrow",
  "staking",
  "stake",
  "yield",
  "dex",
  "liquidity",
  "pool",
  "apy",
  "tvl",
  "protocol",
  "protocols",
  "compare",
  "rates",
  "farm",
  "farming",
  "defi",
  "aave",
  "morpho",
  "compound",
  "curve",
  "uniswap",
  "pendle",
  "yearn",
  "convex",
  "lido",
];

/**
 * Extracts the target chain from a message string.
 * Returns the DeFiLlama chain name, defaulting to "Ethereum".
 */
export function extractChain(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(CHAIN_MAP)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  return "Ethereum";
}

/**
 * Extracts a DeFi category keyword from a message string.
 * Returns the matched keyword or "all" as a default.
 */
export function extractKeyword(text: string): string {
  const lower = text.toLowerCase();
  // Priority order: more specific first
  const ordered = ["lending", "staking", "dex", "liquidity", "farm"];
  for (const kw of ordered) {
    if (lower.includes(kw)) return kw;
  }
  // Generic queries (vault, yield, defi, rates, compare) → return all pools
  return "all";
}

/**
 * Returns true if the message text contains DeFi-related keywords.
 * Used by providers to skip API calls for unrelated messages.
 */
export function isDeFiMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return DEFI_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Filters pools by chain and keyword, sorts by TVL, returns top N.
 * When keyword is "all", returns top pools regardless of project name.
 * When keyword is a specific category, filters by project/symbol match.
 */
export function filterTopPools(
  pools: DefiLlamaPool[],
  chain: string,
  keyword: string,
  limit = 20,
): DefiLlamaPool[] {
  const chainFiltered = pools.filter((p) => p.chain === chain);

  if (keyword === "all") {
    return chainFiltered.sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, limit);
  }

  const kw = keyword.toLowerCase();
  return chainFiltered
    .filter((p) => {
      const combined = `${p.project} ${p.symbol}`.toLowerCase();
      return combined.includes(kw);
    })
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, limit);
}

/**
 * Formats a number as a compact USD string (e.g., $1.23B, $456.7M).
 */
export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/**
 * Formats APY as a percentage string, handling null.
 */
export function formatAPY(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}%`;
}

/**
 * Formats a list of pools as a markdown table.
 */
export function formatPoolsTable(pools: DefiLlamaPool[]): string {
  if (pools.length === 0) return "No pools found matching the criteria.";

  const header =
    "| Protocol | Pool/Asset | TVL | APY (Base) | APY (Reward) |\n" +
    "|----------|-----------|-----|------------|--------------|";

  const rows = pools.map(
    (p) =>
      `| ${p.project} | ${p.symbol} | ${formatUSD(p.tvlUsd)} | ${formatAPY(p.apyBase)} | ${formatAPY(p.apyReward)} |`,
  );

  return [header, ...rows].join("\n");
}

/**
 * Extracts a protocol name from the message text.
 * Returns the matched name or null.
 */
export function extractProtocolName(text: string): string | null {
  const KNOWN_PROTOCOLS: Record<string, string> = {
    aave: "aave-v3",
    "aave v3": "aave-v3",
    "aave v2": "aave-v2",
    morpho: "morpho",
    "morpho blue": "morpho-blue",
    compound: "compound-v3",
    "compound v3": "compound-v3",
    curve: "curve-dex",
    uniswap: "uniswap-v3",
    "uniswap v3": "uniswap-v3",
    pendle: "pendle",
    yearn: "yearn-finance",
    convex: "convex-finance",
    lido: "lido",
    maker: "makerdao",
    spark: "spark",
  };

  const lower = text.toLowerCase();
  for (const [key, slug] of Object.entries(KNOWN_PROTOCOLS)) {
    if (lower.includes(key)) return slug;
  }
  return null;
}
