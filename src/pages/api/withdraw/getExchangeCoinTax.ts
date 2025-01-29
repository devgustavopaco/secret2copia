import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const exchangeId = req.query.exchangeId as string;
      const registeredCoins = await prisma.exchangeCoinTaxFuture.findMany({
        where: { exchangeId },
        include: {
          coin: true,
        },
      });
      res
        .status(200)
        .json(registeredCoins.map((coinTax) => coinTax.coin.ticker));
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar moedas registradas." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
