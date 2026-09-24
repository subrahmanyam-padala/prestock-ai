import { ArrowDownUp, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssetLogo, CopyButton, EmptyState, ErrorState, PageHeader, Skeleton, SpreadPill, StarButton } from '../components/ui';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { num, shortAddr, timeAgo, usd, usdCompact } from '../lib/format';
import { spreadPct } from '../lib/metrics';
import { PreStock } from '../types';

type SortKey = 'name' | 'tokenPrice' | 'spread' | 'impliedValuation' | 'supply';
type Filter = 'all' | 'premium' | 'discount' | 'watchlist';

const SORTS: Record<SortKey, (a: PreStock) => number | string> = {
  name: (a) => a.name.toLowerCase(),
  tokenPrice: (a) => a.tokenPrice,
  spread: (a) => spreadPct(a) ?? -Infinity,
  impliedValuation: (a) => a.impliedValuation,
  supply: (a) => a.supply,
};

export default function Markets() {
  const { assets, loading, error, refresh, refreshing, fetchedAt } = useData();
  const { watchlist } = useStore();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('impliedValuation');
  const [dir, setDir] = useState<1 | -1>(-1);
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assets
      .filter((a) => !needle || [a.name, a.symbol, a.description, a.contract_address].some((f) => f.toLowerCase().includes(needle)))
      .filter((a) => {
        const s = spreadPct(a);
        return filter === 'all' || (filter === 'premium' && (s ?? 0) > 0) || (filter === 'discount' && (s ?? 0) < 0) || (filter === 'watchlist' && watchlist.includes(a.symbol));
      })
      .sort((x, y) => {
        const a = SORTS[sort](x), b = SORTS[sort](y);
        return (a < b ? -1 : a > b ? 1 : 0) * dir;
      });
  }, [assets, q, sort, dir, filter, watchlist]);

  return (
    <>
      <PageHeader title="Markets" sub={`Every PreStock returned by the PreStocks API${fetchedAt ? `, updated ${timeAgo(fetchedAt)}` : ''}. Spread is computed from token and mark price.`}
        right={<button className="btn-ghost" onClick={refresh} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh</button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <div className="relative">
          <label className="label" htmlFor="q">Search</label>
          <Search size={16} className="pointer-events-none absolute bottom-2.5 left-3 text-ink-mute" />
          <input id="q" className="input pl-9" placeholder="Name, symbol, description or address" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="f">Filter</label>
          <select id="f" className="input" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="all">All assets</option><option value="premium">Token above mark</option><option value="discount">Token below mark</option><option value="watchlist">My watchlist</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="s">Sort by</label>
          <select id="s" className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="impliedValuation">Implied valuation</option><option value="tokenPrice">Token price</option><option value="spread">Spread</option><option value="supply">Supply</option><option value="name">Name</option>
          </select>
        </div>
        <button className="btn-ghost" onClick={() => setDir((d) => (d === 1 ? -1 : 1))} aria-label="Reverse sort order"><ArrowDownUp size={14} />{dir === -1 ? 'High to low' : 'Low to high'}</button>
      </div>

      {error && assets.length > 0 && <div className="mb-4"><ErrorState title="Showing the last data we received" message={error} onRetry={refresh} /></div>}
      {loading && <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
      {!loading && assets.length === 0 && <ErrorState title="Could not load PreStocks" message={error ?? 'The API returned no assets.'} onRetry={refresh} />}
      {!loading && assets.length > 0 && rows.length === 0 && (
        <EmptyState title="No assets match" body="Try a different search or filter." action={<button className="btn-ghost" onClick={() => { setQ(''); setFilter('all'); }}>Clear filters</button>} />
      )}

      {rows.length > 0 && (
        <>
          <div className="panel hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold text-ink-mute">
                  <th className="w-10 p-3"><span className="sr-only">Watch</span></th><th className="p-3">Asset</th>
                  <th className="p-3 text-right">Token price</th><th className="p-3 text-right">Mark price</th><th className="p-3 text-right">Spread</th>
                  <th className="p-3 text-right">Implied val.</th><th className="p-3 text-right">Mark val.</th><th className="p-3 text-right">Supply</th><th className="p-3">Token address</th><th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.symbol} className="border-b border-line/70 last:border-0 hover:bg-paper/60">
                    <td className="p-3"><StarButton symbol={a.symbol} /></td>
                    <td className="max-w-[280px] p-3">
                      <Link to={`/stock/${a.symbol}`} className="flex items-center gap-3">
                        <AssetLogo asset={a} />
                        <span className="min-w-0"><span className="block font-semibold">{a.name} <span className="text-ink-mute">{a.symbol}</span></span>
                          <span className="block truncate text-xs text-ink-mute">{a.description.split('\n')[0]}</span></span>
                      </Link>
                    </td>
                    <td className="p-3 text-right font-semibold">{usd(a.tokenPrice)}</td><td className="p-3 text-right">{usd(a.markPrice)}</td>
                    <td className="p-3 text-right"><SpreadPill value={spreadPct(a)} /></td>
                    <td className="p-3 text-right">{usdCompact(a.impliedValuation)}</td><td className="p-3 text-right">{usdCompact(a.markValuation)}</td>
                    <td className="p-3 text-right">{num(a.supply, 2)}</td>
                    <td className="p-3"><span className="inline-flex items-center gap-1">{shortAddr(a.contract_address)}<CopyButton text={a.contract_address} label="" /></span></td>
                    <td className="p-3"><a href={a.external_url} target="_blank" rel="noreferrer" aria-label={`${a.name} on PreStocks`} className="text-ink-mute hover:text-ink"><ExternalLink size={14} /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {rows.map((a) => (
              <div key={a.symbol} className="panel p-4">
                <div className="flex items-center gap-3">
                  <AssetLogo asset={a} /><Link to={`/stock/${a.symbol}`} className="min-w-0 flex-1"><div className="font-semibold">{a.name}</div><div className="text-xs text-ink-mute">{a.symbol}</div></Link>
                  <StarButton symbol={a.symbol} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-ink-mute">{a.description.split('\n')[0]}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs text-ink-mute">Token price</dt><dd className="font-semibold">{usd(a.tokenPrice)}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Mark price</dt><dd>{usd(a.markPrice)}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Spread</dt><dd><SpreadPill value={spreadPct(a)} /></dd></div>
                  <div><dt className="text-xs text-ink-mute">Implied valuation</dt><dd>{usdCompact(a.impliedValuation)}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Mark valuation</dt><dd>{usdCompact(a.markValuation)}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Supply</dt><dd>{num(a.supply, 2)}</dd></div>
                </dl>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-mute"><span>{shortAddr(a.contract_address)}</span><a className="inline-flex items-center gap-1 font-semibold text-ink" href={a.external_url} target="_blank" rel="noreferrer">PreStocks <ExternalLink size={12} /></a></div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
