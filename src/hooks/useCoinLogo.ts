// src/hooks/useCoinLogo.ts
"use client";
import { useEffect, useState } from "react";
import { getCoinImage } from "../utils/getCoinImages";

let LOGO_MAP_CACHE: Record<string, string> | null = null;
let LOGO_MAP_PROMISE: Promise<Record<string, string>> | null = null;

export function useCoinLogo(symbol?: string, nameHint?: string) {
  const [url, setUrl] = useState("/default-exchange.png");

  useEffect(() => {
    let alive = true;
    (async () => {
      const key = (symbol ?? "").toUpperCase();

      try {
        if (!LOGO_MAP_CACHE) {
          if (!LOGO_MAP_PROMISE) {
            LOGO_MAP_PROMISE = fetch("/api/coins/logos")
              .then((r) => (r.ok ? r.json() : {}))
              .catch(() => ({}));
          }
          LOGO_MAP_CACHE = await LOGO_MAP_PROMISE;
        }
        const fromMap = key ? LOGO_MAP_CACHE?.[key] : undefined;
        if (fromMap) {
          if (alive) setUrl(fromMap);
          return;
        }
      } catch {
        // ignore and fallback below
      }

      try {
        const qs = new URLSearchParams();
        qs.set("symbol", symbol ?? "");
        if (nameHint) qs.set("name", nameHint);
        const res = await fetch(`/api/coins/logo?${qs.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            if (alive) setUrl(data.url);
            return;
          }
        }
      } catch {
        // ignore and fallback below
      }

      if (alive) setUrl("/default-coin.png");
    })();
    return () => {
      alive = false;
    };
  }, [symbol, nameHint]);

  return url;
}
