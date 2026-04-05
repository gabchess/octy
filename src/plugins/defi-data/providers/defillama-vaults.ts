/**
 * DeFiLlama Vaults Provider
 * Injects top yield pools into agent context when the message is DeFi-related.
 */

import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import type { ProviderResult } from "@elizaos/core";
import type { DefiLlamaYieldsResponse } from "../types";
import {
  isDeFiMessage,
  extractChain,
  extractKeyword,
  filterTopPools,
  formatPoolsTable,
} from "../utils";

const YIELDS_URL = "https://yields.llama.fi/pools";

export const defiLlamaVaultsProvider = {
  name: "DEFILLAMA_VAULTS",
  description:
    "Injects top DeFi yield pools from DeFiLlama into agent context for DeFi-related queries.",
  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    const text = message.content?.text ?? "";

    if (!isDeFiMessage(text)) {
      return {};
    }

    const chain = extractChain(text);
    const keyword = extractKeyword(text);

    try {
      const response = await fetch(YIELDS_URL);
      if (!response.ok) {
        throw new Error(`DeFiLlama yields API returned ${response.status}`);
      }

      const json = (await response.json()) as DefiLlamaYieldsResponse;

      if (json.status !== "success" || !Array.isArray(json.data)) {
        throw new Error("Unexpected DeFiLlama yields response shape");
      }

      const topPools = filterTopPools(json.data, chain, keyword);
      const table = formatPoolsTable(topPools);

      return {
        text: `## Top ${keyword} pools on ${chain} (DeFiLlama)\n\n${table}\n\n*Source: DeFiLlama yields API*`,
        data: { pools: topPools, chain, keyword },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error fetching yields";
      return {
        text: `[DeFiLlama vaults provider error: ${message}]`,
        data: { error: message },
      };
    }
  },
};
