import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    const { exchangeId, ticker } = req.body;
    const tax = req.body.tax || 0;
    try {
      const updated = await prisma.exchangeCoinTaxFuture.updateMany({
        where: {
          exchangeId: exchangeId,

          coin: {
            ticker: ticker,
          },
        },
        data: {
          tax: tax,
        },
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error("Falha ao atualizar ExchangeCoinTax:", error);
      return res
        .status(500)
        .json({ error: "Falha ao atualizar ExchangeCoinTax" });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
