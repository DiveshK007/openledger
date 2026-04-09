'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { CoinMarket } from '@/types';
import { fmt, pct } from '@/lib/formatters';

const Sparkline = dynamic(() => import('./Sparkline'), { ssr: false });

interface Props {
  coins: CoinMarket[];
  loading: boolean;
}

export default function CoinTable({ coins, loading }: Props) {
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
              : coins.map((coin, idx) => {
                const pos24 = coin.price_change_percentage_24h >= 0;
                const pos7d = (coin.price_change_percentage_7d_in_currency ?? 0) >= 0;
                return (
                  <tr key={coin.id}>
                    <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Image src={coin.image} alt={coin.name} width={28} height={28} style={{ borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 14 }}>{coin.name}</div>
                          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-space-mono), monospace', fontWeight: 700, fontSize: 13 }}>
                      ${coin.current_price.toLocaleString()}
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
                      <Sparkline data={coin.sparkline_in_7d?.price ?? []} positive={pos7d} />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
