import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

let binanceWs: WebSocket | null = null;
let subscribedSymbols: Set<string> = new Set();

// Store prices of symbols (e.g., { "BTCUSDT": 28200.5, ... })
const precosSpot: Record<string, number> = {};

// Function to format symbols consistently
function formatSymbol(symbol: string): string {
  // Ensure the symbol is uppercase and ends with 'USDT'
  const formattedSymbol = symbol.replace(/_/g, "").toUpperCase();
  return formattedSymbol.endsWith("USDT")
    ? formattedSymbol
    : `${formattedSymbol}USDT`;
}

function connectBinanceWs() {
  if (binanceWs && binanceWs.readyState === WebSocket.OPEN) {
    console.log("Já conectado ao WebSocket da Binance.");
    return;
  }

  const endpoint = "wss://stream.binance.com:9443/ws";
  console.log("Conectando ao WebSocket Binance...");
  binanceWs = new WebSocket(endpoint);

  binanceWs.on("open", () => {
    subscribedSymbols.forEach((symbol) => {
      subscribeSymbol(symbol);
    });
  });

  binanceWs.on("message", (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      const symbol = parsedData.s; // Symbol
      const price = parsedData.p; // Price

      if (symbol && price != null) {
        const formattedSymbol = formatSymbol(symbol); // Format symbol
        // Store the price in the precosSpot object
        precosSpot[formattedSymbol] = parseFloat(price);
      } else {
        console.warn(
          "Received message with missing symbol or price:",
          parsedData
        );
      }
    } catch (err) {
      console.error("Erro WS Spot Binance:", err);
    }
  });

  binanceWs.on("error", (error) => {
    console.error("Erro no WebSocket da Binance:", error);
    reconnectBinanceWs();
  });

  binanceWs.on("close", (code, reason) => {
    console.warn(
      `WebSocket da Binance fechado: ${code} - ${reason.toString()}`
    );
    reconnectBinanceWs();
  });
}

function subscribeSymbol(symbol: string) {
  const formattedSymbol = formatSymbol(symbol);
  if (binanceWs && binanceWs.readyState === WebSocket.OPEN) {
    const streamName = `${formattedSymbol.toLowerCase()}@trade`; // Use trade stream for continuous updates
    const message = JSON.stringify({
      method: "SUBSCRIBE",
      params: [streamName],
      id: Date.now(), // Unique ID for the request
    });

    binanceWs.send(message);
    console.log(`Subscribed to: ${streamName}`);
  }
}

function reconnectBinanceWs() {
  if (binanceWs) {
    binanceWs.close();
  }
  connectBinanceWs();
}

// Desinscrição de um símbolo
function unsubscribeSymbol(symbol: string) {
  const formattedSymbol = formatSymbol(symbol);
  if (!binanceWs || binanceWs.readyState !== WebSocket.OPEN) {
    console.log("Tentando se desinscrever antes de conectar: reconectando...");
    connectBinanceWs();
    return;
  }

  const streamName = `${formattedSymbol.toLowerCase()}@trade`;
  const message = JSON.stringify({
    method: "UNSUBSCRIBE",
    params: [streamName],
    id: Date.now(),
  });

  binanceWs.send(message);
  console.log(`Desinscrito do par: ${streamName}`);
}

// Inicializa a conexão quando o servidor carrega
connectBinanceWs();

// Handler da rota
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Garante que a conexão existe
  if (!binanceWs) {
    connectBinanceWs();
  }

  const { method } = req;

  switch (method) {
    case "GET": {
      // Transform the keys to the desired format
      const formattedPrecosSpot = Object.fromEntries(
        Object.entries(precosSpot).map(([symbol, price]) => {
          const formattedSymbol = symbol.replace(/USDT$/, "_USDT");
          return [formattedSymbol, price];
        })
      );

      // Return all stored prices in memory with formatted keys
      return res.status(200).json({ precosSpot: formattedPrecosSpot });
    }

    case "POST": {
      const { action, symbol } = req.body || {};
      if (!symbol || typeof symbol !== "string") {
        return res
          .status(400)
          .json({ error: "É necessário um 'symbol' string" });
      }

      const formattedSymbol = formatSymbol(symbol);

      if (action === "subscribe") {
        subscribedSymbols.add(formattedSymbol);
        subscribeSymbol(formattedSymbol);
        return res.status(200).json({
          message: `Inscrito no par: ${formattedSymbol}`,
          subscribedSymbols: Array.from(subscribedSymbols),
        });
      } else if (action === "unsubscribe") {
        subscribedSymbols.delete(formattedSymbol);
        unsubscribeSymbol(formattedSymbol);
        return res.status(200).json({
          message: `Desinscrito do par: ${formattedSymbol}`,
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
