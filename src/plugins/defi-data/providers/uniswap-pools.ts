/**
 * Uniswap v3 Subgraph Provider
 * Queries pool-level data (TVL, volume, fees) via The Graph decentralized network.
 * Requires GRAPH_API_KEY env var. Falls back gracefully when not configured.
 */

import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import type { ProviderResult } from "@elizaos/core";
import { isDeFiMessage, formatUSD } from "../utils";

// Uniswap v3 Ethereum subgraph on The Graph decentralized network
const SUBGRAPH_ID = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";

const DEX_KEYWORDS = [
  "dex",
  "swap",
  "liquidity",
  "uniswap",
  "pool",
  "trading",
  "volume",
  "amm",
];

interface UniswapPool {
  id: string;
  token0: { symbol: string };
  token1: { symbol: string };
  totalValueLockedUSD: string;
  volumeUSD: string;
  feeTier: string;
}

interface PoolDayData {
  date: number;
  volumeUSD: string;
  tvlUSD: string;
}

const TOP_POOLS_QUERY = `{
  pools(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    totalValueLockedUSD
    volumeUSD
    feeTier
  }
}`;

function formatFeeTier(feeTier: string): string {
  const bps = parseInt(feeTier, 10);
  return `${(bps / 10000).toFixed(2)}%`;
}

function formatPoolsTable(pools: UniswapPool[]): string {
  if (pools.length === 0) return "No pools found.";

  const header =
    "| Pair | TVL | Cumulative Volume | Fee Tier |\n" +
    "|------|-----|-------------------|----------|";

  const rows = pools.map((p) => {
    const pair = `${p.token0.symbol}/${p.token1.symbol}`;
    const tvl = formatUSD(parseFloat(p.totalValueLockedUSD));
    const volume = formatUSD(parseFloat(p.volumeUSD));
    const fee = formatFeeTier(p.feeTier);
    return `| ${pair} | ${tvl} | ${volume} | ${fee} |`;
  });

  return [header, ...rows].join("\n");
}

async function querySubgraph(apiKey: string, query: string): Promise<unknown> {
  const url = `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${SUBGRAPH_ID}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Graph API returned ${response.status}`);
  }

  const json = (await response.json()) as {
    data?: unknown;
    errors?: Array<{ message: string }>;
  };
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Graph query error: ${json.errors[0].message}`);
  }

  return json.data;
}

export const uniswapPoolsProvider = {
  name: "UNISWAP_POOLS",
  description:
    "Injects top Uniswap v3 pool data (TVL, volume, fees) into agent context for DEX/swap/liquidity queries.",
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    const text = message.content?.text ?? "";

    if (!isDeFiMessage(text)) {
      return {};
    }

    // Only activate for DEX/swap/liquidity queries
    const lower = text.toLowerCase();
    const isDexQuery = DEX_KEYWORDS.some((kw) => lower.includes(kw));
    if (!isDexQuery) {
      return {};
    }

    // Check for Graph API key
    const rawKey =
      runtime.getSetting("GRAPH_API_KEY") ?? process.env.GRAPH_API_KEY;
    const apiKey = typeof rawKey === "string" ? rawKey : undefined;

    if (!apiKey) {
      return {
        text: "[Uniswap data unavailable: GRAPH_API_KEY not configured. Set it in .env to enable Uniswap v3 pool data.]",
        data: { error: "GRAPH_API_KEY not configured" },
      };
    }

    try {
      const data = (await querySubgraph(apiKey, TOP_POOLS_QUERY)) as {
        pools: UniswapPool[];
      };

      const table = formatPoolsTable(data.pools);

      return {
        text: `## Top Uniswap v3 Pools (Ethereum)\n\n${table}\n\n*Source: Uniswap v3 subgraph via The Graph*`,
        data: { pools: data.pools },
      };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unknown error querying Uniswap subgraph";
      return {
        text: `[Uniswap pools provider error: ${msg}]`,
        data: { error: msg },
      };
    }
  },
};
