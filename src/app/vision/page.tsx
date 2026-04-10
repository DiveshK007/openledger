import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const LIVE_FEATURES = [
  { icon: '📈', title: 'Live Prices', desc: '8 major assets. Refreshed every 30s via CoinGecko.' },
  { icon: '🐋', title: 'Whale Alerts', desc: 'Large on-chain transfers tracked in real-time.' },
  { icon: '👛', title: 'Portfolio Tracker', desc: 'Paste any ETH or SOL wallet — instant breakdown.' },
  { icon: '⚡', title: 'AI Analyst', desc: 'Ask Claude anything. Live market context on every query.' },
];

const V2_FEATURES = [
  { icon: '🔗', title: 'Real On-Chain Whale Tracking', desc: 'Live BTC (mempool.space), ETH (Etherscan), and multi-chain data via Whale Alert API.', live: true, href: '/whales' },
  { icon: '💰', title: 'DeFi Yield Aggregator', desc: 'Best APY across Aave, Compound, Curve, Uniswap, and 100+ pools via DeFiLlama.', live: true, href: '/yield' },
  { icon: '📊', title: 'Protocol TVL Dashboard', desc: 'DeFiLlama integration — top 10 protocols by TVL with 1d/7d change.', live: true, href: '/whales' },
  { icon: '🧠', title: 'Smart Money Wallets', desc: 'Track wallets of known funds, VCs and top traders.', live: false, href: null },
  { icon: '🔔', title: 'Price Alerts', desc: 'Set thresholds — get notified via Telegram or email.', live: false, href: null },
  { icon: '📅', title: 'Token Unlock Calendar', desc: 'Never get dumped on — see every major unlock 90 days ahead.', live: false, href: null },
];

const AGENTS = [
  {
    icon: '👁',
    title: 'Market Monitor Agent',
    desc: 'Watches 200+ assets 24/7. Detects unusual volume, breakouts, and sentiment shifts. Fires alerts before the crowd notices.',
  },
  {
    icon: '📝',
    title: 'Research Agent',
    desc: 'Reads on-chain data, news, and social signals. Writes a daily market brief at 8am UTC. No newsletter subscription required.',
  },
  {
    icon: '🚨',
    title: 'Alert Agent',
    desc: 'Routes signals to Telegram, email, or webhook. Configurable filters — only get alerted on what matters to your portfolio.',
  },
  {
    icon: '⚖️',
    title: 'Portfolio Rebalancing Agent',
    desc: 'Monitors your target allocations. Suggests rebalancing moves with estimated gas costs. Human-in-the-loop — you always approve.',
  },
];

