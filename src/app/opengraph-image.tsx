import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OpenLedger — Free Alternative to Bloomberg & Nansen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#080b0e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,229,160,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        {/* Green glow */}
        <div style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 400,
          background: 'radial-gradient(ellipse, rgba(0,229,160,0.15) 0%, transparent 70%)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(0,229,160,0.12)',
            border: '2px solid #00e5a0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            color: '#00e5a0',
          }}>Σ</div>
          <div style={{ color: '#e8f0fe', fontSize: 36, fontWeight: 700 }}>OpenLedger</div>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 52,
          fontWeight: 800,
          color: '#e8f0fe',
          textAlign: 'center',
          lineHeight: 1.15,
          marginBottom: 20,
          maxWidth: 900,
        }}>
          Financial Intelligence.{' '}
          <span style={{ color: '#00e5a0' }}>Zero Paywall.</span>
        </div>

        {/* Sub */}
        <div style={{
          fontSize: 22,
          color: '#8ba3be',
          textAlign: 'center',
          maxWidth: 700,
          lineHeight: 1.6,
          marginBottom: 40,
        }}>
          Free alternative to Bloomberg · Nansen · Glassnode
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Live Prices', 'Whale Alerts', 'AI Analyst', 'Portfolio Tracker'].map(f => (
            <div key={f} style={{
              background: 'rgba(0,229,160,0.08)',
              border: '1px solid rgba(0,229,160,0.25)',
              borderRadius: 24,
              padding: '8px 20px',
              color: '#00e5a0',
              fontSize: 16,
              fontWeight: 600,
            }}>{f}</div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
