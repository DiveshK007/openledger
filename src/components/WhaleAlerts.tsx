'use client';

import { useEffect, useState } from 'react';
import { WHALE_ALERT_DEFS, COIN_BADGE_COLORS, WhaleAlertDef } from '@/lib/constants';
import { timeAgo } from '@/lib/formatters';

interface Props {
  showAll?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  'transfer':         'var(--text-dim)',
  'exchange inflow':  'var(--red)',
  'exchange outflow': 'var(--green)',
};

function shuffleWithBias(defs: WhaleAlertDef[]): WhaleAlertDef[] {
  // Slightly shuffle the middle items, keep top 2 and last 2 stable
  const top = defs.slice(0, 2);
  const mid = [...defs.slice(2, -2)].sort(() => Math.random() - 0.52);
  const bot = defs.slice(-2);
  return [...top, ...mid, ...bot];
}

export default function WhaleAlerts({ showAll = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const [defs, setDefs] = useState<WhaleAlertDef[]>(WHALE_ALERT_DEFS);
  const [newestId, setNewestId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Flash the most recent item for 3s on load
    setNewestId(WHALE_ALERT_DEFS[0].id);
    const clearFlash = setTimeout(() => setNewestId(null), 3000);

    // Auto-refresh every 60s — shuffle order slightly, bump top item's time
    const refreshId = setInterval(() => {
      setDefs(prev => {
        const shuffled = shuffleWithBias(prev);
        // "New" first item gets a fresh 1-min-ago timestamp
        return [{ ...shuffled[0], minsAgo: 1 }, ...shuffled.slice(1)];
      });
      setNewestId(defs[0].id);
      setTick(t => t + 1);
      setTimeout(() => setNewestId(null), 3000);
    }, 60000);

    // Tick every 30s so timeAgo strings stay fresh
    const tickId = setInterval(() => setTick(t => t + 1), 30000);

    return () => {
      clearTimeout(clearFlash);
      clearInterval(refreshId);
      clearInterval(tickId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = showAll ? defs : defs.slice(0, 5);

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
          Whale Alerts
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)' }}>
            {defs.length} tracked
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
      </div>

      <div>
        {visible.map(alert => {
          const badgeColor = COIN_BADGE_COLORS[alert.coin] ?? '#888';
          const isNew = alert.id === newestId;
          const timestamp = new Date(Date.now() - alert.minsAgo * 60 * 1000);

          return (
            <div key={alert.id} style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              transition: 'background 0.3s',
              background: isNew ? 'rgba(0,229,160,0.06)' : 'transparent',
              animation: isNew ? 'whale-flash 3s ease-out forwards' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isNew && (
                    <span style={{
                      background: 'var(--green)',
                      color: 'var(--bg)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 8,
                      fontFamily: 'var(--font-space-mono), monospace',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}>NEW</span>
                  )}
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
                <span suppressHydrationWarning style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
                  {mounted ? timeAgo(timestamp) : '—'}
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
