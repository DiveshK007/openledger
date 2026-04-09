'use client';

import { CoinMarket } from '@/types';
import { pct } from '@/lib/formatters';

interface Props {
  coins: CoinMarket[];
}

export default function TickerBar({ coins }: Props) {
  if (!coins.length) return null;
  const items = [...coins, ...coins];

  return (
    <div style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      height: 36,
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          width: 'max-content',
          animation: 'scroll 40s linear infinite',
        }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {items.map((coin, i) => {
          const pos = coin.price_change_percentage_24h >= 0;
          return (
            <span key={`${coin.id}-${i}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 20px',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: 11,
              whiteSpace: 'nowrap',
              borderRight: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>{coin.symbol.toUpperCase()}</span>
              <span style={{ color: 'var(--text)' }}>${coin.current_price.toLocaleString()}</span>
              <span style={{ color: pos ? 'var(--green)' : 'var(--red)' }}>{pct(coin.price_change_percentage_24h)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
