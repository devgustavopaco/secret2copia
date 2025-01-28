"use client";
import { useEffect, useRef, useState } from "react";

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

interface SymbolExchange {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
}

export const useWebSocket = (symbols: SymbolExchange[]) => {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const wsRef = useRef<{
    binance?: WebSocket;
    bitget?: WebSocket;
    kucoin?: WebSocket;
    mexc?: WebSocket;
  }>({});
  //   const kucoinTokenRef = useRef<{
  //     token: string;
  //     endpoint: string;
  //     expireTime?: number;
  //   }>();
  const previousSymbolsRef = useRef<Record<string, Set<string>>>({
    binance: new Set(),
    bitget: new Set(),
    kucoin: new Set(),
    mexc: new Set(),
  });

  useEffect(() => {
    // Organize current symbols by exchange
    const currentSymbols: Record<string, Set<string>> = {
      binance: new Set(),
      bitget: new Set(),
      kucoin: new Set(),
      mexc: new Set(),
    };

    symbols.forEach((symbol) => {
      if (symbol.buyExchange) {
        const exchange = symbol.buyExchange.toLowerCase();
        currentSymbols[exchange]?.add(symbol.symbol);
      }
      if (symbol.sellExchange) {
        const exchange = symbol.sellExchange.toLowerCase();
        currentSymbols[exchange]?.add(symbol.symbol);
      }
    });

    // Check for changes in each exchange's symbols
    Object.entries(currentSymbols).forEach(([exchange, symbols]) => {
      const previousSymbols = previousSymbolsRef.current[exchange];
      const hasChanges =
        symbols.size !== previousSymbols?.size ||
        ![...symbols].every((symbol) => previousSymbols?.has(symbol));

      // If symbols changed, reconnect the websocket with new subscriptions
      if (hasChanges && symbols.size > 0) {
        console.log(`Reconnecting ${exchange} due to symbol changes`);
        wsRef.current[exchange as keyof typeof wsRef.current]?.close();
        // The existing connection logic will handle reconnection
      } else if (hasChanges && symbols.size === 0) {
        console.log(`Closing connection for ${exchange} - no symbols needed`);
        wsRef.current[exchange as keyof typeof wsRef.current]?.close();
        wsRef.current[exchange as keyof typeof wsRef.current] = undefined;
      }
    });

    // Update previous symbols reference
    previousSymbolsRef.current = currentSymbols;

    // Rest of the existing connection logic...
    const symbolsByExchange: Record<string, string[]> = {};
    Object.entries(currentSymbols).forEach(([exchange, symbols]) => {
      if (symbols.size > 0) {
        symbolsByExchange[exchange] = Array.from(symbols);
      }
    });

    // Only connect to needed exchanges
    if (currentSymbols.binance && symbolsByExchange.binance) {
      const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws");
      wsRef.current.binance = binanceWs;

      binanceWs.onopen = () => {
        console.log("Binance WebSocket conectado");
        const subscribeMsg = {
          method: "SUBSCRIBE",
          params:
            symbolsByExchange.binance?.map(
              (symbol) => `${symbol.toLowerCase()}@ticker`
            ) ?? [],
          id: 1,
        };
        binanceWs.send(JSON.stringify(subscribeMsg));
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

      // Adicionar handlers de erro
      binanceWs.onerror = (error) => {
        console.error("Erro no WebSocket Binance:", error);
      };
    }

    if (currentSymbols.bitget && symbolsByExchange.bitget) {
      const connectBitget = () => {
        const bitgetWs = new WebSocket("wss://ws.bitget.com/v2/ws/public");
        wsRef.current.bitget = bitgetWs;

        bitgetWs.onopen = () => {
          console.log("Bitget WebSocket conectado");
          try {
            const subscribeMsg = {
              op: "subscribe",
              args:
                symbolsByExchange.bitget?.map((symbol) => ({
                  instType: "SPOT",
                  channel: "ticker",
                  instId: `${symbol}USDT`,
                })) ?? [],
            };
            bitgetWs.send(JSON.stringify(subscribeMsg));
          } catch (error) {
            console.error("Erro ao enviar subscribe Bitget:", error);
            setTimeout(connectBitget, 5000); // Retry after 5 seconds
          }
        };

        bitgetWs.onclose = () => {
          console.log("Bitget WebSocket fechado, tentando reconectar...");
          setTimeout(connectBitget, 5000);
        };

        bitgetWs.onerror = (error) => {
          console.error("Erro no WebSocket Bitget:", error);
          bitgetWs.close();
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
                rawData: data.data[1],
              });

              if (price) {
                // Só atualiza se tiver preço
                setPrices((prev) => ({
                  ...prev,
                  [`bitget_${symbol}`]: price,
                }));
              }
            }
          } catch (error) {
            console.error("Erro ao processar mensagem Bitget:", error);
          }
        };
      };

      connectBitget();
    }

    // Ping para manter conexão ativa
    const pingInterval = setInterval(() => {
      if (currentSymbols.bitget && wsRef.current.bitget) {
        wsRef.current.bitget.send("ping");
      }
      if (currentSymbols.binance && wsRef.current.binance) {
        wsRef.current.binance.send(JSON.stringify({ method: "ping" }));
      }
    }, 30000);

    // Conectar à KuCoin
    // const connectKucoin = async () => {
    //   if (currentSymbols.kucoin && symbolsByExchange.kucoin) {
    //     try {
    //       // Check if we have a valid token
    //       const now = Date.now();
    //       if (
    //         !kucoinTokenRef.current ||
    //         (kucoinTokenRef.current.expireTime &&
    //           now >= kucoinTokenRef.current.expireTime)
    //       ) {
    //         const response = await fetch("/api/kucoin-token", {
    //           method: "POST",
    //         });
    //         const data: KucoinTokenResponse = await response.json();

    //         if (data.data.instanceServers?.[0]) {
    //           kucoinTokenRef.current = {
    //             token: data.data.token,
    //             endpoint: data.data.instanceServers[0].endpoint,
    //             expireTime: now + 24 * 60 * 60 * 1000, // Token expires in 24h
    //           };
    //         }
    //       }

    //       if (kucoinTokenRef.current) {
    //         const wsEndpoint = `${kucoinTokenRef.current.endpoint}?token=${kucoinTokenRef.current.token}`;
    //         const kucoinWs = new WebSocket(wsEndpoint);
    //         wsRef.current.kucoin = kucoinWs;

    //         kucoinWs.onopen = () => {
    //           // Subscribe apenas para futuros
    //           symbolsByExchange.kucoin?.forEach((symbol) => {
    //             const subscribeMsg = {
    //               id: Date.now(),
    //               type: "subscribe",
    //               topic: `/contractMarket/tickerV2:${symbol}M`,
    //               response: true,
    //             };

    //             kucoinWs.send(JSON.stringify(subscribeMsg));
    //           });
    //         };
    //         const lastUpdate: { [key: string]: number } = {};
    //         const THROTTLE_MS = 50000; // 50 segundos

    //         kucoinWs.onmessage = (event) => {
    //           try {
    //             const data = JSON.parse(event.data);
    //             console.log("Recebido preço KuCoin:", data);
    //             if (data.type === "message") {
    //               if (data.subject === "tickerV2") {
    //                 const symbol = data.topic
    //                   .split(":")[1]
    //                   .replace("USDT", "")
    //                   .replace("M", "");
    //                 const price =
    //                   data.data.bestBidPrice || data.data.bestAskPrice;

    //                 if (price) {
    //                   const now = Date.now();
    //                   // Só atualiza se passou o tempo de throttle
    //                   if (
    //                     !lastUpdate[symbol] ||
    //                     now - lastUpdate[symbol] >= THROTTLE_MS
    //                   ) {
    //                     lastUpdate[symbol] = now;
    //                     setPrices((prev) => ({
    //                       ...prev,
    //                       [`kucoin_${symbol}`]: price.toString(),
    //                     }));
    //                   }
    //                 }
    //               }
    //             }
    //           } catch (error) {
    //             console.error("Erro ao processar mensagem KuCoin:", error);
    //           }
    //         };

    //         kucoinWs.onerror = (error) => {
    //           console.error("Erro no WebSocket KuCoin:", error);
    //         };

    //         // Ping para manter conexão
    //         const pingKucoinInterval = setInterval(() => {
    //           if (kucoinWs.readyState === WebSocket.OPEN) {
    //             kucoinWs.send(
    //               JSON.stringify({
    //                 id: Date.now(),
    //                 type: "ping",
    //               })
    //             );
    //           }
    //         }, 50000); // 50 segundos para o ping também

    //         return () => {
    //           console.log("Limpando conexão KuCoin");
    //           clearInterval(pingKucoinInterval);
    //           if (wsRef.current.kucoin) {
    //             wsRef.current.kucoin.close();
    //           }
    //         };
    //       }
    //     } catch (error) {
    //       console.error("Erro ao conectar com KuCoin:", error);
    //       console.error(
    //         "Stack trace:",
    //         error instanceof Error ? error.stack : undefined
    //       );
    //     }
    //   }
    // };

    // connectKucoin();

    // Tentar conectar à MEXC
    const connectMexc = () => {
      if (currentSymbols.mexc && symbolsByExchange.mexc) {
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

            symbolsByExchange.mexc?.forEach((symbol) => {
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
                  return (
                    symbolsByExchange.mexc?.some(
                      (symbol) => symbol.replace("USDT", "") === tickerSymbol
                    ) ?? false
                  );
                });

                relevantTickers.forEach((ticker: any) => {
                  const symbol = ticker.symbol.split("_")[0];
                  const price = ticker.lastPrice;
                  console.log("Recebido preço MEXC:", {
                    symbol,
                    price,
                  });
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
      }
    };

    const mexcPingInterval = connectMexc() || setInterval(() => {}, 1000);

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      Object.values(wsRef.current).forEach((ws) => {
        if (ws) ws.close();
      });
      clearInterval(mexcPingInterval);
    };
  }, [symbols]);

  return prices;
};
