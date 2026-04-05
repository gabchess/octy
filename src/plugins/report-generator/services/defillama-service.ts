/**
 * DeFiLlama Service — Expanded data for Sections 1 and 2.
 * Protocol detail, yield pools, category leaders, fees.
 * Self-contained — does NOT import from defi-data plugin.
 */

import type {
  DeFiLlamaProtocolDetail,
  DeFiLlamaPool,
  DeFiLlamaYieldsResponse,
  DeFiLlamaProtocol,
  DeFiLlamaFees,
  DeFiLlamaServiceResult,
} from "../types";

const PROTOCOL_URL = "https://api.llama.fi/protocol";
const YIELDS_URL = "https://yields.llama.fi/pools";
const PROTOCOLS_URL = "https://api.llama.fi/protocols";
const FEES_URL = "https://api.llama.fi/summary/fees";

// Map protocol names to DeFiLlama slugs
const SLUG_MAP: Readonly<Record<string, string>> = {
  aave: "aave",
  "aave v3": "aave",
  compound: "compound-v3",
  uniswap: "uniswap",
  curve: "curve-dex",
  lido: "lido",
  maker: "makerdao",
  pendle: "pendle",
  yearn: "yearn-finance",
  convex: "convex-finance",
  morpho: "morpho",
  spark: "spark",
  eigenlayer: "eigenlayer",
  ethena: "ethena",
  sky: "sky",
};

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatAPY(value: number | null | undefined): string {
  if (value == null) return "--";
  return `${value.toFixed(2)}%`;
}

function resolveSlug(topic: string): string {
  const lower = topic.toLowerCase();
  for (const [key, slug] of Object.entries(SLUG_MAP)) {
    if (lower.includes(key)) return slug;
  }
  return lower.replace(/\s+/g, "-");
}

async function fetchProtocolDetail(
  slug: string,
): Promise<DeFiLlamaProtocolDetail | null> {
  try {
    const response = await fetch(`${PROTOCOL_URL}/${slug}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return (await response.json()) as DeFiLlamaProtocolDetail;
  } catch {
    return null;
  }
}

async function fetchYieldPools(
  chain: string,
  keyword: string,
): Promise<readonly DeFiLlamaPool[]> {
  const response = await fetch(YIELDS_URL, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Yields API ${response.status}`);
  const json = (await response.json()) as DeFiLlamaYieldsResponse;
  if (json.status !== "success") throw new Error("Yields API unexpected shape");

  const kw = keyword.toLowerCase();
  return [...json.data]
    .filter((p) => {
      const chainMatch = p.chain.toLowerCase() === chain.toLowerCase();
      const kwMatch =
        kw === "all" || `${p.project} ${p.symbol}`.toLowerCase().includes(kw);
      return chainMatch && kwMatch;
    })
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, 10);
}

async function fetchTopProtocols(
  category?: string,
): Promise<readonly DeFiLlamaProtocol[]> {
  const response = await fetch(PROTOCOLS_URL, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Protocols API ${response.status}`);
  const all = (await response.json()) as DeFiLlamaProtocol[];

  let filtered = all.filter((p) => p.tvl > 0);
  if (category) {
    const cat = category.toLowerCase();
    filtered = filtered.filter((p) => p.category?.toLowerCase().includes(cat));
  }
  return filtered.sort((a, b) => b.tvl - a.tvl).slice(0, 10);
}

async function fetchFees(slug: string): Promise<DeFiLlamaFees | null> {
  try {
    const response = await fetch(`${FEES_URL}/${slug}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return (await response.json()) as DeFiLlamaFees;
  } catch {
    return null;
  }
}

function formatProtocolOverview(
  detail: DeFiLlamaProtocolDetail | null,
  fees: DeFiLlamaFees | null,
): string {
  if (!detail) return "";

  const lines: string[] = [];
  lines.push(`**${detail.name}** (${detail.symbol})`);
  lines.push(`- Category: ${detail.category}`);
  lines.push(`- Total TVL: ${formatUSD(detail.tvl)}`);

  // Chain distribution
  if (detail.currentChainTvls) {
    const chainEntries = Object.entries(detail.currentChainTvls)
      .filter(([key]) => !key.includes("-"))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    if (chainEntries.length > 0) {
      lines.push("- Chain Distribution:");
      for (const [chain, tvl] of chainEntries) {
        const pct = ((tvl / detail.tvl) * 100).toFixed(1);
        lines.push(`  - ${chain}: ${formatUSD(tvl)} (${pct}%)`);
      }
    }
  }

  // TVL trend from chainTvls
  if (detail.chainTvls) {
    const totalTvlHistory = detail.chainTvls["total"]?.tvl;
    if (totalTvlHistory && totalTvlHistory.length > 0) {
      const latest = totalTvlHistory[totalTvlHistory.length - 1];
      const sevenDaysAgo = totalTvlHistory.find(
        (d) =>
          d.date >= latest.date - 7 * 86400 &&
          d.date <= latest.date - 6 * 86400,
      );
      const thirtyDaysAgo = totalTvlHistory.find(
        (d) =>
          d.date >= latest.date - 30 * 86400 &&
          d.date <= latest.date - 29 * 86400,
      );

      if (sevenDaysAgo) {
        const change7d =
          ((latest.totalLiquidityUSD - sevenDaysAgo.totalLiquidityUSD) /
            sevenDaysAgo.totalLiquidityUSD) *
          100;
        lines.push(
          `- 7d TVL Change: ${change7d >= 0 ? "+" : ""}${change7d.toFixed(2)}%`,
        );
      }
      if (thirtyDaysAgo) {
        const change30d =
          ((latest.totalLiquidityUSD - thirtyDaysAgo.totalLiquidityUSD) /
            thirtyDaysAgo.totalLiquidityUSD) *
          100;
        lines.push(
          `- 30d TVL Change: ${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`,
        );
      }
    }
  }

  // Fees
  if (fees) {
    lines.push("- Fees:");
    if (fees.total24h != null)
      lines.push(`  - 24h: ${formatUSD(fees.total24h)}`);
    if (fees.total7d != null) lines.push(`  - 7d: ${formatUSD(fees.total7d)}`);
    if (fees.total30d != null)
      lines.push(`  - 30d: ${formatUSD(fees.total30d)}`);
  }

  return lines.join("\n");
}

