import type { NextApiRequest, NextApiResponse } from "next";
import os from "os";

const CPU_SAMPLE_MS = 250;

function cpuTimesSnapshot() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total +=
      cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cpu = await getCpuUsagePct();
  const memory = getMemoryStats();
  const loadAvg = os.loadavg();
  const uptimeSec = Math.floor(os.uptime());

  return res.status(200).json({ cpu, memory, loadAvg, uptimeSec });
}
