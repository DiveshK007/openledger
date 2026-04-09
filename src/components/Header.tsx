'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const NAV_TABS = [
  { label: 'Markets',       href: '/' },
  { label: 'Portfolio',     href: '/portfolio' },
  { label: 'Whales',        href: '/whales' },
  { label: '⚡ AI Analyst', href: '/analyst' },
  { label: 'Vision',        href: '/vision' },
];

export default function Header() {
  const pathname = usePathname();
  const [utc, setUtc] = useState('');
  const [logoPulsed, setLogoPulsed] = useState(false);
  const [secsSince, setSecsSince] = useState(0);
  const [refreshFlash, setRefreshFlash] = useState(false);
  const lastRefreshRef = useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtc(now.toUTCString().split(' ').slice(4, 5)[0] + ' UTC');
      setSecsSince(Math.floor((Date.now() - lastRefreshRef.current) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    const pt = setTimeout(() => setLogoPulsed(true), 500);

    const onRefresh = () => {
      lastRefreshRef.current = Date.now();
      setSecsSince(0);
      setRefreshFlash(true);
      setTimeout(() => setRefreshFlash(false), 800);
    };
    window.addEventListener('market-refresh', onRefresh);

    return () => {
      clearInterval(id);
      clearTimeout(pt);
      window.removeEventListener('market-refresh', onRefresh);
    };
  }, []);

  const updatedLabel = secsSince < 60
    ? `${secsSince}s ago`
    : secsSince < 3600
    ? `${Math.floor(secsSince / 60)}m ago`
    : 'just now';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(8,11,14,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 20px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--green-dim)',
            border: '1.5px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'var(--green)',
            fontFamily: 'var(--font-syne), sans-serif',
            animation: logoPulsed ? 'logo-pulse 1.8s ease-out 1 forwards' : 'none',
          }}>Σ</div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)', lineHeight: 1.1 }}>OpenLedger</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>Financial Intelligence</div>
          </div>
        </Link>

        {/* Nav — horizontally scrollable on mobile */}
        <nav className="header-nav">
          {NAV_TABS.map(tab => {
            const active = pathname === tab.href;
            const isAI = tab.href === '/analyst';
            const isVision = tab.href === '/vision';
            const tabColor = isAI ? 'var(--blue)' : isVision ? 'var(--yellow)' : 'var(--green)';
            return (
              <Link key={tab.href} href={tab.href} style={{
                padding: '6px 16px',
                borderRadius: 8,
                fontFamily: 'var(--font-syne), sans-serif',
                fontWeight: active ? 700 : 400,
                fontSize: 13,
                color: active ? tabColor : isAI ? 'var(--blue)' : isVision ? 'rgba(255,211,42,0.7)' : 'var(--text-mid)',
                background: active ? (isAI ? 'rgba(0,184,255,0.12)' : isVision ? 'rgba(255,211,42,0.08)' : 'var(--green-dim)') : 'transparent',
                border: active ? `1px solid ${isAI ? 'rgba(0,184,255,0.3)' : isVision ? 'rgba(255,211,42,0.3)' : 'rgba(0,229,160,0.3)'}` : '1px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: last updated + live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span suppressHydrationWarning className="header-clock" style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)' }}>{utc}</span>
          <span suppressHydrationWarning style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            Updated {updatedLabel}
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)',
            borderRadius: 20, padding: '4px 10px',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              animation: refreshFlash ? 'live-flash 0.8s ease-out forwards' : 'pulse-dot 2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--green)', letterSpacing: '1px', textTransform: 'uppercase' }}>Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
