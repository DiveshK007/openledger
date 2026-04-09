import { WhaleAlert, WalletHolding } from '@/types';

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

export const MOCK_WHALE_ALERTS: WhaleAlert[] = [
  { id: "1", coin: "BTC", amount: "1,200 BTC", usdValue: "$118.4M", type: "transfer", from: "Unknown", to: "Coinbase", timestamp: new Date(Date.now() - 2 * 60000) },
  { id: "2", coin: "ETH", amount: "24,500 ETH", usdValue: "$58.2M", type: "exchange outflow", from: "Binance", to: "Unknown", timestamp: new Date(Date.now() - 7 * 60000) },
  { id: "3", coin: "SOL", amount: "380,000 SOL", usdValue: "$31.5M", type: "transfer", from: "Unknown", to: "Unknown", timestamp: new Date(Date.now() - 12 * 60000) },
  { id: "4", coin: "BTC", amount: "890 BTC", usdValue: "$87.7M", type: "exchange inflow", from: "Unknown", to: "Kraken", timestamp: new Date(Date.now() - 18 * 60000) },
  { id: "5", coin: "LINK", amount: "2.1M LINK", usdValue: "$26.8M", type: "transfer", from: "Jump Trading", to: "Unknown", timestamp: new Date(Date.now() - 25 * 60000) },
  { id: "6", coin: "ETH", amount: "12,000 ETH", usdValue: "$28.5M", type: "exchange outflow", from: "Coinbase", to: "Unknown", timestamp: new Date(Date.now() - 31 * 60000) },
  { id: "7", coin: "AAVE", amount: "450,000 AAVE", usdValue: "$19.4M", type: "transfer", from: "Unknown", to: "Unknown", timestamp: new Date(Date.now() - 44 * 60000) },
  { id: "8", coin: "BTC", amount: "340 BTC", usdValue: "$33.5M", type: "exchange inflow", from: "Unknown", to: "Binance", timestamp: new Date(Date.now() - 57 * 60000) },
];

export const MOCK_PORTFOLIO_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

export const MOCK_PORTFOLIO_HOLDINGS: WalletHolding[] = [
  { symbol: "BTC", name: "Bitcoin",   balance: 0.42,  usdValue: 41360, change24h: 4.2  },
  { symbol: "ETH", name: "Ethereum",  balance: 3.8,   usdValue: 9044,  change24h: -1.8 },
  { symbol: "SOL", name: "Solana",    balance: 124,   usdValue: 10292, change24h: 7.3  },
  { symbol: "LINK", name: "Chainlink",balance: 890,   usdValue: 11368, change24h: 2.1  },
  { symbol: "UNI", name: "Uniswap",   balance: 320,   usdValue: 3072,  change24h: -3.4 },
];
