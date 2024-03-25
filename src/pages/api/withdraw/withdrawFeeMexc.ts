import axios from "axios";
import * as crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

const generateSignature = (query_string: string, secretKey: string): string => {
  return crypto
    .createHmac("sha256", secretKey)
    .update(query_string)
    .digest("hex");
};

const fetchServerTime = async (): Promise<number> => {
  const { data } = await axios.get("https://api.mexc.com/api/v3/time");
  return data.serverTime;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiKey = process.env.MEXC_API_KEY;
    const secretKey = process.env.MEXC_SECRET_KEY || "";
    const baseUrl = "https://api.mexc.com";
    const endPoint = "/api/v3/capital/config/getall";
    const recvWindow = 5000;

    const serverTime = await fetchServerTime();

    const queryString = `recvWindow=${recvWindow}&timestamp=${serverTime}`;
    const signature = generateSignature(queryString, secretKey);

    const headers = {
      "X-MEXC-APIKEY": apiKey,
      "Content-Type": "application/json",
    };

    const fullUrl = `${baseUrl}${endPoint}?${queryString}&signature=${signature}`;

    const response = await axios.get(fullUrl, { headers });

    const dataWithNetworkInfo = response.data.map((coin: any) => {
      return coin;
    });

    res.status(200).json(dataWithNetworkInfo);
  } catch (error) {
    console.error("Error fetching currency information:", error);
    res.status(500).json({ error: "Failed to fetch currency information" });
  }
}
