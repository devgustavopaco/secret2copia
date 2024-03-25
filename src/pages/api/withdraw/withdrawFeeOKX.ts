// src/pages/api/withdrawFeeOKX.ts
import axios from "axios";
import { createHmac } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const apiKey = process.env.OKX_API_KEY;
  const apiSecret = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;

  if (!apiKey || !apiSecret || !passphrase) {
    return res.status(500).json({ error: "Missing API credentials" });
  }

  const timestamp = new Date().toISOString();

  const method = "GET";
  const requestPath = "/api/v5/asset/currencies";
  const body = "";
  const prehashString = timestamp + method + requestPath + body;

  const signature = createHmac("sha256", apiSecret)
    .update(prehashString)
    .digest("base64");

  const headers = {
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": passphrase,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.get(`https://www.okx.com${requestPath}`, {
      headers,
    });
    console.log(response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Failed to fetch withdraw fees:", error);
    res.status(500).json({ error: "Failed to fetch withdraw fees" });
  }
}
