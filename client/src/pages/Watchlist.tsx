import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertForm } from '../components/AlertForm';
import { AssetLogo, EmptyState, PageHeader, Skeleton, SpreadPill, StarButton } from '../components/ui';
import { ALERT_LABEL, useStore } from '../context/StoreContext';
import { useData } from '../context/DataContext';
import { pct, timeAgo, usd } from '../lib/format';
import { spreadPct } from '../lib/metrics';

export default function Watchlist() {
  const { assets, loading, prev } = useData();
  const { watchlist, alerts, removeAlert, events, clearEvents } = useStore();
  const rows = assets.filter((a) => watchlist.includes(a.symbol));

  return (
    <>
      <PageHeader title="Watchlist and alerts" sub="Saved in this browser. Alerts are checked each time fresh data arrives (every 30 seconds) while PreStock AI is open in a tab." />
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">Watchlist</h2>
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && rows.length === 0 && (
          <EmptyState title="Your watchlist is empty" body="Add PreStocks to follow their token price and spread." action={
            <div className="flex flex-wrap justify-center gap-2">{assets.map((a) => <span key={a.symbol} className="flex items-center rounded-lg border border-line bg-white pl-3 text-sm font-semibold">{a.symbol}<StarButton symbol={a.symbol} /></span>)}</div>
          } />
        )}
        {rows.length > 0 && (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs font-semibold text-ink-mute">
                <th className="p-3">Asset</th><th className="p-3 text-right">Token price</th><th className="p-3 text-right">Spread</th>
                <th className="p-3 text-right" title={prev ? `Since ${timeAgo(prev.ts)}` : ''}>vs previous snapshot</th><th className="w-12 p-3" />
              </tr></thead>
              <tbody>
                {rows.map((a) => {
                  const p = prev?.data[a.symbol];
                  const d = p && p.tokenPrice > 0 ? ((a.tokenPrice - p.tokenPrice) / p.tokenPrice) * 100 : null;
                  return (
                    <tr key={a.symbol} className="border-b border-line/70 last:border-0">
                      <td className="p-3"><Link to={`/stock/${a.symbol}`} className="flex items-center gap-3 font-semibold hover:underline"><AssetLogo asset={a} size={28} />{a.name}</Link></td>
                      <td className="p-3 text-right font-semibold">{usd(a.tokenPrice)}</td>
                      <td className="p-3 text-right"><SpreadPill value={spreadPct(a)} /></td>
                      <td className="p-3 text-right">{d === null ? <span className="text-ink-mute">n/a</span> : pct(d)}</td>
                      <td className="p-3"><StarButton symbol={a.symbol} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-line px-3 py-2 text-xs text-ink-mute">"vs previous snapshot" compares two API readings saved in this browser{prev ? ` (previous one ${timeAgo(prev.ts)})` : '; it appears once the API values change'}. It is not a 24-hour change.</p>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">Smart alerts</h2>
        <div className="panel p-5"><AlertForm /></div>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-mute">No alerts yet. An alert fires once when its condition becomes true and re-arms when the condition clears.</p>
        ) : (
          <div className="panel mt-3 divide-y divide-line">
            {alerts.map((al) => (
              <div key={al.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div><span className="font-semibold">{al.symbol}</span> · {ALERT_LABEL[al.type].toLowerCase()} {al.type.startsWith('price') ? usd(al.threshold) : pct(al.threshold)}</div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${al.armed ? 'bg-data-tint text-data' : 'bg-warn-tint text-warn'}`}>{al.armed ? 'Watching' : 'Triggered'}</span>
                  <button aria-label="Remove alert" className="text-ink-mute hover:text-down" onClick={() => removeAlert(al.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Alert history</h2>{events.length > 0 && <button className="text-sm font-semibold text-ai hover:underline" onClick={clearEvents}>Clear</button>}</div>
        {events.length === 0 ? <p className="text-sm text-ink-mute">Triggered alerts appear here.</p> : (
          <ul className="panel divide-y divide-line">{events.map((e) => <li key={e.id} className="flex justify-between gap-3 p-3 text-sm"><span>{e.message}</span><span className="shrink-0 text-xs text-ink-mute">{timeAgo(e.ts)}</span></li>)}</ul>
        )}
      </section>
    </>
  );
}
