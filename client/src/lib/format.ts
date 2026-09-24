const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdCompactFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });

export const usd = (n: number) => usdFmt.format(n);
export const usdCompact = (n: number) => usdCompactFmt.format(n);
export const num = (n: number, digits = 2) => n.toLocaleString('en-US', { maximumFractionDigits: digits });
export const pct = (n: number | null, digits = 2) => (n === null ? 'n/a' : `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`);
export const shortAddr = (a: string) => (a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);
export const timeAgo = (ts: number, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};
