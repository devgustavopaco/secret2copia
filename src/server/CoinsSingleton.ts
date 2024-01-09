import { Coin, Exchange, ExchangeCoinTax, Prisma } from "@prisma/client";
import { prisma } from "./db/client";

type ExtendedCoin = Coin & {
  ExchangeCoinTax: (ExchangeCoinTax & {
    exchange: Exchange;
  })[];
};

export class CoinsSingleton {
  private static instance: CoinsSingleton;

  public coins: ExtendedCoin[] = [];

  constructor() {
    this.updateCoins();
  }

  public static getInstance(): CoinsSingleton {
    if (!CoinsSingleton.instance) {
      CoinsSingleton.instance = new CoinsSingleton();
    }
    return CoinsSingleton.instance;
  }

  public async updateCoins(isPlatinum?: boolean): Promise<void> {
    let query: Prisma.CoinFindManyArgs = {
      where: { active: true },
      include: {
        ExchangeCoinTax: {
          where: { active: true },
          include: {
            exchange: true,
          },
        },
      },
    };

    if (!isPlatinum) {
      query = {
        ...query,
        take: 80,
      };
    }

    // @ts-ignore
    this.coins = await prisma.coin.findMany(query);
  }
}
