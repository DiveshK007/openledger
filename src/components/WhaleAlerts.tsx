'use client';

import { useEffect, useState } from 'react';
import { MOCK_WHALE_ALERTS, COIN_BADGE_COLORS } from '@/lib/constants';
import { timeAgo } from '@/lib/formatters';

interface Props {
  showAll?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  'transfer':         'var(--text-dim)',
  'exchange inflow':  'var(--red)',
  'exchange outflow': 'var(--green)',
};

export default function WhaleAlerts({ showAll = false }: Props) {
  const [mounted, setMounted] = useState(false);
  // Tick every 30s so timeAgo stays fresh
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const alerts = showAll ? MOCK_WHALE_ALERTS : MOCK_WHALE_ALERTS.slice(0, 5);

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
          Whale Alerts
        </span>
        <span style={{
          background: 'rgba(255,211,42,0.12)',
          color: 'var(--yellow)',
          border: '1px solid rgba(255,211,42,0.3)',
          borderRadius: 10,
          padding: '2px 8px',
          fontSize: 9,
          fontFamily: 'var(--font-space-mono), monospace',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}>Live</span>
      </div>

      <div>
        {alerts.map(alert => {
          const badgeColor = COIN_BADGE_COLORS[alert.coin] ?? '#888';
          return (
            <div key={alert.id} style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: `${badgeColor}22`,
                    color: badgeColor,
                    border: `1px solid ${badgeColor}44`,
                    borderRadius: 6,
                    padding: '2px 7px',
                    fontSize: 10,
                    fontFamily: 'var(--font-space-mono), monospace',
                    fontWeight: 700,
                  }}>{alert.coin}</span>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-space-mono), monospace',
                    color: TYPE_COLORS[alert.type] ?? 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>{alert.type}</span>
                </div>
                {/* suppressHydrationWarning prevents React mismatch error for time-ago values */}
                <span suppressHydrationWarning style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
                  {mounted ? timeAgo(alert.timestamp) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  {alert.amount}
                </span>
                <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--green)' }}>
                  {alert.usdValue}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
                {alert.from} → {alert.to}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
