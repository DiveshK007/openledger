'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchFearGreed } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean;
}

async function streamAnalyst(
  messages: Message[],
  autobrief: boolean,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch('/api/analyst', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.filter(m => !m.hidden).map(({ hidden: _h, ...m }) => m),
      autobrief,
    }),
  });

  if (!res.ok || !res.body) {
    let errMsg = 'Claude API error — please try again.';
    try { const d = await res.json(); if (d.error) errMsg = d.error; } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fgValue, setFgValue] = useState<number | null>(null);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const autobriefSentRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    fetchFearGreed().then(fg => { if (fg) setFgValue(fg.value); });
  }, []);

  const starters = [
    "Summarize today's market",
    'Are whales buying or selling?',
    fgValue != null ? `What does Fear & Greed at ${fgValue} mean?` : 'What does the Fear & Greed index mean?',
    'Which asset looks strongest today?',
    'Is now a good time to accumulate BTC?',
    'What should I watch today?',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const runStream = async (userText: string, autobrief: boolean, currentMessages: Message[]) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError('');
    setStreamingText('');

    try {
      let accumulated = '';
      await streamAnalyst(currentMessages, autobrief, chunk => {
        accumulated += chunk;
        setStreamingText(accumulated);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });

      // Commit streamed content to messages
      if (autobrief) {
        setMessages([
          { role: 'user', content: 'Generate the market brief.', hidden: true },
          { role: 'assistant', content: accumulated },
        ]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
      }
      setStreamingText(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — please try again.');
      setStreamingText(null);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    runStream(text, false, nextMessages);
  };

  // Auto market brief on mount
  useEffect(() => {
    if (autobriefSentRef.current) return;
    autobriefSentRef.current = true;
    const t = setTimeout(() => runStream('', true, []), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleMessages = messages.filter(m => !m.hidden);

  return (
    <ErrorBoundary>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 96px)' }}>
        <div style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '32px 20px 0' }}>

          {/* Page header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
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
              Live prices, whale alerts &amp; Fear &amp; Greed pulled fresh on every request.
            </p>
          </div>

          {/* Starter chips — only after brief loads */}
          {visibleMessages.length > 0 && !loading && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {starters.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontFamily: 'var(--font-space-mono), monospace',
                      fontSize: 10,
                      color: 'var(--text-mid)',
                      cursor: 'pointer',
                      textTransform: 'none',
                      letterSpacing: 0,
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,160,0.4)'; e.currentTarget.style.color = 'var(--green)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mid)'; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {visibleMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' ? (
                  <AssistantBubble content={msg.content} streaming={false} />
                ) : (
                  <div style={{
                    maxWidth: '72%',
                    background: 'var(--green-dim)',
                    border: '1px solid rgba(0,229,160,0.25)',
                    borderRadius: '12px 12px 4px 12px',
                    padding: '12px 16px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 13, color: 'var(--green)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {streamingText !== null && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <AssistantBubble content={streamingText} streaming={loading} />
              </div>
            )}

            {/* Initial dots loader (before first chunk) */}
            {loading && streamingText === '' && (
              <div style={{ display: 'flex' }}>
                <div style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--green)',
                  borderRadius: '0 12px 12px 0',
                  padding: '14px 20px',
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

        {/* Sticky input bar */}
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
              style={{ padding: '12px 20px', borderRadius: 12, flexShrink: 0, opacity: (loading || !input.trim()) ? 0.45 : 1 }}
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

function AssistantBubble({ content, streaming }: { content: string; streaming: boolean }) {
  return (
    <div style={{
      maxWidth: '88%',
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--green)',
      borderRadius: '0 12px 12px 0',
      padding: '14px 18px',
      boxShadow: '0 2px 12px rgba(0,229,160,0.06)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 9,
        color: 'var(--green)',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        marginBottom: 10,
      }}>
        <span>⚡</span>
        <span>OpenLedger AI</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 13,
        color: 'var(--text)',
        lineHeight: 1.85,
        whiteSpace: 'pre-wrap',
      }}>
        {content}
        {streaming && content.length > 0 && <span className="streaming-cursor" />}
      </div>
    </div>
  );
}
