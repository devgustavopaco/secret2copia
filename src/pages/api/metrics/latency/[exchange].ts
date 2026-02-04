import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_UPSTREAM = "https://almeidashop.shop";

function pickFirst(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const exchange = pickFirst(req.query.exchange).trim();
  const window = pickFirst(req.query.window).trim();
  const windowMs = pickFirst(req.query.windowMs).trim();
  const side = pickFirst(req.query.side).trim();

  if (!exchange) {
    return res.status(400).json({ error: "exchange obrigatorio" });
  }

  const base = (
    process.env.LATENCY_METRICS_API_URL || DEFAULT_UPSTREAM
  ).replace(/\/+$/, "");
  const url = new URL(`${base}/metrics/latency/${encodeURIComponent(exchange)}`);
  if (window) url.searchParams.set("window", window);
  if (windowMs) url.searchParams.set("windowMs", windowMs);
  if (side) url.searchParams.set("side", side);

  const upstream = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  const text = await upstream.text();
  if (!upstream.ok) {
    return res.status(upstream.status).send(text || "upstream error");
  }
  try {
    const payload = JSON.parse(text);
    return res.status(200).json(payload);
  } catch {
    return res.status(502).json({ error: "payload invalido do upstream" });
  }
}
