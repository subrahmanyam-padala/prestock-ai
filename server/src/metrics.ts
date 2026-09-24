import { PreStock } from './types';

export const spreadPct = (a: PreStock): number | null =>
  a.markPrice === 0 ? null : ((a.tokenPrice - a.markPrice) / a.markPrice) * 100;

export interface HoldingInput { symbol: string; percent: number }

export interface HoldingRow {
  symbol: string;
  name: string;
  percent: number;
  usd: number;
  tokenPrice: number;
  markPrice: number;
  quantity: number;
  spreadPct: number | null;
  impliedValuation: number;
}

export interface PortfolioMetrics {
  portfolioValue: number;
  rows: HoldingRow[];
  top: { symbol: string; percent: number; usd: number };
  hhi: number; // sum of squared percentage weights, 0-10,000
  effectiveHoldings: number; // 10,000 / HHI
  weightedSpreadPct: number | null;
  weightAboveMarkPct: number;
  weightBelowMarkPct: number;
  scenarios: {
    largestFalls30: { symbol: string; shockPct: number; valueChangeUsd: number; newValueUsd: number; portfolioChangePct: number };
    spreadsCloseToMark: { valueChangeUsd: number; newValueUsd: number; portfolioChangePct: number };
  };
}

export function computePortfolio(assets: PreStock[], portfolioValue: number, holdings: HoldingInput[]): PortfolioMetrics {
  const bySymbol = new Map(assets.map((a) => [a.symbol.toUpperCase(), a]));
  const rows: HoldingRow[] = holdings.map((h) => {
    const a = bySymbol.get(h.symbol);
    if (!a) throw new Error(`Unknown symbol ${h.symbol}`);
    const usd = (portfolioValue * h.percent) / 100;
    return {
      symbol: a.symbol, name: a.name, percent: h.percent, usd,
      tokenPrice: a.tokenPrice, markPrice: a.markPrice,
      quantity: a.tokenPrice > 0 ? usd / a.tokenPrice : 0,
      spreadPct: spreadPct(a), impliedValuation: a.impliedValuation,
    };
  });
  const top = rows.reduce((m, r) => (r.percent > m.percent ? r : m), rows[0]);
  const hhi = rows.reduce((s, r) => s + r.percent ** 2, 0);
  const withSpread = rows.filter((r) => r.spreadPct !== null);
  const wSum = withSpread.reduce((s, r) => s + r.percent, 0);
  const weightedSpreadPct = wSum > 0 ? withSpread.reduce((s, r) => s + r.percent * (r.spreadPct as number), 0) / wSum : null;
  const above = rows.filter((r) => (r.spreadPct ?? 0) > 0).reduce((s, r) => s + r.percent, 0);
  const below = rows.filter((r) => (r.spreadPct ?? 0) < 0).reduce((s, r) => s + r.percent, 0);

  const shock = -30;
  const topChange = (top.usd * shock) / 100;
  // If each token repriced to its mark price, holding value scales by markPrice / tokenPrice.
  const convChange = rows.reduce((s, r) => s + (r.tokenPrice > 0 ? r.usd * (r.markPrice / r.tokenPrice - 1) : 0), 0);

  return {
    portfolioValue, rows,
    top: { symbol: top.symbol, percent: top.percent, usd: top.usd },
    hhi, effectiveHoldings: hhi > 0 ? 10000 / hhi : 0,
    weightedSpreadPct, weightAboveMarkPct: above, weightBelowMarkPct: below,
    scenarios: {
      largestFalls30: {
        symbol: top.symbol, shockPct: shock, valueChangeUsd: topChange,
        newValueUsd: portfolioValue + topChange, portfolioChangePct: (topChange / portfolioValue) * 100,
      },
      spreadsCloseToMark: {
        valueChangeUsd: convChange, newValueUsd: portfolioValue + convChange,
        portfolioChangePct: (convChange / portfolioValue) * 100,
      },
    },
  };
}
