/**
 * Nansen Token Screener Provider
 * Injects token screener data into agent context for trending/top token queries.
 */

import type {
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { fetchTokenScreener } from "../nansen-cli.js";
import type { NansenScreenerEntry } from "../types.js";
import { extractChain } from "../../defi-data/utils.js";

const SCREENER_KEYWORDS = [
  "screener",
  "top tokens",
  "trending",
  "what are smart money buying",
  "token signals",
  "hot tokens",
  "new tokens",
];

function isScreenerMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return SCREENER_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatScreenerTable(entries: NansenScreenerEntry[]): string {
  if (entries.length === 0) return "No token screener data available.";

  const header =
    "| Token | Price | 24h Change | Volume | Netflow | Market Cap |\n" +
    "|-------|-------|-----------|--------|---------|------------|";

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
    const netflow =
      e.netflow >= 0
        ? `+$${(Math.abs(e.netflow) / 1_000).toFixed(0)}K`
        : `-$${(Math.abs(e.netflow) / 1_000).toFixed(0)}K`;
    const mcap =
      e.market_cap_usd >= 1_000_000_000
        ? `$${(e.market_cap_usd / 1_000_000_000).toFixed(2)}B`
        : `$${(e.market_cap_usd / 1_000_000).toFixed(1)}M`;

    return `| ${e.token_symbol} | ${price} | ${change} | ${vol} | ${netflow} | ${mcap} |`;
  });

  return [header, ...rows].join("\n");
}

export const tokenScreenerProvider = {
  name: "NANSEN_TOKEN_SCREENER",
  description:
    "Injects Nansen token screener data into agent context for trending token and smart money buying queries.",
  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    const text = message.content?.text ?? "";

    if (!isScreenerMessage(text)) {
      return {};
    }

    const chain = extractChain(text);

    try {
      const entries = await fetchTokenScreener(chain, 10);
      const table = formatScreenerTable(entries);

      return {
        text:
          `## Top Tokens on ${chain} (Nansen Screener)\n\n${table}\n\n` +
          `*Source: Nansen CLI — token screener*`,
        data: { entries, chain },
      };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unknown error fetching token screener";
      return {
        text: `[Nansen token screener provider error: ${msg}]`,
        data: { error: msg },
      };
    }
  },
};