function formatProtocolIntelligence(
  pools: readonly DeFiLlamaPool[],
  categoryLeaders: readonly DeFiLlamaProtocol[],
  detail: DeFiLlamaProtocolDetail | null,
): string {
  const lines: string[] = [];

  // Top yield pools
  if (pools.length > 0) {
    lines.push("**Top Yield Pools:**");
    lines.push("| Protocol | Pool | TVL | APY (Base) | APY (Reward) |");
    lines.push("|----------|------|-----|------------|--------------|");
    for (const p of pools) {
      lines.push(
        `| ${p.project} | ${p.symbol} | ${formatUSD(p.tvlUsd)} | ${formatAPY(p.apyBase)} | ${formatAPY(p.apyReward)} |`,
      );
    }
  }

  // Category leaders
  if (categoryLeaders.length > 0 && detail?.category) {
    lines.push("");
    lines.push(`**Top ${detail.category} Protocols by TVL:**`);
    lines.push("| # | Protocol | TVL | Chains |");
    lines.push("|---|----------|-----|--------|");
    categoryLeaders.forEach((proto, idx) => {
      const chainCount = proto.chains?.length ?? 0;
      lines.push(
        `| ${idx + 1} | ${proto.name} | ${formatUSD(proto.tvl)} | ${chainCount} chains |`,
      );
    });
  }

  return lines.join("\n");
}

function formatCategoryOverview(
  protocols: readonly DeFiLlamaProtocol[],
  categoryLabel: string,
  chain: string,
): string {
  if (protocols.length === 0) return "";

  const lines: string[] = [];
  lines.push(`**${categoryLabel} on ${chain} — Category Overview**`);
  lines.push("| # | Protocol | TVL | 7d Change | Category |");
  lines.push("|---|----------|-----|-----------|----------|");
  protocols.forEach((proto, idx) => {
    const change7d =
      proto.change_7d != null
        ? `${proto.change_7d >= 0 ? "+" : ""}${proto.change_7d.toFixed(2)}%`
        : "--";
    lines.push(
      `| ${idx + 1} | ${proto.name} | ${formatUSD(proto.tvl)} | ${change7d} | ${proto.category} |`,
    );
  });
  return lines.join("\n");
}

export async function fetchCategoryData(
  categoryKeyword: string,
  chain: string,
): Promise<DeFiLlamaServiceResult> {
  const [protocolsResult, poolsResult] = await Promise.allSettled([
    fetchTopProtocols(categoryKeyword),
    fetchYieldPools(chain, "all"),
  ]);

  const protocols =
    protocolsResult.status === "fulfilled" ? protocolsResult.value : [];

  // Further filter by chain if we have protocols
  const chainFiltered =
    chain.toLowerCase() === "ethereum"
      ? protocols
      : protocols.filter((p) =>
          p.chains?.some((c) => c.toLowerCase() === chain.toLowerCase()),
        );

  const topProtocols = (
    chainFiltered.length > 0 ? chainFiltered : protocols
  ).slice(0, 10);

  const pools = poolsResult.status === "fulfilled" ? poolsResult.value : [];

  const protocolOverview = formatCategoryOverview(
    topProtocols,
    categoryKeyword.charAt(0).toUpperCase() + categoryKeyword.slice(1),
    chain,
  );

  // Reuse formatProtocolIntelligence with empty categoryLeaders (pools carry the value)
  const protocolIntelligence = formatProtocolIntelligence(pools, [], null);

  return { protocolOverview, protocolIntelligence };
}

export async function fetchDeFiLlamaData(
  topic: string,
  chain: string,
): Promise<DeFiLlamaServiceResult> {
  const slug = resolveSlug(topic);

  const [detailResult, poolsResult, feesResult] = await Promise.allSettled([
    fetchProtocolDetail(slug),
    fetchYieldPools(chain, topic),
    fetchFees(slug),
  ]);

  const detail =
    detailResult.status === "fulfilled" ? detailResult.value : null;
  const pools = poolsResult.status === "fulfilled" ? poolsResult.value : [];
  const fees = feesResult.status === "fulfilled" ? feesResult.value : null;

  // Fetch category leaders based on protocol detail
  let categoryLeaders: readonly DeFiLlamaProtocol[] = [];
  if (detail?.category) {
    try {
      categoryLeaders = await fetchTopProtocols(detail.category);
    } catch {
      // Graceful degradation
    }
  }

  const protocolOverview = formatProtocolOverview(detail, fees);
  const protocolIntelligence = formatProtocolIntelligence(
    pools,
    categoryLeaders,
    detail,
  );

  return { protocolOverview, protocolIntelligence };
}
