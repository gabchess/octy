/**
 * Tests for Nansen Smart Money Plugin — CLI Wrapper
 *
 * parseCsvLine and parseCsv are private (unexported) functions. Their behaviour
 * is verified indirectly by driving fetchSmartMoneyNetflow / fetchTokenScreener
 * with mocked execFile output that exercises the relevant parsing paths:
 *   - basic comma-separated fields
 *   - quoted fields containing commas
 *   - empty/whitespace-only lines skipped by parseCsv
 *
 * The module under test calls util.promisify(execFile) at the top level.
 * Because promisify is evaluated during module initialisation, we mock the
 * `util` module so that promisify() returns our own async stub directly.
 * This is the only reliable intercept point in bun's module mock system.
 *
 * The real Nansen CLI at /opt/homebrew/bin/nansen is NEVER invoked.
 */

import { describe, it, expect, mock, beforeEach } from "bun:test";

// ---------------------------------------------------------------------------
// Helpers to build controlled CSV payloads
// ---------------------------------------------------------------------------

const NETFLOW_HEADER =
  "token_address,token_symbol,net_flow_1h_usd,net_flow_24h_usd," +
  "net_flow_7d_usd,net_flow_30d_usd,chain,token_sectors," +
  "trader_count,token_age_days,market_cap_usd";

const SCREENER_HEADER =
  "chain,token_address,token_symbol,token_age_days,market_cap_usd," +
  "liquidity,price_usd,price_change,fdv,fdv_mc_ratio," +
  "buy_volume,inflow_fdv_ratio,outflow_fdv_ratio,sell_volume,volume,netflow";

function netflowRow(
  overrides: {
    token_address?: string;
    token_symbol?: string;
    net_flow_1h_usd?: number;
    net_flow_24h_usd?: number;
    net_flow_7d_usd?: number;
    net_flow_30d_usd?: number;
    chain?: string;
    token_sectors?: string;
    trader_count?: number;
    token_age_days?: number;
    market_cap_usd?: number;
  } = {},
): string {
  const r = {
    token_address: "0xabc123",
    token_symbol: "TKN",
    net_flow_1h_usd: 1000,
    net_flow_24h_usd: 5000,
    net_flow_7d_usd: 20000,
    net_flow_30d_usd: 80000,
    chain: "ethereum",
    token_sectors: "DeFi",
    trader_count: 42,
    token_age_days: 365,
    market_cap_usd: 1000000,
    ...overrides,
  };
  return [
    r.token_address,
    r.token_symbol,
    r.net_flow_1h_usd,
    r.net_flow_24h_usd,
    r.net_flow_7d_usd,
    r.net_flow_30d_usd,
    r.chain,
    r.token_sectors,
    r.trader_count,
    r.token_age_days,
    r.market_cap_usd,
  ].join(",");
}

function screenerRow(
  overrides: Partial<{
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
  }> = {},
): string {
  const r = {
    chain: "ethereum",
    token_address: "0xdef",
    token_symbol: "SCR",
    token_age_days: 180,
    market_cap_usd: 500000,
    liquidity: 200000,
    price_usd: 1.5,
    price_change: 0.05,
    fdv: 600000,
    fdv_mc_ratio: 1.2,
    buy_volume: 50000,
    inflow_fdv_ratio: 0.08,
    outflow_fdv_ratio: 0.03,
    sell_volume: 15000,
    volume: 65000,
    netflow: 35000,
    ...overrides,
  };
  return [
    r.chain,
    r.token_address,
    r.token_symbol,
    r.token_age_days,
    r.market_cap_usd,
    r.liquidity,
    r.price_usd,
    r.price_change,
    r.fdv,
    r.fdv_mc_ratio,
    r.buy_volume,
    r.inflow_fdv_ratio,
    r.outflow_fdv_ratio,
    r.sell_volume,
    r.volume,
    r.netflow,
  ].join(",");
}

// ---------------------------------------------------------------------------
// Mock strategy
//
// nansen-cli.ts does:
//   const execFileAsync = promisify(execFile);   // top-level, evaluated once
//
// mock.module("child_process") is too late — promisify already captured the
// real execFile reference before our mock installs.
//
// Solution: mock "util" so that promisify() returns our own async function.
// The mock is registered before the module under test is imported, so the
// top-level promisify() call binds to our stub.
// ---------------------------------------------------------------------------

// Mutable state that tests write to before each call
let mockStdout = "";
let mockStderr = "";
let mockError: Error | null = null;

// The async function that replaces execFileAsync inside nansen-cli.ts
const execFileStub = mock(async () => {
  if (mockError) throw mockError;
  return { stdout: mockStdout, stderr: mockStderr };
});

mock.module("util", () => ({
  // promisify is called with execFile — we ignore the argument and always
  // return our stub, which is what the module stores as execFileAsync.
  promisify: mock(() => execFileStub),
}));

// Import AFTER the mock so nansen-cli.ts picks up our promisify replacement.
const { fetchSmartMoneyNetflow, fetchTokenScreener } =
  await import("./nansen-cli.js");

