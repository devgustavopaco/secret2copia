import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const response = await fetch(
      "https://api.kucoin.com/api/v1/bullet-public",
      {
        method: "POST",
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching KuCoin token:", error);
    res.status(500).json({ message: "Error fetching KuCoin token" });
  }
}
