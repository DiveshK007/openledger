import { NextResponse } from 'next/server';

const TRACKED = 'bitcoin,ethereum,solana,chainlink,uniswap,aave,the-graph,matic-network';

export async function GET() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TRACKED}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (e) {
    console.error('markets route error:', e);
    return NextResponse.json([], { status: 200 });
  }
}
