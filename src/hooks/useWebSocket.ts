"use client";
import { useEffect, useRef, useState } from "react";

interface WebSocketPrice {
  symbol: string;
  price: string;
}

interface MexcTicker {
  symbol: string;
  lastPrice: number;
  // ... outros campos se necessário
}

interface KucoinTokenResponse {
  code: string;
  data: {
    token: string;
    instanceServers: {
      endpoint: string;
      encrypt: boolean;
      protocol: string;
      pingInterval: number;
      pingTimeout: number;
    }[];
  };
}

export const useWebSocket = (symbols: string[]) => {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const wsRef = useRef<{
    binance?: WebSocket;
    bitget?: WebSocket;
    kucoin?: WebSocket;
    mexc?: WebSocket;
  }>({});
  const lastUpdateRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const formattedSymbols = symbols.map((symbol) => `${symbol}USDT`);
    console.log(
      "Iniciando WebSocket com símbolos formatados:",
      formattedSymbols
    );

    // Conectar à Binance
    const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws");
    wsRef.current.binance = binanceWs;

    // Conectar à Bitget
    const bitgetWs = new WebSocket("wss://ws.bitget.com/v2/ws/public");
    wsRef.current.bitget = bitgetWs;

    binanceWs.onopen = () => {
      console.log("Binance WebSocket conectado");
      const subscribeMsg = {
        method: "SUBSCRIBE",
        params: formattedSymbols.map(
          (symbol) => `${symbol.toLowerCase()}@ticker`
        ),
        id: 1,
      };
      console.log("Enviando subscribe para Binance:", subscribeMsg);
      binanceWs.send(JSON.stringify(subscribeMsg));
    };

    bitgetWs.onopen = () => {
      console.log("Bitget WebSocket conectado");
      const subscribeMsg = {
        op: "subscribe",
        args: formattedSymbols.map((symbol) => ({
          instType: "SPOT",
          channel: "ticker",
          instId: symbol,
        })),
      };
      console.log("Enviando subscribe para Bitget:", subscribeMsg);
      bitgetWs.send(JSON.stringify(subscribeMsg));
    };

    // Handlers para mensagens recebidas
    binanceWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === "24hrTicker") {
          const symbol = data.s.replace("USDT", ""); // Remove USDT para armazenar
          console.log("Recebido preço Binance:", {
            symbol,
            price: data.c,
          });
          setPrices((prev) => ({
            ...prev,
            [`binance_${symbol}`]: data.c,
          }));
        }
      } catch (error) {
        console.error("Erro ao processar mensagem Binance:", error);
      }
    };

    bitgetWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.arg?.channel === "ticker" && data.data?.[0]) {
          const symbol = data.arg.instId.replace("USDT", "");
          const price = data.data[0].lastPr;

          console.log("Recebido preço Bitget:", {
            symbol,
            price,
            rawData: data.data[0],
          });

          if (price) {
            setPrices((prev) => ({
              ...prev,
              [`bitget_${symbol}`]: price.toString(),
            }));
          }
        }
      } catch (error) {
        console.error("Erro ao processar mensagem Bitget:", error);
        console.error("Dados que causaram o erro:", event.data);
      }
    };

    // Adicionar handlers de erro
    binanceWs.onerror = (error) => {
      console.error("Erro no WebSocket Binance:", error);
    };

    bitgetWs.onerror = (error) => {
      console.error("Erro no WebSocket Bitget:", error);
    };

    // Ping para manter conexão ativa
    const pingInterval = setInterval(() => {
      if (bitgetWs.readyState === WebSocket.OPEN) {
        bitgetWs.send("ping");
      }
      if (binanceWs.readyState === WebSocket.OPEN) {
        binanceWs.send(JSON.stringify({ method: "ping" }));
      }
    }, 30000);

    // Conectar à KuCoin
    const connectKucoin = async () => {
      try {
        const response = await fetch("/api/kucoin-token", {
          method: "POST",
        });
        const data: KucoinTokenResponse = await response.json();

        if (data.data.instanceServers?.[0]) {
          const { endpoint } = data.data.instanceServers[0];
          const token = data.data.token;
          const wsEndpoint = `${endpoint}?token=${token}`;

          const kucoinWs = new WebSocket(wsEndpoint);
          wsRef.current.kucoin = kucoinWs;

          // Controle de throttle para KuCoin
          const lastUpdate: Record<string, number> = {};
          const THROTTLE_MS = 50000; // 50 segundos

          kucoinWs.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              if (data.type === "message" && data.subject === "tickerV2") {
                const symbol = data.topic
                  .split(":")[1]
                  .replace("USDT", "")
                  .replace("M", "");
                const price = data.data.bestBidPrice || data.data.bestAskPrice;

                if (price) {
                  const now = Date.now();
                  const lastUpdateTime = lastUpdate[symbol] || 0;

                  if (now - lastUpdateTime >= THROTTLE_MS) {
                    lastUpdate[symbol] = now;
                    setPrices((prev) => ({
                      ...prev,
                      [`kucoin_${symbol}`]: price.toString(),
                    }));
                  }
                }
              }
            } catch (error) {
              console.error("Erro ao processar mensagem KuCoin:", error);
            }
          };

          // Ping para manter conexão
          const pingKucoinInterval = setInterval(() => {
            if (kucoinWs.readyState === WebSocket.OPEN) {
              kucoinWs.send(
                JSON.stringify({
                  id: Date.now(),
                  type: "ping",
                })
              );
            }
          }, 50000); // 50 segundos para o ping também

          return pingKucoinInterval;
        }
      } catch (error) {
        console.error("Erro ao conectar com KuCoin:", error);
        console.error(
          "Stack trace:",
          error instanceof Error ? error.stack : undefined
        );
      }
    };

    const kucoinPingInterval = connectKucoin();

    // Tentar conectar à MEXC
    const connectMexc = () => {
      const endpoints = [
        "wss://contract.mexc.com/ws",
        "wss://contract.mexc.com/edge",
      ];

      let connected = false;
      let currentEndpoint = 0;
      let pingMexcInterval: NodeJS.Timeout | undefined;

      const tryConnect = () => {
        if (connected || currentEndpoint >= endpoints.length) return;

        const endpoint = endpoints[currentEndpoint];
        if (!endpoint) return;

        const mexcWs = new WebSocket(endpoint);
        wsRef.current.mexc = mexcWs;

        mexcWs.onerror = (error) => {
          console.error(`Erro na conexão MEXC com ${endpoint}:`, error);
          currentEndpoint++;
          tryConnect();
        };

        mexcWs.onclose = (event) => {
          if (!connected) {
            currentEndpoint++;
            tryConnect();
          }
        };

        mexcWs.onopen = () => {
          connected = true;

          // Primeiro enviar um ping para verificar a conexão
          mexcWs.send(JSON.stringify({ method: "ping" }));

          formattedSymbols.forEach((symbol) => {
            const baseSymbol = symbol.replace("USDT", "");
            const subscribeMsg = {
              method: "sub.tickers",
              param: {
                symbol: `${baseSymbol}_USDT`,
              },
            };

            mexcWs.send(JSON.stringify(subscribeMsg));
          });
        };

        mexcWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Verifica se é uma mensagem de ticker
            if (data.channel === "push.tickers" && Array.isArray(data.data)) {
              // Filtra apenas os tickers que nos interessam
              const relevantTickers = data.data.filter((ticker: any) => {
                const tickerSymbol = ticker.symbol.split("_")[0];
                return formattedSymbols.some(
                  (symbol) => symbol.replace("USDT", "") === tickerSymbol
                );
              });

              relevantTickers.forEach((ticker: any) => {
                const symbol = ticker.symbol.split("_")[0];
                const price = ticker.lastPrice;

                if (price) {
                  setPrices((prev) => {
                    const oldPrice = prev[`mexc_${symbol}`];
                    const newPrice = price.toString();

                    return {
                      ...prev,
                      [`mexc_${symbol}`]: newPrice,
                    };
                  });
                }
              });
            }
            // Logs para outros tipos de mensagens
          } catch (error) {
            console.error("Erro ao processar mensagem MEXC:", error);
            console.error("Dados que causaram o erro:", event.data);
          }
        };

        pingMexcInterval = setInterval(() => {
          if (mexcWs.readyState === WebSocket.OPEN) {
            mexcWs.send(JSON.stringify({ method: "ping" }));
          }
        }, 15000);
      };

      tryConnect();
      return pingMexcInterval;
    };

    const mexcPingInterval = connectMexc() || setInterval(() => {}, 0);

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      if (wsRef.current.binance) {
        wsRef.current.binance.close();
      }
      if (wsRef.current.bitget) {
        wsRef.current.bitget.close();
      }
      if (wsRef.current.kucoin) {
        wsRef.current.kucoin.close();
      }
      clearInterval(mexcPingInterval);
      if (wsRef.current.mexc) {
        wsRef.current.mexc.close();
      }
    };
  }, [symbols]);

  // Log dos preços atualizados
  useEffect(() => {
    console.log("Preços atualizados:", prices);
  }, [prices]);

  return prices;
};
