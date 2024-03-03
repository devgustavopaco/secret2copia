import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiKey = process.env.KUCOIN_API_KEY;
    const secretKey = process.env.KUCOIN_SECRET_KEY;
    const passphrase = process.env.KUCOIN_PASSPHRASE;

    const baseUrl = "https://api.kucoin.com";

    const endPoint = "/api/v1/currencies";

    const timestamp = Date.now();
    const strToSign = timestamp + "GET" + endPoint;
    const signature = Buffer.from(strToSign).toString("base64");

    const headers = {
      "KC-API-KEY": apiKey,
      "KC-API-SIGN": signature,
      "KC-API-TIMESTAMP": timestamp.toString(),
      "KC-API-PASSPHRASE": passphrase,
    };

    const response = await axios.get(`${baseUrl}${endPoint}`, { headers });
    console.log(response.data);

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching withdraw fees from KuCoin:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch withdraw fees from KuCoin" });
  }
}
