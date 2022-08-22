import { Exchange } from '@prisma/client'
import { prisma } from './db/client'

export class ExchangesSingleton {
  private static instance: ExchangesSingleton

  public exchanges: Exchange[] = []

  constructor() {
    this.updateExchanges()
  }

  public static getInstance(): ExchangesSingleton {
    if (!ExchangesSingleton.instance) {
      ExchangesSingleton.instance = new ExchangesSingleton()
    }
    return ExchangesSingleton.instance
  }

  public async updateExchanges(): Promise<void> {
    this.exchanges = await prisma.exchange.findMany()
  }
}
