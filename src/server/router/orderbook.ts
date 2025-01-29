import { z } from "zod";
import { CoinsSingleton } from "../CoinsSingleton";
import { ExchangesSingleton } from "../ExchangesSingleton";
import { ServerSingleton } from "../ServerSingleton";
import type {
  Exchange,
  ExchangeStrategy,
} from "../modules/exchanges/ExchangeStrategy";
//
import {
  AscendexStrategy,
  BidgetStrategy,
  BigOneStrategy,
  BinanceStrategy,
  BingxStrategy,
  BitcoinTradeStrategy,
  BitfinexStrategy,
  BitflyerStrategy,
  BitforexStrategy,
  BithumpStrategy,
  BitkubStrategy,
  BitpandaStrategy,
  BitrueStrategy,
  BitsoStrategy,
  BitstampStrategy,
  BkexStrategy,
  BlockchainStrategy,
  BrasilBitcoinStrategy,
  BtcexStrategy,
  ByBitStrategy,
  CexStrategy,
  ChilizStrategy,
  CoinBaseStrategy,
  CoincheckStrategy,
  CoinextStrategy,
  CoinsbitStrategy,
  CointrStrategy,
  CoinwStrategy,
  CryptoComStrategy,
  CryptologyStrategy,
  DYDYXStrategy,
  DextradeStrategy,
  DigifinexStrategy,
  ExmarketsStrategy,
  FoxBitStrategy,
  GateIoTradeStrategy,
  GateIoFuturesStrategy,
  GeminiStategy,
  HitBTCStrategy,
  HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy,
  LatokenStrategy,
  LbkexStrategy,
  MercadoBitcoinStrategy,
  MexcStrategy,
  MexcFuturesStrategy,
  NovaDAXStrategy,
  OkxStrategy,
  P2PB2BStrategy,
  PhemexStrategy,
  PionexStrategy,
  PolonieskStrategy,
  ProbitStrategy,
  RipioTradeStrategy,
  TokoCryptoStrategy,
  WhitebitStrategy,
  WooStrategy,
  XTStrategy,
  ZtbStrategy,
  BitgetFuturesStrategy,
  KucoinFuturesStrategy,
} from "../modules/exchanges/Exchanges";
import { createRouter } from "./context";
import { getDollarValueForUser } from "./user";

interface StrategyObject {
  [key: string]: ExchangeStrategy;
}

const exchangeStrategies: StrategyObject = {
  binance: new BinanceStrategy(),
  bitso: new BitsoStrategy(),
  brasilbitcoin: new BrasilBitcoinStrategy(),
  coinbase: new CoinBaseStrategy(),
  chiliz: new ChilizStrategy(),
  cex: new CexStrategy(),
  bithump: new BithumpStrategy(),
  probit: new ProbitStrategy(),
  p2pb2b: new P2PB2BStrategy(),
  digifinex: new DigifinexStrategy(),
  coinw: new CoinwStrategy(),
  xt: new XTStrategy(),
  phemex: new PhemexStrategy(),
  coincheck: new CoincheckStrategy(),
  ascendex: new AscendexStrategy(),
  lbank: new LbkexStrategy(),
  bkex: new BkexStrategy(),
  bitrue: new BitrueStrategy(),
  cryptocom: new CryptoComStrategy(),
  btcex: new BtcexStrategy(),
  coinsbit: new CoinsbitStrategy(),
  bingx: new BingxStrategy(),
  bigone: new BigOneStrategy(),
  gemini: new GeminiStategy(),
  whitebit: new WhitebitStrategy(),
  dextrade: new DextradeStrategy(),
  bitforex: new BitforexStrategy(),
  cryptology: new CryptologyStrategy(),
  woo: new WooStrategy(),
  latoken: new LatokenStrategy(),
  blockchain: new BlockchainStrategy(),
  bitpanda: new BitpandaStrategy(),
  cointr: new CointrStrategy(),
  exmarkets: new ExmarketsStrategy(),
  ztb: new ZtbStrategy(),
  bitflyer: new BitflyerStrategy(),
  dydyx: new DYDYXStrategy(),
  pionex: new PionexStrategy(),
  bitkub: new BitkubStrategy(),
  huobi: new HuobiStrategy(),
  kraken: new KrakenStrategy(),
  kucoin: new KuCoinStratefy(),
  novadax: new NovaDAXStrategy(),
  mercadobitcoin: new MercadoBitcoinStrategy(),
  hitbtc: new HitBTCStrategy(),
  bitfinex: new BitfinexStrategy(),
  bybit: new ByBitStrategy(),
  mexc: new MexcStrategy(),
  mexcFutures: new MexcFuturesStrategy(),
  poloniex: new PolonieskStrategy(),
  bitstamp: new BitstampStrategy(),
  bitget: new BidgetStrategy(),
  okx: new OkxStrategy(),
  bitcointrade: new BitcoinTradeStrategy(),
  gateio: new GateIoTradeStrategy(),
  gateioFutures: new GateIoFuturesStrategy(),
  foxbit: new FoxBitStrategy(),
  ripio: new RipioTradeStrategy(),
  tokocrypto: new TokoCryptoStrategy(),
  coinext: new CoinextStrategy(),
};

