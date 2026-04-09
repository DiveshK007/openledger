'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_TABS = [
  { label: 'Markets',   href: '/' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Whales',    href: '/whales' },
];

export default function Header() {
  const pathname = usePathname();
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtc(now.toUTCString().split(' ').slice(4, 5)[0] + ' UTC');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
        gap: 24,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--green-dim)',
            border: '1.5px solid var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,229,160,0.3)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--green)',
            fontFamily: 'var(--font-syne), sans-serif',
          }}>Σ</div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)', lineHeight: 1.1 }}>OpenLedger</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>Financial Intelligence</div>
          </div>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV_TABS.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} style={{
                padding: '6px 18px',
                borderRadius: 8,
                fontFamily: 'var(--font-syne), sans-serif',
                fontWeight: active ? 700 : 400,
                fontSize: 13,
                color: active ? 'var(--green)' : 'var(--text-mid)',
                background: active ? 'var(--green-dim)' : 'transparent',
                border: active ? '1px solid rgba(0,229,160,0.3)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: clock + live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)' }}>{utc}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 20, padding: '4px 10px' }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--green)', letterSpacing: '1px', textTransform: 'uppercase' }}>Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
