import fetch from 'node-fetch'
import { Exchange, ExchangeStrategy, Ticker } from './ExchangeStrategy'

interface BinanceOrderbook {
  bids: string[][]
  asks: string[][]
}

interface BinanceTicker {
  symbol: string
  price: string
}

type BinanceTickers = BinanceTicker[]

export class BinanceStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
    )
    const json = (await response.json()) as BinanceTicker

    const ticker = {
      symbol: json.symbol,
      price: json.price,
    }

    return ticker
  }

  async fetchTickers(): Promise<Ticker[]> {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price`)
    const json = (await response.json()) as BinanceTickers

    return json
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.binance.com/api/v3/depth?limit=10&symbol=${pair}`
    )
    const json = (await response.json()) as BinanceOrderbook

    const bids = json.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
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

interface BitsoTicker {
  payload: {
    last: string
    book: string
  }
}

interface BitsoTickers {
  payload: {
    last: string
    book: string
  }[]
}

export class BitsoStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(
      `https://api.bitso.com/v3/ticker/?book=${pair}`
    )
    const json = (await response.json()) as BitsoTicker

    const ticker = {
      symbol: pair,
      price: json.payload.last,
    }

    return ticker
  }

  async fetchTickers(): Promise<Ticker[]> {
    const response = await fetch(`https://api.bitso.com/v3/ticker/`)
    const json = (await response.json()) as BitsoTickers

    return json.payload.map((ticker) => ({
      symbol: ticker.book,
      price: ticker.last,
    }))
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}_${destinationToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.bitso.com/v3/order_book/?book=${pair}`
    )
    const json = (await response.json()) as BitsoOrderbook

    const bids = json.payload.bids.map((bid) => {
      return { price: Number(bid.price), amount: Number(bid.amount) }
    })

    const asks = json.payload.asks.map((ask) => {
      return { price: Number(ask.price), amount: Number(ask.amount) }
    })

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
      orderbook: {
        bids,
        asks,
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

interface BrasilBitcoinTicker {
  ticker: {
    last: string
  }
}

export class BrasilBitcoinStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(
      `https://www.mercadobitcoin.net/api/${pair}/ticker/`
    )
    const json = (await response.json()) as BrasilBitcoinTicker

    const tokens = {
      symbol: pair,
      price: json.ticker.last,
    }

    return tokens
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://brasilbitcoin.com.br/API/orderbook/${pair}`
    )
    const json = (await response.json()) as BrasilBitcoinOrderbook

    const bids = json.sell.map((bid) => {
      return { price: Number(bid.preco), amount: Number(bid.quantidade) }
    })

    const asks = json.buy.map((ask) => {
      return { price: Number(ask.preco), amount: Number(ask.quantidade) }
    })

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
      orderbook: {
        bids,
        asks,
      },
      isUSD: false,
    }
  }
}

interface CoinBaseOrderbook {
  bids: (string | number)[][]
  asks: (string | number)[][]
}

interface CoinBaseTicker {
  price: string
}

