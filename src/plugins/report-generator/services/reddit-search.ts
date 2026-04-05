/**
 * Reddit Search Service — JSON API, zero auth, zero deps.
 * Searches r/ethereum and r/defi, combines and sorts by score.
 */

import type { RedditPost } from "../types";

const SUBREDDITS = ["ethereum", "defi"] as const;
const MAX_POSTS_PER_SUB = 10;
const USER_AGENT = "octy-agent/0.1.0";

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
}

interface RedditRawPost {
  readonly title?: string;
  readonly selftext?: string;
  readonly subreddit?: string;
  readonly score?: number;
  readonly num_comments?: number;
  readonly permalink?: string;
  readonly created_utc?: number;
}

interface RedditListingChild {
  readonly data: RedditRawPost;
}

interface RedditListingResponse {
  readonly data?: {
    readonly children?: readonly RedditListingChild[];
  };
}

async function fetchSubreddit(
  subreddit: string,
  query: string,
): Promise<readonly RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${MAX_POSTS_PER_SUB}&restrict_sr=on`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Reddit r/${subreddit} returned ${response.status}`);
  }

  const json = (await response.json()) as RedditListingResponse;
  const children = json.data?.children ?? [];

  return children.map((child) => ({
    title: truncateText(String(child.data.title ?? ""), 200),
    selftext: truncateText(String(child.data.selftext ?? ""), 200),
    subreddit: String(child.data.subreddit ?? subreddit),
    score: Number(child.data.score ?? 0),
    numComments: Number(child.data.num_comments ?? 0),
    url: child.data.permalink
      ? `https://www.reddit.com${child.data.permalink}`
      : "",
    created: Number(child.data.created_utc ?? 0),
  }));
}

export async function searchReddit(
  topic: string,
): Promise<readonly RedditPost[]> {
  const results = await Promise.allSettled(
    SUBREDDITS.map((sub) => fetchSubreddit(sub, topic)),
  );

  const allPosts: RedditPost[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allPosts.push(...result.value);
    }
  }

  // Sort by score descending, then truncate to budget (~3000 tokens)
  const sorted = allPosts.sort((a, b) => b.score - a.score);
  return sorted.slice(0, 15);
}
