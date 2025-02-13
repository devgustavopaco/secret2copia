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

export const useWebSocket = (
  symbols: SymbolExchange[],
  isPaused: boolean = false // Novo parâmetro
) => {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const wsRef = useRef<{
    binance?: WebSocket;
    bitget?: WebSocket;
    kucoin?: WebSocket;
    mexc?: WebSocket;
    gateio?: WebSocket;
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
    gateio: new Set(),
  });

  useEffect(() => {
    // Se estiver pausado, não faça nada
    if (isPaused) {
      // Feche todas as conexões WebSocket
      Object.values(wsRef.current).forEach((ws) => {
        if (ws) ws.close();
      });
      wsRef.current = {}; // Limpa todas as referências de websocket
      setPrices({}); // Limpa os preços
      return;
    }

    // Organize current symbols by exchange
    const currentSymbols: Record<string, Set<string>> = {
      binance: new Set(),
      bitget: new Set(),
      kucoin: new Set(),
      mexc: new Set(),
      gateio: new Set(),
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
        wsRef.current[exchange as keyof typeof wsRef.current]?.close();
        // The existing connection logic will handle reconnection
      } else if (hasChanges && symbols.size === 0) {
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

            // Subscribe para futuros
            const subscribeFuturesMsg = {
              op: "subscribe",
              args:
                symbolsByExchange.bitget?.map((symbol) => ({
                  instType: "UMCBL",
                  channel: "ticker",
                  instId: `${symbol}USDT_UMCBL`,
                })) ?? [],
            };
            bitgetWs.send(JSON.stringify(subscribeFuturesMsg));
          } catch (error) {
            console.error("Erro ao enviar subscribe Bitget:", error);
            setTimeout(connectBitget, 5000);
          }
        };

        bitgetWs.onclose = () => {
          setTimeout(connectBitget, 5000);
        };

        bitgetWs.onerror = (error) => {
          console.error("Erro no WebSocket Bitget:", error);
          bitgetWs.close();
        };

        bitgetWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Processa mensagens spot
            if (data.arg?.channel === "ticker" && data.data?.[0]) {
              const symbol = data.arg.instId.replace("USDT", "");
              const price = data.data[0].lastPr;

              if (price && data.arg.instType === "SPOT") {
                setPrices((prev) => ({
                  ...prev,
                  [`bitget_${symbol}`]: price,
                }));
              }
              // Processa mensagens futures
              else if (price && data.arg.instType === "UMCBL") {
                const futuresSymbol = symbol.replace("_UMCBL", "");
                setPrices((prev) => ({
                  ...prev,
                  [`bitget_futures_${futuresSymbol}`]: price,
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

              // Subscribe para spot
              mexcWs.send(JSON.stringify(subscribeMsg));

              // Subscribe para futuros
              const futuresMsg = {
                method: "sub.ticker",
                param: {
                  symbol: `${baseSymbol}_USDT`,
                },
              };
              mexcWs.send(JSON.stringify(futuresMsg));
            });
          };

          mexcWs.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              // Verifica se é uma mensagem de ticker
              if (data.channel === "push.tickers" && Array.isArray(data.data)) {
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

                  if (price) {
                    setPrices((prev) => ({
                      ...prev,
                      [`mexc_${symbol}`]: price.toString(),
                    }));
                  }
                });
              }

              // Verifica se é uma mensagem de ticker futures
              if (data.channel === "push.ticker") {
                const symbol = data.symbol.replace("_USDT", "");
                const price = data.data.last;

                if (price) {
                  setPrices((prev) => ({
                    ...prev,
                    [`mexc_futures_${symbol}`]: price.toString(),
                  }));
                }
              }
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

    // Gate.io Futures WebSocket
    if (currentSymbols.gateio && symbolsByExchange.gateio) {
      const connectGateio = () => {
        // Lista de endpoints alternativos
        const endpoints = [
          "wss://fx-ws.gateio.ws/v4/ws/usdt",
          "wss://fx-ws.gateio.ws/v4/ws",
          "wss://fx-ws-testnet.gateio.ws/v4/ws/usdt",
        ];

        let currentEndpoint = 0;
        let connected = false;
        let reconnectAttempts = 0;
        const MAX_RECONNECT_ATTEMPTS = 5;
        let pingInterval: NodeJS.Timeout;

        const tryConnect = () => {
          if (
            connected ||
            currentEndpoint >= endpoints.length ||
            reconnectAttempts >= MAX_RECONNECT_ATTEMPTS
          ) {
            console.log(
              "Máximo de tentativas de reconexão atingido ou já conectado"
            );
            return;
          }

          const endpoint = endpoints[currentEndpoint];
          console.log(
            `Tentando conectar ao Gate.io usando endpoint: ${endpoint}`
          );

          if (!endpoint) {
            console.error("Endpoint inválido para Gate.io");
            return;
          }

          const gateioWs = new WebSocket(endpoint);
          wsRef.current.gateio = gateioWs;

          gateioWs.onopen = () => {
            console.log("Conexão estabelecida com Gate.io");
            connected = true;
            reconnectAttempts = 0;

            try {
              // Primeiro enviar um ping para verificar a conexão
              const pingMsg = {
                time: Math.floor(Date.now() / 1000),
                channel: "futures.ping",
                event: "ping",
                payload: [],
              };
              gateioWs.send(JSON.stringify(pingMsg));

              // Subscribe para os tickers de futuros
              const subscribeMsg = {
                time: Math.floor(Date.now() / 1000),
                channel: "futures.tickers",
                event: "subscribe",
                payload: symbolsByExchange.gateio?.map(
                  (symbol) => `${symbol}_USDT`
                ),
              };
              gateioWs.send(JSON.stringify(subscribeMsg));

              // Configurar ping interval após conexão bem sucedida
              pingInterval = setInterval(() => {
                if (gateioWs.readyState === WebSocket.OPEN) {
                  const pingMsg = {
                    time: Math.floor(Date.now() / 1000),
                    channel: "futures.ping",
                    event: "ping",
                    payload: [],
                  };
                  gateioWs.send(JSON.stringify(pingMsg));
                }
              }, 5000);
            } catch (error) {
              console.error(
                "Erro ao enviar mensagens iniciais Gate.io:",
                error
              );
              gateioWs.close();
            }
          };

          gateioWs.onclose = (event) => {
            console.log(
              `Conexão Gate.io fechada. Code: ${event.code}, Reason: ${event.reason}`
            );
            connected = false;
            clearInterval(pingInterval);

            if (!connected) {
              reconnectAttempts++;
              currentEndpoint++;
              setTimeout(() => {
                console.log(
                  `Tentativa de reconexão ${reconnectAttempts} de ${MAX_RECONNECT_ATTEMPTS}`
                );
                tryConnect();
              }, 5000 * reconnectAttempts); // Backoff exponencial
            }
          };

          gateioWs.onerror = (error) => {
            console.error("Erro no WebSocket Gate.io:", error);
            // Não fechar aqui, deixar o onclose lidar com a reconexão
          };

          gateioWs.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              // Log para debug
              if (data.channel !== "futures.ping") {
                console.log("Mensagem recebida Gate.io:", data);
              }

              // Verifica se é uma mensagem de ticker
              if (
                data.channel === "futures.tickers" &&
                data.event === "update"
              ) {
                const tickers = Array.isArray(data.result)
                  ? data.result
                  : [data.result];

                tickers.forEach((ticker: any) => {
                  if (!ticker || !ticker.contract) return;

                  const symbol = ticker.contract.split("_")[0];
                  const price = ticker.last; // último preço negociado

                  if (price) {
                    setPrices((prev) => ({
                      ...prev,
                      [`gateio_futures_${symbol}`]: price.toString(),
                    }));
                  }
                });
              }
            } catch (error) {
              console.error("Erro ao processar mensagem Gate.io:", error);
              console.error("Dados que causaram o erro:", event.data);
            }
          };
        };

        tryConnect();

        return () => {
          clearInterval(pingInterval);
          if (wsRef.current.gateio) {
            wsRef.current.gateio.close();
          }
        };
      };

      const cleanup = connectGateio();
      return cleanup;
    }

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      Object.values(wsRef.current).forEach((ws) => {
        if (ws) ws.close();
      });
      clearInterval(mexcPingInterval);
    };
  }, [symbols, isPaused]); // Adicione isPaused como dependência

  return prices;
};
