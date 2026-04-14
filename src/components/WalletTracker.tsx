'use client';

import { useState } from 'react';
import { WalletHolding } from '@/types';
import { fetchPortfolio } from '@/lib/api';
import { MOCK_PORTFOLIO_WALLET, MOCK_PORTFOLIO_HOLDINGS } from '@/lib/constants';
import { fmt, shortenAddress } from '@/lib/formatters';

interface PortfolioResult {
  holdings: WalletHolding[];
  totalValue: number;
  pnl24h: number | null;
  pricedCount: number;
  totalCount: number;
  chain: string;
}

interface Props {
  onResult: (result: PortfolioResult | null) => void;
}

const STAGES = ['Connecting…', 'Fetching balances…', 'Pricing assets…', 'Done'];

function detectChain(addr: string): 'ethereum' | 'solana' | null {
  if (addr.startsWith('0x') && addr.length === 42) return 'ethereum';
  if (addr.length >= 32 && addr.length <= 44 && !addr.startsWith('0x')) return 'solana';
  return null;
}

function ChainBadge({ chain }: { chain: 'ethereum' | 'solana' | null }) {
  if (!chain) return null;
  const isEth = chain === 'ethereum';
  return (
    <span style={{
      fontFamily: 'var(--font-space-mono), monospace',
      fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 4,
      background: isEth ? 'rgba(98,126,234,0.12)' : 'rgba(20,241,149,0.1)',
      border: `1px solid ${isEth ? 'rgba(98,126,234,0.3)' : 'rgba(20,241,149,0.3)'}`,
      color: isEth ? '#627eea' : '#14f195',
      flexShrink: 0,
    }}>
      {isEth ? 'Ξ ETH' : '◎ SOL'}
    </span>
  );
}

export default function WalletTracker({ onResult }: Props) {
  const [address, setAddress] = useState('');
  const [stage, setStage] = useState(-1); // -1 = idle
  const [error, setError] = useState('');
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const loading = stage >= 0 && stage < STAGES.length - 1;
  const chain = detectChain(address);

  const runAnalysis = async (addr: string, demo = false) => {
    if (!addr.trim() || loading) return;
    setError('');
    setResult(null);
    setIsDemo(demo);
    setStage(0);

    // Artificial stage progression for UX feedback
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 900);

    try {
      const data = await fetchPortfolio(addr.trim());
      clearTimeout(t1);
      clearTimeout(t2);

      if (!data || 'error' in data) {
        throw new Error((data as { error?: string })?.error ?? 'No holdings found.');
      }

      setStage(3);
      setResult(data);
      onResult(data);
    } catch (e) {
      clearTimeout(t1);
      clearTimeout(t2);
      setStage(-1);
      setError(e instanceof Error ? e.message : 'Could not fetch wallet. Check the address and try again.');
      onResult(null);
    }
  };

  const loadDemo = () => {
    setAddress(MOCK_PORTFOLIO_WALLET);
    // Use mock data directly so demo always works regardless of API key
    const demoResult: PortfolioResult = {
      holdings: MOCK_PORTFOLIO_HOLDINGS.map(h => ({ ...h, chain: 'ethereum' as const })),
      totalValue: MOCK_PORTFOLIO_HOLDINGS.reduce((s, h) => s + (h.usdValue ?? 0), 0),
      pnl24h: null,
      pricedCount: MOCK_PORTFOLIO_HOLDINGS.filter(h => h.usdValue != null).length,
      totalCount: MOCK_PORTFOLIO_HOLDINGS.length,
      chain: 'ethereum',
    };
    setResult(demoResult);
    setIsDemo(true);
    setStage(3);
    onResult(demoResult);
    setError('');
  };

  const pnlPositive = (result?.pnl24h ?? 0) >= 0;
  const pnlColor = pnlPositive ? 'var(--green)' : 'var(--red)';

  return (
    <div className="panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
          Wallet Tracker
        </div>
        {!result && (
          <button
            onClick={loadDemo}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 6, padding: '4px 10px',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: 9, color: 'var(--text-dim)',
              cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
          >
            Load demo wallet
          </button>
        )}
        {result && (
          <button
            onClick={() => { setResult(null); setStage(-1); setAddress(''); onResult(null); }}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 6, padding: '4px 10px',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: 9, color: 'var(--text-dim)',
              cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: error ? 12 : 0, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            value={address}
            onChange={e => { setAddress(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && runAnalysis(address)}
            placeholder="Paste ETH (0x…) or Solana address"
            disabled={loading}
            style={{ paddingRight: chain ? 80 : 14 }}
          />
          {chain && (
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <ChainBadge chain={chain} />
            </div>
          )}
        </div>
        <button
          className="btn-primary"
          onClick={() => runAnalysis(address)}
          disabled={loading || !address.trim()}
          style={{ flexShrink: 0, whiteSpace: 'nowrap', opacity: (loading || !address.trim()) ? 0.45 : 1 }}
        >
          {loading ? STAGES[stage] : 'Analyze →'}
        </button>
      </div>

      {/* Loading progress */}
      {loading && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {STAGES.slice(0, -1).map((s, i) => (
              <div key={s} style={{ flex: 1, height: 2, borderRadius: 1, background: i <= stage ? 'var(--green)' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
            {STAGES[stage]}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'var(--red-dim)', border: '1px solid rgba(255,71,87,0.2)',
          fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--red)',
        }}>
          {error}
        </div>
      )}

      {/* Portfolio summary */}
      {result && stage === 3 && (
        <div style={{ marginTop: 16 }}>
          {/* Address + chain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-mid)' }}>
              {shortenAddress(address || MOCK_PORTFOLIO_WALLET)}
            </span>
            <ChainBadge chain={(result.chain as 'ethereum' | 'solana') ?? null} />
            {isDemo && (
              <span style={{
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 9,
                color: 'var(--yellow)', background: 'rgba(255,211,42,0.1)',
                border: '1px solid rgba(255,211,42,0.25)', borderRadius: 4,
                padding: '1px 6px', letterSpacing: '1px', textTransform: 'uppercase',
              }}>Demo</span>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Total Value</div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
                {fmt(result.totalValue)}
              </div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>24h P&amp;L</div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 18, fontWeight: 700, color: result.pnl24h != null ? pnlColor : 'var(--text-dim)' }}>
                {result.pnl24h != null
                  ? `${pnlPositive ? '+' : ''}${fmt(result.pnl24h)}`
                  : '—'}
              </div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Assets</div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {result.pricedCount}
                {result.totalCount > result.pricedCount && (
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 400 }}> +{result.totalCount - result.pricedCount} unpriced</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
