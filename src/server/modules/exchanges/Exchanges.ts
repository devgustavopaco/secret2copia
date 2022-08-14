import fetch from 'node-fetch'
import { Orderbook } from '../../router/orderbook'
import { Exchange, ExchangeStrategy, Ticker } from './ExchangeStrategy'

interface BinanceOrderbook {
  bids: string[][]
  asks: string[][]
}

export class BinanceStrategy implements ExchangeStrategy {
  orderbook?: BinanceOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.binance.com/api/v3/depth?limit=10&symbol=${pair}`
    )
    const json = (await response.json()) as BinanceOrderbook
    this.orderbook = json

    return {
      name: 'Binance',
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface BitsoOrderbook {
  payload: {
    bids: {
      book: string
      price: string
      amount: string
    }[]
    asks: {
      book: string
      price: string
      amount: string
    }[]
  }
}

export class BitsoStrategy implements ExchangeStrategy {
  orderbook?: BitsoOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.payload.bids.map((bid) => {
        return { price: Number(bid.price), amount: Number(bid.amount) }
      }) ?? []

    const asks =
      this.orderbook?.payload.asks.map((ask) => {
        return { price: Number(ask.price), amount: Number(ask.amount) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}_${destinationToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.bitso.com/v3/order_book/?book=${pair}`
    )
    const json = (await response.json()) as BitsoOrderbook
    this.orderbook = json

    return {
      name: 'Bitso',
      bid: {
        price: Number(json.payload.bids[0]!.price),
        amount: Number(json.payload.bids[0]!.amount),
      },
      ask: {
        price: Number(json.payload.asks[0]!.price),
        amount: Number(json.payload.asks[0]!.amount),
      },
      isUSD: true,
    }
  }
}

interface BrasilBitcoinOrderbook {
  buy: {
    preco: number
    quantidade: number
    valor: number
  }[]
  sell: {
    preco: number
    quantidade: number
    valor: number
  }[]
}

export class BrasilBitcoinStrategy implements ExchangeStrategy {
  orderbook?: BrasilBitcoinOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.sell.map((bid) => {
        return { price: Number(bid.preco), amount: Number(bid.quantidade) }
      }) ?? []

    const asks =
      this.orderbook?.buy.map((ask) => {
        return { price: Number(ask.preco), amount: Number(ask.quantidade) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://brasilbitcoin.com.br/API/orderbook/${pair}`
    )
    const json = (await response.json()) as BrasilBitcoinOrderbook
    this.orderbook = json

    return {
      name: 'BrasilBitcoin',
      bid: {
        price: Number(json.buy[0]!.preco),
        amount: Number(json.buy[0]!.quantidade),
      },
      ask: {
        price: Number(json.sell[0]!.preco),
        amount: Number(json.sell[0]!.quantidade),
      },
      isUSD: false,
    }
  }
}

interface CoinBaseOrderbook {
  bids: (string | number)[][]
  asks: (string | number)[][]
}

export class CoinBaseStrategy implements ExchangeStrategy {
  orderbook?: CoinBaseOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}-${destinationToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.exchange.coinbase.com/products/${pair}/book?level=2`
    )
    const json = (await response.json()) as CoinBaseOrderbook
    this.orderbook = json

    return {
      name: 'CoinBase',
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface ChilizOrderbook {
  bids: string[][]
  asks: string[][]
}

export class ChilizStrategy implements ExchangeStrategy {
  orderbook?: ChilizOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.chiliz.net/openapi/quote/v1/depth?limit=10&symbol=${pair}`
    )
    const json = (await response.json()) as ChilizOrderbook
    this.orderbook = json

    return {
      name: 'Chiliz',
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

type CoinextOrderbook = number[][]

// TODO - Implementar InstrumentId de cada moeda
export class CoinextStrategy implements ExchangeStrategy {
  orderbook?: CoinextOrderbook

  convertOrderbook(): Orderbook {
    // const bids =
    //   this.orderbook?.bids.map((bid) => {
    //     return { price: Number(bid[0]), amount: Number(bid[1]) }
    //   }) ?? []

    // const asks =
    //   this.orderbook?.asks.map((ask) => {
    //     return { price: Number(ask[0]), amount: Number(ask[1]) }
    //   }) ?? []

    return { bids: [], asks: [] }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.coinext.com.br:8443/AP/GetL2Snapshot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ OMSId: 1, InstrumentId: 1, Depth: 10 }),
      }
    )
    const json = (await response.json()) as CoinextOrderbook
    this.orderbook = json

    // TODO: Map até metade

    return {
      name: 'Coinext',
      bid: {
        price: Number(json[0]![6]),
        amount: Number(json[0]![9]),
      },
      ask: {
        price: Number(json[10]![6]),
        amount: Number(json[10]![9]),
      },
      isUSD: false,
    }
  }
}

