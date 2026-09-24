import { config } from '../config';
import { HttpError } from '../errors';
import { PreStock } from '../types';

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(config.solanaRpc, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!res.ok) throw new HttpError(`Solana RPC responded with ${res.status}`, 502, 'rpc_error');
    const json = (await res.json()) as { result?: T; error?: { message: string } };
    if (json.error) throw new HttpError(`Solana RPC error: ${json.error.message}`, 502, 'rpc_error');
    return json.result as T;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError('Could not reach the Solana RPC endpoint', 502, 'rpc_unreachable');
  } finally {
    clearTimeout(timer);
  }
}

interface ParsedAccounts {
  value: { account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmountString: string } } } } } }[];
}

export interface OnChainHolding {
  symbol: string;
  mint: string;
  amount: number;
  usdValue: number;
}

/** Read-only: token balances the wallet holds for PreStocks mints listed by the PreStocks API. */
export async function getHoldings(owner: string, assets: PreStock[]): Promise<OnChainHolding[]> {
  const byMint = new Map(assets.map((a) => [a.contract_address, a]));
  const totals = new Map<string, number>();
  const results = await Promise.allSettled(
    [TOKEN_PROGRAM, TOKEN_2022_PROGRAM].map((programId) =>
      rpc<ParsedAccounts>('getTokenAccountsByOwner', [owner, { programId }, { encoding: 'jsonParsed' }]),
    ),
  );
  if (results.every((r) => r.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const acc of r.value.value) {
      const info = acc.account.data.parsed.info;
      if (!byMint.has(info.mint)) continue;
      totals.set(info.mint, (totals.get(info.mint) ?? 0) + Number(info.tokenAmount.uiAmountString));
    }
  }
  return [...totals.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([mint, amount]) => {
      const a = byMint.get(mint) as PreStock;
      return { symbol: a.symbol, mint, amount, usdValue: amount * a.tokenPrice };
    });
}

export interface SupplyCheck {
  symbol: string;
  mint: string;
  apiSupply: number;
  onChainSupply: number | null;
  diffPct: number | null;
  error?: string;
}

/** Compares the `supply` reported by PreStocks with the mint supply read from Solana. */
export async function checkSupply(assets: PreStock[]): Promise<SupplyCheck[]> {
  return Promise.all(
    assets.map(async (a): Promise<SupplyCheck> => {
      try {
        const r = await rpc<{ value: { uiAmountString: string } }>('getTokenSupply', [a.contract_address]);
        const onChain = Number(r.value.uiAmountString);
        return {
          symbol: a.symbol, mint: a.contract_address, apiSupply: a.supply, onChainSupply: onChain,
          diffPct: a.supply > 0 ? ((onChain - a.supply) / a.supply) * 100 : null,
        };
      } catch (e) {
        return { symbol: a.symbol, mint: a.contract_address, apiSupply: a.supply, onChainSupply: null, diffPct: null, error: (e as Error).message };
      }
    }),
  );
}
