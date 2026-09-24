import { AlertTriangle, Check, Copy, Database, RefreshCw, Sparkles, Star } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { pct } from '../lib/format';
import { useStore } from '../context/StoreContext';
import { PreStock } from '../types';

export function AssetLogo({ asset, size = 36 }: { asset: Pick<PreStock, 'image' | 'symbol'>; size?: number }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const style = { width: size, height: size };
  
  const fallback = (
    <span style={style} className="grid shrink-0 place-items-center rounded-lg bg-ink text-[11px] font-semibold text-white">
      {asset.symbol.slice(0, 2)}
    </span>
  );

  if (!asset.image || failed) {
    return fallback;
  }

  return (
    <>
      {!loaded && fallback}
      <img
        src={asset.image}
        alt=""
        style={{ ...style, display: loaded ? 'block' : 'none' }}
        className="shrink-0 rounded-lg border border-line bg-white object-contain"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </>
  );
}

export function SpreadPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink-mute">n/a</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${up ? 'bg-data-tint text-up' : 'bg-[#FBE4E9] text-down'}`}>
      {pct(value)}
    </span>
  );
}

export function StarButton({ symbol }: { symbol: string }) {
  const { isWatched, toggleWatch } = useStore();
  const on = isWatched(symbol);
  return (
    <button
      type="button"
      onClick={() => toggleWatch(symbol)}
      aria-pressed={on}
      aria-label={on ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      className="rounded-md p-1.5 text-ink-mute hover:bg-paper hover:text-ink"
    >
      <Star size={18} className={on ? 'fill-[#F5B301] text-[#F5B301]' : ''} />
    </button>
  );
}

type Tone = 'data' | 'ai' | 'warn' | 'plain';
const tones: Record<Tone, string> = {
  data: 'bg-data-tint text-data',
  ai: 'bg-ai-tint text-ai',
  warn: 'bg-warn-tint text-warn',
  plain: 'bg-paper text-ink-soft',
};
export function Badge({ tone = 'plain', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{icon}{children}</span>;
}
export const DataBadge = ({ children = 'PreStocks Data' }: { children?: ReactNode }) => <Badge tone="data" icon={<Database size={12} />}>{children}</Badge>;
export const AiBadge = ({ children = 'AI Interpretation' }: { children?: ReactNode }) => <Badge tone="ai" icon={<Sparkles size={12} />}>{children}</Badge>;
export const NaBadge = ({ children = 'Data Not Available' }: { children?: ReactNode }) => <Badge tone="warn" icon={<AlertTriangle size={12} />}>{children}</Badge>;

export function ErrorState({ message, onRetry, title = 'Something went wrong' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="panel flex flex-col items-start gap-3 border-down/30 p-6">
      <div className="flex items-center gap-2 font-display text-lg font-semibold text-down"><AlertTriangle size={18} />{title}</div>
      <p className="max-w-xl text-sm text-ink-soft">{message}</p>
      {onRetry && <button className="btn-ghost" onClick={onRetry}><RefreshCw size={14} />Try again</button>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-12 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-ink-mute">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-md bg-line/70 ${className}`} />;

export function PageHeader({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-ink-mute">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-ink-mute hover:bg-paper hover:text-ink"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
      }}
    >
      {done ? <Check size={12} /> : <Copy size={12} />}{done ? 'Copied' : label}
    </button>
  );
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="text-xs font-semibold text-ink-mute">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {note && <div className="mt-1 text-xs text-ink-mute">{note}</div>}
    </div>
  );
}
