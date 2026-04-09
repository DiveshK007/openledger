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

const TOAST_QUEUE: Array<{ text: string }> = [
  { text: '🐋 New Alert: 1,200 BTC ($118.4M) moved to Coinbase' },
  { text: '🐋 New Alert: 24,500 ETH ($58.2M) outflow from Binance' },
  { text: '🐋 New Alert: 380,000 SOL ($31.5M) large transfer detected' },
  { text: '🐋 New Alert: 890 BTC ($87.7M) deposited to Kraken' },
  { text: '🐋 New Alert: 2.1M LINK ($26.8M) moved by Jump Trading' },
];

function shuffleWithBias(defs: WhaleAlertDef[]): WhaleAlertDef[] {
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

  // Toast state
  const [toast, setToast] = useState<{ text: string; visible: boolean }>({ text: '', visible: false });
  const toastIndexRef = { current: 0 };

  const showToast = (idx: number) => {
    const item = TOAST_QUEUE[idx % TOAST_QUEUE.length];
    setToast({ text: item.text, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
  };

  useEffect(() => {
    setMounted(true);
    setNewestId(WHALE_ALERT_DEFS[0].id);
    const clearFlash = setTimeout(() => setNewestId(null), 3000);

    // Initial toast after 8s
    const toastTimer = setTimeout(() => showToast(0), 8000);
    let toastIdx = 1;

    // Auto-refresh every 60s
    const refreshId = setInterval(() => {
      setDefs(prev => {
        const shuffled = shuffleWithBias(prev);
        return [{ ...shuffled[0], minsAgo: 1 }, ...shuffled.slice(1)];
      });
      setNewestId(defs[0]?.id ?? null);
      setTick(t => t + 1);
      setTimeout(() => setNewestId(null), 3000);
    }, 60000);

    // Toast every 45s
    const toastInterval = setInterval(() => {
      showToast(toastIdx++);
    }, 45000);

    // Tick every 30s for timeAgo
    const tickId = setInterval(() => setTick(t => t + 1), 30000);

    return () => {
      clearTimeout(clearFlash);
      clearTimeout(toastTimer);
      clearInterval(refreshId);
      clearInterval(toastInterval);
      clearInterval(tickId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = showAll ? defs : defs.slice(0, 5);

  return (
    <>
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
          {visible.map((alert, alertIdx) => {
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
                transition: 'background 0.4s',
                background: isNew ? 'rgba(0,229,160,0.06)' : 'transparent',
                animation: isNew ? 'whale-flash 3s ease-out forwards' : 'none',
                borderLeft: isNew ? '3px solid var(--green)' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(isNew || alertIdx === 0) && (
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
                        animation: 'whale-new-badge 3s ease-out forwards',
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

      {/* Whale toast notification */}
      {toast.visible && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--green)',
          borderRadius: '0 10px 10px 0',
          padding: '14px 18px',
          minWidth: 300,
          maxWidth: 380,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          animation: 'toast-in 0.3s ease-out forwards',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 5 }}>
                ⚡ Live Alert
              </div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                {toast.text}
              </div>
            </div>
            <button
              onClick={() => setToast(prev => ({ ...prev, visible: false }))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: 14,
                cursor: 'pointer',
                padding: '0 2px',
                flexShrink: 0,
                lineHeight: 1,
                letterSpacing: 0,
                textTransform: 'none',
              }}
            >✕</button>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 10, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--green)', animation: 'toast-progress 5s linear forwards' }} />
          </div>
        </div>
      )}
    </>
  );
}
