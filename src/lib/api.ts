import { CoinMarket, GlobalStats, FearGreedData, Protocol, WalletHolding } from '@/types';

const COINGECKO = 'https://api.coingecko.com/api/v3';
const TRACKED = 'bitcoin,ethereum,solana,chainlink,uniswap,aave,the-graph,matic-network';

export async function fetchMarkets(): Promise<CoinMarket[]> {
  try {
    const res = await fetch(
      `${COINGECKO}/coins/markets?vs_currency=usd&ids=${TRACKED}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchCoinChart(coinId: string): Promise<number[]> {
  try {
    const res = await fetch(
      `${COINGECKO}/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.prices as [number, number][]).map(([, price]) => price);
  } catch {
    return [];
  }
}

export async function fetchGlobalStats(): Promise<GlobalStats | null> {
  try {
    const res = await fetch(`${COINGECKO}/global`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const d = json.data;
    return {
      total_market_cap_usd: d.total_market_cap.usd,
      total_volume_usd: d.total_volume.usd,
      market_cap_change_24h: d.market_cap_change_percentage_24h_usd,
      btc_dominance: d.market_cap_percentage.btc,
    };
  } catch {
    return null;
  }
}

export async function fetchFearGreed(): Promise<FearGreedData | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=30');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items: Array<{ value: string; value_classification: string; timestamp: string }> = json.data;
    return {
      value: parseInt(items[0].value, 10),
      classification: items[0].value_classification,
      history: items.map(i => ({
        value: parseInt(i.value, 10),
        classification: i.value_classification,
        timestamp: i.timestamp,
      })),
    };
  } catch {
    return null;
  }
}

export async function fetchTopProtocols(): Promise<Protocol[]> {
  try {
    const res = await fetch('https://api.llama.fi/protocols');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data as Array<{
      name: string;
      tvl: number;
      change_1d?: number;
      change_7d?: number;
      category?: string;
    }>)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        tvl: p.tvl,
        change_1d: p.change_1d ?? 0,
        change_7d: p.change_7d ?? 0,
        category: p.category ?? 'DeFi',
      }));
  } catch {
    return [];
  }
}

export async function fetchEthWallet(address: string): Promise<WalletHolding[]> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
    const [tokenRes, ethRes] = await Promise.all([
      fetch(`https://api.etherscan.io/api?module=account&action=tokenlist&address=${address}&apikey=${apiKey}`),
      fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`),
    ]);
    const tokenData = await tokenRes.json();
    const ethData = await ethRes.json();
    const holdings: WalletHolding[] = [];

    const ethBalance = parseFloat(ethData.result) / 1e18;
    if (ethBalance > 0) {
      holdings.push({ symbol: 'ETH', name: 'Ethereum', balance: ethBalance, usdValue: null, change24h: null });
    }

    if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
      for (const t of tokenData.result.slice(0, 20)) {
        const bal = parseFloat(t.balance) / Math.pow(10, parseInt(t.tokenDecimal || '18'));
        if (bal > 0) {
          holdings.push({ symbol: t.tokenSymbol, name: t.tokenName, balance: bal, usdValue: null, change24h: null });
        }
      }
    }
    return holdings;
  } catch {
    return [];
  }
}

export async function fetchSolWallet(address: string): Promise<WalletHolding[]> {
  try {
    const apiKey = process.env.SOLSCAN_API_KEY || '';
    const headers: Record<string, string> = apiKey ? { 'token': apiKey } : {};
    const baseUrl = apiKey
      ? `https://pro-api.solscan.io/v1.0/account/tokens?account=${address}`
      : `https://api.solscan.io/account/tokens?address=${address}`;
    const res = await fetch(baseUrl, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.data ?? [];
    return items.slice(0, 20).map((t: {
      tokenSymbol?: string;
      tokenName?: string;
      tokenAmount?: { uiAmount?: number };
    }) => ({
      symbol: t.tokenSymbol ?? 'Unknown',
      name: t.tokenName ?? 'Unknown',
      balance: t.tokenAmount?.uiAmount ?? 0,
      usdValue: null,
      change24h: null,
    }));
  } catch {
    return [];
  }
}
