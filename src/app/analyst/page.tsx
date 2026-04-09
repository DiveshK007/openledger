'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchMarkets, fetchGlobalStats, fetchFearGreed } from '@/lib/api';
import { fmt, pct } from '@/lib/formatters';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'Summarize today\'s market',
  'Are whales buying or selling?',
  'What\'s driving BTC today?',
  'Should I be cautious right now?',
];

function buildMarketSnapshot(coins: Array<{ symbol: string; current_price: number | null; price_change_percentage_24h: number | null }>, global: { total_market_cap_usd: number; market_cap_change_24h: number; btc_dominance: number } | null, fearGreed: { value: number; classification: string } | null): string {
  const lines: string[] = [];
  if (global) {
    lines.push(`Total Market Cap: ${fmt(global.total_market_cap_usd)} (${pct(global.market_cap_change_24h)} 24h)`);
    lines.push(`BTC Dominance: ${global.btc_dominance.toFixed(1)}%`);
  }
  if (fearGreed) lines.push(`Fear & Greed Index: ${fearGreed.value}/100 — ${fearGreed.classification}`);
  lines.push('');
  lines.push('Asset Prices:');
  for (const c of coins) {
    const price = c.current_price ?? 0;
    lines.push(`  ${c.symbol.toUpperCase()}: $${price.toLocaleString()} (${pct(c.price_change_percentage_24h ?? 0)} 24h)`);
  }
  return lines.join('\n');
}

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [marketSnapshot, setMarketSnapshot] = useState('');
  const [marketLoading, setMarketLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetchMarkets(), fetchGlobalStats(), fetchFearGreed()]).then(([coins, global, fg]) => {
      setMarketSnapshot(buildMarketSnapshot(coins, global, fg));
      setMarketLoading(false);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setError('');
    const userMsg: Message = { role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, marketSnapshot }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Header />

      {/* FREE FOREVER banner */}
      <div style={{
        background: 'rgba(0,229,160,0.06)',
        borderBottom: '1px solid rgba(0,229,160,0.15)',
        padding: '6px 20px',
        textAlign: 'center',
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 10,
        color: 'var(--green)',
        letterSpacing: '3px',
        textTransform: 'uppercase',
      }}>
        Free Forever · No Paywall · No Account Required
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>
              AI Market Analyst
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, rgba(0,229,160,0.15), rgba(0,184,255,0.15))',
              border: '1px solid rgba(0,229,160,0.3)',
              borderRadius: 20,
              padding: '4px 12px',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: 10,
              color: 'var(--green)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}>⚡ Powered by Claude AI</span>
          </div>
          <p style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--text-dim)' }}>
            {marketLoading
              ? 'Loading live market data...'
              : 'Ask anything about today\'s crypto market. Claude has live prices and on-chain data.'}
          </p>
        </div>

        {/* Starter chips — only show when no messages */}
        {messages.length === 0 && !marketLoading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {STARTERS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '8px 16px',
                  fontFamily: 'var(--font-space-mono), monospace',
                  fontSize: 11,
                  color: 'var(--text-mid)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'none',
                  letterSpacing: 0,
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(0,229,160,0.5)';
                  (e.target as HTMLButtonElement).style.color = 'var(--green)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.target as HTMLButtonElement).style.color = 'var(--text-mid)';
                }}
              >{s}</button>
            ))}
          </div>
        )}

        {/* Chat history */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 4, marginBottom: 16 }}>
          {messages.length === 0 && !marketLoading && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'var(--text-dim)',
            }}>
              <div style={{ fontSize: 48 }}>📊</div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>Ask a question about the market above</div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '80%',
                background: msg.role === 'user' ? 'var(--green-dim)' : 'var(--bg2)',
                border: msg.role === 'user' ? '1px solid rgba(0,229,160,0.3)' : '1px solid var(--border)',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                padding: '12px 16px',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>
                    Claude AI · Market Analyst
                  </div>
                )}
                <div style={{
                  fontFamily: 'var(--font-space-mono), monospace',
                  fontSize: 13,
                  color: msg.role === 'user' ? 'var(--green)' : 'var(--text)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px 12px 12px 4px',
                padding: '14px 18px',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
                    animation: `skeleton-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(255,71,87,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: 12,
              color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about today's market... (Enter to send)"
              disabled={loading || marketLoading}
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text)',
                fontFamily: 'var(--font-space-mono), monospace',
                fontSize: 13,
                padding: '12px 16px',
                outline: 'none',
                resize: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,229,160,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim() || marketLoading}
            className="btn-primary"
            style={{ padding: '12px 20px', borderRadius: 12, flexShrink: 0, opacity: (loading || !input.trim() || marketLoading) ? 0.5 : 1 }}
          >
            {loading ? '...' : 'Send →'}
          </button>
        </div>

        <div style={{ marginTop: 8, fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>
          AI responses are informational only · Not financial advice · Markets data refreshed on page load
        </div>
      </div>
    </ErrorBoundary>
  );
}
