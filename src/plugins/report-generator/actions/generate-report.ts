/**
 * GENERATE_DEFI_REPORT Action
 * Aggregates 5 data sources in parallel, assembles a structured report.
 */

import Handlebars from "handlebars";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ModelType } from "@elizaos/core";
import type {
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
  HandlerOptions,
} from "@elizaos/core";
import type {
  NS3Item,
  TavilyResult,
  RedditPost,
  TwitterResult,
  ReportTemplateData,
} from "../types";
import {
  fetchDeFiLlamaData,
  fetchCategoryData,
} from "../services/defillama-service";
import { searchNews } from "../services/news-search";
import { searchReddit } from "../services/reddit-search";
import { searchTwitter } from "../services/twitter-search";
import { fetchCoinGeckoData } from "../services/coingecko-service";

// Chain extraction — same pattern as defi-data/utils.ts but self-contained
const CHAIN_MAP: Readonly<Record<string, string>> = {
  ethereum: "Ethereum",
  eth: "Ethereum",
  arbitrum: "Arbitrum",
  arb: "Arbitrum",
  base: "Base",
  optimism: "Optimism",
  op: "Optimism",
  polygon: "Polygon",
  matic: "Polygon",
  solana: "Solana",
  sol: "Solana",
  avalanche: "Avalanche",
  avax: "Avalanche",
  bsc: "BSC",
  bnb: "BSC",
};

const REPORT_KEYWORDS = [
  "report",
  "research",
  "intelligence",
  "brief",
  "analysis",
  "overview",
  "deep dive",
  "deep-dive",
  "deepdive",
  "investigate",
  "summary",
];

function extractChain(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(CHAIN_MAP)) {
    if (lower.includes(key)) return value;
  }
  return "Ethereum";
}

// Category keyword → DeFiLlama category string + representative protocols for news
const CATEGORY_MAP: Readonly<
  Record<
    string,
    {
      readonly defillamaCategory: string;
      readonly label: string;
      readonly tickers: string;
    }
  >
> = {
  vaults: {
    defillamaCategory: "Yield Aggregator",
    label: "Vaults",
    tickers: "YFI,MORPHO,CVX,PENDLE,AAVE",
  },
  lending: {
    defillamaCategory: "Lending",
    label: "Lending",
    tickers: "AAVE,COMP,MORPHO,MKR",
  },
  dex: {
    defillamaCategory: "Dexes",
    label: "DEX",
    tickers: "UNI,CRV,BAL,SUSHI",
  },
  stablecoins: {
    defillamaCategory: "CDP",
    label: "Stablecoins",
    tickers: "MKR,LQTY,ENA",
  },
  staking: {
    defillamaCategory: "Liquid Staking",
    label: "Staking",
    tickers: "LDO,RPL,EIGEN",
  },
};

interface QueryType {
  readonly topic: string;
  readonly isCategory: boolean;
  readonly categoryDeFiLlamaKeyword: string;
  readonly categoryLabel: string;
  readonly categoryTickers: string;
}

