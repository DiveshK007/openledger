import { NextRequest, NextResponse } from 'next/server';

// ── Token symbol → CoinGecko ID ───────────────────────────────────────────

const SYMBOL_TO_CG: Record<string, string> = {
  ETH: 'ethereum', WETH: 'weth',
  BTC: 'bitcoin', WBTC: 'wrapped-bitcoin',
  SOL: 'solana', WSOL: 'wrapped-solana',
  USDT: 'tether', USDC: 'usd-coin', DAI: 'dai',
  FRAX: 'frax', LUSD: 'liquity-usd', TUSD: 'true-usd',
  LINK: 'chainlink', UNI: 'uniswap', AAVE: 'aave',
  COMP: 'compound-governance-token', MKR: 'maker',
  SNX: 'havven', YFI: 'yearn-finance',
  CRV: 'curve-dao-token', CVX: 'convex-finance',
  BAL: 'balancer', SUSHI: 'sushi', '1INCH': '1inch',
  GRT: 'the-graph', LDO: 'lido-dao', RPL: 'rocket-pool',
  ARB: 'arbitrum', OP: 'optimism',
  MATIC: 'matic-network', POL: 'polygon-ecosystem-token',
  SHIB: 'shiba-inu', PEPE: 'pepe', FLOKI: 'floki',
  APE: 'apecoin', ENS: 'ethereum-name-service',
  IMX: 'immutable-x', BLUR: 'blur',
  FET: 'fetch-ai', RNDR: 'render-token',
  FXS: 'frax-share', CRVUSD: 'crvusd',
  STETH: 'staked-ether', RETH: 'rocket-pool-eth',
  CBETH: 'coinbase-wrapped-staked-eth',
  RAY: 'raydium', BONK: 'bonk',
  JUP: 'jupiter-exchange-solana',
  WIF: 'dogwifcoin', PYTH: 'pyth-network',
  JTO: 'jito-governance-token',
};

// ── Solana mint → { symbol, name } ───────────────────────────────────────

const SOL_MINTS: Record<string, { symbol: string; name: string }> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC',    name: 'USD Coin' },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB:  { symbol: 'USDT',    name: 'Tether' },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: { symbol: 'BONK',    name: 'Bonk' },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN:  { symbol: 'JUP',     name: 'Jupiter' },
  EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm: { symbol: 'WIF',     name: 'dogwifhat' },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY',  name: 'Raydium' },
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3:  { symbol: 'PYTH',   name: 'Pyth Network' },
  jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL:   { symbol: 'JTO',    name: 'Jito' },
  rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof:   { symbol: 'RNDR',   name: 'Render' },
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So:   { symbol: 'mSOL',   name: 'Marinade SOL' },
  J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn:  { symbol: 'jitoSOL',name: 'Jito Staked SOL' },
  bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1:   { symbol: 'bSOL',   name: 'BlazeStake SOL' },
  So11111111111111111111111111111111111111112:      { symbol: 'WSOL',   name: 'Wrapped SOL' },
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': { symbol: 'stSOL',  name: 'Lido Staked SOL' },
  hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux:   { symbol: 'HNT',    name: 'Helium' },
  MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac:   { symbol: 'MNGO',   name: 'Mango' },
};

// ── Types ─────────────────────────────────────────────────────────────────

export interface PortfolioHolding {
  symbol: string;
  name: string;
  balance: number;
  priceUsd: number | null;
  usdValue: number | null;
  change24h: number | null;
  allocation: number | null;
  chain: 'ethereum' | 'solana';
  tokenAddress?: string;
}

interface RawHolding {
  symbol: string;
  name: string;
  balance: number;
  tokenAddress?: string;
  chain: 'ethereum' | 'solana';
}

// ── Ethereum ──────────────────────────────────────────────────────────────

async function fetchEthHoldings(address: string): Promise<RawHolding[]> {
  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) return [];

  const holdings: RawHolding[] = [];

  // Native ETH balance
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${key}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const d = await res.json();
      const bal = parseFloat(d.result || '0') / 1e18;
      if (bal >= 0.0001) holdings.push({ symbol: 'ETH', name: 'Ethereum', balance: bal, chain: 'ethereum' });
    }
  } catch { /* skip */ }

  // ERC-20: discover token contracts via recent transfers
  try {
    const txRes = await fetch(
      `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&sort=desc&page=1&offset=200&apikey=${key}`,
      { next: { revalidate: 60 } }
    );
    if (!txRes.ok) return holdings;
    const txData = await txRes.json();
    if (txData.status !== '1' || !Array.isArray(txData.result)) return holdings;

    // Deduplicate contracts, keep first-seen metadata
    const seen = new Map<string, { symbol: string; name: string; decimals: number }>();
    for (const tx of txData.result) {
      const addr = (tx.contractAddress || '').toLowerCase();
      if (!addr || seen.has(addr)) continue;
      seen.set(addr, {
        symbol: (tx.tokenSymbol || '').toUpperCase(),
        name: tx.tokenName || tx.tokenSymbol || 'Unknown Token',
        decimals: parseInt(tx.tokenDecimal || '18', 10),
      });
    }

    // Fetch current balances in parallel (max 15 tokens)
    const contracts = [...seen.entries()].slice(0, 15);
    const balResults = await Promise.allSettled(
      contracts.map(([addr]) =>
        fetch(
          `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${addr}&address=${address}&tag=latest&apikey=${key}`,
          { next: { revalidate: 60 } }
        ).then(r => r.json())
      )
    );

    for (let i = 0; i < contracts.length; i++) {
      const [contractAddr, meta] = contracts[i];
      const r = balResults[i];
      if (r.status !== 'fulfilled') continue;
      const raw = parseFloat(r.value.result || '0');
      if (!raw || isNaN(raw)) continue;
      const bal = raw / Math.pow(10, meta.decimals);
      if (bal <= 0) continue;
      holdings.push({ symbol: meta.symbol, name: meta.name, balance: bal, tokenAddress: contractAddr, chain: 'ethereum' });
    }
  } catch { /* skip */ }

  return holdings;
}

