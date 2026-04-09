import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  const { coinId } = await params;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) throw new Error(`CoinGecko chart HTTP ${res.status}`);
    const json = await res.json();
    const prices = (json.prices as [number, number][]).map(([, price]) => price);
    return NextResponse.json(prices);
  } catch (e) {
    console.error('chart route error:', e);
    return NextResponse.json([], { status: 200 });
  }
}
