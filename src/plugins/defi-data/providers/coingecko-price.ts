/**
 * CoinGecko Price Provider
 * Injects governance token prices into agent context for DeFi-related queries.
 */

import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import type { ProviderResult } from "@elizaos/core";
import type { CoinGeckoPriceResponse } from "../types";
import { isDeFiMessage } from "../utils";

const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";

// Common DeFi governance tokens to track
const DEFAULT_TOKEN_IDS = [
  "aave",
  "compound-governance-token",
  "uniswap",
  "curve-dao-token",
  "lido-dao",
  "maker",
  "pendle",
  "morpho",
];

function formatPriceTable(prices: CoinGeckoPriceResponse): string {
  const entries = Object.entries(prices);
  if (entries.length === 0) return "No price data available.";

  const header =
    "| Token | Price (USD) | 24h Change |\n" +
    "|-------|-------------|------------|";

  const rows = entries.map(([id, data]) => {
    const change = data.usd_24h_change;
    const changeStr =
      change != null ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—";
    return `| ${id} | $${data.usd.toFixed(2)} | ${changeStr} |`;
  });

  return [header, ...rows].join("\n");
}

export const coingeckoPriceProvider = {
  name: "COINGECKO_PRICES",
  description:
    "Injects DeFi governance token prices from CoinGecko into agent context.",
  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    const text = message.content?.text ?? "";

    if (!isDeFiMessage(text)) {
      return {};
    }

    // Only activate when price/token context is relevant
    const lower = text.toLowerCase();
    const isPriceQuery =
      lower.includes("price") ||
      lower.includes("token") ||
      lower.includes("governance") ||
      lower.includes("compare") ||
      lower.includes("aave") ||
      lower.includes("uniswap") ||
      lower.includes("curve") ||
      lower.includes("lido");

    if (!isPriceQuery) {
      return {};
    }

    const ids = DEFAULT_TOKEN_IDS.join(",");
    const url = `${COINGECKO_URL}?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API returned ${response.status}`);
      }

      const prices = (await response.json()) as CoinGeckoPriceResponse;
      const table = formatPriceTable(prices);

      return {
        text: `## DeFi Token Prices (CoinGecko)\n\n${table}\n\n*Source: CoinGecko*`,
        data: { prices },
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown error fetching prices";
      return {
        text: `[CoinGecko price provider error: ${msg}]`,
        data: { error: msg },
      };
    }
  },
};
