/**
 * Nansen Smart Money Plugin — Shared Types
 * Shapes for Nansen CLI CSV output (smart-money netflow + token screener).
 */

// smart-money netflow fields:
// token_address, token_symbol, net_flow_1h_usd, net_flow_24h_usd,
// net_flow_7d_usd, net_flow_30d_usd, chain, token_sectors,
// trader_count, token_age_days, market_cap_usd
export interface NansenNetflowEntry {
  token_address: string;
  token_symbol: string;
  net_flow_1h_usd: number;
  net_flow_24h_usd: number;
  net_flow_7d_usd: number;
  net_flow_30d_usd: number;
  chain: string;
  token_sectors: string;
  trader_count: number;
  token_age_days: number;
  market_cap_usd: number;
}

// token screener fields:
// chain, token_address, token_symbol, token_age_days, market_cap_usd,
// liquidity, price_usd, price_change, fdv, fdv_mc_ratio,
// buy_volume, inflow_fdv_ratio, outflow_fdv_ratio, sell_volume, volume, netflow
export interface NansenScreenerEntry {
  chain: string;
  token_address: string;
  token_symbol: string;
  token_age_days: number;
  market_cap_usd: number;
  liquidity: number;
  price_usd: number;
  price_change: number;
  fdv: number;
  fdv_mc_ratio: number;
  buy_volume: number;
  inflow_fdv_ratio: number;
  outflow_fdv_ratio: number;
  sell_volume: number;
  volume: number;
  netflow: number;
}

export type NansenCommandResult =
  | { ok: true; data: NansenNetflowEntry[] }
  | { ok: true; data: NansenScreenerEntry[] }
  | { ok: false; error: string };
