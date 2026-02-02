import type { NextApiRequest, NextApiResponse } from "next";
import { resolveImage } from "./logos";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const symbol = String(req.query.symbol || "").trim();
    const name = String(req.query.name || "").trim() || undefined;

    if (!symbol) {
      return res.status(400).json({ error: "symbol obrigatório" });
    }

    const url = await resolveImage(symbol, name);
    return res.status(200).json({ symbol: symbol.toUpperCase(), url });
  } catch (err) {
    console.error("❌ Erro /api/coins/logo:", err);
    return res.status(500).json({ error: "Erro ao resolver logo" });
  }
}
