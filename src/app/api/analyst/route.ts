import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, marketSnapshot } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it to your Vercel environment variables.' },
        { status: 503 }
      );
    }

    const systemPrompt = `You are a professional crypto market analyst with access to live market data. Be concise, direct, and data-driven. Reference specific prices and percentages from the data provided. Never give financial advice. Always end your response with: "Not financial advice."

Current Live Market Data:
${marketSnapshot}`;

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
      console.error('Anthropic error:', errBody);
      return NextResponse.json({ error: 'Claude API error. Please try again.' }, { status: res.status });
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? 'No response from Claude.';
    return NextResponse.json({ text });
  } catch (e) {
    console.error('analyst route error:', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
