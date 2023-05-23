import { z } from "zod";
import { CoinsSingleton } from "../CoinsSingleton";
import { ExchangesSingleton } from "../ExchangesSingleton";
import { ServerSingleton } from "../ServerSingleton";
import type {
  Exchange,
  ExchangeStrategy,
} from "../modules/exchanges/ExchangeStrategy";
import {
  BidgetStrategy,
  BinanceStrategy,
  BitcoinTradeStrategy,
  BitfinexStrategy,
  BitmartStrategy,
  BitsoStrategy,
  BrasilBitcoinStrategy,
  ByBitStrategy,
  ChilizStrategy,
  CoinBaseStrategy,
  CryptoComStrategy,
  GateIoTradeStrategy,
  GeminiStategy,
  HitBTCStrategy,
  HotBitStrategy,
  HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy,
  MercadoBitcoinStrategy,
  MexcStrategy,
  NovaDAXStrategy,
  OkxStrategy,
  PolonieskStrategy,
} from "../modules/exchanges/Exchanges";
import { createRouter } from "./context";

interface StrategyObject {
  [key: string]: ExchangeStrategy;
}

const exchangeStrategies: StrategyObject = {
  binance: new BinanceStrategy(),
  bitso: new BitsoStrategy(),
  brasilbitcoin: new BrasilBitcoinStrategy(),
  coinbase: new CoinBaseStrategy(),
  chiliz: new ChilizStrategy(),
  // coinext: new CoinextStrategy(),
  cryptocom: new CryptoComStrategy(),
  gemini: new GeminiStategy(),
  huobi: new HuobiStrategy(),
  kraken: new KrakenStrategy(),
  kucoin: new KuCoinStratefy(),
  novadax: new NovaDAXStrategy(),
  mercadobitcoin: new MercadoBitcoinStrategy(),
  hitbtc: new HitBTCStrategy(),
  bitfinex: new BitfinexStrategy(),
  hotbit: new HotBitStrategy(),
  bybit: new ByBitStrategy(),
  mexc: new MexcStrategy(),
  poloniex: new PolonieskStrategy(),
  bistamp: new BitmartStrategy(),
  bidget: new BidgetStrategy(),
  okx: new OkxStrategy(),
  bitcointrade: new BitcoinTradeStrategy(),
  gateio: new GateIoTradeStrategy(),
};

export interface OrderbookOperation {
  price: number;
  amount: number;
  sumVolume: number;
}

export interface Orderbook {
  bids: OrderbookOperation[];
  asks: OrderbookOperation[];
}

export interface ArbitrageOpportunity {
  coin: string;
  coinImage?: string;
  ticker: string;
  lowestAsk: {
    exchange: string;
    price: number;
    amount: number;
    isUSD: boolean;
    image_url?: string;
    orderbook: Orderbook;
  };
  highestBid: {
    exchange: string;
    price: number;
    amount: number;
    isUSD: boolean;
    image_url?: string;
    orderbook: Orderbook;
  };
  tax: number;
  fee: number;
  spread: number;
}

interface FilteredOrderbook {
  exchange: string;
  price: number;
  amount: number;
  isUSD: boolean;
  image_url?: string;
  orderbook: Orderbook;
}

const formatExchangeName = (exchange: string): string => {
  return exchange.toLowerCase().replace(/\s/g, "");
};

