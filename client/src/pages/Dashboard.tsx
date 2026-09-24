import { Link } from 'react-router-dom';
import { AssetLogo, DataBadge, EmptyState, ErrorState, PageHeader, Skeleton, SpreadPill, Stat } from '../components/ui';
import { SpreadBars } from '../components/SpreadBars';
import { WalletHoldings } from '../components/WalletHoldings';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { timeAgo, usd, usdCompact } from '../lib/format';
import { spreadPct, tokenSupplyValue } from '../lib/metrics';

export default function Dashboard() {
  const { assets, loading, error, refresh, fetchedAt } = useData();
  const { watchlist, events, alerts } = useStore();

  if (loading) {
    return (<><PageHeader title="Dashboard" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="mt-6 h-72" /></>);
  }
  if (assets.length === 0) return <><PageHeader title="Dashboard" /><ErrorState title="PreStocks data is unavailable" message={error ?? 'No assets returned.'} onRetry={refresh} /></>;

  const withSpread = assets.map((a) => ({ a, s: spreadPct(a) })).filter((x): x is { a: typeof assets[number]; s: number } => x.s !== null);
  const hi = withSpread.reduce((m, x) => (x.s > m.s ? x : m));
  const lo = withSpread.reduce((m, x) => (x.s < m.s ? x : m));
  const total = assets.reduce((s, a) => s + tokenSupplyValue(a), 0);
  const watched = assets.filter((a) => watchlist.includes(a.symbol));

  return (
    <>
      <PageHeader title="Dashboard" sub={`Live PreStocks data${fetchedAt ? `, updated ${timeAgo(fetchedAt)}` : ''}. Refreshes every 30 seconds while this tab is open.`} />
      {error && <div className="mb-4"><ErrorState title="Showing the last data we received" message={error} onRetry={refresh} /></div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="PreStocks listed" value={assets.length} note={<DataBadge />} />
        <Stat label="Supply × token price, all tokens" value={usdCompact(total)} note="Computed. Not an official AUM figure." />
        <Stat label="Highest premium to mark" value={<Link className="hover:underline" to={`/stock/${hi.a.symbol}`}>{hi.a.symbol}</Link>} note={<SpreadPill value={hi.s} />} />
        <Stat label="Deepest discount to mark" value={<Link className="hover:underline" to={`/stock/${lo.a.symbol}`}>{lo.a.symbol}</Link>} note={<SpreadPill value={lo.s} />} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="panel p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Token vs mark spread</h2><DataBadge>Computed from PreStocks API data</DataBadge>
          </div>
          <SpreadBars assets={assets} />
        </div>
        <div className="space-y-6">
          <WalletHoldings />
          <div className="panel p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Watchlist</h2><Link to="/watchlist" className="text-sm font-semibold text-ai hover:underline">Manage</Link></div>
            {watched.length === 0 ? (
              <EmptyState title="Nothing watched yet" body="Star an asset on the Markets page to track it here." action={<Link to="/markets" className="btn-ghost">Browse markets</Link>} />
            ) : (
              <ul className="divide-y divide-line">
                {watched.map((a) => (
                  <li key={a.symbol}><Link to={`/stock/${a.symbol}`} className="flex items-center gap-3 py-2 text-sm hover:bg-paper">
                    <AssetLogo asset={a} size={28} /><span className="font-semibold">{a.symbol}</span>
                    <span className="ml-auto">{usd(a.tokenPrice)}</span><SpreadPill value={spreadPct(a)} />
                  </Link></li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-mute">{alerts.length} alert{alerts.length === 1 ? '' : 's'} active · {events.length} triggered so far</p>
          </div>
        </div>
      </div>
    </>
  );
}
