'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchCoinChart } from '@/lib/api';
import { fmt, pct } from '@/lib/formatters';

const TABS = [
  { id: 'bitcoin',   label: 'BTC' },
  { id: 'ethereum',  label: 'ETH' },
  { id: 'solana',    label: 'SOL' },
  { id: 'chainlink', label: 'LINK' },
];

interface Props {
  coins: Array<{ id: string; current_price: number; price_change_percentage_24h: number }>;
}

const DAY_LABELS = ['7d ago', '6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 12,
      }}>
        <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--text)', fontWeight: 700 }}>{fmt(payload[0].value)}</div>
      </div>
    );
  }
  return null;
}

export default function PriceChart({ coins }: Props) {
  const [selectedId, setSelectedId] = useState('bitcoin');
  const [chartData, setChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const coin = coins.find(c => c.id === selectedId);
  const positive = (coin?.price_change_percentage_24h ?? 0) >= 0;
  const strokeColor = positive ? 'var(--green)' : 'var(--red)';
  const fillId = positive ? 'greenFill' : 'redFill';

  useEffect(() => {
    setLoading(true);
    fetchCoinChart(selectedId).then(data => {
      setChartData(data);
      setLoading(false);
    });
  }, [selectedId]);

  const data = chartData.map((price, i) => ({
    label: DAY_LABELS[i] ?? `Day ${i}`,
    price,
  }));

  return (
    <div className="panel" style={{ minHeight: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
            {fmt(coin?.current_price ?? 0)}
          </div>
          <div style={{
            fontFamily: 'var(--font-space-mono), monospace',
            fontSize: 12,
            color: positive ? 'var(--green)' : 'var(--red)',
            marginTop: 2,
          }}>
            {pct(coin?.price_change_percentage_24h ?? 0)} (24h)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedId(tab.id)}
              style={{
                background: selectedId === tab.id ? 'var(--green-dim)' : 'var(--bg3)',
                color: selectedId === tab.id ? 'var(--green)' : 'var(--text-mid)',
                border: selectedId === tab.id ? '1px solid rgba(0,229,160,0.3)' : '1px solid var(--border)',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: selectedId === tab.id ? 700 : 400,
              }}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--red)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} fill={`url(#${fillId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 8 }}>
        7-Day Price Chart
      </div>
    </div>
  );
}
