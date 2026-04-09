import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.llama.fi/protocols', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`DeFiLlama HTTP ${res.status}`);
    const data = await res.json();
    const top10 = (data as Array<{
      name: string; tvl: number; change_1d?: number; change_7d?: number; category?: string;
    }>)
      .filter(p => p.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        tvl: p.tvl,
        change_1d: p.change_1d ?? 0,
        change_7d: p.change_7d ?? 0,
        category: p.category ?? 'DeFi',
      }));
    return NextResponse.json(top10);
  } catch (e) {
    console.error('protocols route error:', e);
    return NextResponse.json([], { status: 200 });
  }
}
