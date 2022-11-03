import {
  BinanceStrategy,
  BitfinexStrategy,
  BitsoStrategy,
  BrasilBitcoinStrategy, ByBitStrategy, ChilizStrategy,
  CoinBaseStrategy,
  CoinextStrategy,
  CryptoComStrategy,
  GeminiStategy,
  HitBTCStrategy,
  HotBitStrategy, HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy,
  MercadoBitcoinStrategy
} from '../modules/exchanges/Exchanges'
import {
  ExchangeStrategy
} from '../modules/exchanges/ExchangeStrategy'
import { createRouter } from './context'

const exchanges = [
  'Binance', // Feito
  'Bitso', // Feito
  'BrasilBitcoin', // Feito
  'BitcoinTrade', // Precisa de um token https://apidocs.bitcointrade.com.br/#operation/GetBookOrders
  'Coinbase', // Feito
  'Chiliz', // Feito
  'Coinext', // Feito, mas muito ruim
  'Crypto.com', // Feito
  'FTX', // Precisa de um token https://docs.ftx.com/?python#get-open-orders
  'Foxbit', // Só por websocket
  'Gemini', // Feito
  'Huobi', // Feito
  'Kraken', // Feito
  'KuCoin', // Feito
  'NovaDAX', // Feito
  'Mercado Bitcoin', // Feito
  'HitBTC', // Feito
  'Bitfinex', // Feito
  'HotBit', // Feito
]

interface Operation {
  coin: {
    name: string
    symbol: string
  }
  buyExchange: {
    name: string
    price: number
    bids: {
      price: number
      amount: number
      value: number
    }[]
  }
  sellExchange: {
    name: string
    price: number
    asks: {
      price: number
      amount: number
      value: number
    }[]
  }
  taxes: string
  spread: number
}

interface Exchange {
  name: string
  bid: {
    price: number
    amount: number
  }
  ask: {
    price: number
    amount: number
  }
}

const exchangeStrategies: ExchangeStrategy[] = [
  new BinanceStrategy(),
  new BitsoStrategy(),
  new BrasilBitcoinStrategy(),
  new CoinBaseStrategy(),
  new ChilizStrategy(),
  new CoinextStrategy(),
  new CryptoComStrategy(),
  new GeminiStategy(),
  new HuobiStrategy(),
  new KrakenStrategy(),
  new KuCoinStratefy(),
  // new NovaDAXStrategy(),
  new MercadoBitcoinStrategy(),
  new HitBTCStrategy(),
  new BitfinexStrategy(),
  new HotBitStrategy(),
  new ByBitStrategy()
]

export const tickerRouter = createRouter().query('getAll', {
  async resolve({ ctx }) {
    const ticker: Exchange[] = []

    const promisesArray = exchangeStrategies.map(async (exchangeStrategy) => {
      const coinPair = exchangeStrategy.formatPair('btc', 'usdt')

      return exchangeStrategy.fetchOrderbook(coinPair).then((exchangeData) => {
        return exchangeData
      })
    })

    const results = await Promise.allSettled(promisesArray)
    return results
  },
})
