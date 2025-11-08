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
  if (IMG_OK_CACHE[url] !== undefined) return IMG_OK_CACHE[url];
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
function applyLocalOverride(base: string) {
  return LOCAL_OVERRIDES[base.toUpperCase()]?.toLowerCase() ?? base;
}

/** 1) MEXC CDN */
function mexcCdn(base: string) {
  return `https://s3.mexc.com/static/images/currency/${base}.png`;
}

/** 2) CryptoCompare */
async function getFromCryptoCompare(symbol: string, timeoutMs: number) {
  try {
    const now = Date.now();
    if (!CRYPTOCOMPARE_CACHE || now - CRYPTOCOMPARE_CACHE.ts > 60 * 60 * 1000) {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(
        "https://min-api.cryptocompare.com/data/all/coinlist?summary=true",
        { signal: ctrl.signal as any }
      );
      clearTimeout(to);
      if (!res.ok) throw new Error("cc list failed");
      const json = await res.json();
      CRYPTOCOMPARE_CACHE = { ts: now, data: json?.Data ?? {} };
    }
    const entry = CRYPTOCOMPARE_CACHE.data[symbol.toUpperCase()];
    if (entry?.ImageUrl) {
      const url = `https://www.cryptocompare.com${entry.ImageUrl}`;
      if (await imageExists(url, timeoutMs)) return url;
    }
  } catch {}
  return null;
}

/** 3) CoinGecko */
async function getFromCoinGecko(
  base: string,
  coinNameHint: string | undefined,
  timeoutMs: number
) {
  try {
    const q = encodeURIComponent(coinNameHint || base);
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${q}`,
      {
        headers: { Accept: "application/json" },
        signal: ctrl.signal as any,
      }
    );
    clearTimeout(to);
    if (!r.ok) throw new Error("gecko search failed");
    const data = await r.json();
    const hit =
      data?.coins?.find((c: any) => (c.symbol || "").toLowerCase() === base) ??
      data?.coins?.[0];
    if (!hit?.id) return null;
    const ctrl2 = new AbortController();
    const to2 = setTimeout(() => ctrl2.abort(), timeoutMs);
    const r2 = await fetch(
      `https://api.coingecko.com/api/v3/coins/${hit.id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
      { signal: ctrl2.signal as any }
    );
    clearTimeout(to2);
    if (!r2.ok) return null;
    const d2 = await r2.json();
    const url = d2?.image?.small || d2?.image?.thumb || d2?.image?.large;
    if (url && (await imageExists(url, timeoutMs))) return url;
  } catch {}
  return null;
}

/** 4) DexScreener → TrustWallet */
const TRUST_CHAIN_MAP: Record<string, string> = {
  ethereum: "ethereum",
  bsc: "smartchain",
  bnb: "smartchain",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  avalanche: "avalanchec",
  avax: "avalanchec",
  fantom: "fantom",
};
async function getFromDexScreenerTrust(symbol: string, timeoutMs: number) {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(
        symbol
      )}`,
      { signal: ctrl.signal as any }
    );
    clearTimeout(to);
    if (!r.ok) return null;
    const js = await r.json();
    const pair = js?.pairs?.find(
      (p: any) =>
        (p.baseToken?.symbol || "").toLowerCase() === symbol.toLowerCase()
    );
    const chainRaw = pair?.chainId as string | undefined;
    const addr = pair?.baseToken?.address as string | undefined;
    if (!addr || !chainRaw) return null;
    const chain = TRUST_CHAIN_MAP[chainRaw.toLowerCase()];
    if (!chain) return null;
    const tw = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${addr}/logo.png`;
    if (await imageExists(tw, timeoutMs)) return tw;
  } catch {}
  return null;
}

/** 5) Fallback banco local */
async function getFromDatabase(symbol: string): Promise<string | null> {
  const found = await prisma.coinFuture.findFirst({
    where: { ticker: symbol.toUpperCase() },
    select: { image_url: true },
  });
  return found?.image_url || null;
}

/** Função principal (igual ao getCoinImage) */
async function resolveImage(
  symbol: string,
  coinNameHint?: string
): Promise<string> {
  const timeoutMs = DEFAULT_TIMEOUT;
  const base0 = baseFromSymbol(symbol);
  const base = applyLocalOverride(base0);
  const cacheKey = `${base}|${coinNameHint ?? ""}`;

  if (URL_CACHE[cacheKey]) return URL_CACHE[cacheKey];

  // 1) MEXC
  {
    const url = mexcCdn(base);
    if (await imageExists(url, timeoutMs)) return (URL_CACHE[cacheKey] = url);
  }

  // 2) CryptoCompare
  {
    const url = await getFromCryptoCompare(base.toUpperCase(), timeoutMs);
    if (url) return (URL_CACHE[cacheKey] = url);
  }

  // 3) CoinGecko
  {
    const url = await getFromCoinGecko(base, coinNameHint, timeoutMs);
    if (url) return (URL_CACHE[cacheKey] = url);
  }

  // 4) DexScreener
  {
    const url = await getFromDexScreenerTrust(base, timeoutMs);
    if (url) return (URL_CACHE[cacheKey] = url);
  }

  // 5) Banco local
  {
    const url = await getFromDatabase(symbol);
    if (url) return (URL_CACHE[cacheKey] = url);
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

    // Busca símbolos de referência (via MEXC)
    const mexcRes = await fetch("https://api.mexc.com/api/v3/exchangeInfo");
    const mexcData = await mexcRes.json();
    const symbols: string[] = Array.from(
      new Set((mexcData?.symbols ?? []).map((s: any) => s.baseAsset))
    );

    const results: Record<string, string> = {};
    for (const s of symbols.slice(0, 5000)) {
      const url = await resolveImage(s);
      results[s.toUpperCase()] = url;
    }

    MASTER_CACHE = { ts: now, data: results };
    console.log(`✅ Logos resolvidos: ${Object.keys(results).length}`);

    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Erro /api/coins/logos:", err);
    return res.status(500).json({ error: "Erro ao resolver logos" });
  }
}
