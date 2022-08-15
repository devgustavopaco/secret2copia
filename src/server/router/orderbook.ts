import { createRouter } from './context'
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
import type {
  Exchange,
  ExchangeStrategy,
} from '../modules/exchanges/ExchangeStrategy'
import { z } from 'zod'
import { ServerSingleton } from '../ServerSingleton'
import { PrismaClient } from '@prisma/client'
import { ExchangesSingleton } from '../ExchangesSingleton'
import { CoinsSingleton } from '../CoinsSingleton'

interface StrategyObject {
  [key: string]: ExchangeStrategy
}

const exchangeStrategies: StrategyObject = {
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
  // novada: new NovaDAXStrategy(),
  mercadobitcoin: new MercadoBitcoinStrategy(),
  hitbtc: new HitBTCStrategy(),
  bitfinex: new BitfinexStrategy(),
  hotbit: new HotBitStrategy(),
}

export interface Orderbook {
  bids: {
    price: number
    amount: number
  }[]
  asks: {
    price: number
    amount: number
  }[]
}

export interface ArbitrageOpportunity {
  coin: string
  ticker: string
  lowestAsk: {
    exchange: string
    price: number
    amount: number
    isUSD: boolean
    image_url?: string
    orderbook: Orderbook
  }
  highestBid: {
    exchange: string
    price: number
    amount: number
    isUSD: boolean
    image_url?: string
    orderbook: Orderbook
  }
  tax: number
  fee: number
  spread: number
}

interface FilteredOrderbook {
  exchange: string
  price: number
  amount: number
  isUSD: boolean
  image_url?: string
  orderbook: Orderbook
}

const formatExchangeName = (exchange: string): string => {
  return exchange.toLowerCase().replace(/\s/g, '')
}

