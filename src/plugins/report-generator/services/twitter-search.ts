/**
 * Twitter/X Search Service — bird CLI wrapper.
 * Falls back gracefully if bird is not installed or fails.
 */

import { execSync } from "node:child_process";
import type { TwitterResult } from "../types";

interface BirdTweet {
  readonly text?: string;
  readonly username?: string;
  readonly user?: string;
  readonly likes?: number;
  readonly like_count?: number;
  readonly retweets?: number;
  readonly retweet_count?: number;
  readonly date?: string;
  readonly created_at?: string;
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
}

export async function searchTwitter(
  topic: string,
): Promise<readonly TwitterResult[]> {
  try {
    const query = `${topic} DeFi`;
    const output = execSync(
      `bird search "${query.replace(/"/g, '\\"')}" -n 10 --json`,
      {
        encoding: "utf8",
        timeout: 15000,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    const parsed = JSON.parse(output) as readonly BirdTweet[];
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 10).map((tweet) => ({
      text: truncateText(String(tweet.text ?? ""), 280),
      username: String(tweet.username ?? tweet.user ?? "unknown"),
      likes: Number(tweet.likes ?? tweet.like_count ?? 0),
      retweets: Number(tweet.retweets ?? tweet.retweet_count ?? 0),
      date: String(tweet.date ?? tweet.created_at ?? ""),
    }));
  } catch {
    // bird CLI not found or failed — graceful degradation
    return [];
  }
}
