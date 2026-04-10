import { NextResponse } from 'next/server';

// ── Known exchange addresses (ETH, lowercase) ──────────────────
const ETH_EXCHANGES: Record<string, string> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance 2',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': 'Binance 3',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 4',
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase',
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': 'Coinbase 2',
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': 'Coinbase 3',
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': 'Kraken 2',
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': 'Bybit',
  '0x1db92e2eebc8e0c075a02bea49a2935bcd2dfcf4': 'Bybit 2',
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX',
  '0xca3f4574bce5a730cfc4b9df3adcdb8b85f96cf2': 'Huobi',
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': 'Huobi 2',
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': 'Huobi 3',
  '0x6f48a3e70f0251d1e83a989e62aaa2281a179df7': 'Gemini',
  '0xd24400ae8bfebb18ca49be86258a3c749cf46853': 'Gemini 2',
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance Old',
};

function shortenAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || 'Unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function classifyTransfer(
  fromLower: string,
  toLower: string
): 'transfer' | 'exchange inflow' | 'exchange outflow' {
  if (ETH_EXCHANGES[toLower]) return 'exchange inflow';
  if (ETH_EXCHANGES[fromLower]) return 'exchange outflow';
  return 'transfer';
}

// ── Source 1: Whale Alert API ──────────────────────────────────
async function fetchWhaleAlert(): Promise<any[]> {
  const key = process.env.WHALE_ALERT_API_KEY;
  if (!key) return [];

  const start = Math.floor(Date.now() / 1000) - 7200; // last 2h
  const url = `https://api.whale-alert.io/v1/transactions?api_key=${key}&min_value=500000&start=${start}&limit=20&cursor=0`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];

  const data = await res.json();
  if (data.result !== 'success' || !Array.isArray(data.transactions)) return [];

  return data.transactions.map((tx: any) => {
    const from = tx.from?.owner || shortenAddr(tx.from?.address || '');
    const to = tx.to?.owner || shortenAddr(tx.to?.address || '');

    let type: 'transfer' | 'exchange inflow' | 'exchange outflow' = 'transfer';
    if (tx.to?.owner_type === 'exchange') type = 'exchange inflow';
    else if (tx.from?.owner_type === 'exchange') type = 'exchange outflow';

    const usdValueNum = Math.round(tx.amount_usd ?? 0);
    const symbol = (tx.symbol ?? '').toUpperCase();
    const amount = tx.amount != null
      ? `${Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
      : symbol;

    return {
      id: String(tx.id ?? tx.hash ?? tx.timestamp),
      chain: tx.blockchain ?? 'unknown',
      coin: symbol,
      amount,
      usdValue: fmtUsd(usdValueNum),
      usdValueNum,
      type,
      from,
      to,
      txHash: tx.hash ?? null,
      minsAgo: Math.max(0, Math.floor((Date.now() / 1000 - (tx.timestamp ?? 0)) / 60)),
      source: 'whale-alert',
    };
  });
}

// ── Source 2: Etherscan — USDT, USDC, and large ETH transfers ──
async function fetchEthWhales(): Promise<any[]> {
  const key = process.env.ETHERSCAN_API_KEY ?? process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  if (!key || key === 'YourApiKeyToken') return [];

  const results: any[] = [];
  const MIN_USD = 500_000;

  // --- Stablecoin transfers ---
  const tokens = [
    { addr: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', decimals: 6 },
    { addr: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', decimals: 6 },
  ];

  await Promise.allSettled(tokens.map(async ({ addr, symbol, decimals }) => {
    const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${addr}&page=1&offset=100&sort=desc&apikey=${key}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status !== '1' || !Array.isArray(data.result)) return;

    for (const tx of data.result) {
      const usdValueNum = parseFloat(tx.value) / Math.pow(10, decimals);
      if (usdValueNum < MIN_USD) continue;

      const fromLower = (tx.from ?? '').toLowerCase();
      const toLower = (tx.to ?? '').toLowerCase();
      const from = ETH_EXCHANGES[fromLower] ?? shortenAddr(tx.from);
      const to = ETH_EXCHANGES[toLower] ?? shortenAddr(tx.to);
      const type = classifyTransfer(fromLower, toLower);
      const ts = parseInt(tx.timeStamp ?? '0') * 1000;

      results.push({
        id: tx.hash,
        chain: 'ethereum',
        coin: symbol,
        amount: `${fmtUsd(usdValueNum)} ${symbol}`,
        usdValue: fmtUsd(usdValueNum),
        usdValueNum,
        type,
        from,
        to,
        txHash: tx.hash,
        minsAgo: Math.max(0, Math.floor((Date.now() - ts) / 60_000)),
        source: 'etherscan',
      });
    }
  }));

  // --- Large ETH transfers from latest block ---
  try {
    const [blockRes, priceRes] = await Promise.all([
      fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=true&apikey=${key}`, { next: { revalidate: 30 } }),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', { next: { revalidate: 60 } }),
    ]);

    if (blockRes.ok && priceRes.ok) {
      const blockData = await blockRes.json();
      const priceData = await priceRes.json();
      const ethPrice: number = priceData?.ethereum?.usd ?? 2500;
      const txs: any[] = blockData.result?.transactions ?? [];

      for (const tx of txs) {
        const valueEth = parseInt(tx.value ?? '0x0', 16) / 1e18;
        const usdValueNum = valueEth * ethPrice;
        if (usdValueNum < MIN_USD) continue;

        const fromLower = (tx.from ?? '').toLowerCase();
        const toLower = (tx.to ?? '').toLowerCase();
        const from = ETH_EXCHANGES[fromLower] ?? shortenAddr(tx.from);
        const to = ETH_EXCHANGES[toLower] ?? shortenAddr(tx.to ?? '');
        const type = classifyTransfer(fromLower, toLower);

        results.push({
          id: tx.hash,
          chain: 'ethereum',
          coin: 'ETH',
          amount: `${valueEth.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETH`,
          usdValue: fmtUsd(usdValueNum),
          usdValueNum,
          type,
          from,
          to,
          txHash: tx.hash,
          minsAgo: 0,
          source: 'etherscan',
        });
      }
    }
  } catch {
    // skip ETH block parsing on error
  }

  // Dedup by txHash, sort by value
  const seen = new Set<string>();
  return results
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
    .sort((a, b) => b.usdValueNum - a.usdValueNum)
    .slice(0, 12);
}

