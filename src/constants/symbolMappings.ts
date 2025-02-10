export interface SymbolMapping {
  spot: string;
  futures: string;
}

export const exchangeSymbolMappings: Record<
  string,
  Record<string, SymbolMapping>
> = {
  mexc: {
    ELIZA: {
      spot: "ELIZA_USDT",
      futures: "AI16ZELIZA_USDT",
    },
    ELIZAWAKESUP: {
      spot: "ELIZA_USDT",
      futures: "ELIZA_USDT",
    },
    ART: {
      spot: "ART_USDT",
      futures: "ART_USDT",
    },
    CULT: {
      spot: "CULT_USDT",
      futures: "CULT_USDT",
    },
    HOLD: {
      spot: "HOLD_USDT",
      futures: "HOLD_USDT",
    },
    TKO: {
      spot: "TKO_USDT",
      futures: "TKO_USDT",
    },
    ZK: {
      spot: "ZKSYNC_USDT",
      futures: "ZKSYNC_USDT",
    },
    GST: {
      spot: "GST_USDT",
      futures: "GST_USDT",
    },
    VELO: {
      spot: "VELO_USDT",
      futures: "VELO_USDT",
    },
    CLR: {
      spot: "CELR_USDT",
      futures: "CELR_USDT",
    },
    CATTON: {
      spot: "CATTON_USDT",
      futures: "CATTON_USDT",
    },
  },
  bitget: {
    ELIZA: {
      spot: "ELIZAUSDT",
      futures: "ELIZAUSDT",
    },
    HOLD: {
      spot: "HOLDCOINUSDT",
      futures: "HOLDCOINUSDT",
    },
    FIRE: {
      spot: "FIREUSDT",
      futures: "FIREUSDT",
    },
    ZK: {
      spot: "ZKUSDT",
      futures: "ZKUSDT",
    },
    VELO: {
      spot: "VELOUSDT",
      futures: "VELOUSDT",
    },
    URO: {
      spot: "UROUSDT",
      futures: "UROUSDT",
    },
    CLR: {
      spot: "CELRUSDT",
      futures: "CELRUSDT",
    },
  },
  gate: {
    ELIZA: {
      spot: "ELIZA_USDT",
      futures: "ELIZA_USDT",
    },
    ELIZAWAKESUP: {
      spot: "ELIZASOL_USDT",
      futures: "ELIZASOL_USDT",
    },
    ART: {
      spot: "ARTELA_USDT",
      futures: "ARTELA_USDT",
    },
    CULT: {
      spot: "MILADYCULT_USDT",
      futures: "MILADYCULT_USDT",
    },
    HOLD: {
      spot: "HOLD_USDT",
      futures: "HOLD_USDT",
    },
    TKO: {
      spot: "TKO_USDT",
      futures: "TKO_USDT",
    },
    ZK: {
      spot: "ZK_USDT",
      futures: "ZK_USDT",
    },
    GST: {
      spot: "GST_USDT",
      futures: "GST_USDT",
    },
    VELO: {
      spot: "VELO_USDT",
      futures: "VELO_USDT",
    },
    CATTON: {
      spot: "CATTON_USDT",
      futures: "CATTON_USDT",
    },
  },
  kucoin: {
    CULT: {
      spot: "MILADYCULT-USDT",
      futures: "MILADYCULT-USDT",
    },
    HOLD: {
      spot: "HOLDCOIN-USDT",
      futures: "HOLDCOIN-USDT",
    },
    FIRE: {
      spot: "FIRE-USDT",
      futures: "FIRE-USDT",
    },
    VELO: {
      spot: "VELO-USDT",
      futures: "VELO-USDT",
    },
  },
  binance: {
    TKO: {
      spot: "TKO_USDT",
      futures: "TKO_USDT",
    },
    ZK: {
      spot: "ZK_USDT",
      futures: "ZK_USDT",
    },
  },
  bybit: {
    FIRE: {
      spot: "FIRE/USDT",
      futures: "FIRE/USDT",
    },
    ZK: {
      spot: "ZKUSDT",
      futures: "ZKUSDT",
    },
    VELO: {
      spot: "VELO/USDT",
      futures: "VELO/USDT",
    },
  },
};

export function getCorrectSymbol(
  exchange: string,
  symbol: string,
  isFutures: boolean
): string {
  const exchangeLower = exchange.toLowerCase();
  const symbolUpper = symbol.toUpperCase();

  const mapping = exchangeSymbolMappings[exchangeLower]?.[symbolUpper];
  if (!mapping) {
    return `${symbolUpper}_USDT`; // Default format
  }

  return isFutures ? mapping.futures : mapping.spot;
}
