import {
  AscendexStrategy,
  BidgetStrategy,
  BinanceStrategy,
  BitcoinTradeStrategy,
  BitfinexStrategy,
  BithumpStrategy,
  BitmexStrategy,
  BitrueStrategy,
  BitsoStrategy,
  BitstampStrategy,
  BkexStrategy,
  BrasilBitcoinStrategy,
  BtcexStrategy,
  ByBitStrategy,
  CexStrategy,
  ChilizStrategy,
  CoinBaseStrategy,
  CoincheckStrategy,
  CoinextStrategy,
  CoinwStrategy,
  CryptoComStrategy,
  DigifinexStrategy,
  FoxBitStrategy,
  GateIoTradeStrategy,
  GeminiStategy,
  HitBTCStrategy,
  HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy,
  LbkexStrategy,
  MercadoBitcoinStrategy,
  MexcStrategy,
  NovaDAXStrategy,
  OkxStrategy,
  P2PB2BStrategy,
  PhemexStrategy,
  PolonieskStrategy,
  ProbitStrategy,
  XTStrategy
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
  new CexStrategy(),
  new BitmexStrategy(),
  new GeminiStategy(),
  new BithumpStrategy(),
  new ProbitStrategy(),
  new P2PB2BStrategy(),
  new HuobiStrategy(),
  new KrakenStrategy(),
  new KuCoinStratefy(),
  new NovaDAXStrategy(),
  new MexcStrategy(),
  new MercadoBitcoinStrategy(),
  new HitBTCStrategy(),
  new BitfinexStrategy(),
  new DigifinexStrategy(),
  new ByBitStrategy(),
  new CoinwStrategy(),
  new PolonieskStrategy(),
  new BitstampStrategy(),
  new XTStrategy(),
  new BidgetStrategy(),
  new PhemexStrategy(),
  new OkxStrategy(),
  new CoincheckStrategy(),
  new BitcoinTradeStrategy(),
  new AscendexStrategy(),
  new LbkexStrategy(),
  new BkexStrategy(),
  new BitrueStrategy(),
  new BtcexStrategy(),
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
