'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CoinMarket } from '@/types';
import { fmt, pct } from '@/lib/formatters';

const Sparkline = dynamic(() => import('./Sparkline'), { ssr: false });

interface Props {
  coins: CoinMarket[];
  loading: boolean;
}

const COIN_INSIGHTS: Record<string, string> = {
  bitcoin:          'Institutional accumulation ongoing — key support holding',
  ethereum:         'ETH consolidating above range — L2 activity at ATH',
  solana:           'Leading altcoins — DeFi TVL up 12% this week',
  chainlink:        'New oracle integrations driving demand',
  uniswap:          'Volume surging — fee switch proposal gaining traction',
  aave:             '$8B TVL providing strong fundamental floor',
  'the-graph':      'AI data indexing demand expanding fast',
  'matic-network':  'Watching for breakout above resistance level',
};

export default function CoinTable({ coins, loading }: Props) {
  const prevPricesRef = useRef<Record<string, number>>({});
  const firstLoadRef = useRef(false);
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({});
  const [animateRows, setAnimateRows] = useState(false);
  const [tooltip, setTooltip] = useState<{ coin: CoinMarket; x: number; y: number } | null>(null);

  // Detect first load — trigger row stagger animation
  useEffect(() => {
    if (!loading && coins.length > 0 && !firstLoadRef.current) {
      firstLoadRef.current = true;
      setAnimateRows(true);
      // Store initial prices
      coins.forEach(c => { prevPricesRef.current[c.id] = c.current_price ?? 0; });
    }
  }, [loading, coins]);

  // Detect price changes on subsequent refreshes — flash cells
  useEffect(() => {
    if (!firstLoadRef.current || coins.length === 0) return;
    const newFlash: Record<string, 'up' | 'down'> = {};
    coins.forEach(c => {
      const prev = prevPricesRef.current[c.id];
      const cur = c.current_price ?? 0;
      if (prev !== undefined && prev !== 0 && prev !== cur) {
        newFlash[c.id] = cur > prev ? 'up' : 'down';
      }
      prevPricesRef.current[c.id] = cur;
    });
    if (Object.keys(newFlash).length > 0) {
      setFlashMap(newFlash);
      // Signal header that data refreshed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('market-refresh'));
      }
      setTimeout(() => setFlashMap({}), 700);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins]);

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 0', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dim)' }}>
        Top Assets
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Asset</th>
              <th>Price</th>
              <th>24h %</th>
              <th>Mkt Cap</th>
              <th>Volume</th>
              <th style={{ width: 100 }}>7D Chart</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, width: j === 1 ? 120 : 60 }} /></td>
                  ))}
                </tr>
              ))
              : (coins ?? []).map((coin, idx) => {
                const price = coin.current_price ?? 0;
                const pos24 = (coin.price_change_percentage_24h ?? 0) >= 0;
                const pos7d = (coin.price_change_percentage_7d_in_currency ?? 0) >= 0;
                const flash = flashMap[coin.id];
                const sparkPrices = coin.sparkline_in_7d?.price ?? [];
                const high7d = sparkPrices.length ? Math.max(...sparkPrices) : null;
                const low7d = sparkPrices.length ? Math.min(...sparkPrices) : null;
                const change7d = coin.price_change_percentage_7d_in_currency ?? 0;
                const insight = COIN_INSIGHTS[coin.id] ?? 'Monitoring for signals';

                return (
                  <tr
                    key={coin.id}
                    style={{
                      animation: animateRows ? `row-fade-in 0.4s ease-out ${idx * 80}ms both` : 'none',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTooltip({ coin, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {coin.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coin.image} alt={coin.name} width={28} height={28} style={{ borderRadius: '50%' }} />
                        )}
                        <div>
                          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 14 }}>{coin.name}</div>
                          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-space-mono), monospace',
                          fontWeight: 700,
                          fontSize: 13,
                          display: 'inline-block',
                          animation: flash ? `price-flash-${flash} 0.7s ease-out forwards` : 'none',
                        }}
                      >
                        ${price.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: pos24 ? 'var(--green)' : 'var(--red)' }}>
                      {pct(coin.price_change_percentage_24h)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-mid)' }}>
                      {fmt(coin.market_cap, 1)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-mid)' }}>
                      {fmt(coin.total_volume, 1)}
                    </td>
                    <td>
                      <Sparkline data={sparkPrices} positive={pos7d} />
                    </td>
                    {/* Hidden tooltip data attributes for positioning */}
                    <td style={{ display: 'none' }} data-high={high7d} data-low={low7d} data-insight={insight} data-change7={change7d} />
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <CoinTooltip coin={tooltip.coin} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  );
}

function CoinTooltip({ coin, x, y }: { coin: CoinMarket; x: number; y: number }) {
  const sparkPrices = coin.sparkline_in_7d?.price ?? [];
  const high7d = sparkPrices.length ? Math.max(...sparkPrices) : null;
  const low7d = sparkPrices.length ? Math.min(...sparkPrices) : null;
  const change7d = coin.price_change_percentage_7d_in_currency ?? 0;
  const bullish = change7d >= 0;
  const insight = COIN_INSIGHTS[coin.id] ?? 'Monitoring for signals';

  return (
    <div style={{
      position: 'fixed',
      left: Math.min(x, window.innerWidth - 260),
      top: y - 10,
      transform: 'translateY(-100%)',
      zIndex: 1000,
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--green)',
      borderRadius: '0 10px 10px 0',
      padding: '12px 14px',
      width: 240,
      pointerEvents: 'none',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
          {coin.symbol?.toUpperCase()} · 7D
        </span>
        <span style={{
          background: bullish ? 'rgba(0,229,160,0.12)' : 'rgba(255,71,87,0.12)',
          border: `1px solid ${bullish ? 'rgba(0,229,160,0.3)' : 'rgba(255,71,87,0.3)'}`,
          color: bullish ? 'var(--green)' : 'var(--red)',
          borderRadius: 6,
          padding: '2px 7px',
          fontFamily: 'var(--font-space-mono), monospace',
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {bullish ? '↑ Bullish' : '↓ Bearish'}
        </span>
      </div>
      {high7d !== null && low7d !== null && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>7D High</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>${high7d.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>7D Low</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>${low7d.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>7D %</div>
            <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: bullish ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{pct(change7d)}</div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        💡 {coin.symbol?.toUpperCase()} {pct(change7d)} — {insight}
      </div>
    </div>
  );
}