// ── Solana ────────────────────────────────────────────────────────────────

async function fetchSolHoldings(address: string): Promise<RawHolding[]> {
  const holdings: RawHolding[] = [];
  const RPC = 'https://api.mainnet-beta.solana.com';

  try {
    // Native SOL
    const balRes = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
      next: { revalidate: 60 },
    });
    if (balRes.ok) {
      const d = await balRes.json();
      const sol = (d.result?.value ?? 0) / 1e9;
      if (sol >= 0.001) holdings.push({ symbol: 'SOL', name: 'Solana', balance: sol, chain: 'solana' });
    }
  } catch { /* skip */ }

  // SPL tokens
  try {
    const splRes = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 2,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' },
        ],
      }),
      next: { revalidate: 60 },
    });
    if (splRes.ok) {
      const d = await splRes.json();
      const accounts: Array<{ account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number } } } } } }> = d.result?.value ?? [];
      for (const acc of accounts.slice(0, 25)) {
        const info = acc.account?.data?.parsed?.info;
        if (!info) continue;
        const amount = info.tokenAmount?.uiAmount ?? 0;
        if (amount <= 0) continue;
        const mint = info.mint ?? '';
        const meta = SOL_MINTS[mint];
        holdings.push({
          symbol: meta?.symbol ?? `${mint.slice(0, 4)}…`,
          name: meta?.name ?? 'Unknown Token',
          balance: amount,
          tokenAddress: mint,
          chain: 'solana',
        });
      }
    }
  } catch { /* skip */ }

  return holdings;
}

// ── Price all holdings via CoinGecko ─────────────────────────────────────

async function priceHoldings(raw: RawHolding[]): Promise<PortfolioHolding[]> {
  const cgIds = [...new Set(raw.map(h => SYMBOL_TO_CG[h.symbol]).filter(Boolean as unknown as <T>(x: T | undefined) => x is T))];

  let prices: Record<string, { usd: number; usd_24h_change: number }> = {};
  if (cgIds.length > 0) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
        { next: { revalidate: 60 } }
      );
      if (res.ok) prices = await res.json();
    } catch { /* proceed without prices */ }
  }

  const priced = raw.map(h => {
    const cgId = SYMBOL_TO_CG[h.symbol];
    const p = cgId ? prices[cgId] : null;
    const priceUsd = p?.usd ?? null;
    return {
      ...h,
      priceUsd,
      usdValue: priceUsd != null ? h.balance * priceUsd : null,
      change24h: p?.usd_24h_change ?? null,
      allocation: null as number | null,
    };
  });

  // Sort: priced (desc value) then unpriced
  priced.sort((a, b) => {
    if (a.usdValue != null && b.usdValue != null) return b.usdValue - a.usdValue;
    if (a.usdValue != null) return -1;
    if (b.usdValue != null) return 1;
    return 0;
  });

  // Allocation percentages
  const total = priced.reduce((s, h) => s + (h.usdValue ?? 0), 0);
  return priced.map(h => ({
    ...h,
    allocation: h.usdValue != null && total > 0 ? (h.usdValue / total) * 100 : null,
  }));
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.trim();
  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter.' }, { status: 400 });
  }

  const isEth = address.startsWith('0x') && address.length === 42;
  const isSol = !isEth && address.length >= 32 && address.length <= 44;

  if (!isEth && !isSol) {
    return NextResponse.json({ error: 'Invalid address format. Must be an Ethereum (0x…) or Solana address.' }, { status: 400 });
  }

  const raw = isEth ? await fetchEthHoldings(address) : await fetchSolHoldings(address);

  if (raw.length === 0) {
    return NextResponse.json({ error: 'No holdings found for this address. The wallet may be empty or the address is invalid.' }, { status: 404 });
  }

  const holdings = await priceHoldings(raw);
  const totalValue = holdings.reduce((s, h) => s + (h.usdValue ?? 0), 0);
  const pricedCount = holdings.filter(h => h.usdValue != null).length;

  // 24h P&L in USD (weighted by value)
  let pnl24h: number | null = null;
  const pricedHoldings = holdings.filter(h => h.usdValue != null && h.change24h != null);
  if (pricedHoldings.length > 0) {
    pnl24h = pricedHoldings.reduce((s, h) => {
      const prevValue = h.usdValue! / (1 + h.change24h! / 100);
      return s + (h.usdValue! - prevValue);
    }, 0);
  }

  return NextResponse.json({
    address,
    chain: isEth ? 'ethereum' : 'solana',
    holdings,
    totalValue,
    pnl24h,
    pricedCount,
    totalCount: holdings.length,
  });
}
