'use client';

import { useState } from 'react';
import { WalletHolding } from '@/types';
import { fetchEthWallet, fetchSolWallet } from '@/lib/api';
import { MOCK_PORTFOLIO_WALLET, MOCK_PORTFOLIO_HOLDINGS } from '@/lib/constants';
import { fmt, pct, shortenAddress } from '@/lib/formatters';

interface Props {
  onHoldingsChange: (holdings: WalletHolding[]) => void;
}

export default function WalletTracker({ onHoldingsChange }: Props) {
  const [address, setAddress] = useState(MOCK_PORTFOLIO_WALLET);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [holdings, setHoldings] = useState<WalletHolding[]>(MOCK_PORTFOLIO_HOLDINGS);

  const totalValue = holdings.reduce((s, h) => s + (h.usdValue ?? 0), 0);

  const analyze = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError('');
    try {
      const isEth = address.trim().startsWith('0x');
      const result = isEth
        ? await fetchEthWallet(address.trim())
        : await fetchSolWallet(address.trim());
      if (result.length === 0) throw new Error('No holdings found');
      setHoldings(result);
      onHoldingsChange(result);
    } catch {
      setError('Could not fetch wallet. Check the address and try again.');
      setHoldings(MOCK_PORTFOLIO_HOLDINGS);
      onHoldingsChange(MOCK_PORTFOLIO_HOLDINGS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">Wallet Tracker</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Enter ETH (0x...) or SOL address"
          onKeyDown={e => e.key === 'Enter' && analyze()}
        />
        <button className="btn-primary" onClick={analyze} disabled={loading} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          {loading ? 'Loading...' : 'Analyze Wallet'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, marginBottom: 16, padding: '10px 14px', background: 'var(--red-dim)', borderRadius: 8, border: '1px solid rgba(255,71,87,0.2)' }}>
          {error}
        </div>
      )}

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Wallet</div>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-mid)' }}>{shortenAddress(address)}</div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Portfolio Value</div>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{fmt(totalValue)}</div>
        </div>
      </div>
    </div>
  );
}
