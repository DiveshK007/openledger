'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';
import TickerBar from '@/components/TickerBar';
import StatCard from '@/components/StatCard';
import WhaleAlerts from '@/components/WhaleAlerts';
import CoinTable from '@/components/CoinTable';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchMarkets, fetchGlobalStats, fetchFearGreed } from '@/lib/api';
import { CoinMarket, GlobalStats, FearGreedData } from '@/types';
import { fmt, pct } from '@/lib/formatters';

const PriceChart = dynamic(() => import('@/components/PriceChart'), { ssr: false });

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

  return (
    <ErrorBoundary>
      <Header />
      <TickerBar coins={coins} />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(0,229,160,0.04) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '56px 20px 48px',
        textAlign: 'center',
      }}>
        {/* Scanline overlay */}
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
            fontSize: 'clamp(32px, 5vw, 56px)',
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--green)',
              color: 'var(--bg)',
              borderRadius: 8,
              padding: '12px 24px',
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}>
              View Markets →
            </a>
            <Link href="/analyst" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,184,255,0.12)',
              border: '1px solid rgba(0,184,255,0.3)',
              color: 'var(--blue)',
              borderRadius: 8,
              padding: '12px 24px',
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}>
              ⚡ Ask AI Analyst →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Market Data ─────────────────────────────────────────── */}
      <div id="markets" className="main-grid">
        <div className="stat-row">
          <StatCard
            label="Total Market Cap"
            value={loading ? '—' : fmt(global?.total_market_cap_usd ?? 0, 2)}
            sub={loading ? 'Loading...' : pct(global?.market_cap_change_24h ?? 0) + ' (24h)'}
            accentColor="blue"
          />
          <StatCard
            label="24h Volume"
            value={loading ? '—' : fmt(global?.total_volume_usd ?? 0, 2)}
            sub="Global trading volume"
            accentColor="green"
          />
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
    </ErrorBoundary>
  );
}
