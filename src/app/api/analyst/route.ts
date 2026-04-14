import { NextRequest } from 'next/server';

export const maxDuration = 30; // seconds — Vercel serverless timeout

const TRACKED = 'bitcoin,ethereum,solana,chainlink,uniswap,aave,the-graph,polygon-ecosystem-token';

// ── Direct external fetches (no internal HTTP hops) ───────────────────────

async function fetchMarkets() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TRACKED}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return await res.json() as Array<{
      symbol: string;
      current_price: number | null;
      price_change_percentage_24h: number | null;
    }>;
  } catch {
    return [];
  }
}

async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const item = json?.data?.[0];
    if (!item) return null;
    return { value: parseInt(item.value, 10), classification: item.value_classification as string };
  } catch {
    return null;
  }
}

async function fetchBtcWhales() {
  try {
    const [blocksRes, priceRes] = await Promise.all([
      fetch('https://mempool.space/api/blocks', { next: { revalidate: 60 } }),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { next: { revalidate: 60 } }),
    ]);
    if (!blocksRes.ok) return [];
    const blocks: Array<{ id: string; timestamp: number }> = await blocksRes.json();
    const priceData = priceRes.ok ? await priceRes.json() : {};
    const btcPrice: number = priceData?.bitcoin?.usd ?? 72000;

    const lines: string[] = [];
    const MIN_BTC = 500_000 / btcPrice;

    for (const block of blocks.slice(0, 2)) {
      const txsRes = await fetch(`https://mempool.space/api/block/${block.id}/txs/0`, { next: { revalidate: 300 } });
      if (!txsRes.ok) continue;
      const txs: Array<{ vin?: Array<{ is_coinbase?: boolean }>; vout?: Array<{ value?: number; scriptpubkey_address?: string }> }> = await txsRes.json();
      for (const tx of txs) {
        if (tx.vin?.some(v => v.is_coinbase)) continue;
        const vouts = tx.vout ?? [];
        const maxSats = Math.max(...vouts.map(v => v.value ?? 0), 0);
        const maxBtc = maxSats / 1e8;
        if (maxBtc < MIN_BTC) continue;
        const usd = Math.round(maxBtc * btcPrice);
        const usdStr = usd >= 1e9 ? `$${(usd / 1e9).toFixed(1)}B` : usd >= 1e6 ? `$${(usd / 1e6).toFixed(1)}M` : `$${(usd / 1e3).toFixed(0)}K`;
        const minsAgo = Math.max(0, Math.floor((Date.now() - block.timestamp * 1000) / 60_000));
        lines.push(`- ${maxBtc.toFixed(2)} BTC (${usdStr}) — large transfer — ${minsAgo}m ago`);
        if (lines.length >= 4) break;
      }
      if (lines.length >= 4) break;
    }
    return lines;
  } catch {
    return [];
  }
}

// ── System prompt builder ─────────────────────────────────────────────────

function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '?';
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

function buildSystemPrompt(
  markets: Array<{ symbol: string; current_price: number | null; price_change_percentage_24h: number | null }>,
  fearGreed: { value: number; classification: string } | null,
  whaleLines: string[],
  fetchedAt: string,
): string {
  const lines: string[] = [
    `You are OpenLedger's AI market analyst. Live market data fetched at ${fetchedAt}:`,
    '',
    'LIVE PRICES:',
  ];

  if (markets.length > 0) {
    for (const c of markets) {
      const p = c.current_price ?? 0;
      const price = p >= 1
        ? `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
        : `$${p.toFixed(4)}`;
      lines.push(`- ${c.symbol.toUpperCase()}: ${price} (${fmtPct(c.price_change_percentage_24h)} 24h)`);
    }
  } else {
    lines.push('- (price data temporarily unavailable)');
  }

  lines.push('');

  if (fearGreed) {
    lines.push(`FEAR & GREED INDEX: ${fearGreed.value}/100 — ${fearGreed.classification}`);
    const v = fearGreed.value;
    if (v <= 20)      lines.push('Signal: Extreme pessimism — historically a potential accumulation zone.');
    else if (v <= 40) lines.push('Signal: Fear — risk appetite low, caution prevalent.');
    else if (v <= 60) lines.push('Signal: Neutral — no strong directional bias.');
    else if (v <= 80) lines.push('Signal: Greed — positive momentum, watch for overextension.');
    else              lines.push('Signal: Extreme greed — elevated correction risk.');
  } else {
    lines.push('FEAR & GREED INDEX: (temporarily unavailable)');
  }

  lines.push('');
  lines.push('RECENT WHALE ACTIVITY (BTC on-chain):');
  if (whaleLines.length > 0) {
    lines.push(...whaleLines);
  } else {
    lines.push('- (no large transactions detected in recent blocks)');
  }

  lines.push('');
  lines.push('Be a sharp, concise, data-driven analyst. Reference specific numbers. Give clear directional reads. Always end with: Not financial advice.');

  return lines.join('\n');
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages, autobrief } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured. Add it in Vercel → Settings → Environment Variables, then redeploy.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch live context directly — no internal HTTP hops
    const [markets, fearGreed, whaleLines] = await Promise.all([
      fetchMarkets(),
      fetchFearGreed(),
      fetchBtcWhales(),
    ]);

    const systemPrompt = buildSystemPrompt(markets, fearGreed, whaleLines, new Date().toUTCString());

    const finalMessages: { role: string; content: string }[] = autobrief
      ? [{ role: 'user', content: "Give me a professional market brief covering today's key price action, whale signals, and the Fear & Greed reading. Keep it under 200 words. End with: What would you like to dig into?" }]
      : (messages ?? []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 600,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...finalMessages,
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errBody);
      let userMsg = `AI API error (HTTP ${openaiRes.status})`;
      try {
        const parsed = JSON.parse(errBody);
        const detail = parsed?.error?.message ?? parsed?.message;
        if (detail) userMsg += `: ${detail}`;
      } catch { /* non-JSON error body */ }
      return new Response(
        JSON.stringify({ error: userMsg }),
        { status: openaiRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        const reader = openaiRes.body!.getReader();
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
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (typeof delta === 'string') {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch { /* skip malformed SSE lines */ }
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
      JSON.stringify({ error: `Analyst error: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
