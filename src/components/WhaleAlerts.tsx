'use client';

import { useEffect, useRef, useState } from 'react';
import { timeAgo } from '@/lib/formatters';

interface LiveAlert {
  id: string;
  chain: string;
  coin: string;
  amount: string;
  usdValue: string;
  usdValueNum: number;
  type: 'transfer' | 'exchange inflow' | 'exchange outflow';
  from: string;
  to: string;
  txHash?: string;
  minsAgo: number;
  source: string;
}

interface Props {
  showAll?: boolean;
}

const COIN_COLORS: Record<string, string> = {
  BTC: '#ffc107', ETH: '#627eea', SOL: '#14f195',
  USDT: '#26a17b', USDC: '#2775ca', LINK: '#2b61f6',
  UNI: '#ff007a', AAVE: '#b6509e', GRT: '#6f4cff', MATIC: '#8247e5',
};

const TYPE_COLORS: Record<string, string> = {
  'transfer':         'var(--text-dim)',
  'exchange inflow':  'var(--red)',
  'exchange outflow': 'var(--green)',
};

const TOAST_LIMIT = 5;

export default function WhaleAlerts({ showAll = false }: Props) {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [newestId, setNewestId] = useState<string | null>(null);
  const [sources, setSources] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ text: string; visible: boolean }>({ text: '', visible: false });
  const toastCountRef = useRef(0);
  const prevAlertsRef = useRef<Set<string>>(new Set());
  const [, setTick] = useState(0);

  const showToast = (text: string) => {
    setToast({ text, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 5000);
  };

  const loadAlerts = async (isRefresh = false) => {
    try {
      const res = await fetch('/api/whales', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const newAlerts: LiveAlert[] = data.alerts ?? [];
      setSources(data.sources ?? {});

      if (newAlerts.length > 0) {
        // Detect genuinely new alerts since last fetch
        const newIds = newAlerts.map(a => a.id);
        const brandNew = newIds.filter(id => !prevAlertsRef.current.has(id));

        if (isRefresh && brandNew.length > 0) {
          setNewestId(brandNew[0]);
          setTimeout(() => setNewestId(null), 4000);

          // Toast for new alert
          if (toastCountRef.current < TOAST_LIMIT) {
            const a = newAlerts.find(a => a.id === brandNew[0])!;
            showToast(`🐋 New Alert: ${a.amount} (${a.usdValue}) — ${a.from} → ${a.to}`);
            toastCountRef.current++;
          }
        } else if (!isRefresh && newAlerts.length > 0) {
          // Initial load — flash the most recent
          setNewestId(newAlerts[0].id);
          setTimeout(() => setNewestId(null), 3000);

          // Show first toast after 8s
          setTimeout(() => {
            if (newAlerts[0]) {
              showToast(`🐋 Alert: ${newAlerts[0].amount} (${newAlerts[0].usdValue}) moved on-chain`);
            }
          }, 8000);
        }

        prevAlertsRef.current = new Set(newIds);
        setAlerts(newAlerts);
      }
    } catch {
      // leave existing alerts in place
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadAlerts(false);

    const refreshId = setInterval(() => loadAlerts(true), 60_000);
    const tickId    = setInterval(() => setTick(t => t + 1), 30_000);

    return () => {
      clearInterval(refreshId);
      clearInterval(tickId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = showAll ? alerts : alerts.slice(0, 5);

  const sourceLabel = sources.whaleAlert
    ? 'Whale Alert API'
    : [sources.etherscan && 'Etherscan', sources.mempool && 'mempool.space']
        .filter(Boolean).join(' + ') || 'Loading…';

  return (
    <>
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
            Whale Alerts
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)' }}>
              {loading ? '…' : `${alerts.length} tracked · ${sourceLabel}`}
            </span>
            <span style={{
              background: 'rgba(255,211,42,0.12)', color: 'var(--yellow)',
              border: '1px solid rgba(255,211,42,0.3)', borderRadius: 10,
              padding: '2px 8px', fontSize: 9,
              fontFamily: 'var(--font-space-mono), monospace',
              letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700,
            }}>Live</span>
          </div>
        </div>

        {loading && (
          <div style={{ padding: '24px 20px', textAlign: 'center', fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)' }}>
            Fetching on-chain data…
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.8 }}>
              No whale alerts available.<br />
              Add <code style={{ color: 'var(--green)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>WHALE_ALERT_API_KEY</code> or{' '}
              <code style={{ color: 'var(--green)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>ETHERSCAN_API_KEY</code>{' '}
              to Vercel env vars.
            </div>
          </div>
        )}

        <div>
          {visible.map((alert, i) => {
            const badgeColor = COIN_COLORS[alert.coin] ?? '#888';
            const isNew = alert.id === newestId;
            const timestamp = new Date(Date.now() - alert.minsAgo * 60_000);

            return (
              <div
                key={alert.id}
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  transition: 'background 0.4s',
                  background: isNew ? 'rgba(0,229,160,0.06)' : 'transparent',
                  animation: isNew ? 'whale-flash 4s ease-out forwards' : 'none',
                  borderLeft: isNew ? '3px solid var(--green)' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {(isNew || i === 0) && (
                      <span style={{
                        background: 'var(--green)', color: 'var(--bg)',
                        borderRadius: 4, padding: '1px 5px', fontSize: 8,
                        fontFamily: 'var(--font-space-mono), monospace',
                        fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                      }}>NEW</span>
                    )}
                    <span style={{
                      background: `${badgeColor}22`, color: badgeColor,
                      border: `1px solid ${badgeColor}44`, borderRadius: 6,
                      padding: '2px 7px', fontSize: 10,
                      fontFamily: 'var(--font-space-mono), monospace', fontWeight: 700,
                    }}>{alert.coin}</span>
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--font-space-mono), monospace',
                      color: TYPE_COLORS[alert.type] ?? 'var(--text-dim)',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{alert.type}</span>
                    {alert.chain && alert.chain !== 'unknown' && (
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-space-mono), monospace', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        {alert.chain === 'bitcoin' ? '₿' : alert.chain === 'ethereum' ? 'Ξ' : alert.chain === 'solana' ? '◎' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {alert.txHash && (
                      <a
                        href={
                          alert.chain === 'bitcoin'
                            ? `https://mempool.space/tx/${alert.txHash}`
                            : alert.chain === 'solana'
                            ? `https://solscan.io/tx/${alert.txHash}`
                            : `https://etherscan.io/tx/${alert.txHash}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--blue)', textDecoration: 'none' }}
                      >
                        ↗ tx
                      </a>
                    )}
                    <span suppressHydrationWarning style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)' }}>
                      {mounted ? timeAgo(timestamp) : '—'}
                    </span>
                  </div>
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

      {/* Toast */}
      {toast.visible && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--green)',
          borderRadius: '0 10px 10px 0',
          padding: '14px 18px', minWidth: 300, maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          animation: 'toast-in 0.3s ease-out forwards',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 5 }}>
                ⚡ Live On-Chain Alert
              </div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                {toast.text}
              </div>
            </div>
            <button onClick={() => setToast(t => ({ ...t, visible: false }))} style={{
              background: 'transparent', border: 'none', color: 'var(--text-dim)',
              fontSize: 14, cursor: 'pointer', padding: '0 2px', flexShrink: 0,
              lineHeight: 1, letterSpacing: 0, textTransform: 'none',
            }}>✕</button>
          </div>
          <div style={{ marginTop: 10, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--green)', animation: 'toast-progress 5s linear forwards' }} />
          </div>
        </div>
      )}
    </>
  );
}