// ---------------------------------------------------------------------------
// Reset state before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockStdout = "";
  mockStderr = "";
  mockError = null;
  execFileStub.mockClear();
});

// ---------------------------------------------------------------------------
// parseCsvLine behaviour — verified via fetchSmartMoneyNetflow
// ---------------------------------------------------------------------------

describe("parseCsvLine — basic field parsing", () => {
  it("parses a simple comma-separated netflow row", async () => {
    mockStdout = [NETFLOW_HEADER, netflowRow()].join("\n");

    const entries = await fetchSmartMoneyNetflow("ethereum", 1);

    expect(entries).toHaveLength(1);
    // Note: parseCsv coerces any field where !isNaN(Number(raw)) to a number.
    // Hex strings like Ethereum addresses parse as valid JS numbers, so
    // token_address arrives as a numeric value — this is known source behaviour.
    expect(entries[0].token_symbol).toBe("TKN");
    expect(entries[0].net_flow_1h_usd).toBe(1000);
    expect(entries[0].trader_count).toBe(42);
  });

  it("parses a quoted field containing a comma (token_sectors with embedded comma)", async () => {
    // token_sectors = "DeFi,Lending" — the inner comma must not split the field
    const row =
      '0xabc,TKN,1000,5000,20000,80000,ethereum,"DeFi,Lending",42,365,1000000';
    mockStdout = [NETFLOW_HEADER, row].join("\n");

    const entries = await fetchSmartMoneyNetflow("ethereum", 1);

    expect(entries).toHaveLength(1);
    expect(entries[0].token_sectors).toBe("DeFi,Lending");
  });

  it("parses a quoted field containing escaped double-quotes", async () => {
    // token_sectors = 'DeFi "blue-chip"' — CSV-encoded as '"DeFi ""blue-chip"""'
    const row =
      '0xabc,TKN,1000,5000,20000,80000,ethereum,"DeFi ""blue-chip""",42,365,1000000';
    mockStdout = [NETFLOW_HEADER, row].join("\n");

    const entries = await fetchSmartMoneyNetflow("ethereum", 1);

    expect(entries).toHaveLength(1);
    expect(entries[0].token_sectors).toBe('DeFi "blue-chip"');
  });
});

// ---------------------------------------------------------------------------
// parseCsv behaviour — header + multiple data rows, empty lines
// ---------------------------------------------------------------------------

describe("parseCsv — multi-row and empty-line handling", () => {
  it("parses two netflow data rows correctly", async () => {
    const row1 = netflowRow({ token_symbol: "AAA", net_flow_1h_usd: 100 });
    const row2 = netflowRow({ token_symbol: "BBB", net_flow_1h_usd: 200 });
    mockStdout = [NETFLOW_HEADER, row1, row2].join("\n");

    const entries = await fetchSmartMoneyNetflow("ethereum", 2);

    expect(entries).toHaveLength(2);
    expect(entries[0].token_symbol).toBe("AAA");
    expect(entries[0].net_flow_1h_usd).toBe(100);
    expect(entries[1].token_symbol).toBe("BBB");
    expect(entries[1].net_flow_1h_usd).toBe(200);
  });

  it("skips blank lines between data rows", async () => {
    const row1 = netflowRow({ token_symbol: "AAA" });
    const row2 = netflowRow({ token_symbol: "BBB" });
    // Blank line inserted between data rows — must not produce a phantom entry
    mockStdout = [NETFLOW_HEADER, row1, "", row2].join("\n");

    const entries = await fetchSmartMoneyNetflow("ethereum", 2);

    expect(entries).toHaveLength(2);
    expect(entries[0].token_symbol).toBe("AAA");
    expect(entries[1].token_symbol).toBe("BBB");
  });

  it("returns an error when CSV has only a header and no data rows", async () => {
    mockStdout = NETFLOW_HEADER;

    await expect(fetchSmartMoneyNetflow("ethereum", 1)).rejects.toThrow(
      "Nansen CLI returned no netflow entries for chain: ethereum",
    );
  });
});

// ---------------------------------------------------------------------------
// fetchSmartMoneyNetflow — success and error paths
// ---------------------------------------------------------------------------

