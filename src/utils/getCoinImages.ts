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

/** 1) MEXC por símbolo */
function mexcCdn(base: string) {
  return `https://s3.mexc.com/static/images/currency/${base}.png`;
}

/** 2) CryptoCompare: baixa um coinlist leve, mapeia SYMBOL → relative ImageUrl */
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
      CRYPTOCOMPARE_CACHE = {
        ts: now,
        data: json?.Data ?? {},
      };
    }
    const entry = CRYPTOCOMPARE_CACHE.data[symbol.toUpperCase()];
    if (entry?.ImageUrl) {
      const url = `https://www.cryptocompare.com${entry.ImageUrl}`;
      if (await imageExists(url, timeoutMs)) return url;
    }
  } catch {}
  return null;
}

/** 3) CoinGecko: usa /search para achar id exato, depois pega image.small */
async function getFromCoinGecko(
  base: string,
  coinNameHint: string | undefined,
  timeoutMs: number
) {
  try {
    // search ajuda a evitar baixar a /coins/list gigantesca
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
    // prioriza symbol match exato
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

/** 4) DexScreener: tenta descobrir contrato/chain para montar URL TrustWallet (EVM) */
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

/** Util principal: tenta vários provedores, com cache em memória */
export async function getCoinImage(
  symbol: string,
  opts: GetCoinImageOpts = {}
): Promise<string> {
  if (!symbol) return "/default-coin.png";
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;

  // cache por símbolo "base"
  const base0 = baseFromSymbol(symbol);
  const base = applyLocalOverride(base0);
  const cacheKey = `${base}|${opts.coinNameHint ?? ""}`;

  if (URL_CACHE[cacheKey]) return URL_CACHE[cacheKey];

  // 0) Overrides de contratos explícitos (TrustWallet)
  if (opts.contracts && opts.contracts.length) {
    for (const c of opts.contracts) {
      const url = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${c.chain}/assets/${c.address}/logo.png`;
      if (await imageExists(url, timeoutMs)) {
        URL_CACHE[cacheKey] = url;
        return url;
      }
    }
  }

  // 1) MEXC (rápido e barato)
  {
    const url = mexcCdn(base);
    if (await imageExists(url, timeoutMs)) {
      URL_CACHE[cacheKey] = url;
      return url;
    }
  }

  // 2) CryptoCompare
  {
    const url = await getFromCryptoCompare(base.toUpperCase(), timeoutMs);
    if (url) {
      URL_CACHE[cacheKey] = url;
      return url;
    }
  }

  // 3) CoinGecko
  {
    const url = await getFromCoinGecko(base, opts.coinNameHint, timeoutMs);
    if (url) {
      URL_CACHE[cacheKey] = url;
      return url;
    }
  }

  // 4) DexScreener → TrustWallet (EVM)
  {
    const url = await getFromDexScreenerTrust(base, timeoutMs);
    if (url) {
      URL_CACHE[cacheKey] = url;
      return url;
    }
  }

  // 5) Fallback local
  URL_CACHE[cacheKey] = "/default-coin.png";
  return "/default-coin.png";
}
