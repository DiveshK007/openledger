import { WalletHolding } from '@/types';

export const TRACKED_COINS = [
  "bitcoin", "ethereum", "solana", "chainlink",
  "uniswap", "aave", "the-graph", "polygon-ecosystem-token"
];

export const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL",
  chainlink: "LINK", uniswap: "UNI", aave: "AAVE",
  "the-graph": "GRT", "polygon-ecosystem-token": "POL"
};

export const COIN_BADGE_COLORS: Record<string, string> = {
  BTC: "#ffc107", ETH: "#627eea", SOL: "#14f195",
  LINK: "#2b61f6", UNI: "#ff007a", AAVE: "#b6509e",
  GRT: "#6f4cff", POL: "#8247e5"
};

// Whale alert data is now fetched live from /api/whales
// (Whale Alert API → Etherscan → mempool.space)

export const MOCK_PORTFOLIO_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

export const MOCK_PORTFOLIO_HOLDINGS: WalletHolding[] = [
  { symbol: "BTC",  name: "Bitcoin",   balance: 0.42, usdValue: 41360, change24h: 4.2  },
  { symbol: "ETH",  name: "Ethereum",  balance: 3.8,  usdValue: 9044,  change24h: -1.8 },
  { symbol: "SOL",  name: "Solana",    balance: 124,  usdValue: 10292, change24h: 7.3  },
  { symbol: "LINK", name: "Chainlink", balance: 890,  usdValue: 11368, change24h: 2.1  },
  { symbol: "UNI",  name: "Uniswap",   balance: 320,  usdValue: 3072,  change24h: -3.4 },
];
