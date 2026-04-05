# Octy — DeFi Competitive Analysis Agent

DeFi intelligence agent that takes natural-language queries and returns structured competitive briefs: TVL, APY, fees, and smart money signals.

Built on ElizaOS v2, deployed on Nosana decentralized GPU.

---

## About

Octy is a DeFi competitive intelligence agent that answers natural language questions
about protocols, vaults, and yield opportunities — powered by real-time on-chain data.

Ask it "Give me a DeFi intelligence report on Vaults in Ethereum" and it queries
DeFiLlama, CoinGecko, NS3.ai, Reddit, and X/Twitter simultaneously, synthesizes the
data with Qwen3.5, and returns a structured report with TVL rankings, APY comparisons,
news sentiment, and a data-driven verdict.

Built on ElizaOS v2 — the open-source framework powering autonomous AI agents — and
deployed on Nosana's decentralized GPU network running on Solana. No centralized
inference. No subscription. The agent runs on community-provided GPU infrastructure,
making institutional-grade DeFi research accessible to anyone.

**Why it exists:** DeFiLlama's AI research tool charges $49/month. We built a
comparable DeFi intelligence agent, deployed it on decentralized compute, and made
it free to use.

**Technical architecture:**
- 3 custom ElizaOS plugins: defi-data, nansen-smart-money, report-generator
- Parallel data fetching with Promise.allSettled — 5 sources simultaneously
- Handlebars templating for structured report output
- LLM synthesis layer adds executive summary with key findings
- Docker containerized (AMD64) for Nosana GPU deployment
- Category-aware DeFiLlama queries: search by protocol category (vaults,
  lending, DEX) filtered by chain

**Data sources:** DeFiLlama (TVL, yields, fees), CoinGecko (prices, market caps),
NS3.ai (news intelligence), Tavily (web search), Reddit (community sentiment),
X/Twitter via bird CLI (social signals).

**Deployed on:** Nosana decentralized GPU (NVIDIA 3060) — verified on-chain.

---

## Live Deployment

**Nosana endpoint:** https://2rqelazk5f5w6hsg96hdu7jjcraetraoahvs85uupaqm.node.k8s.prd.nos.ci

**Demo video:** https://youtu.be/CSsHmGn3vKs

---

## What it does

Ask Octy about DeFi protocols in plain English:

- "vaults in Ethereum" → table of top yield vaults by TVL with APY and fees
- "compare Aave vs Morpho" → side-by-side protocol comparison with verdict
- "best stablecoin yields" → risk-adjusted yield table across chains
- "top DEXes on Arbitrum" → volume, market share, and fee breakdown

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/gabchess/octy.git
cd octy
cp .env.example .env
bun install

# Start the agent
bun run start

# Open the chat UI
# Visit http://localhost:3000 in your browser
```

**Example queries to try:**
- `"vaults in Ethereum"` — competitive analysis of top yield protocols
- `"compare Aave vs Morpho"` — side-by-side protocol comparison
- `"smart money flows on Ethereum"` — real-time Nansen whale tracking
- `"what are smart money buying"` — Nansen token screener
- `"top DEXes by volume on Arbitrum"` — cross-chain DEX analysis

---

## Architecture

- **Framework:** ElizaOS v2 agent with custom DeFi data plugins
- **Data sources:** DeFiLlama (TVL, APY, fees), CoinGecko (prices), Nansen CLI (smart money), Uniswap v3 subgraph
- **LLM:** Qwen3.5 via Nosana inference endpoint
- **Chat UI:** Built-in ElizaOS web client at `http://localhost:3000`
- **Language:** TypeScript

---

## Data sources

| Source | What it provides | Notes |
|--------|-----------------|-------|
| DeFiLlama | TVL, protocol rankings, yield data | |
| CoinGecko | Token prices, market caps | |
| Uniswap v3 subgraph | On-chain volume, fees, liquidity depth | |
| Nansen CLI | Smart money flows, token screener | Nansen API key required |

---

## Demo

Query: `compare Aave vs Morpho`

```
Aave v3 vs Morpho Blue — Lending Protocol Comparison

| Metric          | Aave v3  | Morpho Blue |
|-----------------|----------|-------------|
| TVL             | $14.2B   | $2.8B       |
| USDC Supply APY | 4.1%     | 6.9%        |
| ETH Borrow Rate | 2.8%     | 3.1%        |
| Protocol Fees   | ~10%     | 0%          |
| Risk Model      | Pooled   | Isolated    |

Verdict: Morpho Blue offers better rates with isolated risk.
Aave v3 has deeper liquidity for large positions (>$1M).
```

---

## Deploy to Nosana

```bash
# Build Docker image
docker build -t gabchess/octy:latest .

# Push to Docker Hub
docker push gabchess/octy:latest

# Deploy via Nosana Dashboard
# https://dashboard.nosana.com/deploy
# Paste contents of nos_job_def/nosana_eliza_job_definition.json
```

---

## Project structure

```
characters/agent.character.json                         # Octy's personality and examples
src/index.ts                                            # Agent entry point
src/plugins/defi-data/                                  # DeFi data plugin
  index.ts                                              #   Plugin registration
  types.ts                                              #   Shared DeFi types
  utils.ts                                              #   Shared utilities
  providers/defillama-vaults.ts                         #   DeFiLlama yield pools
  providers/defillama-protocol.ts                       #   DeFiLlama protocol TVL + fees
  providers/coingecko-price.ts                          #   CoinGecko token prices
  providers/uniswap-pools.ts                            #   Uniswap v3 subgraph pools
  actions/competitive-analysis.ts                       #   Competitive analysis action
  actions/protocol-deep-dive.ts                         #   Protocol deep dive action
src/plugins/nansen-smart-money/                         # Nansen smart money plugin
  index.ts                                              #   Plugin registration
  nansen-cli.ts                                         #   Nansen CLI wrapper
  types.ts                                              #   Smart money types
  actions/smart-money-analysis.ts                       #   Smart money analysis action
  providers/smart-money-flows.ts                        #   Whale flow provider
  providers/token-screener.ts                           #   Token screener provider
patches/                                                # Dependency patches (patch-package)
  @ai-sdk+openai+2.0.101.patch                          #   @ai-sdk/openai compatibility fix
nos_job_def/                                            # Nosana job definition
Dockerfile                                              # Container config
.env.example                                            # Environment template
```

---

## Challenge

Built for the [Nosana x ElizaOS Builders Challenge](https://superteam.fun/earn/listing/nosana-builders-elizaos-challenge/) — April 2026.

**Built with ElizaOS · Deployed on Nosana · Powered by Qwen3.5**

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=gabchess/octy&type=Date)](https://star-history.com/#gabchess/octy&Date)
