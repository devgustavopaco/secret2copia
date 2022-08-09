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

interface ArbitrageOpportunity {
  coin: string
  ticker: string
  lowestAsk: {
    exchange: string
    price: number
    amount: number
  }
  highestBid: {
    exchange: string
    price: number
    amount: number
  }
  tax: number
  fee: number
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
    exchange: { name: string; fee: number; convert: boolean }
    tax: number
  }[]
): Promise<ArbitrageOpportunity> => {
  const { name, ticker } = coin

  const orderBookPromises: Promise<Exchange>[] = []

  var uniqueExchanges = Array.from(
    new Set([...buyExchanges, ...sellExchanges])
  ).map((exchange) => exchange.toLowerCase().replace(/\s/g, ''))

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
          element.toLowerCase().replace(/\s/g, '') ===
          (exchange?.name.toLowerCase() ?? '')
      )
      if (isContained) {
        if (exchange?.ask) {
          const priceInUSD = exchange.isUSD
            ? exchange.ask.price
            : exchange.ask.price / dollarPrice

          if (priceInUSD < acc.price) {
            return { exchange: exchange.name, ...exchange.ask }
          }
        }
      }
      return acc
    },
    { exchange: '', price: 9999999999999, amount: 0 }
  )

  // Highest sell price
  const highestBid = orderBooks.reduce(
    (acc, exchange) => {
      const isContained = buyExchanges.some(
        (element) =>
          element.toLowerCase().replace(/\s/g, '') ===
          (exchange?.name.toLowerCase() ?? '')
      )
      if (isContained) {
        if (exchange?.bid) {
          const priceInUSD = exchange.isUSD
            ? exchange.bid.price
            : exchange.bid.price / dollarPrice

          if (priceInUSD > acc.price) {
            return { exchange: exchange.name, ...exchange.bid }
          }
        }
      }
      return acc
    },
    { exchange: '', price: 0, amount: 0 }
  )

  const lowestAskTax = taxes.find(
    (tax) => tax.exchange.name === lowestAsk.exchange
  )
  const highestBidTax = taxes.find(
    (tax) => tax.exchange.name === highestBid.exchange
  )

  const exchanges = await prisma.exchange.findMany({
    where: {
      name: {
        in: [lowestAsk.exchange, highestBid.exchange],
      },
    },
  })

  const lowestAskFee =
    exchanges.find((exchange) => exchange.name === lowestAsk.exchange)?.fee ?? 0
  const highestBidFee =
    exchanges.find((exchange) => exchange.name === highestBid.exchange)?.fee ??
    0

  return {
    coin: name,
    ticker,
    lowestAsk,
    highestBid,
    tax: (lowestAskTax?.tax ?? 0) + (highestBidTax?.tax ?? 0),
    fee: lowestAskFee + highestBidFee,
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

      const activeCoins = await ctx.prisma.coin.findMany({
        where: {
          active: true,
        },
        include: {
          ExchangeCoinTax: {
            where: {
              active: true,
            },
            select: {
              tax: true,
              exchange: {
                select: {
                  name: true,
                  fee: true,
                  convert: true,
                },
              },
            },
          },
        },
      })

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
