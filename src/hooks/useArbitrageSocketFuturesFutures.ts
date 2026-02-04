import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ArbitrageOpportunity } from "../server/router/orderbook";

const SOCKET_URL = "https://almeidashop.shop";
const SOCKET_PATH = "/futuros/socket.io";
const keyOf = (opp: ArbitrageOpportunity) =>
  `${opp.ticker}-${opp.lowestAsk.exchange}-${opp.highestBid.exchange}`;
type ArbitrageDelta = {
  symbol: string;
  upserts: ArbitrageOpportunity[];
  deletes: string[];
};
type ArbitrageDeltaBatch = { updates: ArbitrageDelta[]; sentAt?: number };

// Para futuros vs futuros, ambos são Futures
const keyFromPair = (symbol: string, pairKey: string) => {
  const [buyEx, sellEx] = pairKey.split("|");
  const lowEx = `${buyEx} Futures`;
  const highEx = `${sellEx} Futures`;
  return `${symbol}-${lowEx}-${highEx}`;
};

const normList = (xs: string[]) => xs.map((s) => s.toLowerCase()).sort();
const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function useArbitrageSocketFuturesFutures(
  symbols: string[],
  refreshRate: number,
  buyExchanges: string[],
  sellExchanges: string[],
  isPaused: boolean = false,
  deltaMode: "single" | "batch" = "single"
) {
  // Cache de logos em memória do frontend
  const coinImageCache = useRef<Map<string, string>>(new Map()).current;

  // Faz apenas uma chamada ao /api/coins/logos por sessão
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

        console.log(`✅ Logos carregados (FutFut): ${coinImageCache.size}`);
      } catch (err) {
        console.error("Erro ao carregar logos (FutFut):", err);
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

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      path: SOCKET_PATH,
    });
    socketRef.current = s;

    const subscribeCurrent = () => {
      if (!s.connected) return;
      // Envia flag isFutures: true para o socket
      s.emit("subscribe", {
        symbols,
        refreshRate,
        buyExchanges,
        sellExchanges,
        isFutures: true, // Flag especial para indicar futures vs futures
        lite: true,
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
      console.log("✅ Conectado ao socket (Futures/Futures)");
      setIsConnected(true);
      subscribeCurrent();
    });

    s.on("reconnect", () => {
      console.log("♻️ Reconectado ao socket (Futures/Futures)");
      subscribeCurrent();
    });

    // dispara logo após montar
    setTimeout(subscribeCurrent, 1000);

    // Atualizações completas
    s.on("arbitrageUpdate", (opp: ArbitrageOpportunity) => {
      const symbol = opp.ticker?.replace(/USDT$/i, "")?.toUpperCase();
      opp.coinImage = coinImageCache.get(symbol) || "/default-coin.png";

      // 🔥 PROVA: Log detalhado mostrando que é Futures vs Futures
      console.log(`🔥 FUTURES vs FUTURES RECEBIDO:`, {
        moeda: symbol,
        compra: {
          exchange: opp.lowestAsk?.exchange,
          isFutures:
            opp.lowestAsk?.exchange?.includes("Futures") || "CHECK SERVER LOG",
          preco: opp.lowestAsk?.price,
        },
        venda: {
          exchange: opp.highestBid?.exchange,
          isFutures:
            opp.highestBid?.exchange?.includes("Futures") || "CHECK SERVER LOG",
          preco: opp.highestBid?.price,
        },
        spread: opp.spread?.toFixed(2) + "%",
      });

      indexRef.current.set(keyOf(opp), opp);
      scheduleFlush();
    });

    // Deltas incrementais
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
      s.off();
      s.disconnect();
      socketRef.current = null;
    };
  }, [isPaused]);

  // Detecta mudanças em symbols / refresh / exchanges
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
        isFutures: true, // Sempre true para futuros vs futuros
        lite: true,
        deltaMode,
      });
    }

    prevSymbolsRef.current = symbols;
    prevRefreshRef.current = refreshRate;
    if (buyChanged) prevBuyRef.current = normList(buyExchanges);
    if (sellChanged) prevSellRef.current = normList(sellExchanges);
  }, [symbols, refreshRate, buyExchanges, sellExchanges, deltaMode]);

  return { opportunities, setOpportunities, isConnected };
}
