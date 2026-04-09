'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchFearGreed } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fgValue, setFgValue] = useState<number | null>(null);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFearGreed().then(fg => { if (fg) setFgValue(fg.value); });
  }, []);

  const starters = [
    'Summarize today\'s market',
    'Are whales buying or selling?',
    fgValue != null ? `What does Fear & Greed at ${fgValue} mean?` : 'What does the Fear & Greed index mean?',
    'Which asset looks strongest today?',
    'Is now a good time to accumulate BTC?',
    'What should I watch today?',
  ];

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
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 96px)' }}>
        <div style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '32px 20px 0' }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 4vw, 32px)', color: 'var(--text)', margin: 0 }}>
                AI Market Analyst
              </h1>
              <span style={{
                background: 'linear-gradient(135deg, rgba(0,229,160,0.12), rgba(0,184,255,0.12))',
                border: '1px solid rgba(0,229,160,0.3)',
                borderRadius: 20,
                padding: '4px 12px',
                fontFamily: 'var(--font-space-mono), monospace',
                fontSize: 9,
                color: 'var(--green)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>⚡ Powered by Claude AI</span>
            </div>
            <p style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
              Claude reads live prices, whale activity and the Fear &amp; Greed index before answering.
            </p>
          </div>

          {/* Starter chips */}
          {messages.length === 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>
                Try asking:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {starters.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={loading}
                    style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      padding: '8px 16px',
                      fontFamily: 'var(--font-space-mono), monospace',
                      fontSize: 11,
                      color: 'var(--text-mid)',
                      cursor: 'pointer',
                      textTransform: 'none',
                      letterSpacing: 0,
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(0,229,160,0.4)'); (e.currentTarget.style.color = 'var(--green)'); }}
                    onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--text-mid)'); }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>
                Ask anything about today&apos;s crypto market
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  background: msg.role === 'user' ? 'var(--green-dim)' : 'var(--bg2)',
                  border: msg.role === 'user' ? '1px solid rgba(0,229,160,0.25)' : '1px solid var(--border)',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  padding: '12px 16px',
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>
                      Claude · OpenLedger Analyst
                    </div>
                  )}
                  <div style={{
                    fontFamily: 'var(--font-space-mono), monospace',
                    fontSize: 13,
                    color: msg.role === 'user' ? 'var(--green)' : 'var(--text)',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: '12px 12px 12px 4px', padding: '14px 20px',
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
                      animation: `skeleton-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                  <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>
                    Analyzing market...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12, color: 'var(--red)' }}>
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input — sticky on mobile */}
        <div className="analyst-input-bar">
          <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about today's market… (Enter to send, Shift+Enter for newline)"
              disabled={loading}
              rows={2}
              style={{
                flex: 1,
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
                width: '100%',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,229,160,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="btn-primary"
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                flexShrink: 0,
                opacity: (loading || !input.trim()) ? 0.45 : 1,
              }}
            >
              {loading ? '…' : 'Send →'}
            </button>
          </div>
          <div style={{ maxWidth: 860, margin: '6px auto 0', fontFamily: 'var(--font-space-mono), monospace', fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>
            Claude reads live market data on every request · Not financial advice
          </div>
        </div>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
