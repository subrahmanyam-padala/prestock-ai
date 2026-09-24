import { ExternalLink, Info, Plus } from 'lucide-react';
import { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertForm } from '../components/AlertForm';
import { AssetAnalysis } from '../components/AiReport';
import { SpreadBars } from '../components/SpreadBars';
import { SupplyCheck } from '../components/SupplyCheck';
import { AssetLogo, Badge, CopyButton, DataBadge, EmptyState, ErrorState, Skeleton, SpreadPill, StarButton } from '../components/ui';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { num, pct, usd, usdCompact } from '../lib/format';
import { spreadPct, tokenSupplyValue } from '../lib/metrics';
import { solscanToken } from '../services/solanaService';

function Metric({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="text-xs font-semibold text-ink-mute">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
      {note && <div className="mt-1 text-[11px] text-ink-mute">{note}</div>}
    </div>
  );
}

export default function StockDetail() {
  const { symbol = '' } = useParams();
  const { assets, loading, error, refresh, prev } = useData();
  const { portfolio, setPortfolio, alerts, removeAlert } = useStore();
  const nav = useNavigate();
  const sym = symbol.toUpperCase();
  const a = assets.find((x) => x.symbol === sym);

  if (loading) return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (assets.length === 0) return <ErrorState title="PreStocks data is unavailable" message={error ?? 'No assets returned.'} onRetry={refresh} />;
  if (!a) return <EmptyState title={`No PreStock called ${sym}`} body="That symbol is not in the current PreStocks API response." action={<Link to="/markets" className="btn-ghost">Back to markets</Link>} />;

  const s = spreadPct(a);
  const inPortfolio = portfolio.holdings.some((h) => h.symbol === a.symbol);
  const prevRow = prev?.data[a.symbol];
  const myAlerts = alerts.filter((x) => x.symbol === a.symbol);
  const fields: [string, string, string][] = [
    ['Name, symbol, description, logo', 'PreStocks API', 'name, symbol, description, image'],
    ['Token price, mark price', 'PreStocks API', 'tokenPrice, markPrice'],
    ['Implied valuation, mark valuation', 'PreStocks API', 'impliedValuation, markValuation'],
    ['Token supply, contract address', 'PreStocks API', 'supply, contract_address'],
    ['Token vs mark spread', 'Computed', '(tokenPrice − markPrice) ÷ markPrice × 100'],
    ['Supply × token price', 'Computed', 'supply × tokenPrice'],
  ];

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-start gap-4 p-5 sm:p-6">
        <AssetLogo asset={a} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold">{a.name}</h1><Badge>{a.symbol}</Badge><StarButton symbol={a.symbol} /></div>
          <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-soft">{a.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-ghost" href={a.external_url} target="_blank" rel="noreferrer">PreStocks <ExternalLink size={14} /></a>
          <button className="btn-ghost" disabled={inPortfolio} onClick={() => { setPortfolio((p) => ({ ...p, holdings: [...p.holdings, { symbol: a.symbol, percent: 0 }] })); nav('/portfolio'); }}>
            <Plus size={14} />{inPortfolio ? 'In portfolio' : 'Add to portfolio'}
          </button>
        </div>
      </div>

      <section className="panel p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">Market snapshot</h2><DataBadge>Live from PreStocks</DataBadge></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Token price" value={usd(a.tokenPrice)} />
          <Metric label="Mark price" value={usd(a.markPrice)} />
          <Metric label="Token vs mark spread" value={<SpreadPill value={s} />} note="Computed from current PreStocks API data" />
          <Metric label="Implied valuation" value={usdCompact(a.impliedValuation)} note="Company value implied by the token price" />
          <Metric label="Mark valuation" value={usdCompact(a.markValuation)} />
          <Metric label="Token supply" value={num(a.supply, 3)} />
          <Metric label="Supply × token price" value={usdCompact(tokenSupplyValue(a))} note="Computed. Not an official market cap." />
          <Metric label="Since your previous snapshot" value={prevRow ? pct(((a.tokenPrice - prevRow.tokenPrice) / prevRow.tokenPrice) * 100) : 'n/a'} note={prevRow ? 'Token price change between two API readings saved in this browser' : 'Appears after this browser sees the price change'} />
        </div>
        <div className="mt-5 flex gap-3 rounded-lg bg-warn-tint p-4 text-sm text-warn">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>The PreStocks API returns current values only. It provides no price history, so there is no price chart here. We do not estimate or simulate history.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">Spread vs other PreStocks</h2><DataBadge>Computed</DataBadge></div>
          <SpreadBars assets={assets} highlight={a.symbol} />
        </section>
        <section className="panel p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">Token information</h2><DataBadge /></div>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs font-semibold text-ink-mute">Contract address</dt><dd className="break-all font-semibold">{a.contract_address} <CopyButton text={a.contract_address} /></dd></div>
            <div><dt className="text-xs font-semibold text-ink-mute">Backing (from the PreStocks description)</dt><dd className="text-ink-soft">{a.description.split('\n\n').pop()}</dd></div>
            <div><a className="inline-flex items-center gap-1 font-semibold text-ai hover:underline" href={solscanToken(a.contract_address)} target="_blank" rel="noreferrer">View mint on Solscan <ExternalLink size={12} /></a></div>
          </dl>
          <SupplyCheck symbol={a.symbol} />
        </section>
      </div>

      <AssetAnalysis symbol={a.symbol} />

      <section className="panel p-5 sm:p-6">
        <h2 className="mb-3 text-xl font-bold">Alerts for {a.symbol}</h2>
        <AlertForm symbol={a.symbol} />
        {myAlerts.length > 0 && (
          <ul className="mt-4 divide-y divide-line text-sm">
            {myAlerts.map((al) => (
              <li key={al.id} className="flex items-center justify-between py-2">
                <span>{al.type.replace('_', ' ')} {al.threshold}{al.type.startsWith('price') ? ' USD' : '%'}</span>
                <button className="text-xs font-semibold text-down hover:underline" onClick={() => removeAlert(al.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="mb-3 text-xl font-bold">Data sources</h2>
        <table className="w-full text-sm">
          <tbody>
            {fields.map(([label, src, detail]) => (
              <tr key={label} className="border-b border-line/70 last:border-0">
                <td className="py-2 pr-4 font-semibold">{label}</td>
                <td className="py-2 pr-4">{src === 'PreStocks API' ? <DataBadge>PreStocks API</DataBadge> : <Badge>Computed</Badge>}</td>
                <td className="py-2 text-ink-mute">{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
