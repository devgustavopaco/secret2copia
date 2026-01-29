import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as crypto from "crypto";

const generateSignature = (query_string: string, secretKey: string): string => {
  return crypto
    .createHmac("sha256", secretKey)
    .update(query_string)
    .digest("hex");
};

const fetchServerTime = async (): Promise<number> => {
  const { data } = await axios.get("https://api.binance.com/api/v3/time");
  return data.serverTime;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiKey = process.env.BINANCE_API_KEY;
    const secretKey = process.env.BINANCE_SECRET_KEY;
    const baseUrl = "https://api.binance.com";
    const endPoint = "/sapi/v1/capital/config/getall";
    const recvWindow = 5000;

    const serverTime = await fetchServerTime();

    const queryString = `recvWindow=${recvWindow}&timestamp=${serverTime}`;
    const signature = generateSignature(queryString, secretKey || "");

    const headers = {
      "X-MBX-APIKEY": apiKey,
    };

    const response = await axios.get(
      `${baseUrl}${endPoint}?${queryString}&signature=${signature}`,
      { headers }
    );

    const dataWithEthNetwork = response.data.map((coin: any) => {
      const ethNetwork = coin.networkList.find(
        (network: any) => network.network === "ETH"
      );
      if (ethNetwork) {
        coin.networkList = [ethNetwork];
      } else {
        const defaultNetwork =
          coin.networkList.find((network: any) => network.isDefault) ||
          coin.networkList[0];
        coin.networkList = [defaultNetwork];
      }
      return coin;
    });

    res.status(200).json(dataWithEthNetwork);
  } catch (error) {
    console.error("Error fetching coin information:", error);
    res.status(500).json({ error: "Failed to fetch coin information" });
  }
}
