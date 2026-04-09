'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
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
        // silently fall through — state stays as default
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const topGainer = coins.reduce<CoinMarket | null>((best, c) => {
    const pct24 = c.price_change_percentage_24h ?? -Infinity;
    const bestPct24 = best?.price_change_percentage_24h ?? -Infinity;
    return pct24 > bestPct24 ? c : best;
  }, null);

  return (
    <ErrorBoundary>
      <Header />
      <TickerBar coins={coins} />
      <div className="main-grid">
        <div className="stat-row">
          <StatCard
            label="Total Market Cap"
            value={fmt(global?.total_market_cap_usd ?? 0, 2)}
            sub={pct(global?.market_cap_change_24h ?? 0) + ' (24h)'}
            accentColor="blue"
          />
          <StatCard
            label="24h Volume"
            value={fmt(global?.total_volume_usd ?? 0, 2)}
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
            sub={topGainer ? pct(topGainer.price_change_percentage_24h ?? 0) : ''}
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
