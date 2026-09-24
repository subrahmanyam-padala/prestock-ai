import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readJson, writeJson } from '../lib/storage';
import { getAssets } from '../services/prestocksService';
import { PreStock } from '../types';

export const POLL_MS = 30_000;

type Snap = Record<string, { tokenPrice: number; markPrice: number }>;
interface Stored { ts: number; data: Snap }

interface DataState {
  assets: PreStock[];
  fetchedAt: number | null;
  loading: boolean; // first load, nothing to show yet
  refreshing: boolean;
  error: string | null;
  stale: boolean;
  /** The last different snapshot seen by this browser, used for "change since previous snapshot". */
  prev: Stored | null;
  refresh: () => void;
  bySymbol: (s: string) => PreStock | undefined;
}

const Ctx = createContext<DataState | null>(null);
const SNAP_KEY = 'pa.snapshot';
const PREV_KEY = 'pa.prev';

const toSnap = (assets: PreStock[]): Snap =>
  Object.fromEntries(assets.map((a) => [a.symbol, { tokenPrice: a.tokenPrice, markPrice: a.markPrice }]));
const differs = (a: Snap, b: Snap) =>
  Object.keys(b).some((k) => !a[k] || a[k].tokenPrice !== b[k].tokenPrice || a[k].markPrice !== b[k].markPrice);

export function DataProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<PreStock[]>([]);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [prev, setPrev] = useState<Stored | null>(() => readJson<Stored | null>(PREV_KEY, null));
  const busy = useRef(false);

  const load = useCallback(async (force = false) => {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      const res = await getAssets(force);
      setAssets(res.assets);
      setFetchedAt(res.fetchedAt);
      setStale(res.stale);
      setError(null);
      const cur = toSnap(res.assets);
      const stored = readJson<Stored | null>(SNAP_KEY, null);
      if (!stored) {
        writeJson(SNAP_KEY, { ts: res.fetchedAt, data: cur });
      } else if (differs(stored.data, cur)) {
        writeJson(PREV_KEY, stored);
        setPrev(stored);
        writeJson(SNAP_KEY, { ts: res.fetchedAt, data: cur });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busy.current = false;
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const value = useMemo<DataState>(() => ({
    assets, fetchedAt, loading, refreshing, error, stale, prev,
    refresh: () => { load(true); },
    bySymbol: (s) => assets.find((a) => a.symbol === s.toUpperCase()),
  }), [assets, fetchedAt, loading, refreshing, error, stale, prev, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside DataProvider');
  return v;
}
