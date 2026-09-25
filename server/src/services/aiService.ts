import { config } from '../config';
import { HttpError } from '../errors';
import { spreadPct, computePortfolio, HoldingInput, PortfolioMetrics } from '../metrics';
import { AVAILABLE_FIELDS, DISCLAIMER, SYSTEM_PROMPT, UNAVAILABLE_FIELDS } from '../prompts';
import { PreStock } from '../types';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const strArray: Schema = { type: Type.ARRAY, items: { type: Type.STRING } };
const obj = (properties: Record<string, Schema>): Schema => ({
  type: Type.OBJECT, properties, required: Object.keys(properties),
});

const ASSET_SCHEMA = obj({
  executive_summary: { type: Type.STRING },
  interpretation: strArray,
  market_observations: strArray,
  risk_considerations: strArray,
  questions_to_investigate: strArray,
  not_available: strArray,
});

const PORTFOLIO_SCHEMA = obj({
  summary: { type: Type.STRING },
  concentration_observations: strArray,
  exposure_observations: strArray,
  insights: strArray,
  risks: strArray,
  scenario_analysis: { type: Type.STRING },
  missing_data_warnings: strArray,
});

async function callGemini<T>(name: string, schema: Schema, data: unknown, task: string): Promise<T> {
  if (!config.geminiKey) {
    throw new HttpError('AI analysis is not configured. Set GEMINI_API_KEY in server/.env and restart the server.', 503, 'ai_not_configured');
  }
  
  const ai = new GoogleGenAI({ apiKey: config.geminiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: `${task}\n\ndata:\n${JSON.stringify(data)}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    if (!response.text) {
        throw new HttpError('The AI returned an empty response.', 502, 'ai_empty');
    }

    let text = response.text;
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(text) as T;
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    console.error('Gemini error', err);
    if (err.status === 429) {
      throw new HttpError('Rate limit exceeded. Please try again later.', 429, 'ai_rate_limit');
    }
    if (err.status === 503) {
      throw new HttpError('The AI model is experiencing high demand. Please try again later.', 503, 'ai_unavailable');
    }
    if (err.status === 401 || err.status === 403) {
      throw new HttpError('Invalid Gemini API key. Check GEMINI_API_KEY in server/.env.', 401, 'ai_unauthorized');
    }
    if (err.status === 404) {
      throw new HttpError('Gemini model not found. Check GEMINI_MODEL in server/.env.', 404, 'ai_model_not_found');
    }
    throw new HttpError(`Could not generate the AI report: ${err.message || 'Unknown error'}`, 502, 'ai_failed');
  }
}

const usd = (n: number, d = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: d }).format(n);
const usdCompact = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(n);
const pct = (n: number | null) => (n === null ? 'n/a' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);

export interface Fact { label: string; value: string; source: 'PreStocks API' | 'Computed from PreStocks API data' }

function assetFacts(a: PreStock): Fact[] {
  const API = 'PreStocks API' as const;
  const CALC = 'Computed from PreStocks API data' as const;
  return [
    { label: 'Name', value: a.name, source: API },
    { label: 'Symbol', value: a.symbol, source: API },
    { label: 'Token price', value: usd(a.tokenPrice), source: API },
    { label: 'Mark price', value: usd(a.markPrice), source: API },
    { label: 'Implied valuation', value: usdCompact(a.impliedValuation), source: API },
    { label: 'Mark valuation', value: usdCompact(a.markValuation), source: API },
    { label: 'Token supply', value: a.supply.toLocaleString('en-US', { maximumFractionDigits: 3 }), source: API },
    { label: 'Contract address', value: a.contract_address, source: API },
    { label: 'Token vs mark spread', value: pct(spreadPct(a)), source: CALC },
    { label: 'Supply x token price', value: usdCompact(a.supply * a.tokenPrice), source: CALC },
  ];
}

export async function analyzeAsset(asset: PreStock, all: PreStock[], fetchedAt: number) {
  const data = {
    fetchedAt: new Date(fetchedAt).toISOString(),
    availableFields: AVAILABLE_FIELDS,
    unavailable: UNAVAILABLE_FIELDS,
    asset: { ...asset, image: undefined, tokenVsMarkSpreadPct: spreadPct(asset), supplyTimesTokenPriceUsd: asset.supply * asset.tokenPrice },
    peers: all.filter((a) => a.symbol !== asset.symbol).map((a) => ({
      symbol: a.symbol, tokenPrice: a.tokenPrice, markPrice: a.markPrice, impliedValuation: a.impliedValuation,
      tokenVsMarkSpreadPct: spreadPct(a),
    })),
  };
  const ai = await callGemini<{
    executive_summary: string; interpretation: string[]; market_observations: string[];
    risk_considerations: string[]; questions_to_investigate: string[]; not_available: string[];
  }>('asset_research', ASSET_SCHEMA,  data,
    'Write a research report for data.asset. Cover: what the token represents (from its description), what the current numbers show, what the spread does and does not mean, comparison with peers using only the supplied peer numbers, risks, and questions worth investigating. Fill not_available with the categories of information a reader might expect but that are missing.');
  return {
    symbol: asset.symbol,
    generatedAt: Date.now(),
    dataFetchedAt: fetchedAt,
    model: config.geminiModel,
    executive_summary: ai.executive_summary,
    // Facts are built by the server straight from the API response, never by the model.
    facts: assetFacts(asset),
    interpretation: ai.interpretation,
    market_observations: ai.market_observations,
    risk_considerations: ai.risk_considerations,
    questions_to_investigate: ai.questions_to_investigate,
    not_available: [...new Set([...UNAVAILABLE_FIELDS, ...ai.not_available])],
    disclaimer: DISCLAIMER,
  };
}

export async function analyzePortfolio(all: PreStock[], portfolioValue: number, holdings: HoldingInput[], fetchedAt: number) {
  let metrics: PortfolioMetrics;
  try {
    metrics = computePortfolio(all, portfolioValue, holdings);
  } catch (e) {
    throw new HttpError((e as Error).message, 400, 'unknown_symbol');
  }
  const data = {
    fetchedAt: new Date(fetchedAt).toISOString(),
    availableFields: AVAILABLE_FIELDS,
    unavailable: UNAVAILABLE_FIELDS,
    portfolio: metrics,
    note: 'Quantities are simulated from current tokenPrice. HHI is the sum of squared percentage weights (range 10000/N to 10000).',
  };
  const ai = await callGemini<{
    summary: string; concentration_observations: string[]; exposure_observations: string[]; insights: string[];
    risks: string[]; scenario_analysis: string; missing_data_warnings: string[];
  }>('portfolio_research', PORTFOLIO_SCHEMA, data,
    'Analyse data.portfolio. Discuss concentration (top holding, HHI, effective holdings), exposure (weights above or below mark, weighted spread), data-driven insights, risks, and the two supplied scenarios (largest position falls 30%; every token reprices to its mark price). Present scenarios as hypothetical arithmetic, not forecasts. Do not compute correlation, volatility or returns.');
  const API = 'PreStocks API' as const;
  const CALC = 'Computed from PreStocks API data' as const;
  const facts: Fact[] = [
    { label: 'Simulated portfolio value', value: usd(portfolioValue), source: CALC },
    { label: 'Largest holding', value: `${metrics.top.symbol} (${metrics.top.percent.toFixed(1)}%)`, source: CALC },
    { label: 'HHI concentration', value: metrics.hhi.toFixed(0), source: CALC },
    { label: 'Effective number of holdings', value: metrics.effectiveHoldings.toFixed(2), source: CALC },
    { label: 'Weighted token vs mark spread', value: pct(metrics.weightedSpreadPct), source: CALC },
    { label: 'Weight in tokens above mark', value: `${metrics.weightAboveMarkPct.toFixed(1)}%`, source: CALC },
    ...metrics.rows.map((r) => ({ label: `${r.symbol} token price`, value: usd(r.tokenPrice), source: API })),
  ];
  return {
    generatedAt: Date.now(),
    dataFetchedAt: fetchedAt,
    model: config.geminiModel,
    metrics,
    facts,
    ...ai,
    not_available: UNAVAILABLE_FIELDS,
    disclaimer: DISCLAIMER,
  };
}
