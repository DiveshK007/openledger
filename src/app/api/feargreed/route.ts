import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=30', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`FNG HTTP ${res.status}`);
    const json = await res.json();
    const items: Array<{ value: string; value_classification: string; timestamp: string }> = json.data ?? [];
    if (!items.length) return NextResponse.json(null, { status: 200 });
    const data = {
      value: parseInt(items[0].value, 10),
      classification: items[0].value_classification,
      history: items.map(i => ({
        value: parseInt(i.value, 10),
        classification: i.value_classification,
        timestamp: i.timestamp,
      })),
    };
    return NextResponse.json(data);
  } catch (e) {
    console.error('feargreed route error:', e);
    return NextResponse.json(null, { status: 200 });
  }
}
