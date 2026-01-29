import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

let bybitWs: WebSocket | null = null;
let subscribedSymbols: Set<string> = new Set();

// Store prices of symbols (e.g., { "ETHUSDT": 2200.10, ... })
const precosSpot: Record<string, number> = {};

// Function to format symbols consistently
function formatSymbol(symbol: string): string {
  // Ensure the symbol is uppercase and ends with 'USDT'
  const formattedSymbol = symbol.replace(/_/g, "").toUpperCase();
  return formattedSymbol.endsWith("USDT")
    ? formattedSymbol
    : `${formattedSymbol}USDT`;
}

function connectBybitWs() {
  if (bybitWs && bybitWs.readyState === WebSocket.OPEN) {
    console.log("Já conectado ao WebSocket da Bybit.");
    return;
  }

  const endpoint = "wss://stream.bybit.com/v5/public/spot";
  console.log("Conectando ao WebSocket Bybit...");
  bybitWs = new WebSocket(endpoint);

  bybitWs.on("open", () => {
    subscribedSymbols.forEach((symbol) => {
      subscribeSymbol(symbol);
    });
  });

  bybitWs.on("message", (data) => {
    console.log("Received data from Bybit WebSocket:", data.toString());
    try {
      const parsedData = JSON.parse(data.toString());
      const topic = parsedData.topic;
      const symbol = topic.split(".")[1]; // Extract symbol from topic
      const lastPrice = parsedData.data?.[0]?.p; // Access the price

      if (topic.startsWith("publicTrade") && symbol && lastPrice != null) {
        // Store the lastPrice in the precosSpot object
        precosSpot[symbol] = parseFloat(lastPrice);
      }
    } catch (err) {
      console.error("Erro WS Spot Bybit:", err);
    }
  });

  bybitWs.on("error", (error) => {
    console.error("Erro no WebSocket da Bybit:", error);
    reconnectBybitWs();
  });

  bybitWs.on("close", (code, reason) => {
    console.warn(`WebSocket da Bybit fechado: ${code} - ${reason.toString()}`);
    reconnectBybitWs();
  });
}

function subscribeSymbol(symbol: string) {
  const formattedSymbol = formatSymbol(symbol);
  if (bybitWs && bybitWs.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      op: "subscribe",
      args: [`publicTrade.${formattedSymbol}`],
    });

    bybitWs.send(message);
    console.log(`Subscribed to: publicTrade.${formattedSymbol}`);
  }
}

function reconnectBybitWs() {
  if (bybitWs) {
    bybitWs.close();
  }
  connectBybitWs();
}

// Desinscrição de um símbolo
function unsubscribeSymbol(symbol: string) {
  const formattedSymbol = formatSymbol(symbol);
  if (!bybitWs || bybitWs.readyState !== WebSocket.OPEN) {
    console.log("Tentando se desinscrever antes de conectar: reconectando...");
    connectBybitWs();
    return;
  }

  const message = JSON.stringify({
    op: "unsubscribe",
    args: [`publicTrade.${formattedSymbol}`],
  });

  bybitWs.send(message);
  console.log(`Desinscrito do par: publicTrade.${formattedSymbol}`);
}

// Inicializa a conexão quando o servidor carrega
connectBybitWs();

// Handler da rota
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Garante que a conexão existe
  if (!bybitWs) {
    connectBybitWs();
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
