'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const NAV_TABS = [
  { label: 'Markets',       href: '/',          emoji: '📊' },
  { label: 'Portfolio',     href: '/portfolio', emoji: '💼' },
  { label: 'Whales',        href: '/whales',    emoji: '🐋' },
  { label: 'Yields',        href: '/yield',     emoji: '💰' },
  { label: 'AI Analyst',    href: '/analyst',   emoji: '⚡' },
  { label: 'Vision',        href: '/vision',    emoji: '🔭' },
];

function tabColor(href: string, active: boolean) {
  if (href === '/analyst') return active ? 'var(--blue)'   : 'rgba(0,184,255,0.7)';
  if (href === '/vision')  return active ? 'var(--yellow)' : 'rgba(255,211,42,0.7)';
  if (href === '/yield')   return active ? 'var(--green)'  : 'rgba(0,229,160,0.7)';
  return active ? 'var(--green)' : 'var(--text-mid)';
}

function tabBg(href: string, active: boolean) {
  if (!active) return 'transparent';
  if (href === '/analyst') return 'rgba(0,184,255,0.12)';
  if (href === '/vision')  return 'rgba(255,211,42,0.08)';
  return 'var(--green-dim)';
}

function tabBorder(href: string, active: boolean) {
  if (!active) return '1px solid transparent';
  if (href === '/analyst') return '1px solid rgba(0,184,255,0.3)';
  if (href === '/vision')  return '1px solid rgba(255,211,42,0.3)';
  return '1px solid rgba(0,229,160,0.3)';
}

export default function Header() {
  const pathname = usePathname();
  const [utc, setUtc] = useState('');
  const [logoPulsed, setLogoPulsed] = useState(false);
  const [secsSince, setSecsSince] = useState(0);
  const [refreshFlash, setRefreshFlash] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastRefreshRef = useRef(Date.now());
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Clock + refresh tracking
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
    return () => { clearInterval(id); clearTimeout(pt); window.removeEventListener('market-refresh', onRefresh); };
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Escape key closes drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Body scroll lock when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Focus trap inside drawer
  useEffect(() => {
    if (!drawerOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [drawerOpen]);

  const updatedLabel = secsSince < 60
    ? `${secsSince}s ago`
    : secsSince < 3600
    ? `${Math.floor(secsSince / 60)}m ago`
    : 'just now';

  const LiveBadge = () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)',
      borderRadius: 20, padding: '4px 10px',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
        display: 'inline-block',
        animation: refreshFlash ? 'live-flash 0.8s ease-out forwards' : 'pulse-dot 2s ease-in-out infinite',
      }} />
      <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--green)', letterSpacing: '1px', textTransform: 'uppercase' }}>Live</span>
    </div>
  );

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,11,14,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 20px',
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--green-dim)', border: '1.5px solid var(--green)',
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

          {/* Desktop nav */}
          <nav className="header-nav" aria-label="Main navigation">
            {NAV_TABS.map(tab => {
              const active = pathname === tab.href;
              return (
                <Link key={tab.href} href={tab.href} style={{
                  padding: '6px 16px', borderRadius: 8,
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontWeight: active ? 700 : 400, fontSize: 13,
                  color: tabColor(tab.href, active),
                  background: tabBg(tab.href, active),
                  border: tabBorder(tab.href, active),
                  transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                }}
                  aria-current={active ? 'page' : undefined}
                >
                  {tab.emoji} {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop right: clock + updated + live */}
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span suppressHydrationWarning className="header-clock" style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)' }}>{utc}</span>
            <span suppressHydrationWarning className="header-updated" style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              Updated {updatedLabel}
            </span>
            <LiveBadge />
          </div>

          {/* Mobile: live badge + hamburger */}
          <div className="mobile-header-right" style={{ display: 'none', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <LiveBadge />
            <button
              ref={hamburgerRef}
              className="hamburger-btn"
              onClick={() => setDrawerOpen(o => !o)}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 5,
                width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
              }}
            >
              <span className={`ham-line ${drawerOpen ? 'ham-line-1-open' : ''}`} />
              <span className={`ham-line ${drawerOpen ? 'ham-line-2-open' : ''}`} />
              <span className={`ham-line ${drawerOpen ? 'ham-line-3-open' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'overlay-in 0.25s ease-out forwards',
          }}
        />
      )}

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(300px, 85vw)', zIndex: 300,
          background: 'var(--bg2)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: drawerOpen ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div style={{
          height: 64, padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Navigation</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>OpenLedger</div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, width: 36, height: 36,
              color: 'var(--text-mid)', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s, color 0.15s',
              letterSpacing: 0, textTransform: 'none', padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mid)'; }}
          >✕</button>
        </div>

        {/* Nav items */}
        <nav aria-label="Mobile navigation" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {NAV_TABS.map((tab, i) => {
            const active = pathname === tab.href;
            const color = tabColor(tab.href, active);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10, marginBottom: 4,
                  background: active ? tabBg(tab.href, true) : 'transparent',
                  border: active ? tabBorder(tab.href, true) : '1px solid transparent',
                  color, textDecoration: 'none',
                  transition: 'background 0.15s, border-color 0.15s',
                  animation: `row-fade-in 0.25s ease-out ${i * 0.04}s both`,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}}
              >
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{tab.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: active ? 700 : 500, fontSize: 15 }}>{tab.label}</div>
                </div>
                {active && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <LiveBadge />
            <span suppressHydrationWarning style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)' }}>
              Updated {updatedLabel}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.7 }}>
            Free Forever · No Paywall · Not financial advice
          </div>
        </div>
      </div>
    </>
  );
}