const futuresExchangeStrategies: { [key: string]: ExchangeStrategy } = {
  mexc: new MexcFuturesStrategy(),
  bitget: new BitgetFuturesStrategy(),
  kucoin: new KucoinFuturesStrategy(),
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
  isFutures?: boolean;
  isOpen?: boolean;
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

// Função para verificar se uma exchange suporta futures
const supportsFutures = (exchangeName: string): boolean => {
  const formattedExchange = formatExchangeName(exchangeName);
  // Verifica se existe uma estratégia de futures para esta exchange
  return !!futuresExchangeStrategies[formattedExchange];
};

const fetchArbitrageOpportunity = async (
  ctx: any,
  coin: {
    name: string;
    ticker: string;
    isFanToken: boolean;
    imageUrl?: string;
    isOpen?: boolean;
  },
  buyExchanges: string[],
  sellExchanges: string[],
  buyFuturesExchanges: string[],
  sellFuturesExchanges: string[],
  taxes: {
    exchange: {
      name: string;
      fee: number;
      image_url: string | null;
      convert: boolean;
    };
    tax: number;
  }[],
  email: string,
  isFutures: boolean
): Promise<ArbitrageOpportunity> => {
  const { name, ticker, isFanToken, imageUrl, isOpen = true } = coin;

  console.log("Iniciando fetchArbitrageOpportunity");
  console.log("buyExchanges:", buyExchanges);
  console.log("sellExchanges:", sellExchanges);
  console.log("isFutures (da seção):", isFutures);

  const orderBookPromises: Promise<Exchange>[] = [];

  // Processar exchanges de compra
  for (const exchange of buyExchanges) {
    const formattedExchange = formatExchangeName(exchange);
    const exchangeStrategy = exchangeStrategies[formattedExchange];

    if (exchangeStrategy) {
      console.log(
        `Exchange ${exchange} (buy) usando estratégia: ${exchangeStrategy.constructor.name}`
      );
      const coinPair = exchangeStrategy.formatPair(ticker, "usdt", isFanToken);
      orderBookPromises.push(
        exchangeStrategy.fetchOrderbook(coinPair, isFanToken)
      );
    }
  }

  // Processar exchanges de venda
  for (const exchange of sellExchanges) {
    const formattedExchange = formatExchangeName(exchange);
    // Se é futures, usa estratégia futures para venda
    const exchangeStrategy =
      isFutures && futuresExchangeStrategies[formattedExchange]
        ? futuresExchangeStrategies[formattedExchange]
        : exchangeStrategies[formattedExchange];

    if (exchangeStrategy) {
      console.log(
        `Exchange ${exchange} (sell) usando estratégia: ${exchangeStrategy.constructor.name}`
      );
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

  const dolarValue = await getDollarValueForUser(ctx, email);
  const dollarPrice = await ServerSingleton.getInstance().getDollar();

  const lowestAsk = orderBooks.reduce(
    (acc, exchange) => {
      const isContained = isOpen
        ? buyExchanges.some(
            (element) =>
              formatExchangeName(element) ===
              formatExchangeName(exchange.name.replace(" Futures", ""))
          )
        : sellExchanges.some(
            (element) =>
              formatExchangeName(element) ===
              formatExchangeName(exchange.name.replace(" Futures", ""))
          );

      if (isContained) {
        const priceInUSD = exchange.isUSD
          ? exchange.ask.price
          : exchange.ask.price / dolarValue;

        // Add this log

        if (
          (isOpen && priceInUSD < acc.price) ||
          (!isOpen && priceInUSD > acc.price)
        ) {
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
      price: isOpen ? 9999999999999 : 0,
      amount: 0,
      image_url: undefined,
      isUSD: true,
    } as FilteredOrderbook
  );

  const highestBid = orderBooks.reduce(
    (acc, exchange) => {
      const isContained = isOpen
        ? sellExchanges.some(
            (element) =>
              formatExchangeName(element) ===
              formatExchangeName(exchange.name.toLowerCase())
          )
        : buyExchanges.some(
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
          : exchange.bid.price / dolarValue;

        if (
          (isOpen && priceInUSD > acc.price) ||
          (!isOpen && priceInUSD < acc.price)
        ) {
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
      price: isOpen ? 0 : 9999999999999,
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
  lowestAsk.orderbook = await exchangeStrategies[
    lowestAskExchangeName
  ]!.convertOrderbook(lowestAskPair, isFanToken);

  const highestBidExchangeName = formatExchangeName(highestBid.exchange);
  const highestBidPair = exchangeStrategies[highestBidExchangeName]!.formatPair(
    ticker,
    "usdt",
    isFanToken
  );
  highestBid.orderbook = await exchangeStrategies[
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
    ? highestBid.price
    : highestBid.price / dolarValue;

  const askPrice = lowestAsk.isUSD
    ? lowestAsk.price
    : lowestAsk.price / dolarValue;

  const spread = isOpen
    ? ((bidPrice - askPrice) / askPrice) * 100
    : ((askPrice - bidPrice) / bidPrice) * 100;

  // Add this log

  return {
    coin: name,
    coinImage: imageUrl,
    ticker,
    lowestAsk,
    highestBid,
    tax: (lowestAskTax?.tax ?? 0) * lowestAsk.price,
    fee: lowestAskFee + highestBidFee,
    spread,
    isOpen,
  };
};

export const orderbookRouter = createRouter()
  .query("getAll", {
    input: z
      .object({
        buyExchanges: z.string().array(),
        sellExchanges: z.string().array(),
        buyFuturesExchanges: z.string().array().optional(),
        sellFuturesExchanges: z.string().array().optional(),
        email: z.string().optional(),
        isChecked: z.boolean().optional(),
        isOpen: z.boolean().optional(),
        isFutures: z.boolean().optional(),
      })
      .optional(),
    async resolve({ ctx, input }) {
      if (!input) {
        // console.log('Sending empty orderbook')
        return [];
      }

      const {
        buyExchanges,
        sellExchanges,
        buyFuturesExchanges = [],
        sellFuturesExchanges = [],
      } = input;

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
            ctx,
            {
              name: coin.name,
              ticker: coin.ticker,
              isFanToken: coin.isFanToken,
              imageUrl: coin.image_url ?? undefined,
              isOpen: input.isOpen,
            },
            buyExchanges,
            sellExchanges,
            buyFuturesExchanges,
            sellFuturesExchanges,
            coin.ExchangeCoinTaxFuture,
            input?.email || "",
            input.isFutures || false
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
  .query("getPaginated", {
    input: z.object({
      buyExchanges: z.string().array(),
      sellExchanges: z.string().array(),
      buyFuturesExchanges: z.string().array().optional(),
      sellFuturesExchanges: z.string().array().optional(),
      email: z.string().optional(),
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.number().nullish(),
      isChecked: z.boolean().optional(),
      isOpen: z.boolean().optional(),
      isFutures: z.boolean().optional(),
    }),
    async resolve({ ctx, input }) {
      if (!input) {
        return {
          arbitrageOpportunities: new Array<ArbitrageOpportunity | undefined>(),
          nextCursor: 1,
        };
      }

      const {
        buyExchanges,
        sellExchanges,
        buyFuturesExchanges = [],
        sellFuturesExchanges = [],
        cursor = 1,
        limit = 50,
        isFutures,
      } = input;

      if (buyExchanges.length === 0 || sellExchanges.length === 0) {
        return {
          arbitrageOpportunities: new Array<ArbitrageOpportunity | undefined>(),
          nextCursor: cursor,
        };
      }

      let activeCoins = CoinsSingleton.getInstance().coins;
      await CoinsSingleton.getInstance().updateCoins(input.isChecked);

      activeCoins = CoinsSingleton.getInstance().coins;

      const startIndex = ((cursor ?? 1) - 1) * (limit ?? 50);
      const endIndex = startIndex + (limit ?? 50);
      const paginatedCoins = activeCoins.slice(startIndex, endIndex);

      if (paginatedCoins.length === 0) {
        // console.log('Sending empty orderbook: no active coins')
        return {
          arbitrageOpportunities: new Array<ArbitrageOpportunity | undefined>(),
          nextCursor: cursor,
        };
      }

      const arbitrageOpportunitiesPromises = paginatedCoins.map((coin) =>
        fetchArbitrageOpportunity(
          ctx,
          coin,
          buyExchanges,
          sellExchanges,
          input.buyFuturesExchanges || [],
          input.sellFuturesExchanges || [],
          coin.ExchangeCoinTaxFuture,
          input.email || "",
          input.isFutures || false
        )
      );

      const results = await Promise.allSettled(arbitrageOpportunitiesPromises);

      const arbitrageOpportunities = results.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
      });

      let nextCursor = 1;
      if (endIndex < activeCoins.length) {
        nextCursor = (cursor ?? 1) + 1;
      }

      return { arbitrageOpportunities, nextCursor };
    },
  })
  //
  .query("getDollar", {
    async resolve({ ctx }) {
      return await ServerSingleton.getInstance().getDollar();
    },
  });

orderbookRouter.query("getDollarValueForUser", {
  input: z.string(),
  async resolve({ ctx, input }) {
    return await getDollarValueForUser(ctx, input);
  },
});
export { getDollarValueForUser };
