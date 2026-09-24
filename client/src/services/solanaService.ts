import { OnChainHolding, SupplyCheck } from '../types';
import { http } from './http';

export const getHoldings = (address: string) =>
  http<{ address: string; fetchedAt: number; holdings: OnChainHolding[] }>(`/api/solana/holdings/${address}`);

export const getSupplyCheck = () => http<{ checkedAt: number; results: SupplyCheck[] }>('/api/solana/supply-check');

export const SOLANA_NETWORK_LABEL = 'Solana mainnet-beta';
export const solscanToken = (mint: string) => `https://solscan.io/token/${mint}`;
export const solscanAccount = (addr: string) => `https://solscan.io/account/${addr}`;
