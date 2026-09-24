import { HoldingInput, HoldingRow, PreStock } from '../types';

/** ((tokenPrice - markPrice) / markPrice) * 100. Computed from current PreStocks API data; not a historical return. */
export const spreadPct = (a: Pick<PreStock, 'tokenPrice' | 'markPrice'>): number | null =>
  a.markPrice === 0 ? null : ((a.tokenPrice - a.markPrice) / a.markPrice) * 100;

/** Token supply multiplied by token price. Computed; the API does not report a market cap. */
export const tokenSupplyValue = (a: PreStock) => a.supply * a.tokenPrice;

export function portfolioRows(assets: PreStock[], value: number, holdings: HoldingInput[]): HoldingRow[] {
  const by = new Map(assets.map((a) => [a.symbol, a]));
  return holdings.flatMap((h) => {
    const a = by.get(h.symbol);
    if (!a) return [];
    const usd = (value * h.percent) / 100;
    return [{
      symbol: a.symbol, name: a.name, percent: h.percent, usd, tokenPrice: a.tokenPrice, markPrice: a.markPrice,
      quantity: a.tokenPrice > 0 ? usd / a.tokenPrice : 0, spreadPct: spreadPct(a), impliedValuation: a.impliedValuation,
    }];
  });
}

export const hhi = (holdings: HoldingInput[]) => holdings.reduce((s, h) => s + h.percent ** 2, 0);

export function weightedSpread(rows: HoldingRow[]): number | null {
  const r = rows.filter((x) => x.spreadPct !== null);
  const w = r.reduce((s, x) => s + x.percent, 0);
  return w > 0 ? r.reduce((s, x) => s + x.percent * (x.spreadPct as number), 0) / w : null;
}

/** Hypothetical: one holding changes by shockPct, everything else unchanged. */
export const shockChange = (row: HoldingRow, shockPct: number) => (row.usd * shockPct) / 100;

/** Hypothetical: every token reprices to its mark price. */
export const convergenceChange = (rows: HoldingRow[]) =>
  rows.reduce((s, r) => s + (r.tokenPrice > 0 ? r.usd * (r.markPrice / r.tokenPrice - 1) : 0), 0);
