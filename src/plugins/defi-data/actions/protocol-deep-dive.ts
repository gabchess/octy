/**
 * PROTOCOL_DEEP_DIVE Action
 * Fetches detailed TVL, fee, and APY data for a specific protocol.
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
  DefiLlamaProtocolDetail,
  DefiLlamaFees,
  DefiLlamaYieldsResponse,
  DefiLlamaPool,
} from "../types";
import {
  extractProtocolName,
  filterTopPools,
  formatUSD,
  formatAPY,
} from "../utils";

const PROTOCOL_URL = "https://api.llama.fi/protocol";
const FEES_URL = "https://api.llama.fi/summary/fees";
const YIELDS_URL = "https://yields.llama.fi/pools";

// Keywords that signal a deep-dive request
const DEEP_DIVE_KEYWORDS = [
  "tell me about",
  "details",
  "deep dive",
  "breakdown",
  "analyze",
  "analysis",
  "info on",
  "about",
  "explain",
  "how does",
  "what is",
];

async function fetchProtocolDetail(
  slug: string,
): Promise<DefiLlamaProtocolDetail | null> {
  try {
    const response = await fetch(`${PROTOCOL_URL}/${slug}`);
    if (!response.ok) return null;
    return (await response.json()) as DefiLlamaProtocolDetail;
  } catch {
    return null;
  }
}

async function fetchFees(slug: string): Promise<DefiLlamaFees | null> {
  try {
    const response = await fetch(`${FEES_URL}/${slug}`);
    if (!response.ok) return null;
    return (await response.json()) as DefiLlamaFees;
  } catch {
    return null;
  }
}

async function fetchProtocolPools(
  projectSlug: string,
): Promise<DefiLlamaPool[]> {
  const response = await fetch(YIELDS_URL);
  if (!response.ok) throw new Error(`Yields API ${response.status}`);
  const json = (await response.json()) as DefiLlamaYieldsResponse;
  if (json.status !== "success") throw new Error("Yields API unexpected shape");

  // Match pools by project name (slug contains the project identifier)
  const slugParts = projectSlug.split("-");
  const baseName = slugParts[0];

  return json.data
    .filter((p) => p.project.toLowerCase().includes(baseName.toLowerCase()))
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, 10);
}

function formatDeepDiveResponse(
  slug: string,
  detail: DefiLlamaProtocolDetail | null,
  fees: DefiLlamaFees | null,
  pools: DefiLlamaPool[],
  errors: string[],
): string {
  const name = detail?.name ?? slug;
  const lines: string[] = [`## ${name} — Protocol Deep Dive`, ""];

  // TVL section
  if (detail) {
    lines.push("### TVL");
    lines.push(`- **Total TVL**: ${formatUSD(detail.tvl)}`);
    lines.push(`- **Category**: ${detail.category}`);
    lines.push(`- **Chains**: ${detail.chains.join(", ")}`);

    if (detail.currentChainTvls) {
      const chainBreakdown = Object.entries(detail.currentChainTvls)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([chain, tvl]) => `  - ${chain}: ${formatUSD(tvl)}`)
        .join("\n");
      lines.push("- **Chain Breakdown**:");
      lines.push(chainBreakdown);
    }
    lines.push("");
  }

  // Fees section
  if (fees) {
    lines.push("### Fees");
    lines.push(
      `- **24h**: ${fees.total24h != null ? formatUSD(fees.total24h) : "—"}`,
    );
    lines.push(
      `- **7d**: ${fees.total7d != null ? formatUSD(fees.total7d) : "—"}`,
    );
    lines.push(
      `- **30d**: ${fees.total30d != null ? formatUSD(fees.total30d) : "—"}`,
    );
    lines.push(
      `- **All-time**: ${fees.totalAllTime != null ? formatUSD(fees.totalAllTime) : "—"}`,
    );
    lines.push("");
  }

  // Top pools section
  if (pools.length > 0) {
    lines.push("### Top Pools / Yields");
    const header =
      "| Pool/Asset | Chain | TVL | APY (Base) | APY (Reward) |\n" +
      "|-----------|-------|-----|------------|--------------|";
    const rows = pools.map(
      (p) =>
        `| ${p.symbol} | ${p.chain} | ${formatUSD(p.tvlUsd)} | ${formatAPY(p.apyBase)} | ${formatAPY(p.apyReward)} |`,
    );
    lines.push(header);
    lines.push(...rows);
    lines.push("");
  }

  if (errors.length > 0) {
    lines.push(`*Note: Some data sources unavailable — ${errors.join("; ")}*`);
  }

  lines.push(`*Source: DeFiLlama | ${new Date().toUTCString()}*`);

  return lines.join("\n");
}

export const protocolDeepDiveAction = {
  name: "PROTOCOL_DEEP_DIVE",
  description:
    "Fetches detailed TVL history, fee revenue, and yield data for a specific DeFi protocol from DeFiLlama.",
  similes: [
    "PROTOCOL_DETAILS",
    "PROTOCOL_INFO",
    "PROTOCOL_ANALYSIS",
    "EXPLAIN_PROTOCOL",
    "PROTOCOL_STATS",
  ],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const text = (message.content?.text ?? "").toLowerCase();
    const hasProtocol = extractProtocolName(text) !== null;
    const hasDeepDiveKeyword = DEEP_DIVE_KEYWORDS.some((kw) =>
      text.includes(kw),
    );
    return hasProtocol && hasDeepDiveKeyword;
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: HandlerOptions,
    callback?: HandlerCallback,
  ): Promise<ActionResult | void> => {
    const text = message.content?.text ?? "";
    const slug = extractProtocolName(text);

    if (!slug) {
      const responseText =
        "I couldn't identify a specific protocol in your message. Try asking about Aave, Morpho, Compound, Curve, Uniswap, Pendle, Yearn, or Lido.";
      if (callback) await callback({ text: responseText });
      return {
        success: false,
        error: "No protocol identified",
        text: responseText,
      };
    }

    const errors: string[] = [];

    const [detailResult, feesResult, poolsResult] = await Promise.allSettled([
      fetchProtocolDetail(slug),
      fetchFees(slug),
      fetchProtocolPools(slug),
    ]);

    const detail =
      detailResult.status === "fulfilled" ? detailResult.value : null;
    if (detailResult.status === "rejected") {
      errors.push(`Protocol detail: ${detailResult.reason}`);
    }

    const fees = feesResult.status === "fulfilled" ? feesResult.value : null;
    if (feesResult.status === "rejected") {
      errors.push(`Fees: ${feesResult.reason}`);
    }

    const pools = poolsResult.status === "fulfilled" ? poolsResult.value : [];
    if (poolsResult.status === "rejected") {
      errors.push(`Yields: ${poolsResult.reason}`);
    }

    const responseText = formatDeepDiveResponse(
      slug,
      detail,
      fees,
      pools,
      errors,
    );

    if (callback) {
      await callback({ text: responseText });
    }

    return { success: true, text: responseText };
  },
};
