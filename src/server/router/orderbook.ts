import { createRouter } from './context'
import fetch from 'node-fetch'
import {
  BinanceStrategy,
  BitfinexStrategy,
  BitsoStrategy,
  BrasilBitcoinStrategy,
  ChilizStrategy,
  CoinBaseStrategy,
  CoinextStrategy,
  CryptoComStrategy,
  GeminiStategy,
  HitBTCStrategy,
  HotBitStrategy,
  HuobiStrategy,
  KrakenStrategy,
  KuCoinStratefy,
  MercadoBitcoinStrategy,
  NovaDAXStrategy,
} from '../modules/exchanges/Exchanges'
import {
  ExchangeStrategy,
  OrderbookContext,
} from '../modules/exchanges/ExchangeStrategy'

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

/* const exchangeStrategies: { [key: string]: ExchangeStrategy } = {
  binance: new BinanceStrategy(),
  bitso: new BitsoStrategy(),
  brasilbitcoin: new BrasilBitcoinStrategy(),
  coinbase: new CoinBaseStrategy(),
  chiliz: new ChilizStrategy(),
  coinext: new CoinextStrategy(),
  crypto: new CryptoComStrategy(),
  gemini: new GeminiStategy(),
  huobi: new HuobiStrategy(),
  kraken: new KrakenStrategy(),
  kucoin: new KuCoinStratefy(),
  // novadax: new NovaDAXStrategy(),
  mercadobitcoin: new MercadoBitcoinStrategy(),
  hitbtc: new HitBTCStrategy(),
  bitfinex: new BitfinexStrategy(),
  hotbit: new HotBitStrategy(),
} */

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
]

export const orderbookRouter = createRouter().query('getAll', {
  async resolve({ ctx }) {
    const orderBookPromises: Promise<Exchange>[] = []

    for (const exchangeStrategy of exchangeStrategies) {
      const coinPair = exchangeStrategy.formatPair('btc', 'usdt')
      orderBookPromises.push(exchangeStrategy.fetchOrderbook(coinPair))
    }

    const results = await Promise.allSettled(orderBookPromises)

    const orderBooks = results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
    })

    // const lowestAsk = orderBooks.reduce(
    //   (acc, book) => {
    //     if (book?.ask) {
    //       if (book.ask.price < acc.price) {
    //         return { exchange: book.name, ...book.ask }
    //       }
    //     }
    //     return acc
    //   },
    //   { exchange: '', price: 0, amount: 0 }
    // )

    const lowestAsk = orderBooks.reduce(
      (acc, book) => {
        if (book?.ask) {
          if (book.ask.price < acc.price) {
            return { exchange: book.name, ...book.ask }
          }
        }
        return acc
      },
      { exchange: '', price: 9999999999999, amount: 0 }
    )

    const highestBid = orderBooks.reduce(
      (acc, book) => {
        if (book?.bid) {
          if (book.bid.price > acc.price) {
            return { exchange: book.name, ...book.bid }
          }
        }
        return acc
      },
      { exchange: '', price: 0, amount: 0 }
    )

    return {
      coin: 'bitcoin',
      ticker: 'btc',
      lowestAsk,
      highestBid,
    }
  },
})
