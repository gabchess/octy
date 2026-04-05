/**
 * Report Generator Plugin
 * Generates structured DeFi intelligence reports from 5 data sources:
 * DeFiLlama, NS3.ai, Tavily, Reddit, and CoinGecko.
 */

import type { Plugin } from "@elizaos/core";
import { generateReportAction } from "./actions/generate-report";

export const reportGeneratorPlugin: Plugin = {
  name: "report-generator",
  description:
    "Generates structured DeFi intelligence reports from 5 data sources (DeFiLlama, NS3.ai, Tavily, Reddit, CoinGecko). Single action: GENERATE_DEFI_REPORT.",
  providers: [],
  actions: [generateReportAction],
};

export default reportGeneratorPlugin;
