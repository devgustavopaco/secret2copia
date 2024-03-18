import * as ccxt from "ccxt";
import type { NextApiRequest, NextApiResponse } from "next";

const bitfinex = new ccxt.bitfinex({
  enableRateLimit: true,

  apiKey: process.env.BITFINEX_API_KEY || "",
  secret: process.env.BITFINEX_SECRET_KEY || "",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const withdrawFees = await bitfinex.fetchTransactionFees();
    console.log(withdrawFees);

    const response = {
      withdraw: withdrawFees,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching withdraw fees:", error);
    res.status(500).send("Falha ao obter taxas de retirada");
  }
}
