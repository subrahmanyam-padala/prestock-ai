# PreStock AI

**AI-powered research and portfolio intelligence for tokenized pre-IPO stocks on Solana.**
Built for the Stocklana Solana Hackathon 2026, PreStocks bounty.

## Problem
PreStocks tokens track the price of private companies such as SpaceX, OpenAI and Anthropic. The public data is a table of numbers. Newcomers cannot easily tell what a token represents, what its numbers mean, how the token price relates to its mark price, or what is missing.

## Solution
PreStock AI turns the live PreStocks API into an explorer, a structured AI research report, and a simulated portfolio tool. Every value is labelled by origin (**PreStocks API**, **Computed**, or **AI interpretation**), and the AI is instructed to list missing information instead of filling it in.

## Features
- **Markets**: all 8 PreStocks with search, filter, sort, responsive table/cards, loading skeletons, empty and error states, retry.
- **Detail page** (`/stock/:symbol`): live token and mark price, valuations, supply, contract address, computed *Token vs Mark Spread*, peer spread comparison, data-sources table, on-chain supply check. No price chart, because the API has no history.
- **AI research**: "Analyze with AI" produces executive summary, facts, market observations, interpretation, risks, questions to investigate and a data-limitations list.
- **Portfolio intelligence**: allocations validated to 100%, simulated token quantities, donut chart, largest holding, HHI, effective holdings, weighted spread, hypothetical scenarios, "Analyze Portfolio with AI".
- **Watchlist**: persisted in localStorage.
- **Smart alerts**: token price above/below and spread above/below, evaluated on every poll while the app is open.
- **Solana wallet**: Phantom and Solflare via Wallet Adapter, plus read-only display of the PreStocks tokens the wallet holds.

## Architecture
```
React + Vite + TS + Tailwind + Recharts + Wallet Adapter
        │ /api/*
Express + TS  (Zod validation, 30 s cache, retry, rate limits)
   ├── services/prestocksService → https://prestocks.com/api/prestocks
   ├── services/aiService        → Gemini API (structured JSON output)
   └── services/solanaService    → Solana JSON-RPC (token balances, mint supply)
```
The browser never calls PreStocks or Gemini directly, and no key reaches the client.

## Tech stack
React 18, Vite, TypeScript, Tailwind CSS, Recharts, Solana Wallet Adapter, Node, Express, Zod, Gemini API.

## PreStocks integration
Verified against the live endpoint. `GET /api/prestocks` needs no authentication and returns an array of assets with exactly these fields: `name, symbol, description, image, external_url, contract_address, markPrice, markValuation, tokenPrice, impliedValuation, supply`. There is no id field (we use `symbol`), no price history, no volume, no holders. The server validates the response with Zod, caches it for 30 s, retries transient failures with backoff, and serves recent cached data (flagged `stale`) if the upstream is down. Only PreStocks tokens are integrated; no other pre-IPO token source is used.

Computed metrics (always labelled as computed):
- Token vs Mark Spread = `(tokenPrice − markPrice) / markPrice × 100`
- Supply × token price
- Portfolio: dollar allocation, simulated tokens = dollars ÷ tokenPrice, HHI = Σ(weight%)², effective holdings = 10,000 ÷ HHI, weighted spread, weight above/below mark
- Scenarios: a chosen holding changes by X% (default: largest falls 30%), and "every token reprices to mark price". These are arithmetic, not forecasts.

Not calculated, because the API cannot support it: correlation, volatility, Sharpe ratio, historical returns.

## AI architecture
1. The server fetches current PreStocks data (never UI text) and builds a JSON payload with `availableFields` and `unavailable` lists.
2. A system prompt (`server/src/prompts.ts`) restricts the model to the supplied data, forbids invented metrics, treats description text as untrusted, forbids buy/sell advice, and requires missing data to be stated.
3. The model must return JSON matching a strict schema (Gemini structured JSON output).
4. **Facts are built by the server from the API response, not by the model**, and merged into the report. The disclaimer is also server-side.
5. The UI badges sections as *PreStocks Data*, *AI Interpretation* or *Data Not Available*.

## Why Solana?
PreStocks tokens are SPL tokens on Solana, and the API publishes each token's mint address. That lets this app do two things that can be demonstrated live: read the connected wallet's PreStocks balances straight from the chain, and compare the API's reported `supply` with the mint's on-chain supply. The app never sends transactions or asks you to sign anything.

## Screenshots
Add images to `docs/screenshots/` before submitting.

## Local setup
Requires Node 20+.
```bash
npm run install:all
cp server/.env.example server/.env   # add GEMINI_API_KEY
npm run dev                           # client :5173, server :8787
npm run typecheck
npm run test --prefix server
```

## Environment variables
| File | Variable | Purpose |
|---|---|---|
| server/.env | `GEMINI_API_KEY` | Required for AI features |
| server/.env | `GEMINI_MODEL` | Gemini Free Tier model (default `gemini-3.5-flash`) |
| server/.env | `SOLANA_RPC_URL` | Use your own RPC for reliable demos |
| server/.env | `PORT`, `CORS_ORIGIN`, `PRESTOCKS_API_URL` | Optional |
| client/.env | `VITE_API_BASE`, `VITE_SOLANA_RPC` | Optional |

## Deployment
One service: `npm run install:all && npm run build`, then `npm start`. The Express server serves `client/dist` and `/api`. Set the server variables on the host (Render, Railway, Fly). Use `VITE_API_BASE` only if the frontend is hosted separately, and then set `CORS_ORIGIN` to its URL.

## Limitations
- No historical prices, so no price charts, returns or risk statistics.
- Alerts and "vs previous snapshot" only work while the app is open, and compare readings saved in one browser.
- Watchlist, alerts and portfolio live in localStorage.
- The public Solana RPC is rate limited.
- The AI can still make mistakes; facts are separated so they can be checked.
- PreStocks are not available to US persons and confer no ownership rights. This is not investment advice.

## Roadmap
Server-side snapshot history (would enable real charts), background notifications, shareable research reports, holder and volume data if PreStocks exposes it.

## Hackathon
Stocklana Solana Hackathon 2026 · Best Use of PreStocks, Tokenized Pre-IPO Stocks.
