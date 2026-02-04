import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const DEFAULT_UPSTREAM = "https://almeidashop.shop";

function parseBytes(value?: string) {
  const v = value?.trim() ?? "";
  if (!v) return 0;
  const match = v.match(/^([\d.]+)\s*([KMGTP]?i?B)?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1] ?? "0");
  const unit = (match[2] ?? "B").toUpperCase();
  const base = unit.includes("IB") ? 1024 : 1000;
  const order = ["B", "KB", "MB", "GB", "TB", "PB"];
  const orderI = ["B", "KIB", "MIB", "GIB", "TIB", "PIB"];
  const idx = unit.includes("IB") ? orderI.indexOf(unit) : order.indexOf(unit);
  if (idx <= 0) return Math.round(num);
  return Math.round(num * Math.pow(base, idx));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const upstreamBase = process.env.LATENCY_METRICS_API_URL || DEFAULT_UPSTREAM;
  const upstreamUrl = `${upstreamBase.replace(
    /\/+$/,
    ""
  )}/metrics/latency?system=0&containers=1`;

  // Primeiro tenta buscar do upstream (mesmo formato que o backend expõe)
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
    });
    if (upstream.ok) {
      const payload = await upstream.json();
      if (payload?.containers) {
        return res.status(200).json(payload.containers);
      }
    }
  } catch {
    // ignora e tenta docker local
  }

  try {
    const { stdout } = await execAsync(
      'docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}"'
    );
    const lines = stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const containers = lines.map((line) => {
      const [name, cpuPerc, memUsage, memPerc, netIo] = line.split("|");
      const cpuPercent = parseFloat((cpuPerc || "0").replace("%", "")) || 0;
      const memPercentHost = parseFloat((memPerc || "0").replace("%", "")) || 0;

      const memUsageBytes = (() => {
        const usage = (memUsage || "").split("/")[0]?.trim() || "0";
        return parseBytes(usage);
      })();

      const [rx, tx] = (netIo || "").split("/")?.map((s) => s.trim()) || [];
      const netRxBytes = parseBytes(rx || "0");
      const netTxBytes = parseBytes(tx || "0");

      return {
        name: name || "unknown",
        cpuPercent,
        memUsageBytes,
        memPercentHost,
        netRxBytes,
        netTxBytes,
      };
    });

    return res.status(200).json({
      enabled: true,
      count: containers.length,
      containers,
    });
  } catch {
    return res.status(200).json({
      enabled: false,
      count: 0,
      containers: [],
    });
  }
}