export default function VisionPage() {
  return (
    <>
      <Header />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 0' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
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
          }}>Product Roadmap</div>
          <h1 style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(28px, 5vw, 48px)',
            color: 'var(--text)',
            lineHeight: 1.15,
            marginBottom: 16,
          }}>
            The Platform We&apos;re Building
          </h1>
          <p style={{
            fontFamily: 'var(--font-space-mono), monospace',
            fontSize: 13,
            color: 'var(--text-mid)',
            maxWidth: 560,
            margin: '0 auto 28px',
            lineHeight: 1.8,
          }}>
            A free, open alternative to Bloomberg, Nansen and Glassnode — with an agentic layer that works for you around the clock.
          </p>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--green)',
            color: 'var(--bg)',
            borderRadius: 8,
            padding: '10px 22px',
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 700,
            fontSize: 13,
          }}>← Back to Markets</Link>
        </div>

        {/* Timeline line */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: -20, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--green), var(--blue), rgba(255,211,42,0.6))', borderRadius: 1 }} />

          {/* ── Section 1: Live Now ───────────────────────────── */}
          <section style={{ marginBottom: 64, paddingLeft: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, fontWeight: 700, color: 'var(--bg)',
                flexShrink: 0, marginLeft: -36,
              }}>v1</div>
              <div>
                <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px' }}>Live Now</div>
                <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', margin: 0 }}>What&apos;s Live</h2>
              </div>
              <div style={{
                marginLeft: 'auto',
                background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)',
                borderRadius: 8, padding: '4px 12px',
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--green)', fontWeight: 700,
              }}>✓ Deployed</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {LIVE_FEATURES.map(f => (
                <div key={f.title} style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, var(--green), transparent)' }} />
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
                    {f.title}
                    <span style={{ marginLeft: 6, color: 'var(--green)', fontSize: 11 }}>✓</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 2: Coming ─────────────────────────────── */}
          <section style={{ marginBottom: 64, paddingLeft: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, fontWeight: 700, color: 'var(--bg)',
                flexShrink: 0, marginLeft: -36,
              }}>v2</div>
              <div>
                <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '2px' }}>Shipping</div>
                <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', margin: 0 }}>v2 Features</h2>
              </div>
              <div style={{
                marginLeft: 'auto',
                background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)',
                borderRadius: 8, padding: '4px 12px',
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--green)', fontWeight: 700,
              }}>3 Live · 3 Building</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {V2_FEATURES.map(f => (
                <div key={f.title} style={{
                  background: 'var(--bg2)',
                  border: `1px solid ${f.live ? 'rgba(0,229,160,0.25)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '20px',
                  position: 'relative', overflow: 'hidden',
                  opacity: f.live ? 1 : 0.7,
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${f.live ? 'var(--green)' : 'var(--blue)'}, transparent)` }} />
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{f.title}</div>
                    {f.live && <span style={{ fontSize: 9, color: 'var(--green)', fontFamily: 'var(--font-space-mono), monospace', fontWeight: 700 }}>✓ LIVE</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: f.href ? 12 : 0 }}>{f.desc}</div>
                  {f.href && (
                    <Link href={f.href} style={{
                      display: 'inline-block', background: 'var(--green-dim)',
                      border: '1px solid rgba(0,229,160,0.3)', borderRadius: 6,
                      padding: '4px 10px', fontFamily: 'var(--font-space-mono), monospace',
                      fontSize: 9, color: 'var(--green)', letterSpacing: '1px', textTransform: 'uppercase',
                    }}>Open →</Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 3: Agentic Layer ──────────────────────── */}
          <section style={{ marginBottom: 64, paddingLeft: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, fontWeight: 700, color: 'var(--bg)',
                flexShrink: 0, marginLeft: -36,
              }}>v3</div>
              <div>
                <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '2px' }}>The Big Vision</div>
                <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', margin: 0 }}>The Agentic Layer</h2>
              </div>
              <div style={{
                marginLeft: 'auto',
                background: 'rgba(255,211,42,0.1)', border: '1px solid rgba(255,211,42,0.3)',
                borderRadius: 8, padding: '4px 12px',
                fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--yellow)', fontWeight: 700,
              }}>Designing</div>
            </div>

            {/* Big description callout */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,211,42,0.06), rgba(0,229,160,0.04))',
              border: '1px solid rgba(255,211,42,0.2)',
              borderRadius: 16,
              padding: '28px 32px',
              marginBottom: 24,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, var(--yellow), var(--green))' }} />
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 12, lineHeight: 1.4 }}>
                An autonomous agent team that monitors markets 24/7.
              </div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.9 }}>
                Sends you alerts before moves happen. Writes daily research reports. Executes your strategy with human-in-the-loop approval — no sleepless nights watching charts.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {AGENTS.map(a => (
                <div key={a.title} style={{
                  background: 'var(--bg2)',
                  border: '1px solid rgba(255,211,42,0.15)',
                  borderRadius: 12,
                  padding: '22px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, var(--yellow), transparent)' }} />
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                  <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{a.title}</div>
                  <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 12 }}>{a.desc}</div>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,211,42,0.08)',
                    border: '1px solid rgba(255,211,42,0.2)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontFamily: 'var(--font-space-mono), monospace',
                    fontSize: 9,
                    color: 'var(--yellow)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}>In Development</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          borderTop: '1px solid var(--border)',
          marginBottom: 0,
        }}>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 'clamp(20px, 3vw, 30px)', color: 'var(--text)', marginBottom: 12 }}>
            Want to see this built?
          </div>
          <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.8 }}>
            The v1 is live today — free, no account, no BS. v2 and v3 are on the roadmap.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{
              background: 'var(--green)', color: 'var(--bg)',
              borderRadius: 8, padding: '12px 24px',
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 14,
            }}>Explore v1 →</Link>
            <Link href="/analyst" style={{
              background: 'rgba(0,184,255,0.12)', border: '1px solid rgba(0,184,255,0.3)', color: 'var(--blue)',
              borderRadius: 8, padding: '12px 24px',
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 14,
            }}>⚡ Try AI Analyst →</Link>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
