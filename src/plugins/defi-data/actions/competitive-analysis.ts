/**
 * COMPETITIVE_ANALYSIS Action
 * Fetches and formats a competitive table of DeFi pools for a given chain + category.
 */

import type {
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
} from "@elizaos/core";
import type { HandlerOptions } from "@elizaos/core";
import type {
  DefiLlamaYieldsResponse,
  DefiLlamaProtocol,
  DefiLlamaFees,
  DefiLlamaPool,
} from "../types";
import {
  extractChain,
  extractKeyword,
  filterTopPools,
  formatUSD,
  formatAPY,
  isDeFiMessage,
} from "../utils";

const YIELDS_URL = "https://yields.llama.fi/pools";
const PROTOCOLS_URL = "https://api.llama.fi/protocols";
const FEES_URL = "https://api.llama.fi/summary/fees";

async function fetchYieldPools(
  chain: string,
  keyword: string,
): Promise<DefiLlamaPool[]> {
  const response = await fetch(YIELDS_URL);
  if (!response.ok) throw new Error(`Yields API ${response.status}`);
  const json = (await response.json()) as DefiLlamaYieldsResponse;
  if (json.status !== "success") throw new Error("Yields API unexpected shape");
  return filterTopPools(json.data, chain, keyword);
}

async function fetchProtocolFees(slug: string): Promise<DefiLlamaFees | null> {
  try {
    const response = await fetch(`${FEES_URL}/${slug}`);
    if (!response.ok) return null;
    return (await response.json()) as DefiLlamaFees;
  } catch {
    return null;
  }
}

async function fetchTopProtocols(): Promise<DefiLlamaProtocol[]> {
  const response = await fetch(PROTOCOLS_URL);
  if (!response.ok) throw new Error(`Protocols API ${response.status}`);
  const all = (await response.json()) as DefiLlamaProtocol[];
  return all
    .filter((p) => p.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 50);
}

function formatCompetitiveTable(
  pools: DefiLlamaPool[],
  protocolFees: Map<string, DefiLlamaFees | null>,
): string {
  if (pools.length === 0) return "No matching pools found.";

  const header =
    "| Protocol | Pool/Asset | TVL | APY (Base) | APY (Reward) | 30d Fees |\n" +
    "|----------|-----------|-----|------------|--------------|----------|";

  const rows = pools.map((p) => {
    const fees = protocolFees.get(p.project.toLowerCase());
    const fees30d = fees?.total30d != null ? formatUSD(fees.total30d) : "—";
    return `| ${p.project} | ${p.symbol} | ${formatUSD(p.tvlUsd)} | ${formatAPY(p.apyBase)} | ${formatAPY(p.apyReward)} | ${fees30d} |`;
  });

  return [header, ...rows].join("\n");
}

export const competitiveAnalysisAction = {
  name: "COMPETITIVE_ANALYSIS",
  description:
    "Fetches real-time DeFi yield data from DeFiLlama and formats a competitive analysis table for a given chain and category (vaults, lending, staking, DEX).",
  similes: [
    "COMPARE_PROTOCOLS",
    "YIELD_COMPARISON",
    "DEFI_ANALYSIS",
    "PROTOCOL_COMPARISON",
    "TOP_VAULTS",
    "LENDING_RATES",
  ],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const text = message.content?.text ?? "";
    return isDeFiMessage(text);
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: HandlerOptions,
    callback?: HandlerCallback,
  ): Promise<ActionResult | void> => {
    const text = message.content?.text ?? "";
    const chain = extractChain(text);
    const keyword = extractKeyword(text);

    const errors: string[] = [];
    let pools: DefiLlamaPool[] = [];
    let protocols: DefiLlamaProtocol[] = [];

    // Fetch pools and protocols in parallel
    const [poolsResult, protocolsResult] = await Promise.allSettled([
      fetchYieldPools(chain, keyword),
      fetchTopProtocols(),
    ]);

    if (poolsResult.status === "fulfilled") {
      pools = poolsResult.value;
    } else {
      errors.push(`Yields API: ${poolsResult.reason}`);
    }

    if (protocolsResult.status === "fulfilled") {
      protocols = protocolsResult.value;
    } else {
      errors.push(`Protocols API: ${protocolsResult.reason}`);
    }

    // Fetch fees for each unique project in the top pools (best-effort)
    const uniqueProjects = [...new Set(pools.map((p) => p.project))];
    const protocolFees = new Map<string, DefiLlamaFees | null>();

    // Map project name to slug via protocol list
    const slugMap = new Map<string, string>();
    for (const proto of protocols) {
      slugMap.set(proto.name.toLowerCase(), proto.slug);
    }

    await Promise.allSettled(
      uniqueProjects.slice(0, 10).map(async (project) => {
        const slug =
          slugMap.get(project.toLowerCase()) ?? project.toLowerCase();
        const fees = await fetchProtocolFees(slug);
        protocolFees.set(project.toLowerCase(), fees);
      }),
    );

    const table = formatCompetitiveTable(pools, protocolFees);

    const errorNote =
      errors.length > 0
        ? `\n\n*Note: Some data sources failed — ${errors.join("; ")}*`
        : "";

    const responseText =
      `## Top ${keyword} pools on ${chain}\n\n` +
      table +
      errorNote +
      `\n\n*Source: DeFiLlama | ${new Date().toUTCString()}*`;

    if (callback) {
      await callback({ text: responseText });
    }

    return { success: true, text: responseText };
  },
};
