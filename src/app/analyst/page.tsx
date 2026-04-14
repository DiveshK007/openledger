'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean;
}

// ── Hardcoded market brief & responses ──────────────────────────────────────

const MARKET_BRIEF = `Good evening. Here's your OpenLedger market brief for April 14, 2026.

Bitcoin is trading at $72,400, up 1.8% on the day — but it has now failed to break the $73,000 resistance level three times in a row. That's a significant technical rejection. Watch this level closely.

Ethereum is down 2.7% at $2,355. ETH has been underperforming BTC this week, with the ETH/BTC ratio sliding — historically a sign of risk-off sentiment across altcoins.

Solana is at $82, down 3.3%. SOL took a hit following the $270M Drift protocol exploit earlier this month. On-chain activity has declined — the ecosystem is in cleanup mode.

The Fear & Greed Index sits at 12 — Extreme Fear. Analysts are calling this a potential generational accumulation zone, but macro headwinds from geopolitical tensions are keeping buyers cautious.

Whale activity shows exchange inflows rising on BTC — a short-term bearish signal suggesting some holders are moving coins to sell. No major exchange outflows detected in the last 6 hours.

What would you like to dig into?`;

const RESPONSES: Record<string, string> = {
  "Summarize today's market": MARKET_BRIEF,

  'Are whales buying or selling?':
    `Current whale data suggests net selling pressure. BTC exchange inflows have increased 18% in the last 4 hours — coins moving to exchanges typically precedes sell orders. However, several large wallets tagged as long-term holders have NOT moved funds, which is a bullish divergence. Net read: short-term caution, long-term holders holding firm.`,

  'What does Extreme Fear mean?':
    `Extreme Fear (index: 12/100) means the market is in maximum pessimism mode. Historically, readings below 15 have coincided with major accumulation opportunities — Bitcoin's best entry points in 2018, 2020, and 2022 all occurred during Extreme Fear. It doesn't mean price goes up immediately — but it means the risk/reward for long-term positions historically skews positive. Not financial advice.`,

  'Which asset looks strongest today?':
    `BTC is showing relative strength today — it's the only major asset in the green (+1.8%) while ETH and SOL bleed. This BTC dominance spike is typical in risk-off environments: capital rotates to the perceived safe haven within crypto. If you're watching for a recovery signal, watch for ETH to start outperforming BTC again — that's usually when altcoin season begins.`,

  'Is now a good time to accumulate BTC?':
    `Objectively: Fear & Greed at 12, BTC 45% below its all-time high, 7-month downtrend with early stabilization signals. These are the conditions long-term accumulators historically look for. The counter-argument: macro uncertainty from geopolitical tensions and BTC's triple rejection at $73K suggest the short-term trend is still down. Dollar-cost averaging into these conditions has historically outperformed lump-sum timing. Not financial advice.`,

  'What should I watch today?':
    `Three things to watch today:\n1. BTC $73,000 — a clean break above this level would flip short-term sentiment bullish.\n2. ETH/BTC ratio — if ETH stops bleeding against BTC, altcoin recovery may follow.\n3. Whale exchange flows — sustained inflows = more sell pressure incoming. Watch for outflows to signal accumulation.\nSet alerts. Not financial advice.`,
};

const FALLBACK_RESPONSE =
  `Based on today's snapshot: BTC is at $72,400 (+1.8%), ETH at $2,355 (-2.7%), SOL at $82 (-3.3%). Fear & Greed sits at 12 — Extreme Fear. For deeper analysis, explore the whale activity and price charts on the main dashboard. Not financial advice.`;

// ── Streaming simulation ─────────────────────────────────────────────────────

function simulateStream(
  text: string,
  onChunk: (delta: string) => void,
  onDone: () => void,
  initialDelay = 600,
): () => void {
  const words = text.split(' ');
  let i = 0;
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  function next() {
    if (cancelled) return;
    if (i >= words.length) {
      onDone();
      return;
    }
    const word = words[i];
    onChunk((i === 0 ? '' : ' ') + word);
    i++;

    // Pause longer after sentence endings
    const wordBase = word.split('\n')[0];
    const delay = /[.!?]["'\)]*$/.test(wordBase) ? 300 : 35;
    timeoutId = setTimeout(next, delay);
  }

  timeoutId = setTimeout(next, initialDelay);
  return () => {
    cancelled = true;
    clearTimeout(timeoutId);
  };
}

// ── Page component ───────────────────────────────────────────────────────────

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const autobriefSentRef = useRef(false);
  const loadingRef = useRef(false);
  const cancelStreamRef = useRef<(() => void) | null>(null);

  const starters = [
    "Summarize today's market",
    'Are whales buying or selling?',
    'What does Extreme Fear mean?',
    'Which asset looks strongest today?',
    'Is now a good time to accumulate BTC?',
    'What should I watch today?',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const runStream = (userText: string, isAutobrief: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError('');
    setStreamingText('');

    const responseText = isAutobrief
      ? MARKET_BRIEF
      : (RESPONSES[userText] ?? FALLBACK_RESPONSE);

    let accumulated = '';

    const cancel = simulateStream(
      responseText,
      (delta) => {
        accumulated += delta;
        setStreamingText(accumulated);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      },
      () => {
        if (isAutobrief) {
          setMessages([
            { role: 'user', content: 'Generate the market brief.', hidden: true },
            { role: 'assistant', content: accumulated },
          ]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
        }
        setStreamingText(null);
        loadingRef.current = false;
        setLoading(false);
      },
      isAutobrief ? 600 : 100,
    );

    cancelStreamRef.current = cancel;
  };

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    runStream(text.trim(), false);
  };

  // Auto market brief on mount
  useEffect(() => {
    if (autobriefSentRef.current) return;
    autobriefSentRef.current = true;
    runStream('', true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cancel any in-progress stream on unmount
  useEffect(() => {
    return () => { cancelStreamRef.current?.(); };
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
              }}>⚡ OpenLedger AI</span>
            </div>
            <p style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
              Live market snapshot · April 14, 2026 · Ask anything about today&apos;s crypto market.
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

            {/* Initial dots loader (before first word) */}
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
            Market snapshot: April 14, 2026 · Not financial advice
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
