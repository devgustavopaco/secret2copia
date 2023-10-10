import { Coin } from "@prisma/client";
import { prisma } from "./db/client";

export class CoinsSingleton {
  private static instance: CoinsSingleton;

  public coins: (Coin & {
    ExchangeCoinTax: {
      exchange: {
        name: string;
        fee: number;
        convert: boolean;
        image_url: string | null;
      };
      tax: number;
    }[];
  })[] = [];

  constructor() {
    this.updateCoins();
  }

  public static getInstance(): CoinsSingleton {
    if (!CoinsSingleton.instance) {
      CoinsSingleton.instance = new CoinsSingleton();
    }
    return CoinsSingleton.instance;
  }

  public async updateCoins(): Promise<void> {
    this.coins = await prisma.coin.findMany({
      where: {
        active: true,
      },
      take: 150,
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
                image_url: true,
                active: true,
              },
            },
          },
        },
      },
    });
  }
}
