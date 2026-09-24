import { Sparkles } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useData } from '../context/DataContext';
import { timeAgo } from '../lib/format';
import { analyzeAsset, analyzePortfolio } from '../services/aiService';
import { AssetReport, Fact, HoldingInput, PortfolioReport } from '../types';
import { AiBadge, DataBadge, ErrorState, NaBadge, Skeleton } from './ui';

function Section({ title, badge, children }: { title: string; badge: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>{badge}
      </div>
      {children}
    </section>
  );
}

const Bullets = ({ items, empty = 'Nothing to report.' }: { items: string[]; empty?: string }) =>
  items.length === 0 ? <p className="text-sm text-ink-mute">{empty}</p> : (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft marker:text-ai">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );

function Facts({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {facts.map((f, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 border-b border-line/70 py-1.5 text-sm">
          <dt className="text-ink-mute">{f.label}</dt>
          <dd className="break-all text-right font-semibold" title={f.source}>
            {f.value}
            {f.source !== 'PreStocks API' && <span className="ml-1 text-[11px] font-medium text-data">computed</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function NotAvailable({ items }: { items: string[] }) {
  return (
    <>
      <p className="mb-2 text-sm text-ink-mute">This information is not available from the current PreStocks data:</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft marker:text-warn">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </>
  );
}

function Frame({ title, meta, children, disclaimer }: { title: string; meta: string; children: ReactNode; disclaimer: string }) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <span className="text-xs text-ink-mute">{meta}</span>
      </div>
      {children}
      <p className="mt-5 rounded-lg bg-warn-tint p-3 text-xs leading-relaxed text-warn">{disclaimer}</p>
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="panel space-y-3 p-6" aria-busy="true">
      <div className="flex items-center gap-2 text-sm font-semibold text-ai"><Sparkles size={16} className="animate-pulse" />{text}</div>
      <Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-24 w-full" />
    </div>
  );
}

export function AssetAnalysis({ symbol }: { symbol: string }) {
  const { fetchedAt } = useData();
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'error' | 'ready'; report?: AssetReport; error?: string; symbol?: string }>({ status: 'idle' });
  const run = async () => {
    setState({ status: 'loading', symbol });
    try { setState({ status: 'ready', report: await analyzeAsset(symbol), symbol }); }
    catch (e) { setState({ status: 'error', error: (e as Error).message, symbol }); }
  };
  const current: typeof state = state.symbol === symbol ? state : { status: 'idle' };
  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-4 border-ai/30 bg-ai-tint/40 p-5">
        <div>
          <h2 className="text-xl font-bold">AI research on {symbol}</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            The server sends this asset's live PreStocks data to the model and asks for a structured report. Facts are copied from the API, not written by the AI.
          </p>
        </div>
        <button className="btn-ai" onClick={run} disabled={current.status === 'loading'}>
          <Sparkles size={16} />{current.status === 'ready' ? 'Analyze again' : 'Analyze with AI'}
        </button>
      </div>
      {current.status === 'loading' && <Loading text={`Reading ${symbol} data and drafting the report…`} />}
      {current.status === 'error' && <ErrorState title="The AI report failed" message={current.error ?? 'Unknown error'} onRetry={run} />}
      {current.status === 'ready' && current.report && (
        <Frame title={`${current.report.symbol} research report`} disclaimer={current.report.disclaimer}
          meta={`Data from ${timeAgo(current.report.dataFetchedAt)} · ${current.report.model}${fetchedAt && fetchedAt > current.report.dataFetchedAt ? ' · newer data available' : ''}`}>
          <Section title="Executive summary" badge={<AiBadge />}><p className="text-sm leading-relaxed text-ink-soft">{current.report.executive_summary}</p></Section>
          <Section title="Facts from PreStocks" badge={<DataBadge />}><Facts facts={current.report.facts} /></Section>
          <Section title="Market observations" badge={<AiBadge>AI, based on PreStocks Data</AiBadge>}><Bullets items={current.report.market_observations} /></Section>
          <Section title="AI interpretation" badge={<AiBadge />}><Bullets items={current.report.interpretation} /></Section>
          <Section title="Potential risks" badge={<AiBadge />}><Bullets items={current.report.risk_considerations} /></Section>
          <Section title="Questions to investigate" badge={<AiBadge />}><Bullets items={current.report.questions_to_investigate} /></Section>
          <Section title="Data limitations" badge={<NaBadge />}><NotAvailable items={current.report.not_available} /></Section>
        </Frame>
      )}
    </div>
  );
}

export function PortfolioAnalysis({ value, holdings, disabled, reason }: { value: number; holdings: HoldingInput[]; disabled: boolean; reason?: string }) {
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'error' | 'ready'; report?: PortfolioReport; error?: string }>({ status: 'idle' });
  const run = async () => {
    setState({ status: 'loading' });
    try { setState({ status: 'ready', report: await analyzePortfolio(value, holdings) }); }
    catch (e) { setState({ status: 'error', error: (e as Error).message }); }
  };
  const r = state.report;
  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-4 border-ai/30 bg-ai-tint/40 p-5">
        <div>
          <h2 className="text-xl font-bold">AI portfolio analysis</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">{reason ?? 'The server recomputes the metrics from live PreStocks data, then asks the model to interpret them.'}</p>
        </div>
        <button className="btn-ai" onClick={run} disabled={disabled || state.status === 'loading'}>
          <Sparkles size={16} />Analyze Portfolio with AI
        </button>
      </div>
      {state.status === 'loading' && <Loading text="Computing metrics and drafting the analysis…" />}
      {state.status === 'error' && <ErrorState title="The portfolio analysis failed" message={state.error ?? 'Unknown error'} onRetry={run} />}
      {r && state.status === 'ready' && (
        <Frame title="Portfolio analysis" disclaimer={r.disclaimer} meta={`Data from ${timeAgo(r.dataFetchedAt)} · ${r.model}`}>
          <Section title="Portfolio summary" badge={<AiBadge />}><p className="text-sm leading-relaxed text-ink-soft">{r.summary}</p></Section>
          <Section title="Facts and computed metrics" badge={<DataBadge />}><Facts facts={r.facts} /></Section>
          <Section title="Concentration" badge={<AiBadge />}><Bullets items={r.concentration_observations} /></Section>
          <Section title="Exposure" badge={<AiBadge />}><Bullets items={r.exposure_observations} /></Section>
          <Section title="Data-driven insights" badge={<AiBadge />}><Bullets items={r.insights} /></Section>
          <Section title="Potential risks" badge={<AiBadge />}><Bullets items={r.risks} /></Section>
          <Section title="Scenario analysis" badge={<AiBadge>Hypothetical, not a forecast</AiBadge>}>
            <p className="text-sm leading-relaxed text-ink-soft">{r.scenario_analysis}</p>
          </Section>
          <Section title="Data limitations" badge={<NaBadge />}>
            <Bullets items={r.missing_data_warnings} empty="" />
            <div className="mt-3"><NotAvailable items={r.not_available} /></div>
          </Section>
        </Frame>
      )}
    </div>
  );
}
