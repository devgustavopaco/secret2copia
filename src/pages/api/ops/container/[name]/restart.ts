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
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const name = pickFirst(req.query.name).trim();
  if (!name) {
    return res.status(400).json({ error: "name obrigatorio" });
  }

  const headerToken = String(req.headers["x-admin-token"] || "");
  const envToken = process.env.DOCKER_CONTROL_TOKEN || "";
  const token = headerToken || envToken;
  if (!token) {
    return res.status(401).json({ ok: false, reason: "token ausente" });
  }
  const base = (
    process.env.LATENCY_METRICS_API_URL || DEFAULT_UPSTREAM
  ).replace(/\/+$/, "");
  const url = `${base}/ops/container/${encodeURIComponent(name)}/restart`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "X-Admin-Token": token },
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
