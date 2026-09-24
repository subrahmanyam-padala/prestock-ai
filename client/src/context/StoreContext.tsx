import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { pct, usd } from '../lib/format';
import { spreadPct } from '../lib/metrics';
import { useLocalStorage } from '../lib/storage';
import { Alert, AlertEvent, AlertType, HoldingInput, PreStock } from '../types';
import { useData } from './DataContext';

interface Portfolio { value: number; holdings: HoldingInput[] }
interface Toast { id: string; text: string }

interface StoreState {
  watchlist: string[];
  toggleWatch: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
  alerts: Alert[];
  addAlert: (a: { symbol: string; type: AlertType; threshold: number }) => void;
  removeAlert: (id: string) => void;
  events: AlertEvent[];
  clearEvents: () => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  portfolio: Portfolio;
  setPortfolio: (p: Portfolio | ((p: Portfolio) => Portfolio)) => void;
}

const Ctx = createContext<StoreState | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

export const ALERT_LABEL: Record<AlertType, string> = {
  price_above: 'Token price rises above',
  price_below: 'Token price falls below',
  spread_above: 'Spread rises above',
  spread_below: 'Spread falls below',
};
export const alertUnit = (t: AlertType) => (t.startsWith('price') ? 'USD' : '%');

function metricFor(a: PreStock, type: AlertType): number | null {
  return type.startsWith('price') ? a.tokenPrice : spreadPct(a);
}
const holds = (type: AlertType, value: number, threshold: number) => (type.endsWith('above') ? value > threshold : value < threshold);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { assets } = useData();
  const [watchlist, setWatchlist] = useLocalStorage<string[]>('pa.watchlist', []);
  const [alerts, setAlerts] = useLocalStorage<Alert[]>('pa.alerts', []);
  const [events, setEvents] = useLocalStorage<AlertEvent[]>('pa.events', []);
  const [portfolio, setPortfolio] = useLocalStorage<Portfolio>('pa.portfolio', { value: 10000, holdings: [] });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Alert engine: runs whenever fresh PreStocks data arrives or the alert list changes.
  // An alert fires once when its condition becomes true, then re-arms when the condition is false again.
  useEffect(() => {
    if (assets.length === 0) return;
    const current = alertsRef.current;
    const fired: AlertEvent[] = [];
    let changed = false;
    const next = current.map((al) => {
      const a = assets.find((x) => x.symbol === al.symbol);
      const m = a ? metricFor(a, al.type) : null;
      if (!a || m === null) return al;
      const on = holds(al.type, m, al.threshold);
      if (on && al.armed) {
        changed = true;
        const shown = al.type.startsWith('price') ? usd(m) : pct(m);
        const limit = al.type.startsWith('price') ? usd(al.threshold) : pct(al.threshold);
        fired.push({
          id: uid(), symbol: al.symbol, ts: Date.now(),
          message: `${al.symbol}: ${ALERT_LABEL[al.type].toLowerCase()} ${limit} (now ${shown})`,
        });
        return { ...al, armed: false };
      }
      if (!on && !al.armed) { changed = true; return { ...al, armed: true }; }
      return al;
    });
    if (!changed) return;
    alertsRef.current = next;
    setAlerts(next);
    if (fired.length) {
      setEvents((e) => [...fired, ...e].slice(0, 50));
      const toasts = fired.map((f) => ({ id: f.id, text: f.message }));
      setToasts((t) => [...t, ...toasts]);
      toasts.forEach((t) => setTimeout(() => dismissToast(t.id), 10_000));
    }
  }, [assets, alerts.length, setAlerts, setEvents, dismissToast]);

  const value = useMemo<StoreState>(() => ({
    watchlist,
    toggleWatch: (s) => setWatchlist((w) => (w.includes(s) ? w.filter((x) => x !== s) : [...w, s])),
    isWatched: (s) => watchlist.includes(s),
    alerts,
    addAlert: ({ symbol, type, threshold }) =>
      setAlerts((a) => [...a, { id: uid(), symbol, type, threshold, armed: true, createdAt: Date.now() }]),
    removeAlert: (id) => setAlerts((a) => a.filter((x) => x.id !== id)),
    events,
    clearEvents: () => setEvents([]),
    toasts, dismissToast,
    portfolio, setPortfolio,
  }), [watchlist, alerts, events, toasts, portfolio, setWatchlist, setAlerts, setEvents, setPortfolio, dismissToast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