const fetchArbitrageOpportunity = async (
  prisma: PrismaClient,
  coin: {
    name: string
    ticker: string
  },
  buyExchanges: string[],
  sellExchanges: string[],
  taxes: {
    exchange: {
      name: string
      fee: number
      image_url: string | null
      convert: boolean
    }
    tax: number
  }[]
): Promise<ArbitrageOpportunity> => {
  const { name, ticker } = coin

  const orderBookPromises: Promise<Exchange>[] = []

  var uniqueExchanges = Array.from(
    new Set([...buyExchanges, ...sellExchanges])
  ).map((exchange) => formatExchangeName(exchange))

  for (const exchange of uniqueExchanges) {
    const exchangeStrategy = exchangeStrategies[exchange]
    if (exchangeStrategy) {
      const coinPair = exchangeStrategy.formatPair(ticker, 'usdt')
      orderBookPromises.push(exchangeStrategy.fetchOrderbook(coinPair))
    }
  }

  const results = await Promise.allSettled(orderBookPromises)

  const orderBooks = results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
  })

  const dollarPrice = await ServerSingleton.getInstance().getDollar()

  // Lowest buy price
  const lowestAsk = orderBooks.reduce(
    (acc, exchange) => {
      const isContained = buyExchanges.some(
        (element) =>
          formatExchangeName(element) === (exchange?.name.toLowerCase() ?? '')
      )
      if (isContained) {
        if (exchange?.ask) {
          const priceInUSD = exchange.isUSD
            ? exchange.ask.price
            : exchange.ask.price / dollarPrice

          if (priceInUSD < acc.price) {
            return {
              exchange: exchange.name,
              isUSD: exchange.isUSD,
              image_url: exchange.image_url,
              orderbook: acc.orderbook,
              ...exchange.ask,
            }
          }
        }
      }
      return acc
    },
    {
      exchange: '',
      price: 9999999999999,
      amount: 0,
      image_url: undefined,
      isUSD: true,
    } as FilteredOrderbook
  )

  // Highest sell price
  const highestBid = orderBooks.reduce(
    (acc, exchange) => {
      const isContained = buyExchanges.some(
        (element) =>
          formatExchangeName(element) === (exchange?.name.toLowerCase() ?? '')
      )
      if (isContained) {
        if (exchange?.bid) {
          const priceInUSD = exchange.isUSD
            ? exchange.bid.price
            : exchange.bid.price / dollarPrice

          if (priceInUSD > acc.price) {
            return {
              exchange: exchange.name,
              isUSD: exchange.isUSD,
              image_url: exchange.image_url,
              orderbook: acc.orderbook,
              ...exchange.bid,
            }
          }
        }
      }
      return acc
    },
    {
      exchange: '',
      price: 0,
      amount: 0,
      image_url: undefined,
      isUSD: true,
      orderbook: {},
    } as FilteredOrderbook
  )

  const lowestAskExchangeName = formatExchangeName(lowestAsk.exchange)
  const lowestAskPair = exchangeStrategies[lowestAskExchangeName]!.formatPair(
    ticker,
    'usdt'
  )
  lowestAsk.orderbook =
    exchangeStrategies[lowestAskExchangeName]!.convertOrderbook(lowestAskPair)

  const highestBidExchangeName = formatExchangeName(highestBid.exchange)
  const highestBidPair = exchangeStrategies[highestBidExchangeName]!.formatPair(
    ticker,
    'usdt'
  )
  highestBid.orderbook =
    exchangeStrategies[highestBidExchangeName]!.convertOrderbook(highestBidPair)

  const lowestAskTax = taxes.find(
    (tax) => tax.exchange.name === lowestAsk.exchange
  )
  const highestBidTax = taxes.find(
    (tax) => tax.exchange.name === highestBid.exchange
  )

  const exchanges = ExchangesSingleton.getInstance().exchanges

  const lowestAskExchange = exchanges.find(
    (exchange) => exchange.name === lowestAsk.exchange
  )
  const highestBidExchange = exchanges.find(
    (exchange) => exchange.name === highestBid.exchange
  )

  const lowestAskFee = lowestAskExchange?.fee ?? 0
  const highestBidFee = highestBidExchange?.fee ?? 0

  lowestAsk.image_url = lowestAskExchange?.image_url ?? ''
  highestBid.image_url = highestBidExchange?.image_url ?? ''

  const bidPrice = highestBid.isUSD
    ? highestBid.price * dollarPrice
    : highestBid.price
  const askPrice = lowestAsk.isUSD
    ? lowestAsk.price * dollarPrice
    : lowestAsk.price

  const spread = (bidPrice - askPrice) / askPrice

  return {
    coin: name,
    ticker,
    lowestAsk,
    highestBid,
    tax:
      (lowestAskTax?.tax ?? 0) * lowestAsk.price +
      (highestBidTax?.tax ?? 0) * highestBid.price,
    fee: lowestAskFee + highestBidFee,
    spread,
  }
}

export const orderbookRouter = createRouter()
  .query('getAll', {
    input: z
      .object({
        buyExchanges: z.string().array(),
        sellExchanges: z.string().array(),
      })
      .optional(),
    async resolve({ ctx, input }) {
      if (!input) {
        return []
      }

      const { buyExchanges, sellExchanges } = input

      if (buyExchanges.length === 0 || sellExchanges.length === 0) {
        return []
      }

      const activeCoins = CoinsSingleton.getInstance().coins

      if (activeCoins.length === 0) {
        return []
      }

      const arbitrageOpportunitiesPromises: Promise<ArbitrageOpportunity>[] = []

      for (const coin of activeCoins) {
        arbitrageOpportunitiesPromises.push(
          fetchArbitrageOpportunity(
            ctx.prisma,
            {
              name: coin.name,
              ticker: coin.ticker,
            },
            buyExchanges,
            sellExchanges,
            coin.ExchangeCoinTax
          )
        )
      }

      const results = await Promise.allSettled(arbitrageOpportunitiesPromises)

      const arbitrageOpportunities = results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value
        }
      })

      return arbitrageOpportunities
    },
  })
  .query('getDollar', {
    async resolve({ ctx }) {
      return await ServerSingleton.getInstance().getDollar()
    },
  })
