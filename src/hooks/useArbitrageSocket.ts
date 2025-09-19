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
        if (symbols.length > 0) {
          socketRef.current?.emit("subscribe", { symbols, refreshRate });
        }
      });

      socketRef.current.on("arbitrageUpdate", (opp: ArbitrageOpportunity) => {
        setOpportunities((prev) => {
          // chave única: ticker + lowestAsk.exchange + highestBid.exchange
          const key = `${opp.ticker}-${opp.lowestAsk.exchange}-${opp.highestBid.exchange}`;

          const exists = prev.find(
            (p) =>
              `${p.ticker}-${p.lowestAsk.exchange}-${p.highestBid.exchange}` ===
              key
          );

          if (exists) {
            // atualiza oportunidade existente
            return prev.map((p) =>
              `${p.ticker}-${p.lowestAsk.exchange}-${p.highestBid.exchange}` ===
              key
                ? opp
                : p
            );
          }

          // adiciona novo
          return [...prev, opp];
        });
      });
    } else {
      socketRef.current?.emit("subscribe", { symbols, refreshRate });
    }
  }, [symbols, refreshRate]); // 🔥 agora dispara quando trocar symbols OU refreshRate

  return { opportunities, setOpportunities };
}
