import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const API_URL = "https://api.mercadobitcoin.net/api/v4";

async function listCoinsWithWithdrawalFee() {
  const response = await axios.get(`${API_URL}/symbols`);
  const symbolsData = response.data;

  const coinsWithFees = symbolsData["base-currency"].map(
    (_: any, index: string | number) => ({
      baseCurrency: symbolsData["base-currency"][index],
      quoteCurrency: symbolsData.currency[index],
      description: symbolsData.description[index],
      withdrawalFee: symbolsData["withdrawal-fee"][index],
      type: symbolsData.type[index],
    })
  );

  return coinsWithFees;
}

// Handler da API Next.js
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const coinsWithFees = await listCoinsWithWithdrawalFee();
    res.status(200).json(coinsWithFees);
  } catch (error) {
    console.error("Failed to list coins with withdrawal fees", error);
    res
      .status(500)
      .json({ error: "Failed to list coins with withdrawal fees" });
  }
}