interface CryptoComOrderbook {
  result: {
    data: {
      bids: number[][]
      asks: number[][]
    }[]
  }
}

export class CryptoComStrategy implements ExchangeStrategy {
  orderbook?: CryptoComOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.result.data[0]!.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.result.data[0]!.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.crypto.com/v2/public/get-book?instrument_name=${pair}&depth=10`
    )
    const json = (await response.json()) as CryptoComOrderbook
    this.orderbook = json

    return {
      name: 'CryptoCom',
      bid: {
        price: Number(json.result.data[0]!.bids[0]![0]),
        amount: Number(json.result.data[0]!.bids[0]![1]),
      },
      ask: {
        price: Number(json.result.data[0]!.asks[0]![0]),
        amount: Number(json.result.data[0]!.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface GeminiOrderbook {
  bids: {
    price: string
    amount: string
  }[]
  asks: {
    price: string
    amount: string
  }[]
}

export class GeminiStategy implements ExchangeStrategy {
  orderbook?: GeminiOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.bids.map((bid) => {
        return { price: Number(bid.price), amount: Number(bid.amount) }
      }) ?? []

    const asks =
      this.orderbook?.asks.map((ask) => {
        return { price: Number(ask.price), amount: Number(ask.amount) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === 'USDT') {
      destinationToken = 'USD'
    }

    return `${baseToken.toLocaleLowerCase()}${destinationToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.gemini.com/v1/book/${pair}?limit_bids=10&limit_asks=10`
    )
    const json = (await response.json()) as GeminiOrderbook
    this.orderbook = json

    return {
      name: 'Gamini',
      bid: {
        price: Number(json.bids[0]!.price),
        amount: Number(json.bids[0]!.amount),
      },
      ask: {
        price: Number(json.asks[0]!.price),
        amount: Number(json.asks[0]!.amount),
      },
      isUSD: true,
    }
  }
}

interface HuobiOrderbook {
  tick: {
    bids: number[][]
    asks: number[][]
  }
}

export class HuobiStrategy implements ExchangeStrategy {
  orderbook?: HuobiOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.tick.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.tick.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}${destinationToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.huobi.pro/market/depth?symbol=${pair}&type=step0&depth=10`
    )
    const json = (await response.json()) as HuobiOrderbook
    this.orderbook = json

