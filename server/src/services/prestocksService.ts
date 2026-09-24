import { config } from '../config';
import { HttpError } from '../errors';
import { PreStock, PreStocksResponseSchema } from '../types';

export interface AssetsResult {
  assets: PreStock[];
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

let cache: { assets: PreStock[]; fetchedAt: number } | null = null;
let inflight: Promise<{ assets: PreStock[]; fetchedAt: number }> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOnce(): Promise<PreStock[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.upstreamTimeoutMs);
  try {
    const res = await fetch(config.prestocksUrl, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      throw Object.assign(new HttpError(`PreStocks API responded with ${res.status}`, 502, 'upstream_error'), { retryable });
    }
    const parsed = PreStocksResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
      throw Object.assign(new HttpError('PreStocks API returned data in an unexpected format', 502, 'upstream_schema'), { retryable: false });
    }
    return parsed.data;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(attempts = 3): Promise<PreStock[]> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchOnce();
    } catch (err) {
      last = err;
      if ((err as { retryable?: boolean }).retryable === false) break;
      if (i < attempts - 1) await sleep(300 * 2 ** i);
    }
  }
  if (last instanceof HttpError) throw last;
  throw new HttpError('Could not reach the PreStocks API', 502, 'upstream_unreachable');
}

export async function getAssets(force = false): Promise<AssetsResult> {
  const now = Date.now();
  if (!force && cache && now - cache.fetchedAt < config.cacheTtlMs) {
    return { ...cache, cached: true, stale: false };
  }
  try {
    inflight ??= fetchWithRetry().then((assets) => ({ assets, fetchedAt: Date.now() }));
    const fresh = await inflight;
    cache = fresh;
    return { ...fresh, cached: false, stale: false };
  } catch (err) {
    // Serve recent data if upstream is failing, and say so.
    if (cache && now - cache.fetchedAt < config.staleMaxMs) return { ...cache, cached: true, stale: true };
    throw err;
  } finally {
    inflight = null;
  }
}

export async function getAsset(symbol: string): Promise<{ asset: PreStock } & Omit<AssetsResult, 'assets'>> {
  const { assets, ...meta } = await getAssets();
  const asset = assets.find((a) => a.symbol.toUpperCase() === symbol.toUpperCase());
  if (!asset) throw new HttpError(`No PreStock found with symbol ${symbol}`, 404, 'not_found');
  return { asset, ...meta };
}
