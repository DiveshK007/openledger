'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

interface YieldPool {
  pool: string;
  project: string;
  projectDisplay: string;
  symbol: string;
  chain: string;
  apy: number;
  apyBase: number;
  apyReward: number;
  apyPct7D: number | null;
  tvlUsd: number;
  stablecoin: boolean;
  ilRisk: string;
  risk: 'low' | 'medium' | 'high';
  volumeUsd1d: number | null;
}

const CHAIN_COLORS: Record<string, string> = {
  Ethereum:  '#627eea',
  Arbitrum:  '#28a0f0',
  Base:      '#0052ff',
  Optimism:  '#ff0420',
  Polygon:   '#8247e5',
  BSC:       '#fcd535',
};

const RISK_COLORS = {
  low:    { bg: 'rgba(0,229,160,0.1)',  border: 'rgba(0,229,160,0.3)',  text: 'var(--green)' },
  medium: { bg: 'rgba(255,211,42,0.1)', border: 'rgba(255,211,42,0.3)', text: 'var(--yellow)' },
  high:   { bg: 'rgba(255,71,87,0.1)',  border: 'rgba(255,71,87,0.3)',  text: 'var(--red)' },
};

function fmtTvl(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

export default function YieldPage() {
  const [pools, setPools] = useState<YieldPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chainFilter, setChainFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'stable' | 'volatile'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium'>('all');
  const [sort, setSort] = useState<'apy' | 'tvl'>('apy');

  useEffect(() => {
    fetch('/api/yields')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setPools(data.pools ?? []);
      })
      .catch(() => setError('Failed to load yield data.'))
      .finally(() => setLoading(false));
  }, []);

  const chains = ['All', ...Array.from(new Set(pools.map(p => p.chain))).sort()];

  const filtered = pools
    .filter(p => chainFilter === 'All' || p.chain === chainFilter)
    .filter(p => typeFilter === 'all' || (typeFilter === 'stable' ? p.stablecoin : !p.stablecoin))
    .filter(p => riskFilter === 'all' || p.risk === riskFilter || (riskFilter === 'medium' && p.risk !== 'high'))
    .sort((a, b) => sort === 'apy' ? b.apy - a.apy : b.tvlUsd - a.tvlUsd);

  const totalTvl = pools.reduce((s, p) => s + p.tvlUsd, 0);
  const avgApy = pools.length ? pools.reduce((s, p) => s + p.apy, 0) / pools.length : 0;
  const bestStable = pools.filter(p => p.stablecoin).sort((a, b) => b.apy - a.apy)[0];

  const filterBtn = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--green-dim)' : 'var(--bg3)',
    border: `1px solid ${active ? 'rgba(0,229,160,0.4)' : 'var(--border)'}`,
    color: active ? 'var(--green)' : 'var(--text-mid)',
    borderRadius: 20,
    padding: '5px 14px',
    fontFamily: 'var(--font-space-mono), monospace',
    fontSize: 10,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textTransform: 'none' as const,
    letterSpacing: 0,
  });

  return (
    <ErrorBoundary>
      <Header />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px 0' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 4vw, 32px)', color: 'var(--text)', margin: 0 }}>
              DeFi Yield Aggregator
            </h1>
            <span style={{
              background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)',
              borderRadius: 20, padding: '4px 12px',
              fontFamily: 'var(--font-space-mono), monospace', fontSize: 9,
              color: 'var(--green)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700,
            }}>
              via DeFiLlama
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
            Real-time APY across Aave, Compound, Curve, Uniswap, and 20+ protocols. Sorted by risk-adjusted yield.
          </p>
        </div>

        {/* Summary stats */}
        {!loading && pools.length > 0 && (
          <div className="stat-row" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total TVL Tracked', value: fmtTvl(totalTvl), sub: `${pools.length} pools`, color: 'blue' },
              { label: 'Avg APY', value: `${avgApy.toFixed(2)}%`, sub: 'Across all pools', color: 'green' },
              { label: 'Best Stable Yield', value: bestStable ? `${bestStable.apy.toFixed(2)}%` : '—', sub: bestStable ? `${bestStable.projectDisplay} · ${bestStable.symbol}` : '—', color: 'green' },
              { label: 'Data Source', value: 'DeFiLlama', sub: 'Updated hourly · Free API', color: 'yellow' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, var(--${s.color}), transparent)` }} />
                <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {/* Chain filter */}
          {chains.slice(0, 7).map(c => (
            <button key={c} onClick={() => setChainFilter(c)} style={filterBtn(chainFilter === c)}>{c}</button>
          ))}
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          {/* Type filter */}
          {(['all', 'stable', 'volatile'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={filterBtn(typeFilter === t)}>
              {t === 'all' ? 'All Types' : t === 'stable' ? 'Stablecoins' : 'Volatile'}
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          {/* Risk filter */}
          {(['all', 'low', 'medium'] as const).map(r => (
            <button key={r} onClick={() => setRiskFilter(r)} style={filterBtn(riskFilter === r)}>
              {r === 'all' ? 'All Risk' : r === 'low' ? 'Low Risk' : '≤ Med Risk'}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={() => setSort('apy')} style={filterBtn(sort === 'apy')}>↓ APY</button>
            <button onClick={() => setSort('tvl')} style={filterBtn(sort === 'tvl')}>↓ TVL</button>
          </div>
        </div>

        {/* Table */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Asset</th>
                  <th>Chain</th>
                  <th>APY</th>
                  <th style={{ fontSize: 9 }}>Base / Reward</th>
                  <th>TVL</th>
                  <th style={{ fontSize: 9 }}>7D APY Δ</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: j === 0 ? 100 : j === 1 ? 80 : 60 }} /></td>
                    ))}
                  </tr>
                ))}

                {!loading && error && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--red)', padding: 24, fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>{error}</td></tr>
                )}

                {!loading && !error && filtered.slice(0, 50).map((pool, i) => {
                  const chainColor = CHAIN_COLORS[pool.chain] ?? '#888';
                  const risk = RISK_COLORS[pool.risk];
                  const apyDelta = pool.apyPct7D;

                  return (
                    <tr key={pool.pool} style={{ animation: `row-fade-in 0.3s ease-out ${i * 30}ms both` }}>
                      <td>
                        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 13 }}>{pool.projectDisplay}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text)' }}>
                          {pool.symbol}
                        </span>
                        {pool.stablecoin && (
                          <span style={{ marginLeft: 5, fontSize: 9, color: 'var(--green)', fontFamily: 'var(--font-space-mono), monospace' }}>STABLE</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          background: `${chainColor}22`, color: chainColor,
                          border: `1px solid ${chainColor}44`, borderRadius: 6,
                          padding: '2px 7px', fontSize: 10,
                          fontFamily: 'var(--font-space-mono), monospace', fontWeight: 700,
                        }}>{pool.chain}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>
                          {pool.apy.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
                        {pool.apyBase.toFixed(2)}% {pool.apyReward > 0 ? `+ ${pool.apyReward.toFixed(2)}%` : ''}
                      </td>
                      <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-mid)' }}>
                        {fmtTvl(pool.tvlUsd)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11 }}>
                        {apyDelta !== null ? (
                          <span style={{ color: apyDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {apyDelta >= 0 ? '+' : ''}{apyDelta.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span style={{
                          background: risk.bg, border: `1px solid ${risk.border}`,
                          color: risk.text, borderRadius: 6, padding: '2px 7px',
                          fontFamily: 'var(--font-space-mono), monospace', fontSize: 9,
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                        }}>{pool.risk}</span>
                      </td>
                    </tr>
                  );
                })}

                {!loading && !error && filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32, fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>
                    No pools match your filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 50 && (
            <div style={{ padding: '12px 20px', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
              Showing top 50 of {filtered.length} pools · Adjust filters to narrow results
            </div>
          )}
        </div>

        <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 0 }}>
          Data from DeFiLlama · Updated hourly · APY is variable and historical — not a guarantee of future returns · Not financial advice
        </div>
      </div>
      <Footer />
    </ErrorBoundary>
  );
}
