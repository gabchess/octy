/**
 * Nansen Smart Money Plugin
 * Bundles Nansen CLI providers + smart money analysis action.
 */

import type { Plugin } from "@elizaos/core";
import { smartMoneyFlowsProvider } from "./providers/smart-money-flows.js";
import { tokenScreenerProvider } from "./providers/token-screener.js";
import { smartMoneyAnalysisAction } from "./actions/smart-money-analysis.js";

export const nansenSmartMoneyPlugin: Plugin = {
  name: "nansen-smart-money",
  description:
    "Real-time smart money intelligence via Nansen CLI. Tracks whale wallet flows, token screener signals, and smart money netflows across chains.",
  providers: [smartMoneyFlowsProvider, tokenScreenerProvider],
  actions: [smartMoneyAnalysisAction],
};
