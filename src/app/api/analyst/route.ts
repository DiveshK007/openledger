import { NextRequest } from 'next/server';

interface CoinData {
  symbol: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
}

interface FearGreedData {
  value: number;
  classification: string;
}

interface WhaleAlert {
  coin: string;
  amount: string;
  usdValue: string;
  type: string;
  from: string;
  to: string;
  minsAgo: number;
}

interface WhalesData {
  alerts: WhaleAlert[];
}

function fmt(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '?';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

function buildSystemPrompt(
  markets: CoinData[],
  fearGreed: FearGreedData | null,
  whales: WhalesData | null,
  fetchedAt: string,
): string {
  const lines: string[] = [];

  lines.push(`You are OpenLedger's AI market analyst. You have access to live market data fetched at ${fetchedAt}:`);
  lines.push('');

  // Prices
  lines.push('LIVE PRICES:');
  if (markets.length > 0) {
    for (const c of markets) {
      const p = c.current_price ?? 0;
      const price = p >= 1
        ? `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
        : `$${p.toFixed(4)}`;
      lines.push(`- ${c.symbol.toUpperCase()}: ${price} (${fmt(c.price_change_percentage_24h)} 24h)`);
    }
  } else {
    lines.push('- (price data temporarily unavailable)');
  }
  lines.push('');

  // Fear & Greed
  if (fearGreed) {
    lines.push(`FEAR & GREED INDEX: ${fearGreed.value}/100 — ${fearGreed.classification}`);
    const fg = fearGreed.value;
    if (fg <= 20) lines.push('Interpretation: Extreme pessimism — historically a potential accumulation zone.');
    else if (fg <= 40) lines.push('Interpretation: Market fear — caution prevalent, risk appetite low.');
    else if (fg <= 60) lines.push('Interpretation: Neutral sentiment — no strong directional bias.');
    else if (fg <= 80) lines.push('Interpretation: Greed — momentum positive but watch for overextension.');
    else lines.push('Interpretation: Extreme greed — elevated risk of correction.');
  } else {
    lines.push('FEAR & GREED INDEX: (data temporarily unavailable)');
  }
  lines.push('');

  // Whale activity
  lines.push('RECENT WHALE ACTIVITY:');
  const alerts = whales?.alerts?.slice(0, 6) ?? [];
  if (alerts.length > 0) {
    for (const w of alerts) {
      const ago = w.minsAgo === 0 ? 'just now' : `${w.minsAgo}m ago`;
      lines.push(`- ${w.amount} (${w.usdValue}) — ${w.type} — ${w.from} → ${w.to} — ${ago}`);
    }
  } else {
    lines.push('- (no major whale transactions detected in the last 2 hours)');
  }
  lines.push('');

  lines.push(`Be a sharp, concise, data-driven analyst. Reference specific numbers from the live data above. Give clear directional reads. Always end responses with: Not financial advice.`);

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { messages, autobrief } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not set. Add it in Vercel → Project Settings → Environment Variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Derive base URL from the incoming request
    const baseUrl = new URL(req.url).origin;

    // Fetch live data in parallel — failures are non-fatal
    const [marketsRes, fearGreedRes, whalesRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/markets`).then(r => r.json() as Promise<CoinData[]>),
      fetch(`${baseUrl}/api/feargreed`).then(r => r.json() as Promise<FearGreedData | null>),
      fetch(`${baseUrl}/api/whales`).then(r => r.json() as Promise<WhalesData>),
    ]);

    const markets   = marketsRes.status   === 'fulfilled' ? (marketsRes.value   ?? []) : [];
    const fearGreed = fearGreedRes.status === 'fulfilled' ? (fearGreedRes.value ?? null) : null;
    const whales    = whalesRes.status    === 'fulfilled' ? (whalesRes.value    ?? null) : null;

    const fetchedAt = new Date().toUTCString();
    const systemPrompt = buildSystemPrompt(markets, fearGreed, whales, fetchedAt);

    const finalMessages: { role: string; content: string }[] = autobrief
      ? [{ role: 'user', content: 'Give me a professional market brief covering today\'s key price action, whale signals, and the Fear & Greed reading. Keep it under 200 words. End with: What would you like to dig into?' }]
      : (messages ?? []).map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        }));

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        stream: true,
        system: systemPrompt,
        messages: finalMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errBody);
      let userMsg = `Claude API error (HTTP ${anthropicRes.status})`;
      try {
        const parsed = JSON.parse(errBody);
        const detail = parsed?.error?.message ?? parsed?.message;
        if (detail) userMsg += `: ${detail}`;
      } catch { /* non-JSON body */ }
      return new Response(
        JSON.stringify({ error: userMsg }),
        { status: anthropicRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            for (const line of text.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6).trim();
              if (!raw || raw === '[DONE]') continue;
              try {
                const parsed = JSON.parse(raw);
                if (
                  parsed.type === 'content_block_delta' &&
                  parsed.delta?.type === 'text_delta' &&
                  typeof parsed.delta.text === 'string'
                ) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('analyst route error:', message, e);
    return new Response(
      JSON.stringify({ error: `AI Analyst error: ${message}. Please try again or check Vercel function logs.` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
