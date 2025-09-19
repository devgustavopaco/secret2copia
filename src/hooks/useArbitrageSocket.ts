// hooks/useArbitrageSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ArbitrageOpportunity } from "../server/router/orderbook";

const URL = "https://futures-socket-production.up.railway.app/";

const keyOf = (opp: ArbitrageOpportunity) =>
  `${opp.ticker}-${opp.lowestAsk.exchange}-${opp.highestBid.exchange}`;

const keyFromPair = (symbol: string, pairKey: string) => {
  // pairKey do backend = "SpotEx|FutEx"
  const [spotEx, futEx] = pairKey.split("|");
  const lowEx = `${spotEx} Spot`;
  const highEx = `${futEx} Futures`;
  return `${symbol}-${lowEx}-${highEx}`;
};

export function useArbitrageSocket(symbols: string[], refreshRate: number) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    []
  );
  const socketRef = useRef<Socket | null>(null);

  // índice em memória para updates rápidos
  const indexRef = useRef<Map<string, ArbitrageOpportunity>>(new Map());
  const prevSymbolsRef = useRef<string[]>([]);
  const prevRefreshRef = useRef<number>(refreshRate);

  useEffect(() => {
    const s = io(URL, { transports: ["websocket"] });
    socketRef.current = s;

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
      if (symbols.length) s.emit("subscribe", { symbols, refreshRate });
    });

    s.on("reconnect", () => {
      console.log("♻️ Reconectado ao socket");
      if (symbols.length) s.emit("subscribe", { symbols, refreshRate });
    });

    // BACK-COMPAT: ainda funciona se o backend emitir arbitrageUpdate
    s.on("arbitrageUpdate", (opp: ArbitrageOpportunity) => {
      console.log("📩 [arbitrageUpdate recebido]", opp.ticker, opp);
      indexRef.current.set(keyOf(opp), opp);
      scheduleFlush();
    });

    // NOVO: deltas em lote (muito mais eficiente)
    s.on(
      "arbitrageDelta",
      (payload: {
        symbol: string;
        upserts: ArbitrageOpportunity[];
        deletes: string[];
      }) => {
        const { symbol, upserts, deletes } = payload;
        console.log("📩 [arbitrageDelta recebido]", symbol, {
          upserts: upserts.length,
          deletes: deletes.length,
        });

        for (const opp of upserts) {
          indexRef.current.set(keyOf(opp), opp);
        }
        for (const pair of deletes) {
          indexRef.current.delete(keyFromPair(symbol, pair));
        }
        scheduleFlush();
      }
    );

    return () => {
      if (prevSymbolsRef.current.length) {
        s.emit("unsubscribe", { symbols: prevSymbolsRef.current });
      }
      s.off();
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // monta apenas uma vez

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
      console.log("🚪 Unsubscribing de", removed);
      s.emit("unsubscribe", { symbols: removed });
    }
    if (added.length || refreshRate !== prevRefreshRef.current) {
      console.log("📡 Subscribing em", symbols, "com refreshRate", refreshRate);
      if (symbols.length) s.emit("subscribe", { symbols, refreshRate });
    }

    prevSymbolsRef.current = symbols;
    prevRefreshRef.current = refreshRate;
  }, [symbols, refreshRate]);

  return { opportunities, setOpportunities };
}