    return {
      name: 'Huobi',
      bid: {
        price: Number(json.tick.bids[0]![0]),
        amount: Number(json.tick.bids[0]![1]),
      },
      ask: {
        price: Number(json.tick.asks[0]![0]),
        amount: Number(json.tick.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface KrakenOrderbook {
  result: {
    [key: string]: {
      bids: (string | number)[][]
      asks: (string | number)[][]
    }
  }
}

export class KrakenStrategy implements ExchangeStrategy {
  orderbook?: KrakenOrderbook
  pairResult: string = ''

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.result[this.pairResult]!.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.result[this.pairResult]!.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.kraken.com/0/public/Depth?pair=${pair}&count=10`
    )
    const json = (await response.json()) as KrakenOrderbook
    this.orderbook = json

    this.pairResult = Object.keys(json.result)[0]!

    return {
      name: 'Kraken',
      bid: {
        price: Number(json.result[this.pairResult]!.bids[0]![0]),
        amount: Number(json.result[this.pairResult]!.bids[0]![1]),
      },
      ask: {
        price: Number(json.result[this.pairResult]!.asks[0]![0]),
        amount: Number(json.result[this.pairResult]!.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface KuCoinOrderbook {
  data: {
    bids: string[][]
    asks: string[][]
  }
}

export class KuCoinStratefy implements ExchangeStrategy {
  orderbook?: KuCoinOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.data.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.data.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}-${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=${pair}`
    )
    const json = (await response.json()) as KuCoinOrderbook
    this.orderbook = json

    return {
      name: 'KuCoin',
      bid: {
        price: Number(json.data.bids[0]![0]),
        amount: Number(json.data.bids[0]![1]),
      },
      ask: {
        price: Number(json.data.asks[0]![0]),
        amount: Number(json.data.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface NovaDAXOrderbook {
  data: {
    bids: string[][]
    asks: string[][]
  }
}

export class NovaDAXStrategy implements ExchangeStrategy {
  orderbook?: NovaDAXOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.data.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.data.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.novadax.com/v1/market/depth?symbol=${pair}&limit=10`
    )
    const json = (await response.json()) as NovaDAXOrderbook
    this.orderbook = json

    return {
      name: 'NovaDAX',
      bid: {
        price: Number(json.data.bids[0]![0]),
        amount: Number(json.data.bids[0]![1]),
      },
      ask: {
        price: Number(json.data.asks[0]![0]),
        amount: Number(json.data.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface MercadoBitcoinOrderbook {
  bids: string[][]
  asks: string[][]
}

export class MercadoBitcoinStrategy implements ExchangeStrategy {
  orderbook?: MercadoBitcoinOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://www.mercadobitcoin.net/api/${pair}/orderbook/`
    )
    const json = (await response.json()) as MercadoBitcoinOrderbook
    this.orderbook = json

    return {
      name: 'Mercado Bitcoin',
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}

interface HitBTCOrderbook {
  bid: string[][]
  ask: string[][]
}

export class HitBTCStrategy implements ExchangeStrategy {
  orderbook?: HitBTCOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.bid.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.ask.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.hitbtc.com/api/3/public/orderbook/${pair}?depth=10`
    )
    const json = (await response.json()) as HitBTCOrderbook
    this.orderbook = json

    return {
      name: 'HitBTC',
      bid: {
        price: Number(json.bid[0]![0]),
        amount: Number(json.bid[0]![1]),
      },
      ask: {
        price: Number(json.ask[0]![0]),
        amount: Number(json.ask[0]![1]),
      },
      isUSD: true,
    }
  }
}

type BitfinexOrderbook = number[][]

export class BitfinexStrategy implements ExchangeStrategy {
  orderbook?: BitfinexOrderbook

  convertOrderbook(): Orderbook {
    const book = this.orderbook?.reduce(
      (acc, result, index) => {
        if (index < 25) {
          acc.bids.push({
            price: Number(result[0]),
            amount: Number(result[2]),
          })
          return acc
        } else {
          acc.asks.push({
            price: Number(result[0]),
            amount: -1 * Number(result[2]),
          })
          return acc
        }
      },
      { asks: [], bids: [] } as {
        asks: { price: number; amount: number }[]
        bids: { price: number; amount: number }[]
      }
    ) ?? { asks: [], bids: [] }

    return book
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === 'USDT') {
      destinationToken = 'USD'
    }

    return `t${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api-pub.bitfinex.com/v2/book/${pair}/P0?len=25`
    )
    const json = (await response.json()) as BitfinexOrderbook
    this.orderbook = json

    return {
      name: 'Bitfinex',
      bid: {
        price: Number(json[0]![0]),
        amount: Number(json[0]![2]),
      },
      ask: {
        price: Number(json[25]![0]),
        amount: -1 * Number(json[25]![2]),
      },
      isUSD: true,
    }
  }
}

interface HotBitOrderbook {
  result: {
    bids: string[][]
    asks: string[][]
  }
}

export class HotBitStrategy implements ExchangeStrategy {
  orderbook?: HotBitOrderbook

  convertOrderbook(): Orderbook {
    const bids =
      this.orderbook?.result.bids.map((bid) => {
        return { price: Number(bid[0]), amount: Number(bid[1]) }
      }) ?? []

    const asks =
      this.orderbook?.result.asks.map((ask) => {
        return { price: Number(ask[0]), amount: Number(ask[1]) }
      }) ?? []

    return { bids, asks }
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}/${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.hotbit.io/api/v1/order.depth?market=${pair}&limit=10&interval=1e-8`
    )
    const json = (await response.json()) as HotBitOrderbook
    this.orderbook = json

    return {
      name: 'HotBit',
      bid: {
        price: Number(json.result.bids[0]![0]),
        amount: Number(json.result.bids[0]![1]),
      },
      ask: {
        price: Number(json.result.asks[0]![0]),
        amount: Number(json.result.asks[0]![1]),
      },
      isUSD: true,
    }
  }
}
