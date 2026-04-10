import { NextResponse } from 'next/server';

export const revalidate = 3600; // 1 hour — yields don't change that fast

const FEATURED_PROTOCOLS = new Set([
  'aave-v3', 'aave-v2', 'compound-v3', 'compound-v2',
  'curve', 'convex-finance', 'lido', 'rocket-pool',
  'uniswap-v3', 'uniswap-v2', 'pancakeswap-amm',
  'maker', 'spark', 'morpho-v1', 'morpho-blue',
  'maple', 'ethena-usde', 'sky-lending', 'pendle',
  'yearn-finance', 'beefy', 'stargate',
]);

const PROTOCOL_DISPLAY: Record<string, string> = {
  'aave-v3':       'Aave v3',
  'aave-v2':       'Aave v2',
  'compound-v3':   'Compound v3',
  'compound-v2':   'Compound v2',
  'curve':         'Curve',
  'convex-finance':'Convex',
  'lido':          'Lido',
  'rocket-pool':   'Rocket Pool',
  'uniswap-v3':    'Uniswap v3',
  'uniswap-v2':    'Uniswap v2',
  'maker':         'MakerDAO',
  'spark':         'Spark',
  'morpho-v1':     'Morpho v1',
  'morpho-blue':   'Morpho Blue',
  'maple':         'Maple Finance',
  'ethena-usde':   'Ethena',
  'sky-lending':   'Sky (MakerDAO)',
  'pendle':        'Pendle',
  'yearn-finance': 'Yearn',
  'beefy':         'Beefy',
  'stargate':      'Stargate',
};

function riskLevel(pool: any): 'low' | 'medium' | 'high' {
  const apy = pool.apy ?? 0;
  const tvl = pool.tvlUsd ?? 0;
  const il = pool.ilRisk ?? 'no';
  const outlier = pool.outlier ?? false;

  if (outlier || apy > 50) return 'high';
  if (il === 'yes' || apy > 20 || tvl < 1_000_000) return 'medium';
  return 'low';
}

export async function GET() {
  try {
    const res = await fetch('https://yields.llama.fi/pools', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ pools: [], error: 'DeFiLlama unavailable' }, { status: 502 });
    }

    const data = await res.json();
    const allPools: any[] = data.data ?? [];

    const TARGET_CHAINS = new Set(['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Polygon', 'BSC']);

    const filtered = allPools.filter(p =>
      TARGET_CHAINS.has(p.chain) &&
      (FEATURED_PROTOCOLS.has(p.project) || (p.tvlUsd ?? 0) > 50_000_000) &&
      (p.apy ?? 0) >= 0.5 &&
      (p.apy ?? 0) < 500 && // exclude obviously broken data
      (p.tvlUsd ?? 0) >= 1_000_000 &&
      !p.outlier
    );

    const pools = filtered.map(p => ({
      pool: p.pool,
      project: p.project,
      projectDisplay: PROTOCOL_DISPLAY[p.project] ?? p.project,
      symbol: p.symbol,
      chain: p.chain,
      apy: Math.round((p.apy ?? 0) * 100) / 100,
      apyBase: Math.round((p.apyBase ?? 0) * 100) / 100,
      apyReward: Math.round((p.apyReward ?? 0) * 100) / 100,
      apyPct7D: p.apyPct7D ?? null,
      tvlUsd: p.tvlUsd ?? 0,
      stablecoin: p.stablecoin ?? false,
      ilRisk: p.ilRisk ?? 'no',
      risk: riskLevel(p),
      volumeUsd1d: p.volumeUsd1d ?? null,
    }));

    // Sort by TVL-weighted APY (not just raw APY — avoids tiny pool traps)
    pools.sort((a, b) => {
      const scoreA = a.apy * Math.log10(Math.max(a.tvlUsd, 1e6));
      const scoreB = b.apy * Math.log10(Math.max(b.tvlUsd, 1e6));
      return scoreB - scoreA;
    });

    return NextResponse.json({ pools: pools.slice(0, 100), total: filtered.length });
  } catch (e) {
    console.error('yields route error:', e);
    return NextResponse.json({ pools: [], error: 'Internal error' }, { status: 500 });
  }
}
