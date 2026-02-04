import type { NextApiRequest, NextApiResponse } from "next";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const DEFAULT_UPSTREAM = "https://almeidashop.shop";
const LATENCY_TIMEOUT_MS = 300_000;
const CPU_SAMPLE_MS = 250;
const execAsync = promisify(exec);

function pickFirst(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}

function parseToggle(value: string | string[] | undefined, defaultOn = true) {
  const v = pickFirst(value).trim();
  if (!v) return defaultOn;
  return !["0", "false", "off", "no"].includes(v.toLowerCase());
}

function cpuTimesSnapshot() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total +=
      cpu.times.user +
      cpu.times.nice +
      cpu.times.sys +
      cpu.times.irq +
      cpu.times.idle;
  }
  return { idle, total, cores: cpus.length };
}

async function getCpuUsagePct(sampleMs = CPU_SAMPLE_MS) {
  const s1 = cpuTimesSnapshot();
  await new Promise((r) => setTimeout(r, sampleMs));
  const s2 = cpuTimesSnapshot();
  const idleDelta = s2.idle - s1.idle;
  const totalDelta = s2.total - s1.total;
  const usagePct = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;
  return { cores: s2.cores, usagePct: Number(usagePct.toFixed(2)) };
}

function getMemoryStats() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = Math.max(totalBytes - freeBytes, 0);
  const usedPct = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const availableBytes = freeBytes;
  return {
    totalBytes,
    usedBytes,
    usedPct: Number(usedPct.toFixed(2)),
    availableBytes,
  };
}

async function getContainerStats() {
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

    return { enabled: true, count: containers.length, containers };
  } catch {
    return { enabled: false, count: 0, containers: [] as any[] };
  }
}

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

  const window = pickFirst(req.query.window).trim();
  const windowMs = pickFirst(req.query.windowMs).trim();
  const withSystem = parseToggle(req.query.system, true);
  const withContainers = parseToggle(req.query.containers, true);

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
      const system = withSystem
        ? {
            cpu: await getCpuUsagePct(),
            memory: getMemoryStats(),
            loadAvg: os.loadavg(),
            uptimeSec: Math.floor(os.uptime()),
          }
        : undefined;

      const containers = withContainers ? await getContainerStats() : undefined;

      const payload = {
        ...parsed,
        ...(withSystem ? { system } : {}),
        ...(withContainers ? { containers } : {}),
      };

      return res.status(200).json(payload);
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
