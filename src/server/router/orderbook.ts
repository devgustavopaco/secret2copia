import { z } from "zod";
import { CoinsSingleton, ExchangeCoinsRawResult } from "../CoinsSingleton";
import { ServerSingleton } from "../ServerSingleton";
import type {
  Exchange,
  ExchangeStrategy,
} from "../modules/exchanges/ExchangeStrategy";
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
  GeminiStategy,
  HitBTCStrategy,
  HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy,
  LatokenStrategy,
  LbkexStrategy,
  MercadoBitcoinStrategy,
  MexcStrategy,
  NovaDAXStrategy,
  OkxStrategy,
  P2PB2BStrategy,
  PhemexStrategy,
  PionexStrategy,
  PolonieskStrategy,
  ProbitStrategy,
  WhitebitStrategy,
  WooStrategy,
  XTStrategy,
  ZtbStrategy,
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
  poloniex: new PolonieskStrategy(),
  bitstamp: new BitstampStrategy(),
  bitget: new BidgetStrategy(),
  okx: new OkxStrategy(),
  bitcointrade: new BitcoinTradeStrategy(),
  gateio: new GateIoTradeStrategy(),
  foxbit: new FoxBitStrategy(),
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

const exchangeSchema = z.object({
  name: z.string(),
  id: z.string(),
});

const fetchOrderbook = async (
  exchangesAndCoins: ExchangeCoinsRawResult[]
): Promise<Exchange[]> => {
  const orderBookPromises: Promise<Exchange>[] = [];

  for (const exchangeAndCoin of exchangesAndCoins) {
    const exchangeStrategy = exchangeStrategies[exchangeAndCoin.exchangeName];

    if (exchangeStrategy) {
      const coinPair = exchangeStrategy.formatPair(
        exchangeAndCoin.ticker,
        "usdt",
        exchangeAndCoin.isFanToken === 0 ? false : true
      );

      const promise = exchangeStrategy
        .fetchOrderbook(
          coinPair,
          exchangeAndCoin.ticker,
          exchangeAndCoin.exchangeName,
          exchangeAndCoin.exchangeType,
          exchangeAndCoin.isFanToken === 0 ? false : true
        )
        .then((result) => ({
          ...result,
          coinImage: exchangeAndCoin.imageUrl,
          coinName: exchangeAndCoin.coinName,
          exchangeUrl: exchangeAndCoin.exchangeUrl,
        }));

      orderBookPromises.push(promise);
    }
  }

  const results = await Promise.allSettled(orderBookPromises);

  const orderBooks = results.reduce((acc, result) => {
    if (result.status === "fulfilled") {
      acc.push(result.value);
    }
    return acc;
  }, [] as Exchange[]);

  return orderBooks;
};

export const orderbookRouter = createRouter()
  .query("getOrderbook", {
    input: z.object({
      buyExchanges: z.array(exchangeSchema),
      sellExchanges: z.array(exchangeSchema),
    }),
    async resolve({ ctx, input }) {
      if (!input) {
        // console.log('Sending empty orderbook')
        return {
          orderbook: new Array<Exchange | undefined>(),
        };
      }

      const { buyExchanges, sellExchanges } = input;

      if (buyExchanges.length === 0 || sellExchanges.length === 0) {
        // console.log('Sending empty orderbook: empty buy or sell exchanges')
        return {
          orderbook: new Array<Exchange | undefined>(),
        };
      }

      const coinsSingleton = CoinsSingleton.getInstance();

      const exchangesAndCoins =
        await coinsSingleton.updateCoinsBasedOnExchangeIds(
          buyExchanges.map((exchange) => exchange.id),
          sellExchanges.map((exchange) => exchange.id)
        );

      const orderbook = await fetchOrderbook(exchangesAndCoins);

      return { orderbook };
    },
  })

  .query("getDollar", {
    async resolve({ ctx }) {
      return await ServerSingleton.getInstance().getDollar();
    },
  });
