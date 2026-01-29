import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

let bitgetWs: WebSocket | null = null;
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

function connectBitgetWs() {
  if (bitgetWs && bitgetWs.readyState === WebSocket.OPEN) {
    console.log("Já conectado ao WebSocket da Bitget.");
    return;
  }

  const endpoint = "wss://ws.bitget.com/v2/ws/public";
  console.log("Conectando ao WebSocket Bitget...");
  bitgetWs = new WebSocket(endpoint);

  bitgetWs.on("open", () => {
    subscribedSymbols.forEach((symbol) => {
      subscribeSymbol(symbol);
    });
  });

  bitgetWs.on("message", (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      const action = parsedData.action;
      const symbol = parsedData.arg?.instId;
      const lastPrice = parsedData.data?.[0]?.lastPr;

      if (action === "snapshot" && symbol && lastPrice != null) {
        // Store the lastPrice in the precosSpot object
        precosSpot[symbol] = parseFloat(lastPrice);
      }
    } catch (err) {
      console.error("Erro WS Spot Bitget:", err);
    }
  });

  bitgetWs.on("error", (error) => {
    console.error("Erro no WebSocket da Bitget:", error);
    reconnectBitgetWs();
  });

  bitgetWs.on("close", (code, reason) => {
    console.warn(`WebSocket da Bitget fechado: ${code} - ${reason.toString()}`);
    reconnectBitgetWs();
  });
}

function subscribeSymbol(symbol: string) {
  const formattedSymbol = formatSymbol(symbol);
  if (bitgetWs && bitgetWs.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      op: "subscribe",
      args: [
        {
          instType: "SPOT",
          channel: "ticker",
          instId: formattedSymbol,
        },
      ],
    });

    bitgetWs.send(message);
    console.log(`Subscribed to: ${formattedSymbol}`);
  }
}

function reconnectBitgetWs() {
  if (bitgetWs) {
    bitgetWs.close();
  }
  connectBitgetWs();
}

// Desinscrição de um símbolo
function unsubscribeSymbol(symbol: string) {
  const formattedSymbol = formatSymbol(symbol);
  if (!bitgetWs || bitgetWs.readyState !== WebSocket.OPEN) {
    console.log("Tentando se desinscrever antes de conectar: reconectando...");
    connectBitgetWs();
    return;
  }

  const message = JSON.stringify({
    op: "unsubscribe",
    args: [
      {
        instType: "SPOT",
        channel: "ticker",
        instId: formattedSymbol,
      },
    ],
  });

  bitgetWs.send(message);
  console.log(`Desinscrito do par: ${formattedSymbol}`);
}

// Inicializa a conexão quando o servidor carrega
connectBitgetWs();

// Handler da rota
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Garante que a conexão existe
  if (!bitgetWs) {
    connectBitgetWs();
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
