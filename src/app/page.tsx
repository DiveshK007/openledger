'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TickerBar from '@/components/TickerBar';
import StatCard from '@/components/StatCard';
import WhaleAlerts from '@/components/WhaleAlerts';
import CoinTable from '@/components/CoinTable';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchMarkets, fetchGlobalStats, fetchFearGreed } from '@/lib/api';
import { CoinMarket, GlobalStats, FearGreedData } from '@/types';
import { fmt, pct } from '@/lib/formatters';

const PriceChart = dynamic(() => import('@/components/PriceChart'), { ssr: false });

// Animated number that counts up from 0 on first load
function AnimatedStat({ raw, formatter }: { raw: number; formatter: (n: number) => string }) {
  const [display, setDisplay] = useState('—');
  const animatedRef = useRef(false);

  useEffect(() => {
    if (raw === 0 || animatedRef.current) return;
    animatedRef.current = true;

    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(formatter(raw * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(formatter(raw));
    };

    requestAnimationFrame(tick);
  }, [raw, formatter]);

  return <>{display}</>;
}

// Bloomberg comparison strip
function ComparisonStrip() {
  const rows = [
    {
      feature: 'Monthly Cost',
      bloomberg: '$2,000',
      nansen: '$150',
      openledger: 'FREE',
      openledgerStyle: { color: 'var(--green)', fontWeight: 700 },
      bloombergStyle: { color: 'var(--red)' },
      nansenStyle: { color: '#ff9f43' },
    },
    {
      feature: 'AI Analysis',
      bloomberg: '✗',
      nansen: '✗',
      openledger: '✓',
      openledgerStyle: { color: 'var(--green)' },
      bloombergStyle: { color: 'var(--red)' },
      nansenStyle: { color: 'var(--red)' },
    },
    {
      feature: 'Whale Alerts',
      bloomberg: '✓',
      nansen: '✓',
      openledger: '✓',
      openledgerStyle: { color: 'var(--green)' },
      bloombergStyle: { color: 'var(--text-mid)' },
      nansenStyle: { color: 'var(--text-mid)' },
    },
    {
      feature: 'No Paywall',
      bloomberg: '✗',
      nansen: '✗',
      openledger: '✓',
      openledgerStyle: { color: 'var(--green)' },
      bloombergStyle: { color: 'var(--red)' },
      nansenStyle: { color: 'var(--red)' },
    },
    {
      feature: 'Portfolio Tracker',
      bloomberg: '✓',
      nansen: '✓',
      openledger: '✓',
      openledgerStyle: { color: 'var(--green)' },
      bloombergStyle: { color: 'var(--text-mid)' },
      nansenStyle: { color: 'var(--text-mid)' },
    },
  ];

  const cell: React.CSSProperties = {
    fontFamily: 'var(--font-space-mono), monospace',
    fontSize: 12,
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
    textAlign: 'center' as const,
    verticalAlign: 'middle',
  };

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.1fr', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '12px 16px', fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Feature</div>
        <div style={{ padding: '12px 16px', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', letterSpacing: '0.5px' }}>Bloomberg</div>
        <div style={{ padding: '12px 16px', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', letterSpacing: '0.5px' }}>Nansen</div>
        <div style={{ padding: '12px 16px', fontFamily: 'var(--font-syne), sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--green)', textAlign: 'center', letterSpacing: '0.5px' }}>
          OpenLedger ✓
        </div>
      </div>
      {rows.map(row => (
        <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.1fr' }}>
          <div style={{ ...cell, textAlign: 'left', color: 'var(--text-mid)' }}>{row.feature}</div>
          <div style={{ ...cell, ...row.bloombergStyle }}>{row.bloomberg}</div>
          <div style={{ ...cell, ...row.nansenStyle }}>{row.nansen}</div>
          <div style={{ ...cell, background: 'rgba(0,229,160,0.04)', ...row.openledgerStyle }}>{row.openledger}</div>
        </div>
      ))}
    </div>
  );
}

export default function MarketsPage() {
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [c, g, fg] = await Promise.all([fetchMarkets(), fetchGlobalStats(), fetchFearGreed()]);
        if (cancelled) return;
        setCoins(Array.isArray(c) ? c : []);
        setGlobal(g);
        setFearGreed(fg);
        // Signal header that data refreshed
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('market-refresh'));
        }
      } catch {
        // state stays as default
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const topGainer = coins.reduce<CoinMarket | null>((best, c) => {
    const p = c.price_change_percentage_24h ?? -Infinity;
    const bp = best?.price_change_percentage_24h ?? -Infinity;
    return p > bp ? c : best;
  }, null);

  const marketCapRaw = global?.total_market_cap_usd ?? 0;
  const volumeRaw = global?.total_volume_usd ?? 0;

  return (
    <ErrorBoundary>
      <Header />
      <TickerBar coins={coins} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(0,229,160,0.04) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '56px 20px 48px',
        textAlign: 'center',
      }}>
        <div className="scanline-overlay" />
        <div style={{
          maxWidth: 800,
          margin: '0 auto',
          position: 'relative',
          animation: 'hero-fade-in 0.7s ease-out forwards',
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,229,160,0.08)',
            border: '1px solid rgba(0,229,160,0.2)',
            borderRadius: 20,
            padding: '4px 14px',
            fontFamily: 'var(--font-space-mono), monospace',
            fontSize: 10,
            color: 'var(--green)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Free Alternative to Bloomberg · Nansen · Glassnode
          </div>
          <h1 style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(28px, 5vw, 56px)',
            color: 'var(--text)',
            lineHeight: 1.1,
            marginBottom: 18,
            letterSpacing: '-1px',
          }}>
            Financial Intelligence.{' '}
            <span style={{ color: 'var(--green)' }}>Zero Paywall.</span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-space-mono), monospace',
            fontSize: 14,
            color: 'var(--text-mid)',
            lineHeight: 1.8,
            marginBottom: 32,
            maxWidth: 560,
            margin: '0 auto 32px',
          }}>
            Real-time crypto data. AI-powered analysis.{' '}
            Built to replace{' '}
            <span style={{ color: 'var(--yellow)' }}>$24,000/yr Bloomberg</span> subscriptions.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#markets" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--green)', color: 'var(--bg)',
              borderRadius: 8, padding: '12px 24px',
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}>View Markets →</a>
            <Link href="/analyst" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,184,255,0.12)', border: '1px solid rgba(0,184,255,0.3)',
              color: 'var(--blue)', borderRadius: 8, padding: '12px 24px',
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}>⚡ Ask AI Analyst →</Link>
          </div>
        </div>
      </div>

      {/* ── Comparison strip ────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            vs. the alternatives
          </div>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>
        <ComparisonStrip />
      </div>

      {/* ── Market Data ──────────────────────────────────────── */}
      <div id="markets" className="main-grid">
        <div className="stat-row">
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, var(--blue), transparent)' }} />
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 10 }}>Total Market Cap</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {loading ? '—' : <AnimatedStat raw={marketCapRaw} formatter={n => fmt(n, 2)} />}
            </div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              {loading ? 'Loading...' : pct(global?.market_cap_change_24h ?? 0) + ' (24h)'}
            </div>
          </div>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, var(--green), transparent)' }} />
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 10 }}>24h Volume</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {loading ? '—' : <AnimatedStat raw={volumeRaw} formatter={n => fmt(n, 2)} />}
            </div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Global trading volume</div>
          </div>
          <StatCard
            label="Fear & Greed"
            value={fearGreed ? `${fearGreed.value} — ${fearGreed.classification}` : '—'}
            sub="Market sentiment index"
            accentColor={fearGreed ? (fearGreed.value < 30 ? 'red' : fearGreed.value < 60 ? 'yellow' : 'green') : 'yellow'}
          />
          <StatCard
            label="Top Gainer 24h"
            value={topGainer ? (topGainer.symbol ?? '').toUpperCase() : '—'}
            sub={topGainer ? pct(topGainer.price_change_percentage_24h ?? 0) : 'Loading...'}
            accentColor="green"
          />
        </div>

        <div className="content-row">
          <PriceChart coins={coins} />
          <WhaleAlerts />
        </div>

        <CoinTable coins={coins} loading={loading} />
      </div>
      <Footer />
    </ErrorBoundary>
  );
}
