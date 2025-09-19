// hooks/useArbitrageSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ArbitrageOpportunity } from "../server/router/orderbook";

export function useArbitrageSocket(symbols: string[], refreshRate: number) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    []
  );

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(
        "https://futures-socket-production.up.railway.app/",
        {
          transports: ["websocket"],
        }
      );

      socketRef.current.on("connect", () => {
        console.log("✅ conectado ao socket");
      });

      socketRef.current.on("arbitrageUpdate", (opp: ArbitrageOpportunity) => {
        setOpportunities((prev) => {
          const key = `${opp.ticker}-${opp.lowestAsk.exchange}-${opp.highestBid.exchange}`;
          const exists = prev.find(
            (p) =>
              `${p.ticker}-${p.lowestAsk.exchange}-${p.highestBid.exchange}` ===
              key
          );
          return exists
            ? prev.map((p) => (p.ticker === opp.ticker ? opp : p))
            : [...prev, opp];
        });
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []); // ⬅️ monta só uma vez

  // efeito separado só para subscrever quando mudar symbols/refreshRate
  useEffect(() => {
    if (socketRef.current && symbols.length > 0) {
      socketRef.current.emit("subscribe", { symbols, refreshRate });
    }
  }, [symbols, refreshRate]);

  return { opportunities, setOpportunities };
}
