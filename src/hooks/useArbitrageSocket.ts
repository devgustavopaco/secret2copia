// hooks/useArbitrageSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ArbitrageOpportunity } from "../server/router/orderbook";

const URL = "wss://arbitrage-socket.fly.dev/";

const keyOf = (opp: ArbitrageOpportunity) =>
  `${opp.ticker}-${opp.lowestAsk.exchange}-${opp.highestBid.exchange}`;

const keyFromPair = (symbol: string, pairKey: string) => {
  const [spotEx, futEx] = pairKey.split("|");
  const lowEx = `${spotEx} Spot`;
  const highEx = `${futEx} Futures`;
  return `${symbol}-${lowEx}-${highEx}`;
};

// helpers p/ comparar listas
const normList = (xs: string[]) => xs.map((s) => s.toLowerCase()).sort();
const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function useArbitrageSocket(
  symbols: string[],
  refreshRate: number,
  buyExchanges: string[],
  sellExchanges: string[],
  isPaused: boolean = false
) {
  const coinImageCache = useRef<Map<string, string>>(new Map()).current;
  useEffect(() => {
    async function loadCache() {
      try {
        const res = await fetch("/api/getCoinImage");
        const coins: { ticker: string; image_url: string | null }[] =
          await res.json();
        coins.forEach((c) => {
          coinImageCache.set(c.ticker, c.image_url || "");
        });
        console.log("✅ Cache de imagens carregado:", coinImageCache.size);
      } catch (err) {
        console.error("Erro ao carregar cache de imagens:", err);
      }
    }
    loadCache();
  }, [coinImageCache]);

  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    []
  );
  // useEffect(() => {
  //   const zec = opportunities.find(
  //     (opp) => opp.ticker.replace(/USDT$/, "") === "ZEC"
  //   );
  //   if (zec) {
  //     console.log("🔎 TokenStats para ZEC:", zec.tokenStats);
  //   }
  // }, [opportunities]);

  const socketRef = useRef<Socket | null>(null);

  const indexRef = useRef<Map<string, ArbitrageOpportunity>>(new Map());
  const prevSymbolsRef = useRef<string[]>([]);
  const prevRefreshRef = useRef<number>(refreshRate);
  const prevBuyRef = useRef<string[]>(normList(buyExchanges));
  const prevSellRef = useRef<string[]>(normList(sellExchanges));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isPaused) {
      // Se pausado, apenas desconecta o socket mas mantém os dados
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const s = io(URL, { transports: ["websocket"] });
    socketRef.current = s;

    const subscribeCurrent = () => {
      if (!s.connected) return;
      console.log("➡️ subscribe()", {
        symbols,
        refreshRate,
        buyExchanges,
        sellExchanges,
      });
      s.emit("subscribe", {
        symbols,
        refreshRate,
        buyExchanges,
        sellExchanges,
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
      subscribeCurrent(); // 🚀 subscribe imediato ao conectar
    });

    s.on("reconnect", () => {
      console.log("♻️ Reconectado ao socket");
      subscribeCurrent(); // 🚀 subscribe automático ao reconectar
    });

    // ⬇️ já dispara logo ao montar (mesmo antes do evento connect)
    setTimeout(subscribeCurrent, 1000);

    s.on("arbitrageUpdate", (opp: ArbitrageOpportunity) => {
      opp.coinImage = coinImageCache.get(opp.ticker) || "";
      indexRef.current.set(keyOf(opp), opp);
      scheduleFlush();
    });

    s.on("arbitrageDelta", (payload) => {
      const { symbol, upserts, deletes } = payload;

      for (const opp of upserts) {
        opp.coinImage = coinImageCache.get(opp.ticker) || "";
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
  }, [isPaused]); // monta uma vez, mas reconecta quando pausa muda

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    // 1) dif de symbols p/ unsubscribe/subscribe
    const added = symbols.filter(
      (sym) => !prevSymbolsRef.current.includes(sym)
    );
    const removed = prevSymbolsRef.current.filter(
      (sym) => !symbols.includes(sym)
    );

    if (removed.length) {
      console.log("⬅️ unsubscribe", { symbols: removed });
      s.emit("unsubscribe", { symbols: removed });
    }

    // 2) detecta mudanças de whitelist (compra/venda) e limpa UI
    const buyChanged = !arraysEqual(normList(buyExchanges), prevBuyRef.current);
    const sellChanged = !arraysEqual(
      normList(sellExchanges),
      prevSellRef.current
    );
    const refreshChanged = refreshRate !== prevRefreshRef.current;

    if (buyChanged || sellChanged) {
      console.log("🧹 whitelist changed → limpar UI e resubscrever", {
        buyExchanges,
        sellExchanges,
      });
      indexRef.current.clear();
      setOpportunities([]); // limpa tela imediatamente
    }

    if (added.length || refreshChanged || buyChanged || sellChanged) {
      console.log("➡️ subscribe", {
        symbols,
        refreshRate,
        buyExchanges,
        sellExchanges,
      });
      s.emit("subscribe", {
        symbols,
        refreshRate,
        buyExchanges,
        sellExchanges,
      });
    }

    prevSymbolsRef.current = symbols;
    prevRefreshRef.current = refreshRate;
    if (buyChanged) prevBuyRef.current = normList(buyExchanges);
    if (sellChanged) prevSellRef.current = normList(sellExchanges);
  }, [symbols, refreshRate, buyExchanges, sellExchanges]);

  return { opportunities, setOpportunities, isConnected };
}
