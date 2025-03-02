import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

let mexcWs: WebSocket | null = null;
let subscribedSymbols: Set<string> = new Set();

// Store prices of symbols (e.g., { "BTC_USDT": 28200.5, ... })
const precosFuturos: Record<string, number> = {};

function connectMexcWs() {
  if (mexcWs && mexcWs.readyState === WebSocket.OPEN) {
    console.log("Já conectado ao WebSocket da MEXC.");
    return;
  }

  const endpoint = "wss://contract.mexc.com/edge";
  console.log("Conectando ao WebSocket MEXC...");
  mexcWs = new WebSocket(endpoint);

  mexcWs.on("open", () => {
    console.log("WebSocket MEXC Futuros aberto.");
    subscribedSymbols.forEach((symbol) => {
      subscribeSymbol(symbol);
    });
  });

  mexcWs.on("message", (data) => {
    console.log("[MEXC Futures - Raw WS Message]:", data.toString());
    try {
      const parsedData = JSON.parse(data.toString());
      const symbol = parsedData.symbol;
      const lastPrice = parsedData?.data?.lastPrice;
      if (symbol && lastPrice != null) {
        // Store the lastPrice in the precosFuturos object
        precosFuturos[symbol] = parseFloat(lastPrice);
      }
    } catch (err) {
      console.error("Erro WS Futuros MEXC:", err);
    }
  });

  mexcWs.on("error", (error) => {
    console.error("Erro no WebSocket da MEXC:", error);
    reconnectMexcWs();
  });

  mexcWs.on("close", (code, reason) => {
    console.warn(`WebSocket da MEXC fechado: ${code} - ${reason.toString()}`);
    reconnectMexcWs();
  });
}

function subscribeSymbol(symbol: string) {
  if (mexcWs && mexcWs.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      method: "sub.ticker",
      param: {
        symbol: `${symbol}_USDT`,
      },
    });
    console.log("Sending WebSocket message:", message);
    mexcWs.send(message);
  }
}

function reconnectMexcWs() {
  if (mexcWs) {
    mexcWs.close();
  }
  connectMexcWs();
}

// Desinscrição de um símbolo
function unsubscribeSymbol(symbol: string) {
  if (!mexcWs || mexcWs.readyState !== WebSocket.OPEN) {
    console.log("Tentando se desinscrever antes de conectar: reconectando...");
    connectMexcWs();
    return;
  }

  const baseSymbol = symbol.toUpperCase().includes("_USDT")
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}_USDT`;

  const unsubscribeMsg = {
    method: "unsub.ticker",
    param: {
      symbol: baseSymbol,
    },
  };
  mexcWs.send(JSON.stringify(unsubscribeMsg));
  console.log(`Desinscrito do par: ${baseSymbol}`);
}

// Inicializa a conexão quando o servidor carrega
connectMexcWs();

// Handler da rota
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Garante que a conexão existe
  if (!mexcWs) {
    connectMexcWs();
  }

  const { method } = req;

  switch (method) {
    case "GET": {
      // Return all stored prices in memory
      return res.status(200).json({ precosFuturos });
    }

    case "POST": {
      const { action, symbol } = req.body || {};
      if (!symbol || typeof symbol !== "string") {
        return res
          .status(400)
          .json({ error: "É necessário um 'symbol' string" });
      }

      if (action === "subscribe") {
        subscribedSymbols.add(symbol.toUpperCase());
        subscribeSymbol(symbol);
        return res.status(200).json({
          message: `Inscrito no par: ${symbol.toUpperCase()}`,
          subscribedSymbols: Array.from(subscribedSymbols),
        });
      } else if (action === "unsubscribe") {
        subscribedSymbols.delete(symbol.toUpperCase());
        unsubscribeSymbol(symbol);
        return res.status(200).json({
          message: `Desinscrito do par: ${symbol.toUpperCase()}`,
          subscribedSymbols: Array.from(subscribedSymbols),
        });
      }

      return res
        .status(400)
        .json({ error: "Ação deve ser subscribe ou unsubscribe" });
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Método ${method} Não Permitido`);
    }
  }
}
