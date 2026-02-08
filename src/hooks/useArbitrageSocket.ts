import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ArbitrageOpportunity } from "../server/router/orderbook";

type MetricsIntent = "abertura" | "fechamento";
type MetricsPeriod = "30m" | "1h" | "4h" | "12h";
export type SocketMetricsKey = {
  symbol: string;
  spotExchange: string;
  futuresExchange: string;
};
type MetricsKey = SocketMetricsKey;
type MetricsUpdate = {
  key: MetricsKey;
  period: MetricsPeriod;
  intent: MetricsIntent;
  maxOpenPct?: number;
  maxClosePct?: number;
  invertidas?: number;
  lastInversionMs?: number;
  lastInversionAt?: number;
  history?: Array<{
    ts: number;
    spot: number;
    futures: number;
    spotBid?: number;
    spotAsk?: number;
    futuresBid?: number;
    futuresAsk?: number;
  }>;
  updatedAt: number;
};
type MetricsUpdateBatch = { updates: MetricsUpdate[] };
export type MetricsHistoryTarget = {
  symbol: string;
  spotExchange: string;
  futuresExchange: string;
  period?: MetricsPeriod;
  intent?: MetricsIntent;
};
type ArbitrageDelta = {
  symbol: string;
  upserts: ArbitrageOpportunity[];
  deletes: string[];
};
type ArbitrageDeltaBatch = { updates: ArbitrageDelta[]; sentAt?: number };

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
  metricsIntent: MetricsIntent = "abertura",
  deltaMode: "single" | "batch" = "single",
  historyTarget?: MetricsHistoryTarget | null,
  visibleMetricsKeys?: SocketMetricsKey[] | null
) {
  const METRICS_MAX_KEYS = 200;
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
  const historySubRef = useRef<{
    key: MetricsKey;
    period: MetricsPeriod;
    intent: MetricsIntent;
  } | null>(null);
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
  const useExplicitMetricsKeys = visibleMetricsKeys !== undefined;
  const normalizeMetricsKey = (raw: SocketMetricsKey): MetricsKey | null => {
    const symbol = String(raw?.symbol ?? "")
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]/g, "");
    const spotExchange = normalizeExchangeName(String(raw?.spotExchange ?? ""));
    const futuresExchange = normalizeExchangeName(
      String(raw?.futuresExchange ?? "")
    );
    if (!symbol || !spotExchange || !futuresExchange) return null;
    return {
      symbol: symbol.endsWith("USDT") ? symbol : `${symbol}USDT`,
      spotExchange,
      futuresExchange,
    };
  };

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
        deltaMode,
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
    const applyDelta = (payload: ArbitrageDelta) => {
      const { symbol, upserts, deletes } = payload;
      for (const opp of upserts) {
        const sym = opp.ticker?.replace(/USDT$/i, "")?.toUpperCase();
        opp.coinImage = coinImageCache.get(sym) || "/default-coin.png";
        indexRef.current.set(keyOf(opp), opp);
      }
      for (const pair of deletes) {
        indexRef.current.delete(keyFromPair(symbol, pair));
      }
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
          const prev = next[k];
          if (!update.history?.length && prev?.history?.length) {
            next[k] = { ...update, history: prev.history };
          } else {
            next[k] = update;
          }
        }
        return next;
      });
    });

    s.on("arbitrageDelta", (payload: ArbitrageDelta) => {
      applyDelta(payload);
      scheduleFlush();
    });
    s.on("arbitrageDeltaBatch", (payload: ArbitrageDeltaBatch) => {
      const updates = Array.isArray(payload?.updates) ? payload.updates : [];
      for (const update of updates) applyDelta(update);
      scheduleFlush();
    });

    return () => {
      if (prevSymbolsRef.current.length) {
        s.emit("unsubscribe", { symbols: prevSymbolsRef.current });
      }
      s.emit("metrics:unsubscribe", {});
      historySubRef.current = null;
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
      historySubRef.current = null;
      prevConfig.period = metricsPeriod;
      prevConfig.intent = metricsIntent;
    }

    const keyMap = new Map<string, MetricsKey>();
    if (useExplicitMetricsKeys) {
      const explicitKeys = Array.isArray(visibleMetricsKeys)
        ? visibleMetricsKeys
        : [];
      for (const rawKey of explicitKeys) {
        const key = normalizeMetricsKey(rawKey);
        if (!key) continue;
        const keyStr = metricsKeyString(key, metricsPeriod, metricsIntent);
        keyMap.set(keyStr, key);
      }
    } else {
      const scoreOf = (opp: ArbitrageOpportunity) => {
        const v =
          metricsIntent === "fechamento"
            ? Number(opp.spreadS ?? opp.spread ?? 0)
            : Number(opp.spread ?? 0);
        return Number.isFinite(v) ? v : 0;
      };
      const orderedOpps = Array.from(indexRef.current.values())
        .filter((opp) => Boolean(opp?.ticker))
        .sort((a, b) => scoreOf(b) - scoreOf(a))
        .slice(0, METRICS_MAX_KEYS);

      for (const opp of orderedOpps) {
        const symbol = opp.ticker?.toUpperCase();
        if (!symbol) continue;
        const spotExchange = normalizeExchangeName(opp.lowestAsk.exchange);
        const futuresExchange = normalizeExchangeName(opp.highestBid.exchange);
        const key: MetricsKey = { symbol, spotExchange, futuresExchange };
        const keyStr = metricsKeyString(key, metricsPeriod, metricsIntent);
        keyMap.set(keyStr, key);
      }
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
  }, [
    metricsPeriod,
    metricsIntent,
    opportunities,
    visibleMetricsKeys,
    useExplicitMetricsKeys,
  ]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !s.connected) return;

    const prev = historySubRef.current;
    const nextPeriod = historyTarget?.period ?? metricsPeriod;
    const nextIntent = historyTarget?.intent ?? metricsIntent;
    const normalizedSymbol = historyTarget?.symbol
      ?.toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]/g, "");

    const nextKey =
      historyTarget &&
      normalizedSymbol &&
      historyTarget.spotExchange &&
      historyTarget.futuresExchange
        ? {
            symbol: normalizedSymbol.endsWith("USDT")
              ? normalizedSymbol
              : `${normalizedSymbol}USDT`,
            spotExchange: normalizeExchangeName(historyTarget.spotExchange),
            futuresExchange: normalizeExchangeName(
              historyTarget.futuresExchange
            ),
          }
        : null;

    const prevId = prev
      ? metricsKeyString(prev.key, prev.period, prev.intent)
      : null;
    const nextId = nextKey
      ? metricsKeyString(nextKey, nextPeriod, nextIntent)
      : null;

    if (prev && prevId && prevId !== nextId) {
      s.emit("metrics:unsubscribe", {
        keys: [prev.key],
        period: prev.period,
        intent: prev.intent,
        includeHistory: true,
      });
      historySubRef.current = null;
    }

    if (!nextKey || nextId === prevId) return;

    s.emit("metrics:subscribe", {
      keys: [nextKey],
      period: nextPeriod,
      intent: nextIntent,
      includeHistory: true,
    });
    historySubRef.current = {
      key: nextKey,
      period: nextPeriod,
      intent: nextIntent,
    };
  }, [historyTarget, metricsPeriod, metricsIntent, isConnected]);

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
        deltaMode,
      });
    }

    prevSymbolsRef.current = symbols;
    prevRefreshRef.current = refreshRate;
    if (buyChanged) prevBuyRef.current = normList(buyExchanges);
    if (sellChanged) prevSellRef.current = normList(sellExchanges);
  }, [
    symbols,
    refreshRate,
    buyExchanges,
    sellExchanges,
    lite,
    minSpread,
    deltaMode,
  ]);

  return { opportunities, setOpportunities, isConnected, metricsByKey };
}
