import { NextFunction, Request, Response, Router } from 'express';
import { config } from './config';
import { HttpError } from './errors';
import { analyzeAsset, analyzePortfolio } from './services/aiService';
import { getAsset, getAssets } from './services/prestocksService';
import { checkSupply, getHoldings } from './services/solanaService';
import { AnalyzeAssetBody, AnalyzePortfolioBody, SymbolSchema } from './types';

const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) =>
  fn(req, res).catch(next);

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(config.geminiKey), model: config.geminiModel });
});

router.get('/assets', wrap(async (req, res) => {
  res.json(await getAssets(req.query.refresh === '1'));
}));

router.get('/assets/:symbol', wrap(async (req, res) => {
  const symbol = SymbolSchema.safeParse(req.params.symbol);
  if (!symbol.success) throw new HttpError('Invalid symbol', 400, 'bad_request');
  res.json(await getAsset(symbol.data));
}));

router.post('/ai/analyze-asset', wrap(async (req, res) => {
  const body = AnalyzeAssetBody.safeParse(req.body);
  if (!body.success) throw new HttpError('Provide a valid asset symbol', 400, 'bad_request');
  const { assets, fetchedAt } = await getAssets();
  const asset = assets.find((a) => a.symbol.toUpperCase() === body.data.symbol);
  if (!asset) throw new HttpError(`No PreStock found with symbol ${body.data.symbol}`, 404, 'not_found');
  res.json(await analyzeAsset(asset, assets, fetchedAt));
}));

router.post('/ai/analyze-portfolio', wrap(async (req, res) => {
  const body = AnalyzePortfolioBody.safeParse(req.body);
  if (!body.success) {
    throw new HttpError(body.error.issues[0]?.message ?? 'Invalid portfolio', 400, 'bad_request');
  }
  const { assets, fetchedAt } = await getAssets();
  res.json(await analyzePortfolio(assets, body.data.portfolioValue, body.data.holdings, fetchedAt));
}));

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

router.get('/solana/holdings/:address', wrap(async (req, res) => {
  if (!BASE58.test(req.params.address)) throw new HttpError('Invalid Solana address', 400, 'bad_request');
  const { assets, fetchedAt } = await getAssets();
  res.json({ address: req.params.address, fetchedAt, holdings: await getHoldings(req.params.address, assets) });
}));

router.get('/solana/supply-check', wrap(async (_req, res) => {
  const { assets } = await getAssets();
  res.json({ checkedAt: Date.now(), results: await checkSupply(assets) });
}));