export class CoinBaseStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(
      `https://api.exchange.coinbase.com/products/${pair}/ticker`
    )
    const json = (await response.json()) as CoinBaseTicker

    const ticker = {
      symbol: pair,
      price: json.price,
    }

    return ticker
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}-${destinationToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.exchange.coinbase.com/products/${pair}/book?level=2`
    )
    const json = (await response.json()) as CoinBaseOrderbook

    const bids = json.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
      },
      isUSD: true,
    }
  }
}

interface ChilizOrderbook {
  bids: string[][]
  asks: string[][]
}

interface ChilizTicker {
  price: string
}

export class ChilizStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(
      `https://api.chiliz.net/openapi/quote/v1/ticker/price&symbol=${pair}`
    )
    const json = (await response.json()) as ChilizTicker

    const ticker = {
      symbol: pair,
      price: json.price,
    }

    return ticker
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.chiliz.net/openapi/quote/v1/depth?limit=10&symbol=${pair}`
    )
    const json = (await response.json()) as ChilizOrderbook

    const bids = json.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
      },
      isUSD: true,
    }
  }
}

type CoinextOrderbook = number[][]

// TODO - Implementar InstrumentId de cada moeda
export class CoinextStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(
      `https://api.coinext.com.br:8443/AP/GetL2Snapshot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ OMSId: 1, InstrumentId: 1, Depth: 1 }),
      }
    )
    const json = (await response.json()) as CoinextOrderbook

    const ticker = {
      symbol: pair,
      price: '222222220',
    }

    return ticker
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
      orderbook: {
        asks: [],
        bids: [],
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

interface CryptoComTicker {
  result: {
    data: {
      a: number
    }
  }
}

export class CryptoComStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(
      `https://api.crypto.com/v2/public/get-ticker?instrument_name=${pair}`
    )
    const json = (await response.json()) as CryptoComTicker

    const ticker = {
      symbol: pair,
      price: String(json.result.data.a),
    }

    return ticker
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.crypto.com/v2/public/get-book?instrument_name=${pair}&depth=10`
    )
    const json = (await response.json()) as CryptoComOrderbook

    const bids = json.result.data[0]!.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.result.data[0]!.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
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

interface GeminiTicker {
  close: string
}

export class GeminiStategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(`https://api.gemini.com/v2/ticker/${pair}`)
    const json = (await response.json()) as GeminiTicker

    const ticker = {
      symbol: pair,
      price: json.close,
    }

    return ticker
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

    const bids = json.bids.map((bid) => {
      return { price: Number(bid.price), amount: Number(bid.amount) }
    })

    const asks = json.asks.map((ask) => {
      return { price: Number(ask.price), amount: Number(ask.amount) }
    })

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
      orderbook: {
        asks,
        bids,
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

interface HuobiTicker {
  data: {
    symbol: string
    close: number
  }[]
}

export class HuobiStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    const response = await fetch(`https://api.huobi.pro/market/tickers?symbol`)
    const json = (await response.json()) as HuobiTicker

    const ticker = {
      symbol: pair,
      price: String(
        json.data.filter((ticker) => ticker.symbol === pair)[0]!.close
      ),
    }

    return ticker
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}${destinationToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.huobi.pro/market/depth?symbol=${pair}&type=step0&depth=10`
    )
    const json = (await response.json()) as HuobiOrderbook

    const bids = json.tick.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.tick.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
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
  async fetchTicker(pair: string): Promise<Ticker> {
    throw new Error('Method not implemented.')
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.kraken.com/0/public/Depth?pair=${pair}&count=10`
    )
    const json = (await response.json()) as KrakenOrderbook

    const pairResult = Object.keys(json.result)[0]!

    const bids = json.result[pairResult]!.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.result[pairResult]!.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

    return {
      name: 'Kraken',
      bid: {
        price: Number(json.result[pairResult]!.bids[0]![0]),
        amount: Number(json.result[pairResult]!.bids[0]![1]),
      },
      ask: {
        price: Number(json.result[pairResult]!.asks[0]![0]),
        amount: Number(json.result[pairResult]!.asks[0]![1]),
      },
      orderbook: {
        bids,
        asks,
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
  async fetchTicker(pair: string): Promise<Ticker> {
    throw new Error('Method not implemented.')
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}-${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=${pair}`
    )
    const json = (await response.json()) as KuCoinOrderbook

    const bids = json.data.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.data.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
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
  async fetchTicker(pair: string): Promise<Ticker> {
    throw new Error('Method not implemented.')
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.novadax.com/v1/market/depth?symbol=${pair}&limit=10`
    )
    const json = (await response.json()) as NovaDAXOrderbook

    const bids = json.data.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.data.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
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
  async fetchTicker(pair: string): Promise<Ticker> {
    throw new Error('Method not implemented.')
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://www.mercadobitcoin.net/api/${pair}/orderbook/`
    )
    const json = (await response.json()) as MercadoBitcoinOrderbook

    const bids = json.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        bids,
        asks,
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
  async fetchTicker(pair: string): Promise<Ticker> {
    throw new Error('Method not implemented.')
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.hitbtc.com/api/3/public/orderbook/${pair}?depth=10`
    )
    const json = (await response.json()) as HitBTCOrderbook

    const bids = json.bid.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.ask.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        asks,
        bids,
      },
      isUSD: true,
    }
  }
}

type BitfinexOrderbook = number[][]

export class BitfinexStrategy implements ExchangeStrategy {
  async fetchTicker(pair: string): Promise<Ticker> {
    throw new Error('Method not implemented.')
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

    const book = json.reduce(
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
    )

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
      orderbook: {
        asks: book.asks,
        bids: book.bids,
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
  async fetchTicker(pair: string): Promise<Ticker> {
    throw new Error('Method not implemented.')
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}/${destinationToken.toUpperCase()}`
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const response = await fetch(
      `https://api.hotbit.io/api/v1/order.depth?market=${pair}&limit=10&interval=1e-8`
    )
    const json = (await response.json()) as HotBitOrderbook

    const bids = json.result.bids.map((bid) => {
      return { price: Number(bid[0]), amount: Number(bid[1]) }
    })

    const asks = json.result.asks.map((ask) => {
      return { price: Number(ask[0]), amount: Number(ask[1]) }
    })

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
      orderbook: {
        asks,
        bids,
      },
      isUSD: true,
    }
  }
}