function extractQueryType(text: string): QueryType {
  const lower = text.toLowerCase();

  // Check category keywords FIRST — before protocol names
  for (const [key, info] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) {
      return {
        topic: key,
        isCategory: true,
        categoryDeFiLlamaKeyword: info.defillamaCategory,
        categoryLabel: info.label,
        categoryTickers: info.tickers,
      };
    }
  }

  // Known protocol names — try to extract the most specific one
  const protocols = [
    "aave v3",
    "aave v2",
    "aave",
    "compound v3",
    "compound",
    "uniswap v3",
    "uniswap",
    "curve",
    "lido",
    "maker",
    "makerdao",
    "pendle",
    "yearn",
    "convex",
    "morpho",
    "spark",
    "eigenlayer",
    "ethena",
    "sky",
  ];
  for (const proto of protocols) {
    if (lower.includes(proto)) {
      return {
        topic: proto,
        isCategory: false,
        categoryDeFiLlamaKeyword: "",
        categoryLabel: "",
        categoryTickers: "",
      };
    }
  }

  // Fallback: return first non-stop word
  const stopWords = new Set([
    "report",
    "research",
    "intelligence",
    "brief",
    "generate",
    "create",
    "make",
    "write",
    "give",
    "me",
    "a",
    "an",
    "the",
    "on",
    "in",
    "for",
    "about",
    "of",
    "defi",
    "protocol",
  ]);
  const words = text.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (clean.length > 2 && !stopWords.has(clean)) {
      return {
        topic: clean,
        isCategory: false,
        categoryDeFiLlamaKeyword: "",
        categoryLabel: "",
        categoryTickers: "",
      };
    }
  }
  return {
    topic: "DeFi",
    isCategory: false,
    categoryDeFiLlamaKeyword: "",
    categoryLabel: "",
    categoryTickers: "",
  };
}

function isReportRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return REPORT_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatNewsSentiment(
  ns3Items: readonly NS3Item[],
  tavilyResults: readonly TavilyResult[],
  redditPosts: readonly RedditPost[],
  twitterResults: readonly TwitterResult[],
): string {
  const lines: string[] = [];

  // NS3 insights
  if (ns3Items.length > 0) {
    lines.push("**News Insights (NS3.ai):**");
    for (const item of ns3Items.slice(0, 7)) {
      lines.push(`- **${item.title}** (${item.pubDate})`);
      if (item.insight) {
        lines.push(`  ${item.insight}`);
      }
    }
    lines.push("");
  }

  // Tavily articles
  if (tavilyResults.length > 0) {
    lines.push("**Web Articles (Tavily):**");
    for (const result of tavilyResults) {
      lines.push(`- [${result.title}](${result.url})`);
      if (result.content) {
        lines.push(`  ${result.content}`);
      }
    }
    lines.push("");
  }

  // Reddit discussions
  if (redditPosts.length > 0) {
    lines.push("**Reddit Discussions:**");
    for (const post of redditPosts.slice(0, 7)) {
      const meta = `r/${post.subreddit} | score: ${post.score} | ${post.numComments} comments`;
      lines.push(`- **${post.title}** (${meta})`);
      if (post.selftext) {
        lines.push(`  ${post.selftext}`);
      }
    }
    lines.push("");
  }

  // Twitter/X
  if (twitterResults.length > 0) {
    lines.push("**X/Twitter:**");
    for (const tweet of twitterResults.slice(0, 7)) {
      const engagement = `${tweet.likes} likes, ${tweet.retweets} RTs`;
      lines.push(`- @${tweet.username}: ${tweet.text} (${engagement})`);
    }
  }

  return lines.join("\n");
}

// Load and compile template once at module level
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "..", "templates", "report.hbs");
const templateSource = fs.readFileSync(templatePath, "utf-8");
const reportTemplate = Handlebars.compile<ReportTemplateData>(templateSource);

