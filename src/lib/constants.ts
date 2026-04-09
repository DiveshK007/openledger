import { WalletHolding } from '@/types';

export const TRACKED_COINS = [
  "bitcoin", "ethereum", "solana", "chainlink",
  "uniswap", "aave", "the-graph", "matic-network"
];

export const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL",
  chainlink: "LINK", uniswap: "UNI", aave: "AAVE",
  "the-graph": "GRT", "matic-network": "MATIC"
};

export const COIN_BADGE_COLORS: Record<string, string> = {
  BTC: "#ffc107", ETH: "#627eea", SOL: "#14f195",
  LINK: "#2b61f6", UNI: "#ff007a", AAVE: "#b6509e",
  GRT: "#6f4cff", MATIC: "#8247e5"
};

// Definitions use minsAgo so timestamps are always computed fresh at render time
export interface WhaleAlertDef {
  id: string;
  coin: string;
  amount: string;
  usdValue: string;
  type: 'transfer' | 'exchange inflow' | 'exchange outflow';
  from: string;
  to: string;
  minsAgo: number;
}

export const WHALE_ALERT_DEFS: WhaleAlertDef[] = [
  { id: "1",  coin: "BTC",  amount: "1,200 BTC",     usdValue: "$118.4M", type: "transfer",         from: "Unknown",       to: "Coinbase",  minsAgo: 2  },
  { id: "2",  coin: "ETH",  amount: "24,500 ETH",    usdValue: "$58.2M",  type: "exchange outflow", from: "Binance",       to: "Unknown",   minsAgo: 7  },
  { id: "3",  coin: "SOL",  amount: "380,000 SOL",   usdValue: "$31.5M",  type: "transfer",         from: "Unknown",       to: "Unknown",   minsAgo: 12 },
  { id: "4",  coin: "BTC",  amount: "890 BTC",       usdValue: "$87.7M",  type: "exchange inflow",  from: "Unknown",       to: "Kraken",    minsAgo: 18 },
  { id: "5",  coin: "LINK", amount: "2.1M LINK",     usdValue: "$26.8M",  type: "transfer",         from: "Jump Trading",  to: "Unknown",   minsAgo: 25 },
  { id: "6",  coin: "ETH",  amount: "12,000 ETH",    usdValue: "$28.5M",  type: "exchange outflow", from: "Coinbase",      to: "Unknown",   minsAgo: 31 },
  { id: "7",  coin: "AAVE", amount: "450,000 AAVE",  usdValue: "$19.4M",  type: "transfer",         from: "Unknown",       to: "Unknown",   minsAgo: 44 },
  { id: "8",  coin: "BTC",  amount: "340 BTC",       usdValue: "$33.5M",  type: "exchange inflow",  from: "Unknown",       to: "Binance",   minsAgo: 57 },
  { id: "9",  coin: "UNI",  amount: "3.8M UNI",      usdValue: "$14.2M",  type: "exchange outflow", from: "Alameda",       to: "Unknown",   minsAgo: 63 },
  { id: "10", coin: "MATIC",amount: "28M MATIC",     usdValue: "$11.8M",  type: "transfer",         from: "Unknown",       to: "Polygon Bridge", minsAgo: 71 },
  { id: "11", coin: "AAVE", amount: "210,000 AAVE",  usdValue: "$9.1M",   type: "exchange inflow",  from: "Unknown",       to: "OKX",       minsAgo: 84 },
  { id: "12", coin: "SOL",  amount: "210,000 SOL",   usdValue: "$17.4M",  type: "exchange inflow",  from: "Unknown",       to: "FTX Estate",minsAgo: 92 },
];

// For backwards compat — generate live timestamps on every call
export function getLiveWhaleAlerts() {
  return WHALE_ALERT_DEFS.map(d => ({
    ...d,
    timestamp: new Date(Date.now() - d.minsAgo * 60 * 1000),
  }));
}

// Keep a static export for places that just need the data shape
export const MOCK_WHALE_ALERTS = getLiveWhaleAlerts();

export const MOCK_PORTFOLIO_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

export const MOCK_PORTFOLIO_HOLDINGS: WalletHolding[] = [
  { symbol: "BTC",  name: "Bitcoin",   balance: 0.42, usdValue: 41360, change24h: 4.2  },
  { symbol: "ETH",  name: "Ethereum",  balance: 3.8,  usdValue: 9044,  change24h: -1.8 },
  { symbol: "SOL",  name: "Solana",    balance: 124,  usdValue: 10292, change24h: 7.3  },
  { symbol: "LINK", name: "Chainlink", balance: 890,  usdValue: 11368, change24h: 2.1  },
  { symbol: "UNI",  name: "Uniswap",   balance: 320,  usdValue: 3072,  change24h: -3.4 },
];
