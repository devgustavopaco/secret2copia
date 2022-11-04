import {
  BinanceStrategy,
  BitfinexStrategy, BitmartStrategy, BitsoStrategy,
  BrasilBitcoinStrategy, ByBitStrategy, ChilizStrategy,
  CoinBaseStrategy,
  CoinextStrategy,
  CryptoComStrategy, GeminiStategy, GTOStrategy, HitBTCStrategy, HotBitStrategy, HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy, MercadoBitcoinStrategy, MexcStrategy, PolonieskStrategy
} from '../modules/exchanges/Exchanges'
import {
  ExchangeStrategy
} from '../modules/exchanges/ExchangeStrategy'
import { createRouter } from './context'


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
  new MexcStrategy(),
  new MercadoBitcoinStrategy(),
  new HitBTCStrategy(),
  new BitfinexStrategy(),
  new HotBitStrategy(),
  new ByBitStrategy(),
  new GTOStrategy(),
  new PolonieskStrategy(),
  new BitmartStrategy()
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