const fetchArbitrageOpportunity = async (
  coin: {
    name: string;
    ticker: string;
    isFanToken: boolean;
    imageUrl?: string;
  },
  buyExchanges: string[],
  sellExchanges: string[],
  taxes: {
    exchange: {
      name: string;
      fee: number;
      image_url: string | null;
      convert: boolean;
    };
    tax: number;
  }[]
): Promise<ArbitrageOpportunity> => {
  const { name, ticker, isFanToken, imageUrl } = coin;

  const orderBookPromises: Promise<Exchange>[] = [];

  var uniqueExchanges = Array.from(
    new Set([...buyExchanges, ...sellExchanges])
  ).map((exchange) => formatExchangeName(exchange));

  for (const exchange of uniqueExchanges) {
    const exchangeStrategy = exchangeStrategies[exchange];
    if (exchangeStrategy) {
      const coinPair = exchangeStrategy.formatPair(ticker, "usdt", isFanToken);

      orderBookPromises.push(
        exchangeStrategy.fetchOrderbook(coinPair, isFanToken)
      );
    }
  }

  const results = await Promise.allSettled(orderBookPromises);

  const orderBooks = results.reduce((acc, result) => {
    if (result.status === "fulfilled") {
      acc.push(result.value);
    }
    return acc;
  }, [] as Exchange[]);

  const dollarPrice = await ServerSingleton.getInstance().getDollar();

  // Lowest buy price
  const lowestAsk = orderBooks.reduce(
    (acc, exchange) => {
      const isContained = buyExchanges.some(
        (element) =>
          formatExchangeName(element) ===
          formatExchangeName(exchange.name.toLowerCase())
      );
      if (isContained) {
        const priceInUSD = exchange.isUSD
          ? exchange.ask.price
          : exchange.ask.price / dollarPrice;

        if (priceInUSD < acc.price) {
          return {
            exchange: exchange.name,
            isUSD: exchange.isUSD,
            image_url: exchange.image_url,
            orderbook: acc.orderbook,
            ...exchange.ask,
          };
        }
      }
      return acc;
    },
    {
      exchange: "",
      price: 9999999999999,
      amount: 0,
      image_url: undefined,
      isUSD: true,
    } as FilteredOrderbook
  );

  // Highest sell price
  const highestBid = orderBooks.reduce(
    (acc, exchange) => {
      const isContained = sellExchanges.some(
        (element) =>
          formatExchangeName(element) ===
          formatExchangeName(exchange.name.toLowerCase())
      );

      const notSelectedBuyExchange =
        formatExchangeName(lowestAsk.exchange) !==
        formatExchangeName(exchange.name);

      if (isContained && notSelectedBuyExchange) {
        const priceInUSD = exchange.isUSD
          ? exchange.bid.price
          : exchange.bid.price / dollarPrice;

        if (priceInUSD > acc.price) {
          return {
            exchange: exchange.name,
            isUSD: exchange.isUSD,
            image_url: exchange.image_url,
            orderbook: acc.orderbook,
            ...exchange.bid,
          };
        }
      }
      return acc;
    },
    {
      exchange: "",
      price: 0,
      amount: 0,
      image_url: undefined,
      isUSD: true,
      orderbook: {},
    } as FilteredOrderbook
  );

  const lowestAskExchangeName = formatExchangeName(lowestAsk.exchange);
  const lowestAskPair = exchangeStrategies[lowestAskExchangeName]!.formatPair(
    ticker,
    "usdt",
    isFanToken
  );
  lowestAsk.orderbook = exchangeStrategies[
    lowestAskExchangeName
  ]!.convertOrderbook(lowestAskPair, isFanToken);

  const highestBidExchangeName = formatExchangeName(highestBid.exchange);
  const highestBidPair = exchangeStrategies[highestBidExchangeName]!.formatPair(
    ticker,
    "usdt",
    isFanToken
  );
  highestBid.orderbook = exchangeStrategies[
    highestBidExchangeName
  ]!.convertOrderbook(highestBidPair, isFanToken);

  const lowestAskTax = taxes.find(
    (tax) =>
      tax.exchange.name.toLowerCase().trim() ===
      lowestAsk.exchange.toLowerCase().trim()
  );
  const highestBidTax = taxes.find(
    (tax) => tax.exchange.name === highestBid.exchange
  );

  const exchanges = ExchangesSingleton.getInstance().exchanges;

  //console.table(exchanges)

  const lowestAskExchange = exchanges.find(
    (exchange) =>
      exchange.name.toLowerCase().trim() ===
      lowestAsk.exchange.toLowerCase().trim()
  );
  const highestBidExchange = exchanges.find(
    (exchange) =>
      exchange.name.toLowerCase().trim() ===
      highestBid.exchange.toLowerCase().trim()
  );

  const lowestAskFee = lowestAskExchange?.fee ?? 0;
  const highestBidFee = highestBidExchange?.fee ?? 0;

  lowestAsk.image_url = lowestAskExchange?.image_url ?? "";
  highestBid.image_url = highestBidExchange?.image_url ?? "";

  const bidPrice = highestBid.isUSD
    ? highestBid.price * dollarPrice
    : highestBid.price;
  const askPrice = lowestAsk.isUSD
    ? lowestAsk.price * dollarPrice
    : lowestAsk.price;

  const spread = (bidPrice - askPrice) / askPrice;

  return {
    coin: name,
    coinImage: imageUrl,
    ticker,
    lowestAsk,
    highestBid,
    tax: (lowestAskTax?.tax ?? 0) * lowestAsk.price,
    fee: lowestAskFee + highestBidFee,
    spread,
  };
};

export const orderbookRouter = createRouter()
  .query("getAll", {
    input: z
      .object({
        buyExchanges: z.string().array(),
        sellExchanges: z.string().array(),
      })
      .optional(),
    async resolve({ ctx, input }) {
      if (!input) {
        // console.log('Sending empty orderbook')
        return [];
      }

      const { buyExchanges, sellExchanges } = input;

      if (buyExchanges.length === 0 || sellExchanges.length === 0) {
        // console.log('Sending empty orderbook: empty buy or sell exchanges')
        return [];
      }

      let activeCoins = CoinsSingleton.getInstance().coins;

      if (activeCoins.length === 0) {
        await CoinsSingleton.getInstance().updateCoins();
      }

      activeCoins = CoinsSingleton.getInstance().coins;

      if (activeCoins.length === 0) {
        // console.log('Sending empty orderbook: no active coins')
        return [];
      }

      const arbitrageOpportunitiesPromises: Promise<ArbitrageOpportunity>[] =
        [];

      for (const coin of activeCoins) {
        arbitrageOpportunitiesPromises.push(
          fetchArbitrageOpportunity(
            {
              name: coin.name,
              ticker: coin.ticker,
              isFanToken: coin.isFanToken,
              imageUrl: coin.image_url ?? undefined,
            },
            buyExchanges,
            sellExchanges,
            coin.ExchangeCoinTax
          )
        );
      }

      const results = await Promise.allSettled(arbitrageOpportunitiesPromises);

      const arbitrageOpportunities = results.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
      });

      return arbitrageOpportunities;
    },
  })
  .query("getDollar", {
    async resolve({ ctx }) {
      return await ServerSingleton.getInstance().getDollar();
    },
  });
