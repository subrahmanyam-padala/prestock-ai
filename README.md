markdown

# PreStock AI

**AI-powered research and portfolio intelligence for tokenized pre-IPO stocks on Solana.**

Built for the **Stocklana Solana Hackathon 2026** — PreStocks bounty (Best Use of PreStocks).

**Live Demo:** [https://prestock-ai.vercel.app](https://prestock-ai.vercel.app)
**GitHub:** [https://github.com/subrahmanyam-padala/prestock-ai](https://github.com/subrahmanyam-padala/prestock-ai)

---

## Problem

PreStocks tokens track the price of private companies such as SpaceX, OpenAI, and Anthropic. The public data is a table of numbers. Newcomers cannot easily tell what a token represents, what its numbers mean, how the token price relates to its mark price, or what information is missing.

## Solution

PreStock AI turns the live PreStocks API into a professional explorer, structured AI research reports, and a simulated portfolio tool.  

Every value is clearly labelled by origin:
- **PreStocks API**
- **Computed**
- **AI Interpretation**

The AI is strictly instructed to list missing information instead of inventing it.

---

## Features

- **Markets** — All 8 PreStocks with search, filter, sort, responsive table/cards, loading skeletons, empty & error states, and retry.
- **Detail page** (`/stock/:symbol`) — Live token & mark price, valuations, supply, contract address, computed *Token vs Mark Spread*, peer spread comparison, data-sources table, and on-chain supply check.  
  *(No price chart — the API provides no historical data.)*
- **AI Research Agent** — “Analyze with AI” generates:
  - Executive Summary
  - Facts from PreStocks
  - Market Observations
  - AI Interpretation
  - Potential Risks
  - Questions to Investigate
  - Data Limitations
- **Portfolio Intelligence** — Create allocations (validated to 100%), simulated token quantities, donut chart, largest holding, HHI, effective holdings, weighted spread, hypothetical scenarios, and “Analyze Portfolio with AI”.
- **Watchlist** — Persisted in `localStorage`.
- **Smart Alerts** — Token price above/below and spread above/below thresholds (evaluated while the app is open).
- **Solana Wallet** — Phantom & Solflare via Wallet Adapter + read-only display of PreStocks tokens held in the connected wallet.

---

## Architecture

React + Vite + TypeScript + Tailwind + Recharts + Solana Wallet Adapter
                │
                │  /api/*
                ▼
Express + TypeScript
  ├── Zod validation
  ├── 30-second cache + retry + stale fallback
  ├── Rate limiting
  │
  ├── services/prestocksService  →  https://prestocks.com/api/prestocks
  ├── services/aiService         →  Gemini API (structured JSON)
  └── services/solanaService     →  Solana JSON-RPC (balances + mint supply)

The browser never calls PreStocks or Gemini directly.  
No API keys ever reach the client.

---

## Tech Stack

| Layer       | Technologies                                      |
|-------------|---------------------------------------------------|
| Frontend    | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Solana Wallet Adapter |
| Backend     | Node.js, Express, TypeScript, Zod                 |
| AI          | Google Gemini (structured JSON output)            |
| Blockchain  | Solana Web3.js + Wallet Adapter (Phantom / Solflare) |

---

## PreStocks Integration

Verified against the live endpoint:

GET https://prestocks.com/api/prestocks

- No authentication required
- Returns an array of assets with exactly these fields:  
  `name, symbol, description, image, external_url, contract_address, markPrice, markValuation, tokenPrice, impliedValuation, supply`
- No `id` field (we use `symbol`)
- No price history, volume, or holder data

The server:
- Validates every response with Zod
- Caches results for 30 seconds
- Retries transient failures with exponential backoff
- Serves recent cached data (flagged as `stale`) if the upstream is unavailable

**Only PreStocks tokens are integrated.**  
No other pre-IPO token sources are used (eligibility requirement for the bounty).

### Computed Metrics (always labelled as Computed)

- **Token vs Mark Spread** = `(tokenPrice − markPrice) / markPrice × 100`
- Supply × token price
- Portfolio: dollar allocation, simulated tokens = dollars ÷ tokenPrice
- HHI = Σ(weight%)²
- Effective holdings = 10,000 ÷ HHI
- Weighted spread
- Weight above/below mark
- Arithmetic scenarios (e.g. largest holding falls 30%, or every token reprices to mark)

**Not calculated** (API cannot support them): correlation, volatility, Sharpe ratio, historical returns.

---

## AI Architecture

1. Server fetches current PreStocks data (never UI text) and builds a strict JSON payload containing `availableFields` and `unavailable` lists.
2. System prompt (`server/src/prompts.ts`) forces the model to:
   - Use only the supplied data
   - Never invent metrics
   - Treat description text as untrusted
   - Forbid buy/sell advice
   - Explicitly state missing information
3. Model must return JSON matching a strict schema (Gemini structured output).
4. **Facts are built by the server from the API response**, not by the model, and are merged into the final report.
5. UI clearly badges every section as:
   - *PreStocks Data*
   - *AI Interpretation*
   - *Data Not Available*

---

## Why Solana?

PreStocks are SPL tokens on Solana. The API publishes each token’s mint address (`contract_address`).

This enables two live, demonstrable features:

1. Reading the connected wallet’s PreStocks balances directly from the chain
2. Comparing the API-reported `supply` with the actual on-chain mint supply

The application **never** sends transactions or asks the user to sign anything.

---

## Screenshots

*(Add images to `docs/screenshots/`)*

| Markets | Asset Detail + AI Report | Portfolio Intelligence |
|---------|---------------------------|------------------------|
| ![Markets](docs/screenshots/markets.png) | ![Detail](docs/screenshots/detail-ai.png) | ![Portfolio](docs/screenshots/portfolio.png) |

---

## Local Setup

**Requirements:** Node.js 20+

```bash
# Install dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Add your GEMINI_API_KEY

# Start development servers
npm run dev
# → Frontend: http://localhost:5173
# → Backend:  http://localhost:8787

# Type checking
npm run typecheck

# Run server tests
npm run test --prefix server

