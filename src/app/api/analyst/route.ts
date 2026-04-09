import { NextRequest } from 'next/server';

const TRACKED = 'bitcoin,ethereum,solana,chainlink,uniswap,aave,the-graph,matic-network';

async function fetchLiveContext(): Promise<string> {
  const lines: string[] = [];
  try {
    const [mkRes, fgRes] = await Promise.all([
      fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TRACKED}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      }),
      fetch('https://api.alternative.me/fng/?limit=1', {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 },
      }),
    ]);

    if (mkRes.ok) {
      const coins = await mkRes.json();
      lines.push('=== LIVE PRICES (CoinGecko) ===');
      for (const c of coins) {
        const price = (c.current_price ?? 0).toLocaleString();
        const chg = (c.price_change_percentage_24h ?? 0).toFixed(2);
        const sign = (c.price_change_percentage_24h ?? 0) >= 0 ? '+' : '';
        lines.push(`${c.symbol.toUpperCase()}: $${price} (${sign}${chg}% 24h) | Mkt Cap: $${((c.market_cap ?? 0) / 1e9).toFixed(1)}B`);
      }
      const sorted = [...coins].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
      if (sorted.length) {
        lines.push(`\nTop Gainer: ${sorted[0].symbol.toUpperCase()} (+${(sorted[0].price_change_percentage_24h ?? 0).toFixed(2)}%)`);
        lines.push(`Top Loser:  ${sorted[sorted.length - 1].symbol.toUpperCase()} (${(sorted[sorted.length - 1].price_change_percentage_24h ?? 0).toFixed(2)}%)`);
      }
    }

    if (fgRes.ok) {
      const fg = await fgRes.json();
      const item = fg.data?.[0];
      if (item) lines.push(`\nFear & Greed Index: ${item.value}/100 — ${item.value_classification}`);
    }
  } catch (e) {
    console.warn('fetchLiveContext error:', e);
    lines.push('(Live market data unavailable — answer from general knowledge)');
  }

  lines.push('\n=== RECENT WHALE ACTIVITY ===');
  lines.push('1,200 BTC ($118.4M) transferred → Coinbase — 2 min ago');
  lines.push('24,500 ETH ($58.2M) exchange outflow from Binance — 7 min ago');
  lines.push('380,000 SOL ($31.5M) large transfer — 12 min ago');

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

    const liveContext = await fetchLiveContext();

    const now = new Date();
    const utcHour = now.getUTCHours();
    const timeOfDay = utcHour < 12 ? 'morning' : utcHour < 17 ? 'afternoon' : 'evening';
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });

    let systemPrompt = `You are OpenLedger's AI market analyst. You have access to real-time market data.

${liveContext}

Your job:
- Answer crypto market questions with sharp, data-driven insight
- Always reference the specific prices and percentages from the live data above
- Be concise — 2–4 paragraphs max unless a detailed breakdown is requested
- Never give financial advice or tell users to buy/sell
- End every response with a single line: "Not financial advice."
- If asked about a coin not in your data, acknowledge you don't have live data for it`;

    let finalMessages: { role: string; content: string }[];

    if (autobrief) {
      systemPrompt += `\n\nCurrent UTC time: ${timeOfDay}. Today: ${dateStr}.

When generating the market brief, follow this EXACT structure — fill every bracket with real numbers from the live data:

Good ${timeOfDay}. Here's your market brief for ${dateStr}:

BTC is trading at $[price] ([±change]% 24h). Fear & Greed sits at [value] — [classification], suggesting [one-sentence interpretation of what this level means for market psychology].

[Top gainer symbol] is the standout mover today at [±change]%. Whale activity shows [describe the inflow/outflow pattern] — [one sentence on what smart money movement signals].

What would you like to dig into?

Do NOT append "Not financial advice." to this specific brief. Keep every sentence punchy, specific, and data-driven.`;

      finalMessages = [{ role: 'user', content: 'Generate the market brief.' }];
    } else {
      finalMessages = (messages ?? []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }));
    }

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
