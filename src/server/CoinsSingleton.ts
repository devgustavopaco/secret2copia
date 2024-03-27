import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ExchangeCoinsRawResult {
  exchangeId: string;
  exchangeName: string;
  exchangeUrl: string;
  coinId: string;
  coinName: string;
  ticker: string;
  isFanToken: number;
  imageUrl: string;
  exchangeFee: number;
  coinTax: number;
  exchangeType: "buy" | "sell";
}

export class CoinsSingleton {
  private static instance: CoinsSingleton;

  public static getInstance(): CoinsSingleton {
    if (!CoinsSingleton.instance) {
      CoinsSingleton.instance = new CoinsSingleton();
    }
    return CoinsSingleton.instance;
  }

  public async updateCoinsBasedOnExchangeIds(
    buyExchangeIds: string[],
    sellExchangeIds: string[]
  ): Promise<ExchangeCoinsRawResult[]> {
    const whenClauses = buyExchangeIds
      .map((id) => `WHEN e.id = '${id}' THEN 'buy'`)
      .concat(sellExchangeIds.map((id) => `WHEN e.id = '${id}' THEN 'sell'`))
      .join(" ");

    const queryString = `
      SELECT 
        e.id AS exchangeId,
        LOWER(REPLACE(e.name, ' ', '')) AS exchangeName, -- Formata o nome da exchange
        c.id AS coinId,
        c.name AS coinName,
        c.ticker,
        c.isFanToken,
        c.image_url AS imageUrl,
        e.image_url as exchangeUrl,
        e.fee as exchangeFee,
        ect.tax AS coinTax,
        ROW_NUMBER() OVER(PARTITION BY e.id ORDER BY c.name) AS rn,
        CASE ${whenClauses} ELSE 'unknown' END AS exchangeType
      FROM Exchange e
      INNER JOIN ExchangeCoinTax ect ON e.id = ect.exchangeId
      INNER JOIN Coin c ON c.id = ect.coinId
      WHERE e.id IN (${[...buyExchangeIds, ...sellExchangeIds]
        .map((id) => `'${id}'`)
        .join(", ")})
        AND c.active = TRUE
        AND ect.active = TRUE
    `;

    console.log(queryString);

    const results: ExchangeCoinsRawResult[] = await prisma.$queryRaw(
      Prisma.raw(queryString)
    );

    return results;
  }
}
