import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioAnalysis } from '../components/AiReport';
import { AssetLogo, Badge, DataBadge, EmptyState, ErrorState, PageHeader, Skeleton, SpreadPill, Stat } from '../components/ui';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { num, pct, usd } from '../lib/format';
import { convergenceChange, hhi, portfolioRows, shockChange, weightedSpread } from '../lib/metrics';

const COLORS = ['#6236D6', '#0B8F74', '#E08A1E', '#2A6FDB', '#CF3E58', '#7B8CA6', '#14B8A6', '#9945FF'];
const round2 = (n: number) => Math.round(n * 100) / 100;

export default function Portfolio() {
  const { assets, loading, error, refresh } = useData();
  const { portfolio, setPortfolio } = useStore();
  const [pick, setPick] = useState('');
  const [shock, setShock] = useState(-30);
  const [target, setTarget] = useState('');

  const known = useMemo(() => new Set(assets.map((a) => a.symbol)), [assets]);
  const holdings = portfolio.holdings.filter((h) => known.has(h.symbol));
  const rows = useMemo(() => portfolioRows(assets, portfolio.value, holdings), [assets, portfolio.value, holdings]);
  const total = round2(holdings.reduce((s, h) => s + h.percent, 0));
  const totalOk = Math.abs(total - 100) < 0.01;
  const valueOk = portfolio.value > 0;
  const available = assets.filter((a) => !holdings.some((h) => h.symbol === a.symbol));

  const update = (symbol: string, percent: number) =>
    setPortfolio((p) => ({ ...p, holdings: p.holdings.map((h) => (h.symbol === symbol ? { ...h, percent: Math.min(100, Math.max(0, percent)) } : h)) }));
  const remove = (symbol: string) => setPortfolio((p) => ({ ...p, holdings: p.holdings.filter((h) => h.symbol !== symbol) }));
  const add = () => { if (pick) { setPortfolio((p) => ({ ...p, holdings: [...p.holdings, { symbol: pick, percent: Math.max(0, round2(100 - total)) }] })); setPick(''); } };
  const equalise = () => setPortfolio((p) => {
    const hs = p.holdings.filter((h) => known.has(h.symbol));
    const each = round2(100 / hs.length);
    return { ...p, holdings: hs.map((h, i) => ({ ...h, percent: i === hs.length - 1 ? round2(100 - each * (hs.length - 1)) : each })) };
  });
  const normalise = () => setPortfolio((p) => {
    const sum = p.holdings.reduce((s, h) => s + h.percent, 0);
    if (sum <= 0) return p;
    const hs = p.holdings.map((h) => ({ ...h, percent: round2((h.percent / sum) * 100) }));
    const drift = round2(100 - hs.reduce((s, h) => s + h.percent, 0));
    if (hs.length) hs[0] = { ...hs[0], percent: round2(hs[0].percent + drift) };
    return { ...p, holdings: hs };
  });

  if (loading) return <><PageHeader title="Portfolio intelligence" /><Skeleton className="h-64 w-full" /></>;
  if (assets.length === 0) return <><PageHeader title="Portfolio intelligence" /><ErrorState title="PreStocks data is unavailable" message={error ?? 'No assets returned.'} onRetry={refresh} /></>;

  const top = rows.length ? rows.reduce((m, r) => (r.percent > m.percent ? r : m)) : null;
  const h = hhi(holdings);
  const ws = weightedSpread(rows);
  const scenarioRow = rows.find((r) => r.symbol === (target || top?.symbol)) ?? top;
  const scenarioChange = scenarioRow ? shockChange(scenarioRow, shock) : 0;
  const conv = convergenceChange(rows);
  const pieData = rows.filter((r) => r.percent > 0).map((r) => ({ name: r.symbol, value: r.percent }));
  const problem = !holdings.length ? 'Add at least one PreStock to analyze.' : !valueOk ? 'Enter a portfolio value above zero.' : !totalOk ? `Allocations must total 100% (currently ${total}%).` : undefined;

  return (
    <>
      <PageHeader title="Portfolio intelligence" sub="A simulated portfolio: no money moves and nothing is bought. Quantities are your dollar allocation divided by the current token price." />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="panel p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="label" htmlFor="pv">Portfolio value (USD)</label>
              <input id="pv" className="input" type="number" min={0} step={100} value={portfolio.value || ''} onChange={(e) => setPortfolio((p) => ({ ...p, value: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={equalise} disabled={!holdings.length}>Equal weight</button>
              <button className="btn-ghost" onClick={normalise} disabled={!holdings.length}>Scale to 100%</button>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <select className="input" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Asset to add" disabled={available.length === 0}>
              <option value="">{available.length ? 'Add a PreStock…' : 'All PreStocks added'}</option>
              {available.map((a) => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
            </select>
            <button className="btn-primary" onClick={add} disabled={!pick}><Plus size={14} />Add</button>
          </div>

          {holdings.length === 0 ? (
            <div className="mt-5"><EmptyState title="No holdings yet" body="Add PreStocks to build a simulated portfolio, then adjust their allocations." /></div>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {holdings.map((hd, i) => {
                const a = assets.find((x) => x.symbol === hd.symbol)!;
                return (
                  <li key={hd.symbol} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 sm:grid-cols-[auto_8rem_1fr_5.5rem_auto]">
                    <span className="h-3 w-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
                    <span className="flex items-center gap-2 text-sm font-semibold"><AssetLogo asset={a} size={24} />{a.symbol}</span>
                    <input className="col-span-3 accent-[#6236D6] sm:col-span-1 sm:col-start-3" type="range" min={0} max={100} step={0.5} value={hd.percent} onChange={(e) => update(hd.symbol, Number(e.target.value))} aria-label={`${a.symbol} allocation`} />
                    <div className="relative">
                      <input className="input pr-7 text-right" type="number" min={0} max={100} step={0.1} value={hd.percent} onChange={(e) => update(hd.symbol, Number(e.target.value))} aria-label={`${a.symbol} allocation percent`} />
                      <span className="pointer-events-none absolute right-3 top-2 text-sm text-ink-mute">%</span>
                    </div>
                    <button onClick={() => remove(hd.symbol)} aria-label={`Remove ${a.symbol}`} className="text-ink-mute hover:text-down"><Trash2 size={16} /></button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className={`mt-4 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${totalOk ? 'bg-data-tint text-data' : 'bg-warn-tint text-warn'}`} role="status">
            <span>Total allocation</span>
            <span>{total}%{!totalOk && holdings.length > 0 && ` · ${total < 100 ? `${round2(100 - total)}% left to assign` : `${round2(total - 100)}% over`}`}</span>
          </div>
        </section>

        <section className="panel p-5">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">Composition</h2><Badge>Your allocations</Badge></div>
          {pieData.length === 0 ? <div className="grid h-64 place-items-center text-sm text-ink-mute">Set allocations to see the chart.</div> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="none">
                    {pieData.map((d) => <Cell key={d.name} fill={COLORS[holdings.findIndex((x) => x.symbol === d.name) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-ink-mute">Largest holding</div><div className="font-semibold">{top?.symbol} · {top?.percent}%</div></div>
              <div><div className="text-xs text-ink-mute">HHI concentration</div><div className="font-semibold">{num(h, 0)} <span className="font-normal text-ink-mute">of 10,000</span></div></div>
              <div><div className="text-xs text-ink-mute">Effective holdings</div><div className="font-semibold">{h > 0 ? num(10000 / h, 2) : 'n/a'}</div></div>
              <div><div className="text-xs text-ink-mute">Weighted spread</div><div className="font-semibold">{pct(ws)}</div></div>
            </div>
          )}
        </section>
      </div>

      {rows.length > 0 && (
        <section className="panel mt-6 overflow-x-auto">
          <div className="flex items-center justify-between p-4"><h2 className="text-lg font-semibold">Simulated holdings</h2><DataBadge>Token prices from PreStocks</DataBadge></div>
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line text-left text-xs font-semibold text-ink-mute">
              <th className="p-3">Asset</th><th className="p-3 text-right">Allocation</th><th className="p-3 text-right">Dollar value</th><th className="p-3 text-right">Token price</th><th className="p-3 text-right">Simulated tokens</th><th className="p-3 text-right">Spread</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.symbol} className="border-b border-line/70 last:border-0">
                  <td className="p-3 font-semibold">{r.symbol}</td><td className="p-3 text-right">{r.percent}%</td><td className="p-3 text-right">{usd(r.usd)}</td>
                  <td className="p-3 text-right">{usd(r.tokenPrice)}</td><td className="p-3 text-right">{num(r.quantity, 4)}</td><td className="p-3 text-right"><SpreadPill value={r.spreadPct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <Stat label="Weight in tokens above mark" value={`${num(rows.filter((r) => (r.spreadPct ?? 0) > 0).reduce((s, r) => s + r.percent, 0), 1)}%`} note="Computed from allocations and current spreads" />
            <Stat label="Weight in tokens below mark" value={`${num(rows.filter((r) => (r.spreadPct ?? 0) < 0).reduce((s, r) => s + r.percent, 0), 1)}%`} />
            <Stat label="Correlation, volatility, returns" value="Not available" note="The API has no price history, so these are not calculated." />
          </div>
        </section>
      )}

      {rows.length > 0 && scenarioRow && (
        <section className="panel mt-6 p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Scenario simulator</h2>
            <Badge tone="warn">Hypothetical scenario, not a forecast</Badge>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label" htmlFor="sc-t">Position</label>
                  <select id="sc-t" className="input" value={scenarioRow.symbol} onChange={(e) => setTarget(e.target.value)}>{rows.map((r) => <option key={r.symbol} value={r.symbol}>{r.symbol}{r.symbol === top?.symbol ? ' (largest)' : ''}</option>)}</select></div>
                <div><label className="label" htmlFor="sc-s">Price change: {shock}%</label>
                  <input id="sc-s" className="w-full accent-[#6236D6]" type="range" min={-90} max={90} step={5} value={shock} onChange={(e) => setShock(Number(e.target.value))} /></div>
              </div>
              <p className="mt-3 text-sm">
                What if {scenarioRow.symbol} changes by {shock}% and nothing else moves? Value changes by <b>{usd(scenarioChange)}</b> to <b>{usd(portfolio.value + scenarioChange)}</b>, a <b>{pct(portfolio.value > 0 ? (scenarioChange / portfolio.value) * 100 : 0)}</b> move for the whole portfolio.
              </p>
              <p className="mt-1 text-xs text-ink-mute">Arithmetic: dollar allocation × price change. No probability is attached.</p>
            </div>
            <div className="rounded-lg border border-line p-4 text-sm">
              <div className="font-semibold">If every token repriced to its mark price</div>
              <p className="mt-2">Portfolio value changes by <b>{usd(conv)}</b> to <b>{usd(portfolio.value + conv)}</b> ({pct(portfolio.value > 0 ? (conv / portfolio.value) * 100 : 0)}).</p>
              <p className="mt-1 text-xs text-ink-mute">Uses each holding's markPrice ÷ tokenPrice from PreStocks. It shows how much of the value depends on the current spread; it does not predict that prices will converge.</p>
            </div>
          </div>
        </section>
      )}

      <div className="mt-6"><PortfolioAnalysis value={portfolio.value} holdings={holdings} disabled={Boolean(problem)} reason={problem} /></div>
    </>
  );
}
