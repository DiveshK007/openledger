import { NextRequest } from 'next/server';

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

    const systemPrompt = `You are OpenLedger's AI market analyst. You have access to today's live market snapshot as of April 14, 2026:

PRICES:
- BTC: $72,400 (+1.8% 24h) — rejected $73,000 resistance 3x
- ETH: $2,355 (-2.7% 24h) — underperforming BTC, ETH/BTC ratio falling
- SOL: $82 (-3.3% 24h) — post-Drift exploit ($270M), activity declining
- LINK: $12.40 (-1.1% 24h)
- UNI: $7.20 (-2.8% 24h)
- AAVE: $142 (-1.9% 24h)

MARKET CONDITIONS:
- Fear & Greed Index: 12 (Extreme Fear)
- Total Market Cap: $2.53T
- 24h Volume: $88.4B
- BTC Dominance: rising (risk-off signal)
- Market trend: 7-month downtrend, early stabilization signals

WHALE ACTIVITY:
- BTC exchange inflows up ~18% last 4 hours (bearish short-term)
- No major exchange outflows detected
- Long-term holder wallets (5yr+) have not moved funds (bullish divergence)
- Notable: 1,200 BTC ($87.7M) moved to Coinbase 2h ago

MACRO CONTEXT:
- Iran ceasefire fragile, oil near $97
- Geopolitical uncertainty suppressing risk appetite
- Analysts calling current zone a potential generational bottom
- BTC all-time high: ~$108,000 (Jan 2026) — current price is 33% below ATH

Be a sharp, concise, data-driven analyst. Reference specific numbers from the snapshot above. Give clear directional reads. Always end responses with: Not financial advice.`;

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
      return new Response(
        JSON.stringify({ error: 'Claude API error — please try again.' }),
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
    console.error('analyst route error:', e);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
