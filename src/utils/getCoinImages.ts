const IMG_OK_CACHE: Record<string, boolean> = {};
const URL_CACHE: Record<string, string> = {};
let CRYPTOCOMPARE_CACHE: {
  ts: number;
  data: Record<string, { ImageUrl?: string }>;
} | null = null;
type GetCoinImageOpts = {
  /** Se você já souber o nome completo, ajude o CoinGecko a acertar */
  coinNameHint?: string;
  /** Passar contratos conhecidos ajuda o TrustWallet (EVM) */
  contracts?: {
    chain:
      | "ethereum"
      | "smartchain"
      | "polygon"
      | "arbitrum"
      | "optimism"
      | "avalanchec"
      | "fantom";
    address: string;
  }[];
  /** ms por tentativa */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT = 4500;

/** HEAD com timeout, cacheando sucesso/fracasso por URL */
async function imageExists(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<boolean> {
  if (IMG_OK_CACHE[url] === true) return true;
  if (IMG_OK_CACHE[url] === false) return false;

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

/** Ajuda a normalizar: strip USDT/USDC/USD e baixa */
function baseFromSymbol(sym: string) {
  return (sym || "")
    .replace(/(USDT|USDC|USD|PERP)$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

/** Alguns símbolos que fogem do padrão (ajuste aqui conforme for achando casos reais) */
const LOCAL_OVERRIDES: Record<string, string> = {
  // exemplo: "1000PEPE": "pepe",
  // "WBTC": "btc",
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
    const apiKey = process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY;
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

/** Util principal: tenta vários provedores, com cache em memória */
export async function getCoinImage(
  symbol: string,
  opts: GetCoinImageOpts = {}
): Promise<string> {
  if (!symbol) return "/default-coin.png";
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;

  const base0 = baseFromSymbol(symbol);
  const base = applyLocalOverride(base0);
  const cacheKey = `${base}|${opts.coinNameHint ?? ""}`;

  const cachedUrl = URL_CACHE[cacheKey];
  if (cachedUrl) return cachedUrl;

  const list = await getFromCryptoCompareList(timeoutMs);
  const entry = list?.[base.toUpperCase()];
  if (entry?.ImageUrl) {
    const url = `https://www.cryptocompare.com${entry.ImageUrl}`;
    if (await imageExists(url, timeoutMs)) {
      URL_CACHE[cacheKey] = url;
      return url;
    }
  }

  URL_CACHE[cacheKey] = "/default-coin.png";
  return "/default-coin.png";
}
