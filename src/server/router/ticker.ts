import {
  BidgetStrategy,
  BinanceStrategy,
  BitcoinTradeStrategy,
  BitfinexStrategy,
  BitsoStrategy,
  BitstampStrategy,
  BrasilBitcoinStrategy,
  ByBitStrategy,
  ChilizStrategy,
  CoinBaseStrategy,
  CoinextStrategy,
  CryptoComStrategy,
  FoxBitStrategy,
  GateIoTradeStrategy,
  GeminiStategy,
  HitBTCStrategy,
  HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy,
  MercadoBitcoinStrategy,
  MexcStrategy,
  NovaDAXStrategy,
  OkxStrategy,
  PolonieskStrategy,
} from "../modules/exchanges/Exchanges";
import { ExchangeStrategy } from "../modules/exchanges/ExchangeStrategy";
import { createRouter } from "./context";

const exchangeStrategies: ExchangeStrategy[] = [
  new BinanceStrategy(),
  new BitsoStrategy(),
  new BrasilBitcoinStrategy(),
  new CoinBaseStrategy(),
  new ChilizStrategy(),
  new CoinextStrategy(),
  new CryptoComStrategy(),
  new FoxBitStrategy(),
  new GeminiStategy(),
  new HuobiStrategy(),
  new KrakenStrategy(),
  new KuCoinStratefy(),
  new NovaDAXStrategy(),
  new MexcStrategy(),
  new MercadoBitcoinStrategy(),
  new HitBTCStrategy(),
  new BitfinexStrategy(),
  new ByBitStrategy(),
  new PolonieskStrategy(),
  new BitstampStrategy(),
  new BidgetStrategy(),
  new OkxStrategy(),
  new BitcoinTradeStrategy(),
  new GateIoTradeStrategy(),
];

export const tickerRouter = createRouter().query("getAll", {
  async resolve({ ctx }) {
    const promisesArray = exchangeStrategies.map(async (exchangeStrategy) => {
      const coinPair = exchangeStrategy.formatPair("btc", "usdt");

      return exchangeStrategy.fetchOrderbook(coinPair).then((exchangeData) => {
        return exchangeData;
      });
    });

    const results = await Promise.allSettled(promisesArray);
    return results;
  },
});
