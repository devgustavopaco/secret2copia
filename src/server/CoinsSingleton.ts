import { Coin, ExchangeCoinTax } from "@prisma/client";
import { prisma } from "./db/client";

export class CoinsSingleton {
  private static instance: CoinsSingleton;

  public coins: (Coin & {
    ExchangeCoinTax: (ExchangeCoinTax & {
      exchange: {
        name: string;
        fee: number;
        convert: boolean;
        image_url: string | null;
      };
    })[];
  })[] = [];

  public static getInstance(): CoinsSingleton {
    if (!CoinsSingleton.instance) {
      CoinsSingleton.instance = new CoinsSingleton();
    }
    return CoinsSingleton.instance;
  }

  public async updateCoinsBasedOnExchangeIds(
    exchangeIds: string[]
  ): Promise<void> {
    this.coins = await prisma.coin.findMany({
      where: {
        active: true,
        ExchangeCoinTax: {
          some: {
            exchangeId: { in: exchangeIds },
            active: true,
          },
        },
      },
      include: {
        ExchangeCoinTax: {
          where: {
            exchangeId: { in: exchangeIds },
            active: true,
          },
          include: {
            exchange: true,
          },
        },
      },
    });
  }
}
