import * as ccxt from "ccxt";
import type { NextApiRequest, NextApiResponse } from "next";

const bitso = new ccxt.bitso({
  enableRateLimit: true,

  apiKey: process.env.BITSO_API_KEY || "",
  secret: process.env.BITSO_SECRET_KEY || "",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const withdrawFees = await bitso.fetchDepositWithdrawFees();
    console.log("Withdraw Fees:", withdrawFees);

    if (!withdrawFees) {
      console.log(
        "No info property found in withdrawFees, continuing with the process."
      );
    }

    const response = {
      withdraw: withdrawFees,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching withdraw fees:", error);
    res.status(500).send("Falha ao obter taxas de retirada");
  }
}
