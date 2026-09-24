import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LogOut, Wallet } from 'lucide-react';
import { shortAddr } from '../lib/format';
import { SOLANA_NETWORK_LABEL } from '../services/solanaService';

export function WalletButton() {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  if (!connected || !publicKey) {
    return (
      <button className="btn-primary" onClick={() => setVisible(true)} disabled={connecting}>
        <Wallet size={16} />{connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    );
  }
  const addr = publicKey.toBase58();
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white py-1 pl-3 pr-1 text-sm">
      <span className="h-2 w-2 rounded-full bg-up" aria-hidden />
      <span className="font-semibold" title={addr}>{shortAddr(addr)}</span>
      <span className="hidden text-xs text-ink-mute lg:inline">{wallet?.adapter.name} · {SOLANA_NETWORK_LABEL}</span>
      <button className="rounded-md p-1.5 text-ink-mute hover:bg-paper hover:text-ink" onClick={() => disconnect()} aria-label="Disconnect wallet">
        <LogOut size={14} />
      </button>
    </div>
  );
}
