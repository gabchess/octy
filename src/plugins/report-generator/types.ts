/**
 * Report Generator Plugin — Type Definitions
 * Shapes for all data source responses and report structure.
 */

// NS3 RSS feed item (parsed from XML)
export interface NS3Item {
  readonly title: string;
  readonly pubDate: string;
  readonly insight: string;
  readonly mentionedCoins: readonly string[];
  readonly level: number;
  readonly newsType: string;
}

// Tavily web search result
export interface TavilyResult {
  readonly title: string;
  readonly url: string;
  readonly content: string;
  readonly score: number;
  readonly publishedDate: string;
}

// Reddit post from JSON API
export interface RedditPost {
  readonly title: string;
  readonly selftext: string;
  readonly subreddit: string;
  readonly score: number;
  readonly numComments: number;
  readonly url: string;
  readonly created: number;
}

// Twitter/X result from bird CLI
export interface TwitterResult {
  readonly text: string;
  readonly username: string;
  readonly likes: number;
  readonly retweets: number;
  readonly date: string;
}

// Report section (one of 4 sections)
export interface ReportSection {
  readonly title: string;
  readonly content: string;
  readonly source: string;
}

// Full assembled report data
export interface ReportData {
  readonly topic: string;
  readonly chain: string;
  readonly sections: readonly ReportSection[];
  readonly generatedAt: string;
  readonly errors: readonly string[];
}

// DeFiLlama protocol detail response
export interface DeFiLlamaProtocolDetail {
  readonly name: string;
  readonly slug: string;
  readonly symbol: string;
  readonly category: string;
  readonly chains: readonly string[];
  readonly tvl: number;
  readonly currentChainTvls?: Readonly<Record<string, number>>;
  readonly chainTvls?: Readonly<
    Record<
      string,
      {
        readonly tvl: readonly {
          readonly date: number;
          readonly totalLiquidityUSD: number;
        }[];
      }
    >
  >;
}

// DeFiLlama pool (from yields API)
export interface DeFiLlamaPool {
  readonly pool: string;
  readonly chain: string;
  readonly project: string;
  readonly symbol: string;
  readonly tvlUsd: number;
  readonly apy: number;
  readonly apyBase: number | null;
  readonly apyReward: number | null;
}

// DeFiLlama yields API response wrapper
export interface DeFiLlamaYieldsResponse {
  readonly status: string;
  readonly data: readonly DeFiLlamaPool[];
}

// DeFiLlama protocol list item
export interface DeFiLlamaProtocol {
  readonly name: string;
  readonly slug: string;
  readonly symbol: string;
  readonly category: string;
  readonly chain: string;
  readonly chains: readonly string[];
  readonly tvl: number;
  readonly change_1d: number | null;
  readonly change_7d: number | null;
  readonly change_1m: number | null;
}

// DeFiLlama fees response
export interface DeFiLlamaFees {
  readonly total24h: number | null;
  readonly total7d: number | null;
  readonly total30d: number | null;
  readonly totalAllTime: number | null;
}

// CoinGecko price response shape
export interface CoinGeckoPrice {
  readonly usd: number;
  readonly usd_24h_change?: number;
  readonly usd_market_cap?: number;
}

export type CoinGeckoPriceResponse = Readonly<Record<string, CoinGeckoPrice>>;

// News search combined result
export interface NewsSearchResult {
  readonly ns3Items: readonly NS3Item[];
  readonly tavilyResults: readonly TavilyResult[];
}

// DeFiLlama service result (Sections 1 and 2)
export interface DeFiLlamaServiceResult {
  readonly protocolOverview: string;
  readonly protocolIntelligence: string;
}

// CoinGecko service result (Section 4)
export interface CoinGeckoServiceResult {
  readonly marketContext: string;
}

// Handlebars template data
export interface ReportTemplateData {
  readonly topic: string;
  readonly generatedAt: string;
  readonly protocolOverview: string | null;
  readonly protocolIntelligence: string | null;
  readonly newsSentiment: string | null;
  readonly marketContext: string | null;
}
