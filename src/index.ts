/**
 * Octy — DeFi Competitive Intelligence Agent
 * Project entry point: exports character + plugin for ElizaOS runtime.
 */

import type { Character, Plugin, Project } from "@elizaos/core";
import { defiDataPlugin } from "./plugins/defi-data/index";
import { nansenSmartMoneyPlugin } from "./plugins/nansen-smart-money/index";
import { reportGeneratorPlugin } from "./plugins/report-generator/index";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load character from JSON file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const characterPath = path.join(
  __dirname,
  "..",
  "characters",
  "agent.character.json",
);
const character: Character = JSON.parse(
  fs.readFileSync(characterPath, "utf-8"),
);

// Merge providers and actions from sub-plugins
const octyPlugin: Plugin = {
  name: "octy",
  description:
    "DeFi competitive intelligence with real-time data from DeFiLlama, CoinGecko, Uniswap v3, Nansen smart money, and multi-source intelligence reports.",
  providers: [
    ...(defiDataPlugin.providers ?? []),
    ...(nansenSmartMoneyPlugin.providers ?? []),
  ],
  actions: [
    ...(defiDataPlugin.actions ?? []),
    ...(nansenSmartMoneyPlugin.actions ?? []),
    ...(reportGeneratorPlugin.actions ?? []),
  ],
};

const project: Project = {
  agents: [
    {
      character,
      plugins: [octyPlugin],
    },
  ],
};

export default project;

// LLM endpoint health check (runs on module load)
(async () => {
  const baseUrl = process.env["OPENAI_BASE_URL"];
  if (!baseUrl) {
    console.warn(
      "[Octy] WARNING: OPENAI_BASE_URL not set — LLM endpoint unknown",
    );
    return;
  }
  try {
    const res = await fetch(`${baseUrl}/models`, {
      signal: AbortSignal.timeout(5000),
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) {
      console.warn(
        `[Octy] WARNING: LLM endpoint returned ${res.status} (${contentType}). Agent will not respond until endpoint is ready.`,
      );
      console.warn(`[Octy] Check: curl -s "${baseUrl}/models"`);
      return;
    }
    const data = await res.json();
    const models = Array.isArray(data?.data)
      ? data.data.map((m: { id?: string }) => m.id).join(", ")
      : "unknown";
    console.log(`[Octy] LLM endpoint ready — available models: ${models}`);
  } catch (err) {
    console.warn(
      `[Octy] WARNING: LLM endpoint unreachable (${err instanceof Error ? err.message : "unknown error"}). Agent will not respond until endpoint is ready.`,
    );
    console.warn(`[Octy] Check: curl -s "${baseUrl}/models"`);
  }
})();
