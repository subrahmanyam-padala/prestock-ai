export interface PreStock {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  contract_address: string;
  markPrice: number;
  markValuation: number;
  tokenPrice: number;
  impliedValuation: number;
  supply: number;
}

export interface AssetsResponse { assets: PreStock[]; fetchedAt: number; cached: boolean; stale: boolean }

export interface Fact { label: string; value: string; source: 'PreStocks API' | 'Computed from PreStocks API data' }

export interface AssetReport {
  symbol: string;
  generatedAt: number;
  dataFetchedAt: number;
  model: string;
  executive_summary: string;
  facts: Fact[];
  interpretation: string[];
  market_observations: string[];
  risk_considerations: string[];
  questions_to_investigate: string[];
  not_available: string[];
  disclaimer: string;
}

export interface HoldingInput { symbol: string; percent: number }

export interface HoldingRow {
  symbol: string; name: string; percent: number; usd: number; tokenPrice: number; markPrice: number;
  quantity: number; spreadPct: number | null; impliedValuation: number;
}

export interface PortfolioMetrics {
  portfolioValue: number;
  rows: HoldingRow[];
  top: { symbol: string; percent: number; usd: number };
  hhi: number;
  effectiveHoldings: number;
  weightedSpreadPct: number | null;
  weightAboveMarkPct: number;
  weightBelowMarkPct: number;
  scenarios: {
    largestFalls30: { symbol: string; shockPct: number; valueChangeUsd: number; newValueUsd: number; portfolioChangePct: number };
    spreadsCloseToMark: { valueChangeUsd: number; newValueUsd: number; portfolioChangePct: number };
  };
}

export interface PortfolioReport {
  generatedAt: number;
  dataFetchedAt: number;
  model: string;
  metrics: PortfolioMetrics;
  facts: Fact[];
  summary: string;
  concentration_observations: string[];
  exposure_observations: string[];
  insights: string[];
  risks: string[];
  scenario_analysis: string;
  missing_data_warnings: string[];
  not_available: string[];
  disclaimer: string;
}

export interface OnChainHolding { symbol: string; mint: string; amount: number; usdValue: number }
export interface SupplyCheck {
  symbol: string; mint: string; apiSupply: number; onChainSupply: number | null; diffPct: number | null; error?: string;
}

export type AlertType = 'price_above' | 'price_below' | 'spread_above' | 'spread_below';
export interface Alert { id: string; symbol: string; type: AlertType; threshold: number; armed: boolean; createdAt: number }
export interface AlertEvent { id: string; symbol: string; message: string; ts: number }
