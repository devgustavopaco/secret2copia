// pages/api/getAllCoinImages.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const coins = await prisma.coinFuture.findMany({
      select: {
        ticker: true,
        image_url: true,
      },
    });

    // retorna array tipo [{ticker:"BTC", image_url:"..."}, ...]
    return res.json(coins);
  } catch (err) {
    console.error("Erro getAllCoinImages:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
