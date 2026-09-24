import { AssetReport, HoldingInput, PortfolioReport } from '../types';
import { http } from './http';

export const analyzeAsset = (symbol: string) =>
  http<AssetReport>('/api/ai/analyze-asset', { method: 'POST', body: JSON.stringify({ symbol }) });

export const analyzePortfolio = (portfolioValue: number, holdings: HoldingInput[]) =>
  http<PortfolioReport>('/api/ai/analyze-portfolio', { method: 'POST', body: JSON.stringify({ portfolioValue, holdings }) });
