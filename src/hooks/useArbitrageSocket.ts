import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ArbitrageOpportunity } from "../server/router/orderbook";

type MetricsIntent = "abertura" | "fechamento";
type MetricsPeriod = "30m" | "1h" | "4h" | "12h" | "24h";
type MetricsKey = {
  symbol: string;
  spotExchange: string;
  futuresExchange: string;
};
type MetricsUpdate = {
  key: MetricsKey;
  period: MetricsPeriod;
  intent: MetricsIntent;
  maxOpenPct?: number;
  maxClosePct?: number;
  invertidas?: number;
  lastInversionMs?: number;
  lastInversionAt?: number;
  updatedAt: number;
};
type MetricsUpdateBatch = { updates: MetricsUpdate[] };

const SOCKET_URL = "https://almeidashop.shop/";
const keyOf = (opp: ArbitrageOpportunity) =>
  `${opp.ticker}-${opp.lowestAsk.exchange}-${opp.highestBid.exchange}`;

const normalizeExchangeName = (raw: string) => {
  const cleaned = raw
    .replace(/ spot| futures/gi, "")
    .trim()
    .toLowerCase();
  if (cleaned.includes("gate")) return "Gate";
  if (cleaned.includes("mexc")) return "MEXC";
  if (cleaned.includes("bitget")) return "Bitget";
  if (cleaned.includes("bybit")) return "Bybit";
  if (cleaned.includes("huobi") || cleaned.includes("htx")) return "Huobi";
  if (cleaned.includes("bingx")) return "Bingx";
  if (cleaned.includes("kucoin")) return "Kucoin";
  if (cleaned.includes("okx")) return "Okx";
  if (!cleaned) return raw.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const metricsKeyString = (
  key: MetricsKey,
  period: MetricsPeriod,
  intent: MetricsIntent
) =>
  `${key.symbol}:${key.spotExchange}:${key.futuresExchange}:${period}:${intent}`;

const keyFromPair = (symbol: string, pairKey: string) => {
  const [spotEx, futEx] = pairKey.split("|");
  const lowEx = `${spotEx} Spot`;
  const highEx = `${futEx} Futures`;
  return `${symbol}-${lowEx}-${highEx}`;
};

const normList = (xs: string[]) => xs.map((s) => s.toLowerCase()).sort();
const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function useArbitrageSocket(
  symbols: string[],
  refreshRate: number,
  buyExchanges: string[],
  sellExchanges: string[],
  isPaused: boolean = false,
  lite: boolean = false,
  minSpread?: number,
  metricsPeriod: MetricsPeriod = "4h",
  metricsIntent: MetricsIntent = "abertura"
) {
  // 🔹 cache de logos em memória do frontend
  const coinImageCache = useRef<Map<string, string>>(new Map()).current;

  // ✅ faz apenas uma chamada ao /api/coins/logos por sessão
  useEffect(() => {
    let cancelled = false;

    async function loadCache() {
      try {
        const res = await fetch("/api/coins/logos");
        const logos: Record<string, string> = await res.json();

        if (cancelled) return;

        Object.entries(logos).forEach(([ticker, url]) => {
          coinImageCache.set(ticker.toUpperCase(), url);
        });

        console.log(`✅ Logos carregados: ${coinImageCache.size}`);
      } catch (err) {
        console.error("Erro ao carregar logos:", err);
      }
    }

    loadCache();
    return () => {
      cancelled = true;
    };
  }, [coinImageCache]);

  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    []
  );
  const [metricsByKey, setMetricsByKey] = useState<
    Record<string, MetricsUpdate>
  >({});
  const metricsKeysRef = useRef<Set<string>>(new Set());
  const prevMetricsConfigRef = useRef({
    period: metricsPeriod,
    intent: metricsIntent,
  });
  const socketRef = useRef<Socket | null>(null);
  const indexRef = useRef<Map<string, ArbitrageOpportunity>>(new Map());
  const prevSymbolsRef = useRef<string[]>([]);
  const prevRefreshRef = useRef<number>(refreshRate);
  const prevBuyRef = useRef<string[]>(normList(buyExchanges));
  const prevSellRef = useRef<string[]>(normList(sellExchanges));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isPaused) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const s = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = s;

    const subscribeCurrent = () => {
      if (!s.connected) return;
      s.emit("subscribe", {
        symbols,
        refreshRate,
        buyExchanges,
        sellExchanges,
        lite,
        minSpread,
      });
    };

    let rafId: number | null = null;
    const scheduleFlush = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setOpportunities(Array.from(indexRef.current.values()));
      });
    };

    s.on("connect", () => {
      console.log("✅ Conectado ao socket");
      setIsConnected(true);
      subscribeCurrent();
    });

    s.on("reconnect", () => {
      console.log("♻️ Reconectado ao socket");
      subscribeCurrent();
    });

    // dispara logo após montar
    setTimeout(subscribeCurrent, 1000);

    // 🔹 Atualizações completas
    s.on("arbitrageUpdate", (opp: ArbitrageOpportunity) => {
      const symbol = opp.ticker?.replace(/USDT$/i, "")?.toUpperCase();
      opp.coinImage = coinImageCache.get(symbol) || "/default-coin.png";
      indexRef.current.set(keyOf(opp), opp);
      scheduleFlush();
    });

    // 🔹 Deltas incrementais
    s.on("metrics:update", (payload: MetricsUpdate | MetricsUpdateBatch) => {
      const updates = Array.isArray((payload as MetricsUpdateBatch).updates)
        ? (payload as MetricsUpdateBatch).updates
        : [payload as MetricsUpdate];
      setMetricsByKey((prev) => {
        const next = { ...prev };
        for (const update of updates) {
          if (!update?.key) continue;
          const k = metricsKeyString(update.key, update.period, update.intent);
          next[k] = update;
        }
        return next;
      });
    });

    s.on("arbitrageDelta", (payload) => {
      const { symbol, upserts, deletes } = payload;

      for (const opp of upserts) {
        const sym = opp.ticker?.replace(/USDT$/i, "")?.toUpperCase();
        opp.coinImage = coinImageCache.get(sym) || "/default-coin.png";
        indexRef.current.set(keyOf(opp), opp);
      }

      // TESTE: nao remove da tela quando chega delete
      // for (const pair of deletes) {
      //   indexRef.current.delete(keyFromPair(symbol, pair));
      // }

      scheduleFlush();
    });

    return () => {
      if (prevSymbolsRef.current.length) {
        s.emit("unsubscribe", { symbols: prevSymbolsRef.current });
      }
      s.emit("metrics:unsubscribe", {});
      s.off();
      s.disconnect();
      socketRef.current = null;
      if (rafId != null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isPaused]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !s.connected) return;

    const prevConfig = prevMetricsConfigRef.current;
    if (
      prevConfig.period !== metricsPeriod ||
      prevConfig.intent !== metricsIntent
    ) {
      s.emit("metrics:unsubscribe", {});
      metricsKeysRef.current.clear();
      prevConfig.period = metricsPeriod;
      prevConfig.intent = metricsIntent;
    }

    const keyMap = new Map<string, MetricsKey>();
    for (const opp of indexRef.current.values()) {
      const symbol = opp.ticker?.toUpperCase();
      if (!symbol) continue;
      const spotExchange = normalizeExchangeName(opp.lowestAsk.exchange);
      const futuresExchange = normalizeExchangeName(opp.highestBid.exchange);
      const key: MetricsKey = { symbol, spotExchange, futuresExchange };
      const keyStr = metricsKeyString(key, metricsPeriod, metricsIntent);
      keyMap.set(keyStr, key);
    }

    const currentSet = new Set(keyMap.keys());
    const added: MetricsKey[] = [];
    for (const [keyStr, key] of keyMap.entries()) {
      if (!metricsKeysRef.current.has(keyStr)) {
        metricsKeysRef.current.add(keyStr);
        added.push(key);
      }
    }

    const removed: MetricsKey[] = [];
    for (const keyStr of Array.from(metricsKeysRef.current)) {
      if (currentSet.has(keyStr)) continue;
      metricsKeysRef.current.delete(keyStr);
      const parts = keyStr.split(":");
      if (parts.length >= 3) {
        const symbol = parts[0];
        const spotExchange = parts[1];
        const futuresExchange = parts[2];
        if (symbol && spotExchange && futuresExchange) {
          removed.push({ symbol, spotExchange, futuresExchange });
        }
      }
    }

    if (removed.length) {
      s.emit("metrics:unsubscribe", {
        keys: removed,
        period: metricsPeriod,
        intent: metricsIntent,
      });
    }
    if (added.length) {
      s.emit("metrics:subscribe", {
        keys: added,
        period: metricsPeriod,
        intent: metricsIntent,
      });
    }
  }, [metricsPeriod, metricsIntent, opportunities]);

  // 🔹 Detecta mudanças em symbols / refresh / exchanges
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const added = symbols.filter(
      (sym) => !prevSymbolsRef.current.includes(sym)
    );
    const removed = prevSymbolsRef.current.filter(
      (sym) => !symbols.includes(sym)
    );

    if (removed.length) {
      s.emit("unsubscribe", { symbols: removed });
    }

    const buyChanged = !arraysEqual(normList(buyExchanges), prevBuyRef.current);
    const sellChanged = !arraysEqual(
      normList(sellExchanges),
      prevSellRef.current
    );
    const refreshChanged = refreshRate !== prevRefreshRef.current;

    if (buyChanged || sellChanged) {
      indexRef.current.clear();
      setOpportunities([]);
    }

    if (added.length || refreshChanged || buyChanged || sellChanged) {
      s.emit("subscribe", {
        symbols,
        refreshRate,
        buyExchanges,
        sellExchanges,
        lite,
        minSpread,
      });
    }

    prevSymbolsRef.current = symbols;
    prevRefreshRef.current = refreshRate;
    if (buyChanged) prevBuyRef.current = normList(buyExchanges);
    if (sellChanged) prevSellRef.current = normList(sellExchanges);
  }, [symbols, refreshRate, buyExchanges, sellExchanges, lite, minSpread]);

  return { opportunities, setOpportunities, isConnected, metricsByKey };
}
