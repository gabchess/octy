/**
 * Nansen Smart Money Flows Provider
 * Injects smart money netflow data into agent context for whale/flow queries.
 */

import type {
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { fetchSmartMoneyNetflow } from "../nansen-cli.js";
import type { NansenNetflowEntry } from "../types.js";
import { extractChain } from "../../defi-data/utils.js";

const SMART_MONEY_KEYWORDS = [
  "smart money",
  "whale",
  "flows",
  "netflow",
  "who is buying",
  "who is selling",
  "smart wallet",
  "institutional",
];

function isSmartMoneyMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return SMART_MONEY_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatNetflowTable(entries: NansenNetflowEntry[]): string {
  if (entries.length === 0) return "No smart money netflow data available.";

  const header =
    "| Token | 1h Flow | 24h Flow | 7d Flow | Traders | Market Cap |\n" +
    "|-------|---------|----------|---------|---------|------------|";

  const rows = entries.map((e) => {
    const fmt = (n: number) => {
      const sign = n >= 0 ? "+" : "";
      if (Math.abs(n) >= 1_000_000)
        return `${sign}$${(n / 1_000_000).toFixed(1)}M`;
      if (Math.abs(n) >= 1_000) return `${sign}$${(n / 1_000).toFixed(0)}K`;
      return `${sign}$${n.toFixed(0)}`;
    };
    const mcap =
      e.market_cap_usd >= 1_000_000_000
        ? `$${(e.market_cap_usd / 1_000_000_000).toFixed(2)}B`
        : `$${(e.market_cap_usd / 1_000_000).toFixed(1)}M`;

    return `| ${e.token_symbol} | ${fmt(e.net_flow_1h_usd)} | ${fmt(e.net_flow_24h_usd)} | ${fmt(e.net_flow_7d_usd)} | ${e.trader_count} | ${mcap} |`;
  });

  return [header, ...rows].join("\n");
}

export const smartMoneyFlowsProvider = {
  name: "NANSEN_SMART_MONEY",
  description:
    "Injects Nansen smart money netflow data into agent context for whale activity and flow queries.",
  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    const text = message.content?.text ?? "";

    if (!isSmartMoneyMessage(text)) {
      return {};
    }

    const chain = extractChain(text);

    try {
      const entries = await fetchSmartMoneyNetflow(chain, 10);
      const table = formatNetflowTable(entries);

      return {
        text:
          `## Smart Money Netflows on ${chain} (Nansen)\n\n${table}\n\n` +
          `*Source: Nansen CLI — smart money wallet tracking*`,
        data: { entries, chain },
      };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unknown error fetching smart money flows";
      return {
        text: `[Nansen smart money provider error: ${msg}]`,
        data: { error: msg },
      };
    }
  },
};
