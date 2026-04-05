/**
 * Nansen Smart Money Plugin — CLI Wrapper
 * Spawns the Nansen CLI via child_process.execFile and parses CSV output.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import type { NansenNetflowEntry, NansenScreenerEntry } from "./types.js";

const execFileAsync = promisify(execFile);

const DEFAULT_CLI_PATH = "/opt/homebrew/bin/nansen";

function getCliPath(): string {
  return process.env.NANSEN_CLI_PATH ?? DEFAULT_CLI_PATH;
}

/**
 * Parses a CSV line, correctly handling quoted fields that may contain commas.
 * Returns an array of string values.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Parses CSV text (with header row) into an array of typed objects.
 * Returns new objects — never mutates the input.
 */
function parseCsv<T>(csv: string): T[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).reduce<T[]>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;

    const values = parseCsvLine(trimmed);
    const entry = headers.reduce<Record<string, unknown>>(
      (obj, header, idx) => {
        const raw = values[idx] ?? "";
        const num = Number(raw);
        return { ...obj, [header]: isNaN(num) || raw === "" ? raw : num };
      },
      {},
    );

    return [...acc, entry as T];
  }, []);
}

/**
 * Fetches smart money netflow data for a given chain.
 */
export async function fetchSmartMoneyNetflow(
  chain: string,
  limit = 10,
): Promise<NansenNetflowEntry[]> {
  const cliPath = getCliPath();

  const { stdout, stderr } = await execFileAsync(cliPath, [
    "research",
    "smart-money",
    "netflow",
    "--chain",
    chain.toLowerCase(),
    "--limit",
    String(limit),
    "--format",
    "csv",
  ]).catch((err: Error) => {
    throw new Error(`Nansen CLI error (smart-money netflow): ${err.message}`);
  });

  if (stderr && !stdout) {
    throw new Error(`Nansen CLI stderr: ${stderr}`);
  }

  const entries = parseCsv<NansenNetflowEntry>(stdout);
  if (entries.length === 0) {
    throw new Error(
      `Nansen CLI returned no netflow entries for chain: ${chain}`,
    );
  }

  return entries;
}

/**
 * Fetches token screener data for a given chain.
 */
export async function fetchTokenScreener(
  chain: string,
  limit = 10,
): Promise<NansenScreenerEntry[]> {
  const cliPath = getCliPath();

  const { stdout, stderr } = await execFileAsync(cliPath, [
    "research",
    "token",
    "screener",
    "--chain",
    chain.toLowerCase(),
    "--limit",
    String(limit),
    "--format",
    "csv",
  ]).catch((err: Error) => {
    throw new Error(`Nansen CLI error (token screener): ${err.message}`);
  });

  if (stderr && !stdout) {
    throw new Error(`Nansen CLI stderr: ${stderr}`);
  }

  const entries = parseCsv<NansenScreenerEntry>(stdout);
  if (entries.length === 0) {
    throw new Error(
      `Nansen CLI returned no screener entries for chain: ${chain}`,
    );
  }

  return entries;
}
