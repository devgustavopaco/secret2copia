import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ArbitrageOpportunity } from "../server/router/orderbook";

const SOCKET_URL = "https://almeidashop.shop/";
const keyOf = (opp: ArbitrageOpportunity) =>
  `${opp.ticker}-${opp.lowestAsk.exchange}-${opp.highestBid.exchange}`;

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
  isPaused: boolean = false
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

    const s = io(SOCKET_URL, { transports: ["websocket"] });
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
      indexRef.current.set(keyOf(opp), opp);
      scheduleFlush();
    });

    // Deltas incrementais
    s.on("arbitrageDelta", (payload) => {
      const { symbol, upserts, deletes } = payload;

      for (const opp of upserts) {
        const sym = opp.ticker?.replace(/USDT$/i, "")?.toUpperCase();
        opp.coinImage = coinImageCache.get(sym) || "/default-coin.png";
        indexRef.current.set(keyOf(opp), opp);
      }

      for (const pair of deletes) {
        indexRef.current.delete(keyFromPair(symbol, pair));
      }

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
      });
    }

    prevSymbolsRef.current = symbols;
    prevRefreshRef.current = refreshRate;
    if (buyChanged) prevBuyRef.current = normList(buyExchanges);
    if (sellChanged) prevSellRef.current = normList(sellExchanges);
  }, [symbols, refreshRate, buyExchanges, sellExchanges]);

  return { opportunities, setOpportunities, isConnected };
}
