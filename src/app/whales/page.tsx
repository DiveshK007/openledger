'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import TickerBar from '@/components/TickerBar';
import StatCard from '@/components/StatCard';
import WhaleAlerts from '@/components/WhaleAlerts';
import FearGauge from '@/components/FearGauge';
import { fetchFearGreed, fetchTopProtocols } from '@/lib/api';
import { FearGreedData, Protocol } from '@/types';
import { fmt, pct } from '@/lib/formatters';
import { MOCK_WHALE_ALERTS } from '@/lib/constants';

function TopProtocols({ protocols }: { protocols: Protocol[] }) {
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
              <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, fontWeight: 700 }}>{fmt(p.tvl, 1)}</td>
              <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: p.change_1d >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {pct(p.change_1d)}
              </td>
              <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WhalesPage() {
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    Promise.all([fetchFearGreed(), fetchTopProtocols()]).then(([fg, p]) => {
      setFearGreed(fg);
      setProtocols(p);
    });
  }, []);

  // Compute whale stats from mock data
  const transfers = MOCK_WHALE_ALERTS.filter(a => a.type === 'transfer');
  const inflows = MOCK_WHALE_ALERTS.filter(a => a.type === 'exchange inflow');
  const outflows = MOCK_WHALE_ALERTS.filter(a => a.type === 'exchange outflow');

  return (
    <>
      <Header />
      <TickerBar coins={[]} />
      <div className="main-grid">
        <div className="stat-row">
          <StatCard label="Largest Tx 24h" value="$118.4M" sub="1,200 BTC Transfer" accentColor="yellow" />
          <StatCard label="Total Whale Vol" value="$403.3M" sub={`${MOCK_WHALE_ALERTS.length} transactions`} accentColor="blue" />
          <StatCard label="Exchange Inflows" value={`${inflows.length} txs`} sub="Potential sell pressure" accentColor="red" />
          <StatCard label="Exchange Outflows" value={`${outflows.length} txs`} sub="Potential accumulation" accentColor="green" />
        </div>

        <div className="content-row">
          <WhaleAlerts showAll={true} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FearGauge data={fearGreed} />
            <TopProtocols protocols={protocols} />
          </div>
        </div>
      </div>
    </>
  );
}
