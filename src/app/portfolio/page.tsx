'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TickerBar from '@/components/TickerBar';
import WalletTracker from '@/components/WalletTracker';
import ErrorBoundary from '@/components/ErrorBoundary';
import { WalletHolding } from '@/types';
import { MOCK_PORTFOLIO_HOLDINGS } from '@/lib/constants';
import { fmt, pct } from '@/lib/formatters';

const PortfolioChart = dynamic(() => import('@/components/PortfolioChart'), { ssr: false });

function HoldingsTable({ holdings }: { holdings: WalletHolding[] }) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 0', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
        Holdings
      </div>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Balance</th>
            <th>USD Value</th>
            <th>24h Change</th>
          </tr>
        </thead>
        <tbody>
          {(holdings ?? []).map(h => {
            const pos = (h.change24h ?? 0) >= 0;
            return (
              <tr key={h.symbol}>
                <td>
                  <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 14 }}>{h.name}</div>
                  <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{h.symbol}</div>
                </td>
                <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>{(h.balance ?? 0).toLocaleString()}</td>
                <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 13, fontWeight: 700 }}>{fmt(h.usdValue ?? 0)}</td>
                <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: pos ? 'var(--green)' : 'var(--red)' }}>
                  {h.change24h != null ? pct(h.change24h) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<WalletHolding[]>(MOCK_PORTFOLIO_HOLDINGS);

  return (
    <ErrorBoundary>
      <Header />
      <TickerBar coins={[]} />
      <div className="main-grid">
        <WalletTracker onHoldingsChange={setHoldings} />
        <div className="content-row">
          <PortfolioChart holdings={holdings} />
          <HoldingsTable holdings={holdings} />
        </div>
      </div>
      <Footer />
    </ErrorBoundary>
  );
}
