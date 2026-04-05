/**
 * DeFiLlama Protocol Provider
 * Injects protocol TVL and fee data into agent context for DeFi-related queries.
 */

import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import type { ProviderResult } from "@elizaos/core";
import type { DefiLlamaProtocol } from "../types";
import { isDeFiMessage, formatUSD } from "../utils";

const PROTOCOLS_URL = "https://api.llama.fi/protocols";

function formatProtocolsTable(protocols: DefiLlamaProtocol[]): string {
  if (protocols.length === 0) return "No protocols found.";

  const header =
    "| Protocol | Category | TVL | Chains |\n" +
    "|----------|----------|-----|--------|";

  const rows = protocols.map(
    (p) =>
      `| ${p.name} | ${p.category} | ${formatUSD(p.tvl)} | ${p.chains.slice(0, 3).join(", ")} |`,
  );

  return [header, ...rows].join("\n");
}

export const defiLlamaProtocolProvider = {
  name: "DEFILLAMA_PROTOCOLS",
  description:
    "Injects top DeFi protocol TVL data from DeFiLlama into agent context for protocol comparison queries.",
  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    const text = message.content?.text ?? "";

    if (!isDeFiMessage(text)) {
      return {};
    }

    // Only activate for protocol comparison queries
    const lower = text.toLowerCase();
    const isComparisonQuery =
      lower.includes("compare") ||
      lower.includes("protocol") ||
      lower.includes("tvl") ||
      lower.includes("vs") ||
      lower.includes("versus");

    if (!isComparisonQuery) {
      return {};
    }

    try {
      const response = await fetch(PROTOCOLS_URL);
      if (!response.ok) {
        throw new Error(`DeFiLlama protocols API returned ${response.status}`);
      }

      const protocols = (await response.json()) as DefiLlamaProtocol[];

      if (!Array.isArray(protocols)) {
        throw new Error("Unexpected DeFiLlama protocols response shape");
      }

      // Top 20 by TVL
      const top20 = protocols
        .filter((p) => p.tvl > 0)
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 20);

      const table = formatProtocolsTable(top20);

      return {
        text: `## Top DeFi Protocols by TVL (DeFiLlama)\n\n${table}\n\n*Source: DeFiLlama protocols API*`,
        data: { protocols: top20 },
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown error fetching protocols";
      return {
        text: `[DeFiLlama protocol provider error: ${msg}]`,
        data: { error: msg },
      };
    }
  },
};
