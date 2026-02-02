// pages/api/coins/logos.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMG_OK_CACHE: Record<string, boolean> = {};
const URL_CACHE: Record<string, string> = {};
let CRYPTOCOMPARE_CACHE: {
  ts: number;
  data: Record<string, { ImageUrl?: string }>;
} | null = null;

let MASTER_CACHE: { ts: number; data: Record<string, string> } | null = null;
const MASTER_TTL = 1000 * 60 * 60; // 1h

const DEFAULT_TIMEOUT = 4500;

/** HEAD com timeout, cacheando sucesso/fracasso por URL */
async function imageExists(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<boolean> {
  const cached = IMG_OK_CACHE[url];
  if (cached !== undefined) return cached;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: "HEAD", signal: ctrl.signal as any });
    const ok = r.ok;
    IMG_OK_CACHE[url] = ok;
    return ok;
  } catch {
    IMG_OK_CACHE[url] = false;
    return false;
  } finally {
    clearTimeout(t);
  }
}

/** Normaliza símbolo → base */
function baseFromSymbol(sym: string) {
  return (sym || "")
    .replace(/(USDT|USDC|USD|PERP)$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

/** Overrides locais */
const LOCAL_OVERRIDES: Record<string, string> = {
  // "1000PEPE": "pepe",
  // "WBTC": "btc",
};

const LOCAL_LOGO_OVERRIDES: Record<string, string> = {
  CLAWDONBASE: "https://public.mocortech.com/coin/F20260127131012790z0AeimraeDTEOx.png",
};
function applyLocalOverride(base: string) {
  return LOCAL_OVERRIDES[base.toUpperCase()]?.toLowerCase() ?? base;
}

async function getFromCryptoCompareList(timeoutMs: number) {
  try {
    const now = Date.now();
    if (CRYPTOCOMPARE_CACHE && now - CRYPTOCOMPARE_CACHE.ts < 60 * 60 * 1000) {
      return CRYPTOCOMPARE_CACHE.data;
    }
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
    const headers: Record<string, string> = apiKey
      ? { authorization: `Apikey ${apiKey}` }
      : {};
    const res = await fetch(
      "https://min-api.cryptocompare.com/data/all/coinlist?summary=true",
      { signal: ctrl.signal as any, headers }
    );
    clearTimeout(to);
    if (!res.ok) throw new Error("cc list failed");
    const json = await res.json();
    CRYPTOCOMPARE_CACHE = { ts: now, data: json?.Data ?? {} };
    return CRYPTOCOMPARE_CACHE.data;
  } catch {
    return CRYPTOCOMPARE_CACHE?.data ?? {};
  }
}



/** Função principal (igual ao getCoinImage) */
export async function resolveImage(
  symbol: string,
  coinNameHint?: string,
  ccMap?: Record<string, { ImageUrl?: string }>
): Promise<string> {
  const timeoutMs = DEFAULT_TIMEOUT;
  const base0 = baseFromSymbol(symbol);
  const base = applyLocalOverride(base0);
  const baseKey = base.toUpperCase();
  const cacheKey = `${base}|${coinNameHint ?? ""}`;

  const cachedUrl = URL_CACHE[cacheKey];
  if (cachedUrl) return cachedUrl;

  // 0) Override local de logo
  const overrideUrl = LOCAL_LOGO_OVERRIDES[baseKey];
  if (overrideUrl) return (URL_CACHE[cacheKey] = overrideUrl);

  // 1) CryptoCompare (mapa por ticker)
  if (ccMap) {
    const entry = ccMap[base.toUpperCase()];
    if (entry?.ImageUrl) {
      const url = `https://www.cryptocompare.com${entry.ImageUrl}`;
      if (await imageExists(url, timeoutMs)) return (URL_CACHE[cacheKey] = url);
    }
  }

  // 1) CryptoCompare (fetch lista se nao tiver mapa)
  const list = await getFromCryptoCompareList(timeoutMs);
  const entry = list?.[base.toUpperCase()];
  if (entry?.ImageUrl) {
    const url = `https://www.cryptocompare.com${entry.ImageUrl}`;
    if (await imageExists(url, timeoutMs)) return (URL_CACHE[cacheKey] = url);
  }

  return (URL_CACHE[cacheKey] = "/default-coin.png");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const now = Date.now();
    if (MASTER_CACHE && now - MASTER_CACHE.ts < MASTER_TTL) {
      return res.status(200).json(MASTER_CACHE.data);
    }

    console.log("🔄 Atualizando cache global de logos...");

    const list = await getFromCryptoCompareList(DEFAULT_TIMEOUT);
    const results: Record<string, string> = {};
    for (const [sym, info] of Object.entries(list)) {
      if (!info?.ImageUrl) continue;
      results[sym.toUpperCase()] = `https://www.cryptocompare.com${info.ImageUrl}`;
    }
    // overrides manuais (ganham do provider)
    for (const [sym, url] of Object.entries(LOCAL_LOGO_OVERRIDES)) {
      results[sym.toUpperCase()] = url;
    }

    MASTER_CACHE = { ts: now, data: results };
    console.log(`✅ Logos resolvidos (CryptoCompare): ${Object.keys(results).length}`);

    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Erro /api/coins/logos:", err);
    return res.status(500).json({ error: "Erro ao resolver logos" });
  }
}
