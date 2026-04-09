'use client';

import { FearGreedData } from '@/types';

interface Props {
  data: FearGreedData | null;
}

function getColor(value: number): string {
  if (value < 30) return 'var(--red)';
  if (value < 60) return 'var(--yellow)';
  return 'var(--green)';
}

export default function FearGauge({ data }: Props) {
  if (!data) {
    return (
      <div className="panel">
        <div className="panel-header">Fear &amp; Greed Index</div>
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    );
  }

  const color = getColor(data.value);
  const last7 = data.history.slice(0, 7).reverse();

  return (
    <div className="panel">
      <div className="panel-header">Fear &amp; Greed Index</div>

      {/* Big number */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          fontFamily: 'var(--font-space-mono), monospace',
          fontSize: 56,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}>{data.value}</div>
        <div style={{
          fontFamily: 'var(--font-syne), sans-serif',
          fontWeight: 600,
          fontSize: 14,
          color,
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>{data.classification}</div>
      </div>

      {/* Gradient bar */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{
          height: 8,
          borderRadius: 4,
          background: 'linear-gradient(to right, var(--red), var(--yellow), var(--green))',
        }} />
        <div style={{
          position: 'absolute',
          top: -3,
          left: `calc(${data.value}% - 7px)`,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#fff',
          border: '2px solid var(--bg2)',
          boxShadow: `0 0 6px ${color}`,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--red)' }}>FEAR</span>
          <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)' }}>NEUTRAL</span>
          <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--green)' }}>GREED</span>
        </div>
      </div>

      {/* 7-day history */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>
          7-Day History
        </div>
        {last7.map((d, i) => {
          const c = getColor(d.value);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', width: 50, flexShrink: 0 }}>
                {i === last7.length - 1 ? 'Today' : `${last7.length - 1 - i}d ago`}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg3)', overflow: 'hidden' }}>
                <div style={{ width: `${d.value}%`, height: '100%', background: c, borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: c, width: 24, textAlign: 'right' }}>{d.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