describe("fetchSmartMoneyNetflow", () => {
  it("returns parsed entries on valid CSV output", async () => {
    const row = netflowRow({
      token_symbol: "ETH",
      net_flow_24h_usd: 999999,
      chain: "ethereum",
    });
    mockStdout = [NETFLOW_HEADER, row].join("\n");

    const entries = await fetchSmartMoneyNetflow("ethereum", 1);

    expect(entries).toHaveLength(1);
    expect(entries[0].token_symbol).toBe("ETH");
    expect(entries[0].net_flow_24h_usd).toBe(999999);
    expect(entries[0].chain).toBe("ethereum");
  });

  it("normalises numeric fields to numbers, not strings", async () => {
    mockStdout = [NETFLOW_HEADER, netflowRow()].join("\n");

    const entries = await fetchSmartMoneyNetflow("ethereum", 1);

    expect(typeof entries[0].net_flow_1h_usd).toBe("number");
    expect(typeof entries[0].trader_count).toBe("number");
    expect(typeof entries[0].market_cap_usd).toBe("number");
  });

  it("throws when CLI returns empty stdout", async () => {
    mockStdout = "";

    await expect(fetchSmartMoneyNetflow("ethereum", 1)).rejects.toThrow(
      "Nansen CLI returned no netflow entries for chain: ethereum",
    );
  });

  it("throws when stdout contains only the header row (no data rows)", async () => {
    mockStdout = NETFLOW_HEADER + "\n";

    await expect(fetchSmartMoneyNetflow("ethereum", 1)).rejects.toThrow(
      "Nansen CLI returned no netflow entries for chain: ethereum",
    );
  });

  it("throws with CLI error message when execFile rejects", async () => {
    mockError = new Error("CLI exited with code 1");

    await expect(fetchSmartMoneyNetflow("ethereum", 1)).rejects.toThrow(
      "Nansen CLI error (smart-money netflow): CLI exited with code 1",
    );
  });

  it("throws when stderr is set and stdout is empty", async () => {
    mockStderr = "authentication failed";
    mockStdout = "";

    await expect(fetchSmartMoneyNetflow("ethereum", 1)).rejects.toThrow();
  });

  it("accepts a custom chain name and returns entries with that chain field", async () => {
    const row = netflowRow({ chain: "base" });
    mockStdout = [NETFLOW_HEADER, row].join("\n");

    const entries = await fetchSmartMoneyNetflow("BASE", 1);

    expect(entries).toHaveLength(1);
    expect(entries[0].chain).toBe("base");
  });
});

// ---------------------------------------------------------------------------
// fetchTokenScreener — success and error paths
// ---------------------------------------------------------------------------

describe("fetchTokenScreener", () => {
  it("returns parsed screener entries on valid CSV output", async () => {
    const row = screenerRow({
      token_symbol: "UNI",
      price_usd: 7.42,
      volume: 1234567,
    });
    mockStdout = [SCREENER_HEADER, row].join("\n");

    const entries = await fetchTokenScreener("ethereum", 1);

    expect(entries).toHaveLength(1);
    expect(entries[0].token_symbol).toBe("UNI");
    expect(entries[0].price_usd).toBe(7.42);
    expect(entries[0].volume).toBe(1234567);
  });

  it("normalises screener numeric fields to numbers, not strings", async () => {
    mockStdout = [SCREENER_HEADER, screenerRow()].join("\n");

    const entries = await fetchTokenScreener("ethereum", 1);

    expect(typeof entries[0].price_usd).toBe("number");
    expect(typeof entries[0].market_cap_usd).toBe("number");
    expect(typeof entries[0].netflow).toBe("number");
  });

  it("parses two screener rows correctly", async () => {
    const row1 = screenerRow({ token_symbol: "UNI", price_usd: 7.0 });
    const row2 = screenerRow({ token_symbol: "AAVE", price_usd: 90.0 });
    mockStdout = [SCREENER_HEADER, row1, row2].join("\n");

    const entries = await fetchTokenScreener("ethereum", 2);

    expect(entries).toHaveLength(2);
    expect(entries[0].token_symbol).toBe("UNI");
    expect(entries[1].token_symbol).toBe("AAVE");
  });

  it("throws when CLI returns empty stdout", async () => {
    mockStdout = "";

    await expect(fetchTokenScreener("ethereum", 1)).rejects.toThrow(
      "Nansen CLI returned no screener entries for chain: ethereum",
    );
  });

  it("throws when stdout contains only the header row (no data rows)", async () => {
    mockStdout = SCREENER_HEADER + "\n";

    await expect(fetchTokenScreener("ethereum", 1)).rejects.toThrow(
      "Nansen CLI returned no screener entries for chain: ethereum",
    );
  });

  it("throws with CLI error message when execFile rejects", async () => {
    mockError = new Error("ENOENT: CLI not found");

    await expect(fetchTokenScreener("ethereum", 1)).rejects.toThrow(
      "Nansen CLI error (token screener): ENOENT: CLI not found",
    );
  });

  it("throws when stderr is set and stdout is empty", async () => {
    mockStderr = "rate limit exceeded";
    mockStdout = "";

    await expect(fetchTokenScreener("ethereum", 1)).rejects.toThrow();
  });

  it("skips blank lines in screener CSV output", async () => {
    const row1 = screenerRow({ token_symbol: "ARB", chain: "arbitrum" });
    const row2 = screenerRow({ token_symbol: "GMX", chain: "arbitrum" });
    // Trailing blank line and blank line between rows — both must be ignored
    mockStdout = [SCREENER_HEADER, row1, "", row2, ""].join("\n");

    const entries = await fetchTokenScreener("arbitrum", 5);

    expect(entries).toHaveLength(2);
    expect(entries[0].token_symbol).toBe("ARB");
    expect(entries[1].token_symbol).toBe("GMX");
  });
});
