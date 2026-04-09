import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const json = await res.json();
    const d = json.data;
    const data = {
      total_market_cap_usd: d.total_market_cap?.usd ?? 0,
      total_volume_usd: d.total_volume?.usd ?? 0,
      market_cap_change_24h: d.market_cap_change_percentage_24h_usd ?? 0,
      btc_dominance: d.market_cap_percentage?.btc ?? 0,
    };
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (e) {
    console.error('global route error:', e);
    return NextResponse.json(null, { status: 200 });
  }
}
