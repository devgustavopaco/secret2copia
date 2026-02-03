import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_UPSTREAM = "https://almeidashop.shop";
const SPREAD_HISTORY_TIMEOUT_MS = 15_000;

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

  const symbol = pickFirst(req.query.symbol).trim();
  const spot = pickFirst(req.query.spot).trim();
  const futures = pickFirst(req.query.futures).trim();
  const stepSec = pickFirst(req.query.stepSec).trim();
  const from = pickFirst(req.query.from).trim();
  const to = pickFirst(req.query.to).trim();

  if (!symbol || (!spot && !futures)) {
    return res
      .status(400)
      .json({ error: "symbol e (spot ou futures) sao obrigatorios" });
  }

  const base = (process.env.SPREAD_HISTORY_API_URL || DEFAULT_UPSTREAM).replace(
    /\/+$/,
    ""
  );
  const url = new URL(`${base}/api/spread-history`);
  url.searchParams.set("symbol", symbol);
  if (spot) url.searchParams.set("spot", spot);
  if (futures) url.searchParams.set("futures", futures);
  if (stepSec) url.searchParams.set("stepSec", stepSec);
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SPREAD_HISTORY_TIMEOUT_MS
  );

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

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const hFrom = upstream.headers.get("x-range-from");
      const hTo = upstream.headers.get("x-range-to");
      const hStep = upstream.headers.get("x-step-sec");
      if (hFrom) res.setHeader("X-Range-From", hFrom);
      if (hTo) res.setHeader("X-Range-To", hTo);
      if (hStep) res.setHeader("X-Step-Sec", hStep);
      return res.status(200).json(parsed);
    }

    return res.status(502).json({ error: "payload invalido do upstream" });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "timeout no spread-history" });
    }
    return res.status(502).json({ error: err?.message || "upstream error" });
  } finally {
    clearTimeout(timeout);
  }
}
