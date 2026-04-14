'use client';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '24px 20px',
      marginTop: 40,
      background: 'var(--bg2)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--text)',
            marginBottom: 4,
          }}>OpenLedger</div>
          <div style={{
            fontFamily: 'var(--font-space-mono), monospace',
            fontSize: 10,
            color: 'var(--text-dim)',
            lineHeight: 1.7,
          }}>
            Free financial intelligence for everyone.<br />
            Built as an open alternative to Bloomberg, Nansen &amp; Glassnode.
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-space-mono), monospace',
          fontSize: 10,
          color: 'var(--text-dim)',
          textAlign: 'right',
          lineHeight: 1.8,
        }}>
          <span style={{ color: 'var(--text-mid)' }}>Powered by </span>
          <span style={{ color: 'var(--green)' }}>CoinGecko</span>
          <span style={{ color: 'var(--text-dim)' }}> · </span>
          <span style={{ color: 'var(--blue)' }}>DeFiLlama</span>
          <span style={{ color: 'var(--text-dim)' }}> · </span>
          <span style={{ color: 'var(--yellow)' }}>GPT-4o</span>
          <br />
          <span style={{ color: 'var(--text-dim)' }}>Data is informational only · Not financial advice</span>
          <br />
          <a
            href="https://github.com/DiveshK007/openledger"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-dim)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
          >GitHub ↗</a>
        </div>
      </div>
    </footer>
  );
}
