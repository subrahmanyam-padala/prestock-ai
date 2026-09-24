import { useState } from 'react';
import { num, pct } from '../lib/format';
import { getSupplyCheck } from '../services/solanaService';
import { SupplyCheck as Check } from '../types';
import { ErrorState } from './ui';

/** Compares the API's `supply` with the mint supply read straight from Solana. */
export function SupplyCheck({ symbol }: { symbol: string }) {
  const [state, setState] = useState<{ loading: boolean; error?: string; row?: Check }>({ loading: false });
  const run = async () => {
    setState({ loading: true });
    try {
      const r = (await getSupplyCheck()).results.find((x) => x.symbol === symbol);
      setState({ loading: false, row: r });
    } catch (e) { setState({ loading: false, error: (e as Error).message }); }
  };
  return (
    <div className="mt-4 rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Verify supply on Solana</div>
          <p className="text-xs text-ink-mute">Reads the token mint's supply from the chain and compares it to the PreStocks API.</p>
        </div>
        <button className="btn-ghost" onClick={run} disabled={state.loading}>{state.loading ? 'Checking…' : 'Check on-chain'}</button>
      </div>
      {state.error && <div className="mt-3"><ErrorState message={state.error} onRetry={run} /></div>}
      {state.row && (
        <div className="mt-3 text-sm">
          {state.row.onChainSupply === null ? (
            <p className="text-warn">Could not read this mint from the RPC: {state.row.error}</p>
          ) : (
            <p>
              API supply <b>{num(state.row.apiSupply, 3)}</b> · on-chain supply <b>{num(state.row.onChainSupply, 3)}</b>
              {state.row.diffPct !== null && <> · difference <b>{pct(state.row.diffPct, 3)}</b></>}
              <span className="block text-xs text-ink-mute">Small differences can appear because the two numbers are read at different moments.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
