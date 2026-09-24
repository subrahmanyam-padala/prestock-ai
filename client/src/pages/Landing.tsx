import { Link } from 'react-router-dom';
import { Logo } from '../components/Layout';
import { SpreadBars } from '../components/SpreadBars';
import { DataBadge, Skeleton } from '../components/ui';
import { useData } from '../context/DataContext';
import { WalletButton } from '../components/WalletButton';

const FEATURES: [string, string][] = [
  ['Discover', 'Browse every PreStocks token with its live token price, mark price and implied valuation.'],
  ['Research', 'Generate a structured report where PreStocks facts and AI interpretation are labelled separately.'],
  ['Compare', 'See which tokens trade above or below their mark price, side by side.'],
  ['Build portfolios', 'Set allocations, see simulated token holdings, and test hypothetical scenarios.'],
  ['Understand your data', 'Every number says where it came from. Missing data is listed, never filled in.'],
];

export default function Landing() {
  const { assets, loading, error } = useData();
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <WalletButton />
      </header>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-16">
        <div>
          <h1 className="text-5xl font-bold leading-[1.05] sm:text-6xl">Research the Future of Private Markets</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Explore tokenized pre-IPO opportunities using real PreStocks data and AI-powered research.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/markets" className="btn-primary px-5 py-3 text-base">Explore PreStocks</Link>
            <Link to="/research" className="btn-ai px-5 py-3 text-base">Try AI Research</Link>
          </div>
          <p className="mt-6 max-w-md text-xs text-ink-mute">Educational tool. PreStocks confer no ownership or voting rights, can lose all value, and are not available to US persons.</p>
        </div>
        <div className="panel p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Token price vs mark price, right now</h2>
            <DataBadge>Live from PreStocks</DataBadge>
          </div>
          <p className="mb-4 text-xs text-ink-mute">Spread = (token price − mark price) ÷ mark price, computed from the current API response. It is not a return.</p>
          {loading && <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>}
          {!loading && assets.length > 0 && <SpreadBars assets={assets} />}
          {!loading && assets.length === 0 && <p className="text-sm text-down">{error ?? 'No data available.'}</p>}
        </div>
      </section>
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
          {FEATURES.map(([t, d]) => (
            <div key={t}><h3 className="text-lg font-semibold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-ink-mute">{d}</p></div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-bold">Built on what PreStocks actually provides</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          The PreStocks API returns current prices, valuations, supply and token addresses. It does not return price history, volume or holder data, so PreStock AI does not draw price charts or compute volatility. The AI is told exactly which fields exist and must say when something is missing.
        </p>
        <Link to="/dashboard" className="btn-ghost mt-6">Open the dashboard</Link>
      </section>
    </div>
  );
}
