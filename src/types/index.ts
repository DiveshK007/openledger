export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
  image: string;
}

export interface GlobalStats {
  total_market_cap_usd: number;
  total_volume_usd: number;
  market_cap_change_24h: number;
  btc_dominance: number;
}

export interface FearGreedData {
  value: number;
  classification: string;
  history: Array<{ value: number; classification: string; timestamp: string }>;
}

export interface Protocol {
  name: string;
  tvl: number;
  change_1d: number;
  change_7d: number;
  category: string;
}

export interface WalletHolding {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number | null;
  change24h: number | null;
}

export interface WhaleAlert {
  id: string;
  coin: string;
  amount: string;
  usdValue: string;
  type: 'transfer' | 'exchange inflow' | 'exchange outflow';
  from: string;
  to: string;
  timestamp: Date;
}
