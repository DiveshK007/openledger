'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TickerBar from '@/components/TickerBar';
import StatCard from '@/components/StatCard';
import WhaleAlerts from '@/components/WhaleAlerts';
import FearGauge from '@/components/FearGauge';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchFearGreed, fetchTopProtocols } from '@/lib/api';
import { FearGreedData, Protocol } from '@/types';
import { fmt, pct } from '@/lib/formatters';

function TopProtocols({ protocols }: { protocols: Protocol[] }) {
  if (!protocols.length) return null;
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 0', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
        Top DeFi Protocols (TVL)
      </div>
      <table>
        <thead>
          <tr>
            <th>Protocol</th>
            <th>TVL</th>
            <th>1d %</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {protocols.slice(0, 5).map(p => (
            <tr key={p.name}>
              <td style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 13 }}>{p.name}</td>
              <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, fontWeight: 700 }}>{fmt(p.tvl ?? 0, 1)}</td>
              <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: (p.change_1d ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {pct(p.change_1d ?? 0)}
              </td>
              <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface WhaleStats {
  largestTxUsd: string;
  largestTxDesc: string;
  totalVolUsd: string;
  txCount: number;
  inflows: number;
  outflows: number;
}

export default function WhalesPage() {
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [stats, setStats] = useState<WhaleStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Fetch fear/greed + protocols
    Promise.all([fetchFearGreed(), fetchTopProtocols()])
      .then(([fg, p]) => {
        if (cancelled) return;
        setFearGreed(fg);
        setProtocols(Array.isArray(p) ? p : []);
      })
      .catch(() => {});

    // Fetch whale stats
    fetch('/api/whales')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const alerts: any[] = data.alerts ?? [];
        if (!alerts.length) return;

        const largest = alerts.reduce((best: any, a: any) =>
          a.usdValueNum > (best?.usdValueNum ?? 0) ? a : best, null);
        const totalVol = alerts.reduce((sum: number, a: any) => sum + (a.usdValueNum ?? 0), 0);
        const inflows  = alerts.filter((a: any) => a.type === 'exchange inflow').length;
        const outflows = alerts.filter((a: any) => a.type === 'exchange outflow').length;

        const fmtUsd = (n: number) => {
          if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
          if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
          if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
          return `$${n.toFixed(0)}`;
        };

        setStats({
          largestTxUsd: largest ? fmtUsd(largest.usdValueNum) : '—',
          largestTxDesc: largest ? `${largest.amount} ${largest.type}` : '—',
          totalVolUsd: fmtUsd(totalVol),
          txCount: alerts.length,
          inflows,
          outflows,
        });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return (
    <ErrorBoundary>
      <Header />
      <TickerBar coins={[]} />
      <div className="main-grid">
        <div className="stat-row">
          <StatCard
            label="Largest Tx"
            value={stats?.largestTxUsd ?? '—'}
            sub={stats?.largestTxDesc ?? 'Loading live data…'}
            accentColor="yellow"
          />
          <StatCard
            label="Total Whale Vol"
            value={stats?.totalVolUsd ?? '—'}
            sub={stats ? `${stats.txCount} transactions tracked` : 'Loading…'}
            accentColor="blue"
          />
          <StatCard
            label="Exchange Inflows"
            value={stats ? `${stats.inflows} txs` : '—'}
            sub="Potential sell pressure"
            accentColor="red"
          />
          <StatCard
            label="Exchange Outflows"
            value={stats ? `${stats.outflows} txs` : '—'}
            sub="Potential accumulation"
            accentColor="green"
          />
        </div>

        <div className="content-row">
          <WhaleAlerts showAll={true} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FearGauge data={fearGreed} />
            <TopProtocols protocols={protocols} />
          </div>
        </div>
      </div>
      <Footer />
    </ErrorBoundary>
  );
}
