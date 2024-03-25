import { Orderbook } from "../../router/orderbook";

export interface Exchange {
  name: string;
  coinName?: string;
  bids?: {
    price: number;
    amount: number;
    exchangeUrl?: string;
  }[];
  asks?: {
    price: number;
    amount: number;
    exchangeUrl?: string;
  }[];
  image_url?: string;
  isUSD?: boolean;
  ticker?: string;
  coinImage?: string;
  exchangeUrl?: string;
  isFanToken?: boolean;
  exchangeType: "buy" | "sell";
}

export interface Ticker {
  symbol: string;
  price: string;
}

export interface ExchangeStrategy {
  formatPair(
    baseToken: string,
    destinationToken: string,
    isFanToken?: boolean
  ): string;
  fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken?: boolean
  ): Promise<Exchange>;
  convertOrderbook(
    pair: string,
    isFanToken?: boolean
  ): Orderbook | Promise<Orderbook>;
}
