import { Orderbook } from '../../router/orderbook'

export class OrderbookContext {
  private strategy: ExchangeStrategy

  constructor(strategy: ExchangeStrategy) {
    this.strategy = strategy
  }

  public setStrategy(strategy: ExchangeStrategy) {
    this.strategy = strategy
  }

  public async fetchOrderbook(
    baseToken: string,
    destinationToken: string
  ): Promise<Exchange> {
    const pair = this.strategy.formatPair(baseToken, destinationToken)
    return await this.strategy.fetchOrderbook(pair)
  }
}

export interface Exchange {
  name: string
  bid: {
    price: number
    amount: number
  }
  ask: {
    price: number
    amount: number
  }
  image_url?: string
  isUSD: boolean
}

export interface Ticker {
  symbol: string
  price: string
}

export interface ExchangeStrategy {
  formatPair(baseToken: string, destinationToken: string): string
  fetchOrderbook(pair: string): Promise<Exchange>
  convertOrderbook(): Orderbook
}
