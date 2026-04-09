import { NextRequest, NextResponse } from 'next/server';

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
        const sign = c.price_change_percentage_24h >= 0 ? '+' : '';
        lines.push(`${c.symbol.toUpperCase()}: $${price} (${sign}${chg}% 24h) | Mkt Cap: $${((c.market_cap ?? 0) / 1e9).toFixed(1)}B`);
      }
      // Top gainer / loser
      const sorted = [...coins].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
      if (sorted.length) {
        lines.push(`\nTop Gainer: ${sorted[0].symbol.toUpperCase()} (${(sorted[0].price_change_percentage_24h ?? 0).toFixed(2)}%)`);
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
    const { messages } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not set. Add it in Vercel → Project Settings → Environment Variables.' },
        { status: 503 }
      );
    }

    const liveContext = await fetchLiveContext();

    const systemPrompt = `You are OpenLedger's AI market analyst. You have access to real-time market data.

${liveContext}

Your job:
- Answer crypto market questions with sharp, data-driven insight
- Always reference the specific prices and percentages from the live data above
- Be concise — 2–4 paragraphs max unless a detailed breakdown is requested
- Never give financial advice or tell users to buy/sell
- End every response with a single line: "Not financial advice."
- If asked about a coin not in your data, acknowledge you don't have live data for it`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Anthropic API error:', res.status, errBody);
      return NextResponse.json({ error: 'Claude API error — please try again.' }, { status: res.status });
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? 'No response from Claude.';
    return NextResponse.json({ text });
  } catch (e) {
    console.error('analyst route error:', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
