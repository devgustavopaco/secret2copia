import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";
import axios from "axios";

let gateioWs: WebSocket | null = null;
let subscribedSymbols: Set<string> = new Set();

// Store prices of symbols (e.g., { "BTC_USDT": 93220.5, ... })
const precosSpot: Record<string, number> = {};
let lastFetchTime = 0;
const FETCH_INTERVAL = 1000; // 1 segundo

function connectGateioWs() {
  if (gateioWs && gateioWs.readyState === WebSocket.OPEN) {
    console.log("Já conectado ao WebSocket da Gate.io.");
    return;
  }

  const endpoint = "wss://api.gateio.ws/ws/v4/";
  console.log("Conectando ao WebSocket Gate.io...");
  gateioWs = new WebSocket(endpoint);

  gateioWs.on("open", () => {
    console.log("Conexão WebSocket da Gate.io estabelecida.");
    subscribedSymbols.forEach((symbol) => {
      subscribeSymbol(symbol);
    });
  });

  gateioWs.on("message", (data) => {
    // console.log("Mensagem recebida da Gate.io:", data.toString());
    try {
      const parsedData = JSON.parse(data.toString());
      const symbol = parsedData?.result?.currency_pair;
      const price = parsedData?.result?.price;
      if (symbol && price != null) {
        // Store the price in the precosSpot object
        precosSpot[symbol] = parseFloat(price);
      }
    } catch (err) {
      console.error("Erro WS Spot Gate.io:", err);
    }
  });

  gateioWs.on("error", (error) => {
    console.error("Erro no WebSocket da Gate.io:", error);
    reconnectGateioWs();
  });

  gateioWs.on("close", (code, reason) => {
    console.warn(
      `WebSocket da Gate.io fechado: ${code} - ${reason.toString()}`
    );
    reconnectGateioWs();
  });
}

function subscribeSymbol(symbol: string) {
  if (gateioWs && gateioWs.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      time: Math.floor(Date.now() / 1000),
      channel: "spot.trades",
      event: "subscribe",
      payload: [`${symbol}_USDT`],
    });

    gateioWs.send(message);
  }
}

function reconnectGateioWs() {
  if (gateioWs) {
    gateioWs.close();
  }
  connectGateioWs();
}

// Desinscrição de um símbolo
function unsubscribeSymbol(symbol: string) {
  if (!gateioWs || gateioWs.readyState !== WebSocket.OPEN) {
    console.log("Tentando se desinscrever antes de conectar: reconectando...");
    connectGateioWs();
    return;
  }

  const baseSymbol =
    symbol.toUpperCase() === "CULT"
      ? "MILADYCULT_USDT"
      : symbol.toUpperCase().includes("_USDT")
      ? symbol.toUpperCase()
      : `${symbol.toUpperCase()}_USDT`;

  const unsubscribeMsg = {
    time: Math.floor(Date.now() / 1000),
    channel: "spot.trades",
    event: "unsubscribe",
    payload: [baseSymbol],
  };
  gateioWs.send(JSON.stringify(unsubscribeMsg));
  console.log(`Desinscrito do par: ${baseSymbol}`);
}

// Função para buscar preços da API REST
async function fetchPricesREST() {
  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL) {
    return; // Evitar chamadas muito frequentes
  }

  lastFetchTime = now;

  try {
    // Esta chamada obtém TODOS os preços de spot de uma vez
    const response = await axios.get(
      "https://api.gateio.ws/api/v4/spot/tickers"
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      response.data.forEach((item: any) => {
        if (item.currency_pair && item.currency_pair.endsWith("_USDT")) {
          // O símbolo já está no formato correto (BTC_USDT)
          const symbol = item.currency_pair;

          // Usar o último preço (last)
          const price = parseFloat(item.last);

          // Verificar se o preço é um número válido
          if (!isNaN(price)) {
            precosSpot[symbol] = price;
          }
        }
      });
    }
  } catch (error) {
    console.error("Erro ao buscar preços spot da Gate.io:", error);
  }
}

// Buscar preços iniciais
fetchPricesREST();

// Configurar intervalo para buscar preços regularmente
setInterval(fetchPricesREST, FETCH_INTERVAL);

// Handler da rota
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET": {
      // Buscar preços atualizados antes de responder
      await fetchPricesREST();

      // Return all stored prices in memory
      return res.status(200).json({ precosSpot });
    }

    case "POST": {
      const { action, symbol } = req.body || {};
      if (!symbol || typeof symbol !== "string") {
        return res
          .status(400)
          .json({ error: "É necessário um 'symbol' string" });
      }

      if (action === "subscribe") {
        // Não precisamos realmente "assinar" nada, já que estamos usando REST
        // Mas mantemos a API consistente com as outras implementações

        // Formatar o símbolo para o formato correto (BTC_USDT)
        const formattedSymbol = symbol.includes("_")
          ? symbol.toUpperCase()
          : `${symbol.toUpperCase()}_USDT`;

        // Buscar o preço específico para garantir que temos o mais recente
        try {
          const response = await axios.get(
            `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${formattedSymbol}`
          );

          if (
            response.status === 200 &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            const price = parseFloat(response.data[0].last);
            if (!isNaN(price)) {
              precosSpot[formattedSymbol] = price;
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar preço para ${formattedSymbol}:`, error);
        }

        return res.status(200).json({
          message: `Inscrito no par: ${formattedSymbol}`,
          price: precosSpot[formattedSymbol],
        });
      }

      return res.status(400).json({ error: "Ação deve ser subscribe" });
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Método ${method} Não Permitido`);
    }
  }
}
