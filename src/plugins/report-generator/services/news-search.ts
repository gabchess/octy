/**
 * News Search Service — NS3 RSS + Tavily Web Search
 * Dual-source news aggregation with graceful degradation.
 */

import { XMLParser } from "fast-xml-parser";
import { tavily } from "@tavily/core";
import type { NS3Item, TavilyResult, NewsSearchResult } from "../types";

// Map protocol names to ticker symbols for NS3 feed
const PROTOCOL_TICKERS: Readonly<Record<string, string>> = {
  aave: "AAVE",
  compound: "COMP",
  uniswap: "UNI",
  curve: "CRV",
  lido: "LDO",
  maker: "MKR",
  pendle: "PENDLE",
  yearn: "YFI",
  convex: "CVX",
  morpho: "MORPHO",
  ethereum: "ETH",
  solana: "SOL",
  arbitrum: "ARB",
  optimism: "OP",
  polygon: "MATIC",
  avalanche: "AVAX",
  base: "BASE",
};

const NS3_BASE_URL = "https://api.ns3.ai/feed/news-data";
const MAX_NS3_ITEMS = 10;
const MAX_TAVILY_RESULTS = 5;

function resolveTickers(topic: string): string {
  const lower = topic.toLowerCase();
  const matched: string[] = [];
  for (const [key, ticker] of Object.entries(PROTOCOL_TICKERS)) {
    if (lower.includes(key)) {
      matched.push(ticker);
    }
  }
  // Default to the topic itself as a ticker if no match
  return matched.length > 0 ? matched.join(",") : topic.toUpperCase();
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
}

interface NS3RSSItem {
  readonly title?: string;
  readonly pubDate?: string;
  readonly description?: string;
  readonly "ns3:insight"?: string;
  readonly insight?: string;
  readonly "ns3:mentionedCoins"?: string;
  readonly mentionedCoins?: string;
  readonly "ns3:level"?: number | string;
  readonly level?: number | string;
  readonly "ns3:newsType"?: string;
  readonly newsType?: string;
}

async function fetchNS3News(topic: string): Promise<readonly NS3Item[]> {
  const tickers = resolveTickers(topic);
  const url = `${NS3_BASE_URL}?lang=en&crypto=${encodeURIComponent(tickers)}&excludeLevels=4,5&limit=${MAX_NS3_ITEMS}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "octy-agent/0.1.0" },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`NS3 API returned ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const parsed = parser.parse(xmlText) as Record<string, unknown>;

  // Navigate RSS structure: rss > channel > item
  const rss = parsed["rss"] as Record<string, unknown> | undefined;
  const channel = (rss?.["channel"] ?? parsed["channel"]) as
    | Record<string, unknown>
    | undefined;
  if (!channel) return [];

  const rawItems = channel["item"];
  if (!rawItems) return [];

  const itemList: readonly NS3RSSItem[] = Array.isArray(rawItems)
    ? rawItems
    : [rawItems as NS3RSSItem];

  return itemList.slice(0, MAX_NS3_ITEMS).map((item) => ({
    title: truncateText(String(item.title ?? ""), 200),
    pubDate: String(item.pubDate ?? ""),
    insight: truncateText(
      String(item["ns3:insight"] ?? item.insight ?? item.description ?? ""),
      500,
    ),
    mentionedCoins: String(
      item["ns3:mentionedCoins"] ?? item.mentionedCoins ?? "",
    )
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    level: Number(item["ns3:level"] ?? item.level ?? 3),
    newsType: String(item["ns3:newsType"] ?? item.newsType ?? "general"),
  }));
}

async function fetchTavilyNews(
  topic: string,
): Promise<readonly TavilyResult[]> {
  const apiKey = process.env["TAVILY_API_KEY"];
  if (!apiKey) {
    return [];
  }

  const client = tavily({ apiKey });
  const query = `${topic} DeFi cryptocurrency latest news`;
  const response = await client.search(query, {
    topic: "news",
    days: 90,
    maxResults: MAX_TAVILY_RESULTS,
  });

  return response.results.map((r) => ({
    title: truncateText(r.title, 200),
    url: r.url,
    content: truncateText(r.content, 300),
    score: r.score,
    publishedDate: r.publishedDate,
  }));
}

export async function searchNews(topic: string): Promise<NewsSearchResult> {
  const [ns3Result, tavilyResult] = await Promise.allSettled([
    fetchNS3News(topic),
    fetchTavilyNews(topic),
  ]);

  const ns3Items = ns3Result.status === "fulfilled" ? ns3Result.value : [];
  const tavilyResults =
    tavilyResult.status === "fulfilled" ? tavilyResult.value : [];

  return { ns3Items, tavilyResults };
}
