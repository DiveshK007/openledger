import { CoinMarket, GlobalStats, FearGreedData, Protocol, WalletHolding } from '@/types';

// Internal proxy routes (avoid CORS + rate-limit issues on client)
const base = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as T;
  } catch (e) {
    console.warn(`apiFetch ${path} failed:`, e);
    return fallback;
  }
}

export async function fetchMarkets(): Promise<CoinMarket[]> {
  return apiFetch<CoinMarket[]>('/api/markets', []);
}

export async function fetchGlobalStats(): Promise<GlobalStats | null> {
  return apiFetch<GlobalStats | null>('/api/global', null);
}

export async function fetchFearGreed(): Promise<FearGreedData | null> {
  return apiFetch<FearGreedData | null>('/api/feargreed', null);
}

export async function fetchTopProtocols(): Promise<Protocol[]> {
  return apiFetch<Protocol[]>('/api/protocols', []);
}

export async function fetchCoinChart(coinId: string): Promise<number[]> {
  return apiFetch<number[]>(`/api/chart/${encodeURIComponent(coinId)}`, []);
}

export async function fetchPortfolio(address: string): Promise<{
  holdings: WalletHolding[];
  totalValue: number;
  pnl24h: number | null;
  pricedCount: number;
  totalCount: number;
  chain: string;
} | null> {
  return apiFetch(`/api/portfolio?address=${encodeURIComponent(address)}`, null);
}

export async function fetchEthWallet(address: string): Promise<WalletHolding[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'YourApiKeyToken';
    const [tokenRes, ethRes] = await Promise.all([
      fetch(`https://api.etherscan.io/api?module=account&action=tokenlist&address=${address}&apikey=${apiKey}`, { headers: { 'Accept': 'application/json' } }),
      fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`, { headers: { 'Accept': 'application/json' } }),
    ]);
    const tokenData = await tokenRes.json();
    const ethData = await ethRes.json();
    const holdings: WalletHolding[] = [];
    const ethBalance = parseFloat(ethData.result) / 1e18;
    if (ethBalance > 0) holdings.push({ symbol: 'ETH', name: 'Ethereum', balance: ethBalance, usdValue: null, change24h: null });
    if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
      for (const t of tokenData.result.slice(0, 20)) {
        const bal = parseFloat(t.balance) / Math.pow(10, parseInt(t.tokenDecimal || '18'));
        if (bal > 0) holdings.push({ symbol: t.tokenSymbol, name: t.tokenName, balance: bal, usdValue: null, change24h: null });
      }
    }
    return holdings;
  } catch {
    return [];
  }
}

export async function fetchSolWallet(address: string): Promise<WalletHolding[]> {
  try {
    const res = await fetch(`https://api.solscan.io/account/tokens?address=${address}`, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.data ?? [];
    return items.slice(0, 20).map((t: { tokenSymbol?: string; tokenName?: string; tokenAmount?: { uiAmount?: number } }) => ({
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
