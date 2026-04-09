'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { WalletHolding } from '@/types';
import { fmt } from '@/lib/formatters';

const PALETTE = ['#00e5a0', '#627eea', '#14f195', '#2b61f6', '#ff007a', '#b6509e', '#6f4cff', '#8247e5', '#ffc107', '#00b8ff'];

interface Props {
  holdings: WalletHolding[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, fontWeight: 700 }}>{d.name}</div>
        <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--green)' }}>{fmt(d.value)}</div>
        <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>{d.payload.pct}%</div>
      </div>
    );
  }
  return null;
}

export default function PortfolioChart({ holdings }: Props) {
  const total = holdings.reduce((s, h) => s + (h.usdValue ?? 0), 0);
  const data = holdings
    .filter(h => (h.usdValue ?? 0) > 0)
    .map(h => ({
      name: h.symbol,
      value: h.usdValue ?? 0,
      pct: total > 0 ? ((h.usdValue ?? 0) / total * 100).toFixed(1) : '0',
    }));

  return (
    <div className="panel">
      <div className="panel-header">Portfolio Allocation</div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry) => {
              const d = entry.payload as { pct: string };
              return (
                <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-mid)' }}>
                  {value} <span style={{ color: 'var(--text-dim)' }}>{d.pct}%</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