export const generateReportAction = {
  name: "GENERATE_DEFI_REPORT",
  description:
    "Generates a structured DeFi intelligence report from 5 data sources: DeFiLlama, NS3.ai, Tavily, Reddit, and CoinGecko. Returns a 4-section markdown report.",
  similes: [
    "RESEARCH_REPORT",
    "DEFI_BRIEF",
    "MARKET_REPORT",
    "INTELLIGENCE_REPORT",
    "DEFI_REPORT",
  ],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const text = message.content?.text ?? "";
    return isReportRequest(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: HandlerOptions,
    callback?: HandlerCallback,
  ): Promise<ActionResult | void> => {
    const text = message.content?.text ?? "";
    const queryType = extractQueryType(text);
    const { topic, isCategory, categoryDeFiLlamaKeyword, categoryTickers } =
      queryType;
    const chain = extractChain(text);

    // Immediate feedback
    if (callback) {
      await callback({
        text: `Generating your DeFi intelligence report on **${topic}** (${chain})...`,
      });
    }

    const errors: string[] = [];

    // Choose DeFiLlama fetch path based on query type
    const defillamaFetch = isCategory
      ? fetchCategoryData(categoryDeFiLlamaKeyword, chain)
      : fetchDeFiLlamaData(topic, chain);

    // For category queries use the representative tickers so NS3/Tavily get real results
    const newsTopic = isCategory && categoryTickers ? categoryTickers : topic;

    // Fetch all sources in parallel
    const [
      defillamaResult,
      newsResult,
      redditResult,
      twitterResult,
      coingeckoResult,
    ] = await Promise.allSettled([
      defillamaFetch,
      searchNews(newsTopic),
      searchReddit(topic),
      searchTwitter(topic),
      fetchCoinGeckoData(topic),
    ]);

    // Extract results with graceful degradation
    const defillama =
      defillamaResult.status === "fulfilled"
        ? defillamaResult.value
        : (() => {
            errors.push(`DeFiLlama: ${String(defillamaResult.reason)}`);
            return { protocolOverview: "", protocolIntelligence: "" };
          })();

    const news =
      newsResult.status === "fulfilled"
        ? newsResult.value
        : (() => {
            errors.push(`News: ${String(newsResult.reason)}`);
            return {
              ns3Items: [] as readonly NS3Item[],
              tavilyResults: [] as readonly TavilyResult[],
            };
          })();

    const reddit =
      redditResult.status === "fulfilled"
        ? redditResult.value
        : (() => {
            errors.push(`Reddit: ${String(redditResult.reason)}`);
            return [] as readonly RedditPost[];
          })();

    const twitter =
      twitterResult.status === "fulfilled"
        ? twitterResult.value
        : (() => {
            errors.push(`Twitter: ${String(twitterResult.reason)}`);
            return [] as readonly TwitterResult[];
          })();

    const coingecko =
      coingeckoResult.status === "fulfilled"
        ? coingeckoResult.value
        : (() => {
            errors.push(`CoinGecko: ${String(coingeckoResult.reason)}`);
            return { marketContext: "" };
          })();

    // Assemble Section 3: News & Sentiment
    const newsSentiment = formatNewsSentiment(
      news.ns3Items,
      news.tavilyResults,
      reddit,
      twitter,
    );

    // Build template data
    const templateData: ReportTemplateData = {
      topic,
      generatedAt: new Date().toUTCString(),
      protocolOverview: defillama.protocolOverview || null,
      protocolIntelligence: defillama.protocolIntelligence || null,
      newsSentiment: newsSentiment || null,
      marketContext: coingecko.marketContext || null,
    };

    // Render raw data report
    let renderedReport = reportTemplate(templateData);

    // Append error notes if any
    if (errors.length > 0) {
      renderedReport += `\n\n*Note: Some data sources degraded gracefully -- ${errors.join("; ")}*`;
    }

    // Fix B — LLM synthesis: prepend executive summary
    try {
      const synthesisPrompt = `You are a DeFi analyst. Read the data report below and write a 3-4 sentence executive summary.
Focus on: the dominant protocol by TVL, the best risk-adjusted yield opportunity, and one notable trend or risk.
Be specific with numbers from the report. Do not repeat the full table — just the key takeaways.

DATA REPORT:
${renderedReport}`;

      const executiveSummary = await runtime.useModel(ModelType.TEXT_LARGE, {
        prompt: synthesisPrompt,
        temperature: 0.3,
        maxTokens: 500,
      });

      if (executiveSummary) {
        renderedReport = `## Executive Summary\n\n${executiveSummary}\n\n---\n\n${renderedReport}`;
      }
    } catch (err) {
      // Graceful degradation — return raw report without summary
      errors.push(`Synthesis: ${String(err)}`);
    }

    if (callback) {
      await callback({ text: renderedReport });
    }

    return { success: true, text: renderedReport };
  },
};
