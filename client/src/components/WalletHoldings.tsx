import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usd, num, shortAddr } from '../lib/format';
import { getHoldings, SOLANA_NETWORK_LABEL, solscanAccount } from '../services/solanaService';
import { OnChainHolding } from '../types';
import { DataBadge, ErrorState, Skeleton } from './ui';

/** Read-only: lists PreStocks tokens (matched by the mint addresses in the PreStocks API) held by the connected wallet. */
export function WalletHoldings() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const [state, setState] = useState<{ loading: boolean; error?: string; holdings?: OnChainHolding[] }>({ loading: false });

  const load = useCallback(async () => {
    if (!address) return;
    setState({ loading: true });
    try { setState({ loading: false, holdings: (await getHoldings(address)).holdings }); }
    catch (e) { setState({ loading: false, error: (e as Error).message }); }
  }, [address]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Your PreStocks on Solana</h2>
        <DataBadge>Solana RPC + PreStocks mints</DataBadge>
      </div>
      {!address && <p className="text-sm text-ink-mute">Connect a wallet to see any PreStocks tokens it holds. This is read-only; the app never asks you to sign or send anything.</p>}
      {address && state.loading && <Skeleton className="h-16 w-full" />}
      {address && state.error && <ErrorState title="Could not read wallet balances" message={state.error} onRetry={load} />}
      {address && state.holdings && (
        state.holdings.length === 0 ? (
          <p className="text-sm text-ink-mute">
            No PreStocks tokens found in <a className="font-semibold underline" href={solscanAccount(address)} target="_blank" rel="noreferrer">{shortAddr(address)}</a> on {SOLANA_NETWORK_LABEL}.
          </p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {state.holdings.map((h) => (
              <li key={h.mint} className="flex items-center justify-between py-2">
                <Link to={`/stock/${h.symbol}`} className="font-semibold hover:underline">{h.symbol}</Link>
                <span>{num(h.amount, 4)} tokens <span className="text-ink-mute">· {usd(h.usdValue)} at token price</span></span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
