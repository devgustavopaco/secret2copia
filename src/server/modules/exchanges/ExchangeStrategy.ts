import { Orderbook } from "../../router/orderbook";

export interface Exchange {
  name: string;
  coinName?: string;
  bids?: {
    price: number;
    amount: number;
    exchangeUrl?: string;
    exchangeFee?: number;
  }[];
  asks?: {
    price: number;
    amount: number;
    exchangeUrl?: string;
    exchangeFee?: number;
  }[];
  image_url?: string;
  isUSD?: boolean;
  ticker?: string;
  coinImage?: string;
  coinTax?: number;
  exchangeUrl?: string;

  exchangeFee?: number;
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
    isFanToken?: boolean,
    exchangeFee?: number
  ): Promise<Exchange>;
  convertOrderbook(
    pair: string,
    isFanToken?: boolean
  ): Orderbook | Promise<Orderbook>;
}
