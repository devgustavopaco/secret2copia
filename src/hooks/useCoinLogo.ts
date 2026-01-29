// src/hooks/useCoinLogo.ts
"use client";
import { useEffect, useState } from "react";
import { getCoinImage } from "../utils/getCoinImages";

export function useCoinLogo(symbol?: string, nameHint?: string) {
  const [url, setUrl] = useState("/default-exchange.png");

  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await getCoinImage(symbol ?? "", {
        coinNameHint: nameHint,
        timeoutMs: 3000,
      });
      if (alive) setUrl(u);
    })();
    return () => {
      alive = false;
    };
  }, [symbol, nameHint]);

  return url;
}
