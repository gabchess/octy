/**
 * SMART_MONEY_ANALYSIS Action
 * Fetches Nansen smart money netflow + token screener in parallel and returns
 * a formatted markdown brief.
 */

import type {
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
} from "@elizaos/core";
import type { HandlerOptions } from "@elizaos/core";
import { fetchSmartMoneyNetflow, fetchTokenScreener } from "../nansen-cli.js";
import type { NansenNetflowEntry, NansenScreenerEntry } from "../types.js";
import { extractChain } from "../../defi-data/utils.js";

const SMART_MONEY_ACTION_KEYWORDS = [
  "smart money",
  "whale",
  "flows",
  "netflow",
  "who is buying",
  "who is selling",
  "screener",
  "top tokens",
  "trending",
  "token signals",
  "whale activity",
  "whale watch",
];

function isSmartMoneyQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return SMART_MONEY_ACTION_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatNetflowSection(entries: NansenNetflowEntry[]): string {
  if (entries.length === 0) return "_No netflow data available._";

  const header =
    "| Token | 1h Flow | 24h Flow | 7d Flow | Traders |\n" +
    "|-------|---------|----------|---------|---------| ";

  const rows = entries.map((e) => {
    const fmt = (n: number) => {
      const sign = n >= 0 ? "+" : "";
      if (Math.abs(n) >= 1_000_000)
        return `${sign}$${(n / 1_000_000).toFixed(1)}M`;
      if (Math.abs(n) >= 1_000) return `${sign}$${(n / 1_000).toFixed(0)}K`;
      return `${sign}$${n.toFixed(0)}`;
    };
    return `| ${e.token_symbol} | ${fmt(e.net_flow_1h_usd)} | ${fmt(e.net_flow_24h_usd)} | ${fmt(e.net_flow_7d_usd)} | ${e.trader_count} |`;
  });

  return [header, ...rows].join("\n");
}

function formatScreenerSection(entries: NansenScreenerEntry[]): string {
  if (entries.length === 0) return "_No screener data available._";

  const header =
    "| Token | Price | 24h Change | Volume | Netflow |\n" +
    "|-------|-------|-----------|--------|---------|";

  const rows = entries.map((e) => {
    const price =
      e.price_usd < 0.001
        ? `$${e.price_usd.toExponential(2)}`
        : `$${e.price_usd.toFixed(4)}`;
    const change =
      e.price_change >= 0
        ? `+${(e.price_change * 100).toFixed(2)}%`
        : `${(e.price_change * 100).toFixed(2)}%`;
    const vol =
      e.volume >= 1_000_000
        ? `$${(e.volume / 1_000_000).toFixed(1)}M`
        : `$${(e.volume / 1_000).toFixed(0)}K`;
    const nf =
      e.netflow >= 0
        ? `+$${(Math.abs(e.netflow) / 1_000).toFixed(0)}K`
        : `-$${(Math.abs(e.netflow) / 1_000).toFixed(0)}K`;
    return `| ${e.token_symbol} | ${price} | ${change} | ${vol} | ${nf} |`;
  });

  return [header, ...rows].join("\n");
}

export const smartMoneyAnalysisAction = {
  name: "SMART_MONEY_ANALYSIS",
  description:
    "Fetches real-time smart money netflow and token screener data from Nansen CLI, formatted as a competitive intelligence brief.",
  similes: [
    "WHALE_WATCH",
    "SMART_MONEY_FLOWS",
    "TOKEN_SIGNALS",
    "WHALE_ACTIVITY",
  ],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    return isSmartMoneyQuery(message.content?.text ?? "");
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

    const errors: string[] = [];
    let netflowEntries: NansenNetflowEntry[] = [];
    let screenerEntries: NansenScreenerEntry[] = [];

    const [netflowResult, screenerResult] = await Promise.allSettled([
      fetchSmartMoneyNetflow(chain, 10),
      fetchTokenScreener(chain, 10),
    ]);

    if (netflowResult.status === "fulfilled") {
      netflowEntries = netflowResult.value;
    } else {
      errors.push(`Netflow: ${netflowResult.reason}`);
    }

    if (screenerResult.status === "fulfilled") {
      screenerEntries = screenerResult.value;
    } else {
      errors.push(`Screener: ${screenerResult.reason}`);
    }

    const netflowSection = formatNetflowSection(netflowEntries);
    const screenerSection = formatScreenerSection(screenerEntries);

    const errorNote =
      errors.length > 0
        ? `\n\n*Note: Some Nansen data sources failed — ${errors.join("; ")}*`
        : "";

    const responseText =
      `## Smart Money Intelligence — ${chain}\n\n` +
      `### Netflows (Smart Wallet Activity)\n\n` +
      netflowSection +
      `\n\n### Token Screener\n\n` +
      screenerSection +
      errorNote +
      `\n\n*Source: Nansen CLI | ${new Date().toUTCString()}*`;

    if (callback) {
      await callback({ text: responseText });
    }

    return { success: true, text: responseText };
  },
};
