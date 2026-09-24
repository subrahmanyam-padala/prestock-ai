import { Link } from 'react-router-dom';
import { pct } from '../lib/format';
import { spreadPct } from '../lib/metrics';
import { PreStock } from '../types';

/** Diverging bars of the current token-vs-mark spread. Values are computed from live PreStocks data. */
export function SpreadBars({ assets, highlight }: { assets: PreStock[]; highlight?: string }) {
  const rows = assets
    .map((a) => ({ a, s: spreadPct(a) }))
    .filter((r): r is { a: PreStock; s: number } => r.s !== null)
    .sort((x, y) => y.s - x.s);
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.s)));
  return (
    <ul className="space-y-1.5" aria-label="Token versus mark spread by asset">
      {rows.map(({ a, s }) => {
        const w = (Math.abs(s) / max) * 50;
        const on = highlight === a.symbol;
        return (
          <li key={a.symbol}>
            <Link to={`/stock/${a.symbol}`} className={`grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-paper ${on ? 'bg-ai-tint/60' : ''}`}>
              <span className="font-semibold">{a.symbol}</span>
              <span className="relative h-4">
                <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
                <span
                  className={`absolute inset-y-0.5 rounded-sm ${s >= 0 ? 'bg-up' : 'bg-down'}`}
                  style={s >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }}
                />
              </span>
              <span className={`text-right text-xs font-semibold ${s >= 0 ? 'text-up' : 'text-down'}`}>{pct(s, 1)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
