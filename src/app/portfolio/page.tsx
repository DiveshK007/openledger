'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TickerBar from '@/components/TickerBar';
import WalletTracker from '@/components/WalletTracker';
import ErrorBoundary from '@/components/ErrorBoundary';
import { WalletHolding } from '@/types';
import { fmt, pct } from '@/lib/formatters';

const PortfolioChart = dynamic(() => import('@/components/PortfolioChart'), { ssr: false });

type SortKey = 'value' | 'change' | 'allocation';

interface PortfolioResult {
  holdings: WalletHolding[];
  totalValue: number;
  pnl24h: number | null;
  pricedCount: number;
  totalCount: number;
  chain: string;
}

// ── Token color badge ─────────────────────────────────────────────────────

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#ffc107', WBTC: '#ffc107',
  ETH: '#627eea', WETH: '#627eea', STETH: '#627eea', RETH: '#627eea',
  SOL: '#14f195', WSOL: '#14f195',
  USDT: '#26a17b', USDC: '#2775ca', DAI: '#f5a623', FRAX: '#000',
  LINK: '#2b61f6', UNI: '#ff007a', AAVE: '#b6509e',
  COMP: '#00d395', MKR: '#1aaa6b', SNX: '#00d1ff',
  CRV: '#3a3a3a', CVX: '#3a3a3a', BAL: '#1e1e1e',
  SUSHI: '#fa52a0', GRT: '#6f4cff', LDO: '#f08080',
  ARB: '#2d374b', OP: '#ff0420', MATIC: '#8247e5', POL: '#8247e5',
  SHIB: '#ff6600', PEPE: '#3cb371',
  APE: '#0055ff', ENS: '#5284ff',
  RAY: '#c28df8', BONK: '#f5a623', JUP: '#00bcd4',
  WIF: '#c8a97e', PYTH: '#8b5cf6', JTO: '#14b8a6',
};

function TokenBadge({ symbol }: { symbol: string }) {
  const color = TOKEN_COLORS[symbol] ?? '#5a7090';
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-space-mono), monospace',
      fontWeight: 700, fontSize: symbol.length > 4 ? 7 : 9,
      color,
    }}>
      {symbol.slice(0, 4)}
    </div>
  );
}

// ── Holdings table ────────────────────────────────────────────────────────

function HoldingsTable({
  holdings, totalValue, sort, setSort,
}: {
  holdings: WalletHolding[];
  totalValue: number;
  sort: SortKey;
  setSort: (k: SortKey) => void;
}) {
  const priced = holdings.filter(h => h.usdValue != null);
  const unpriced = holdings.filter(h => h.usdValue == null);

  const sorted = [...priced].sort((a, b) => {
    if (sort === 'value')      return (b.usdValue ?? 0) - (a.usdValue ?? 0);
    if (sort === 'change')     return (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity);
    if (sort === 'allocation') return (b.allocation ?? 0) - (a.allocation ?? 0);
    return 0;
  });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSort(k)}
      style={{
        background: sort === k ? 'rgba(0,229,160,0.1)' : 'transparent',
        border: `1px solid ${sort === k ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
        borderRadius: 6, padding: '4px 10px',
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 9, color: sort === k ? 'var(--green)' : 'var(--text-dim)',
        cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase',
        transition: 'all 0.15s',
      }}
    >
      {sort === k ? '↓ ' : ''}{label}
    </button>
  );

  const explorerUrl = (h: WalletHolding) => {
    if (!h.tokenAddress) return null;
    if (h.chain === 'solana') return `https://solscan.io/token/${h.tokenAddress}`;
    return `https://etherscan.io/token/${h.tokenAddress}`;
  };

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
          Holdings · {priced.length} assets
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <SortBtn k="value" label="Value" />
          <SortBtn k="change" label="24h %" />
          <SortBtn k="allocation" label="Allocation" />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>Asset</th>
              <th style={{ textAlign: 'right' }}>Balance</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Value</th>
              <th style={{ textAlign: 'right' }}>24h</th>
              <th style={{ textAlign: 'right' }}>Allocation</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, i) => {
              const pos = (h.change24h ?? 0) >= 0;
              const alloc = h.allocation ?? 0;
              const link = explorerUrl(h);
              return (
                <tr key={`${h.symbol}-${i}`} style={{ animation: `row-fade-in 0.2s ease-out ${i * 0.03}s both` }}>
                  <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
                    {i + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <TokenBadge symbol={h.symbol} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 13 }}>{h.name}</div>
                        <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>{h.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-mid)' }}>
                    {h.balance >= 1
                      ? h.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })
                      : h.balance.toFixed(6)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-mid)' }}>
                    {h.priceUsd != null
                      ? h.priceUsd >= 1
                        ? `$${h.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : `$${h.priceUsd.toFixed(6)}`
                      : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-space-mono), monospace', fontSize: 13, fontWeight: 700 }}>
                    {fmt(h.usdValue ?? 0)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: pos ? 'var(--green)' : 'var(--red)' }}>
                    {h.change24h != null ? pct(h.change24h) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
                        {alloc.toFixed(1)}%
                      </span>
                      <div style={{ width: 48, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(alloc, 100)}%`, background: 'var(--green)', borderRadius: 2, transition: 'width 0.5s ease-out' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--blue)', textDecoration: 'none' }}
                        title={`View on ${h.chain === 'solana' ? 'Solscan' : 'Etherscan'}`}
                      >↗</a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unpriced tokens */}
      {unpriced.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px' }}>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>
            Unpriced tokens ({unpriced.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unpriced.map((h, i) => (
              <div key={`unp-${i}`} style={{
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 10,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px', color: 'var(--text-dim)',
              }}>
                {h.symbol} · {h.balance >= 1 ? h.balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : h.balance.toFixed(4)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)' }}>
          Prices via CoinGecko · Balances via Etherscan / Solana RPC
        </span>
        <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)' }}>
          Total: {fmt(totalValue)}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [sort, setSort] = useState<SortKey>('value');

  const holdings = result?.holdings ?? [];

  return (
    <ErrorBoundary>
      <Header />
      <TickerBar coins={[]} />
      <div className="main-grid">

        <WalletTracker onResult={setResult} />

        {holdings.length > 0 && (
          <>
            {/* Chart + holdings table side by side */}
            <div className="content-row">
              <PortfolioChart holdings={holdings} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Top 3 by allocation */}
                {[...holdings]
                  .filter(h => h.usdValue != null)
                  .sort((a, b) => (b.allocation ?? 0) - (a.allocation ?? 0))
                  .slice(0, 3)
                  .map((h, i) => {
                    const pos = (h.change24h ?? 0) >= 0;
                    return (
                      <div key={i} style={{
                        background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px',
                        borderLeft: `3px solid ${TOKEN_COLORS[h.symbol] ?? 'var(--green)'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13 }}>{h.symbol}</div>
                          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: pos ? 'var(--green)' : 'var(--red)' }}>
                            {h.change24h != null ? pct(h.change24h) : '—'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                            {fmt(h.usdValue ?? 0)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
                            {(h.allocation ?? 0).toFixed(1)}% of portfolio
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <HoldingsTable
              holdings={holdings}
              totalValue={result?.totalValue ?? 0}
              sort={sort}
              setSort={setSort}
            />
          </>
        )}

        {/* Empty state */}
        {holdings.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>💼</div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
              No wallet loaded
            </div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8 }}>
              Paste any Ethereum or Solana address above,<br />or load the demo wallet to preview.
            </div>
          </div>
        )}

      </div>
      <Footer />
    </ErrorBoundary>
  );
}
