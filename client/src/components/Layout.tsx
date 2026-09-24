import { Menu, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { timeAgo } from '../lib/format';
import { WalletButton } from './WalletButton';

const NAV = [
  ['/dashboard', 'Dashboard'], ['/markets', 'Markets'], ['/research', 'Research'], ['/portfolio', 'Portfolio'], ['/watchlist', 'Watchlist'],
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink">
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M6 22l7-8 5 4 8-11" stroke="#14F195" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      PreStock AI
    </Link>
  );
}

function Status() {
  const { fetchedAt, refreshing, error, stale, refresh } = useData();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(id); }, []);
  const bad = Boolean(error) || stale;
  return (
    <button onClick={refresh} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-ink-mute hover:bg-white" title="Refresh PreStocks data">
      <span className={`h-2 w-2 rounded-full ${bad ? 'bg-[#E0A21B]' : 'bg-up'}`} />
      {fetchedAt ? `${bad ? 'Last data' : 'Live'} · ${timeAgo(fetchedAt)}` : 'Loading data'}
      <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
    </button>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="panel flex items-start gap-3 border-l-4 border-l-ai p-3 text-sm">
          <div className="flex-1"><div className="font-semibold">Alert triggered</div><div className="text-ink-soft">{t.text}</div></div>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-ink-mute hover:text-ink"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white'}`;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map(([to, label]) => <NavLink key={to} to={to} className={link}>{label}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block"><Status /></div>
            <WalletButton />
            <button className="btn-ghost px-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden" aria-label="Mobile">
            {NAV.map(([to, label]) => <NavLink key={to} to={to} className={link}>{label}</NavLink>)}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6"><Outlet /></main>
      <footer className="border-t border-line px-4 py-6 text-xs leading-relaxed text-ink-mute sm:px-6">
        <div className="mx-auto max-w-7xl">
          PreStock AI is an educational research tool. It is not affiliated with PreStocks. PreStocks provide economic exposure only, confer no ownership or voting rights, may lose all value, and are not available to US persons. Nothing here is investment advice. Data comes from the PreStocks API; AI text is generated and may be wrong.
        </div>
      </footer>
      <Toasts />
    </div>
  );
}
