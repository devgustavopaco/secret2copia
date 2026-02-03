import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_UPSTREAM = "https://almeidashop.shop";
const LATENCY_TIMEOUT_MS = 10_000;

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

  const window = pickFirst(req.query.window).trim();
  const windowMs = pickFirst(req.query.windowMs).trim();

  const base = (
    process.env.LATENCY_METRICS_API_URL || DEFAULT_UPSTREAM
  ).replace(/\/+$/, "");
  const url = new URL(`${base}/metrics/latency`);
  if (window) url.searchParams.set("window", window);
  if (windowMs) url.searchParams.set("windowMs", windowMs);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LATENCY_TIMEOUT_MS);

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      signal: controller.signal,
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).send(text || "upstream error");
    }

    try {
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    } catch (err) {
      return res.status(502).json({ error: "payload invalido do upstream" });
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "timeout no metrics/latency" });
    }
    return res.status(502).json({ error: err?.message || "upstream error" });
  } finally {
    clearTimeout(timeout);
  }
}
