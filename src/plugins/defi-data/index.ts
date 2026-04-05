/**
 * DeFi Data Plugin
 * Bundles DeFiLlama and CoinGecko providers + competitive analysis actions.
 */

import type { Plugin } from "@elizaos/core";
import { defiLlamaVaultsProvider } from "./providers/defillama-vaults";
import { defiLlamaProtocolProvider } from "./providers/defillama-protocol";
import { coingeckoPriceProvider } from "./providers/coingecko-price";
import { uniswapPoolsProvider } from "./providers/uniswap-pools";
import { competitiveAnalysisAction } from "./actions/competitive-analysis";
import { protocolDeepDiveAction } from "./actions/protocol-deep-dive";

export const defiDataPlugin: Plugin = {
  name: "defi-data",
  description:
    "Provides real-time DeFi competitive intelligence via DeFiLlama, CoinGecko, and Uniswap v3 subgraph. Injects yield pool data, protocol TVL, token prices, and DEX pool data into agent context. Handles COMPETITIVE_ANALYSIS and PROTOCOL_DEEP_DIVE actions.",
  providers: [
    defiLlamaVaultsProvider,
    defiLlamaProtocolProvider,
    coingeckoPriceProvider,
    uniswapPoolsProvider,
  ],
  actions: [competitiveAnalysisAction, protocolDeepDiveAction],
};

export default defiDataPlugin;