// ── Source 3: BTC large transfers via mempool.space (free) ─────
async function fetchBtcWhales(): Promise<any[]> {
  try {
    const [blocksRes, priceRes] = await Promise.all([
      fetch('https://mempool.space/api/blocks', { next: { revalidate: 60 } }),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { next: { revalidate: 60 } }),
    ]);
    if (!blocksRes.ok) return [];

    const blocks: any[] = await blocksRes.json();
    const priceData = priceRes.ok ? await priceRes.json() : {};
    const btcPrice: number = priceData?.bitcoin?.usd ?? 97_000;

    const results: any[] = [];
    const MIN_BTC = 500_000 / btcPrice; // ~$500k in BTC

    // Check the last 3 confirmed blocks
    for (const block of blocks.slice(0, 3)) {
      const txsRes = await fetch(
        `https://mempool.space/api/block/${block.id}/txs/0`,
        { next: { revalidate: 300 } }
      );
      if (!txsRes.ok) continue;

      const txs: any[] = await txsRes.json();

      for (const tx of txs) {
        // Skip coinbase
        if (tx.vin?.some((v: any) => v.is_coinbase)) continue;

        const vouts: any[] = tx.vout ?? [];
        const maxSats = Math.max(...vouts.map((v: any) => v.value ?? 0), 0);
        const maxBtc = maxSats / 1e8;

        if (maxBtc < MIN_BTC) continue;

        const usdValueNum = Math.round(maxBtc * btcPrice);
        const largestOut = vouts.find((v: any) => v.value === maxSats);
        const toAddr = largestOut?.scriptpubkey_address ?? '';
        const to = shortenAddr(toAddr);
        const blockTs = (block.timestamp ?? 0) * 1000;

        results.push({
          id: tx.txid,
          chain: 'bitcoin',
          coin: 'BTC',
          amount: `${maxBtc.toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC`,
          usdValue: fmtUsd(usdValueNum),
          usdValueNum,
          type: 'transfer' as const,
          from: 'Unknown',
          to,
          txHash: tx.txid,
          minsAgo: Math.max(0, Math.floor((Date.now() - blockTs) / 60_000)),
          source: 'mempool',
        });
      }
    }

    return results.sort((a, b) => b.usdValueNum - a.usdValueNum).slice(0, 6);
  } catch {
    return [];
  }
}

// ── Route handler ──────────────────────────────────────────────
export const revalidate = 60;

export async function GET() {
  try {
    const [waResult, ethResult, btcResult] = await Promise.allSettled([
      fetchWhaleAlert(),
      fetchEthWhales(),
      fetchBtcWhales(),
    ]);

    const waData  = waResult.status  === 'fulfilled' ? waResult.value  : [];
    const ethData = ethResult.status === 'fulfilled' ? ethResult.value : [];
    const btcData = btcResult.status === 'fulfilled' ? btcResult.value : [];

    // Whale Alert is gold standard — use exclusively if available
    let combined: any[];
    if (waData.length > 0) {
      combined = waData;
    } else {
      // Merge on-chain sources, dedup by id
      const seen = new Set<string>();
      combined = [...ethData, ...btcData].filter(tx => {
        if (seen.has(tx.id)) return false;
        seen.add(tx.id);
        return true;
      });
    }

    combined.sort((a, b) => a.minsAgo - b.minsAgo || b.usdValueNum - a.usdValueNum);

    const sources = {
      whaleAlert: waData.length > 0,
      etherscan:  ethData.length > 0,
      mempool:    btcData.length > 0,
    };

    return NextResponse.json({ alerts: combined.slice(0, 20), sources });
  } catch (e) {
    console.error('whales route error:', e);
    return NextResponse.json({ alerts: [], sources: {} }, { status: 500 });
  }
}
