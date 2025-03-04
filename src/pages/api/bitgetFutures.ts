import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

let bitgetWs: WebSocket | null = null;
let subscribedSymbols: Set<string> = new Set();

const precosFuturos: Record<string, number> = {};

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
      const symbol = parsedData.arg?.instId;
      const lastPrice = parsedData?.data?.[0]?.lastPr;
      if (symbol && lastPrice != null) {
        // Store the lastPrice in the precosFuturos object
        precosFuturos[symbol] = parseFloat(lastPrice);
      }
    } catch (err) {
      console.error("Erro WS Futuros Bitget:", err);
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

function formatSymbol(symbol: string): string {
  // Remove underscores and ensure the symbol ends with 'USDT'
  const formattedSymbol = symbol.replace(/_/g, "").toUpperCase();
  return formattedSymbol.endsWith("USDT")
    ? formattedSymbol
    : `${formattedSymbol}USDT`;
}

function subscribeSymbol(symbol: string) {
  const formattedSymbol = formatSymbol(symbol);
  if (bitgetWs && bitgetWs.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      op: "subscribe",
      args: [
        {
          instType: "USDT-FUTURES",
          channel: "ticker",
          instId: formattedSymbol,
        },
      ],
    });

    bitgetWs.send(message);
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

  const unsubscribeMsg = {
    op: "unsubscribe",
    args: [
      {
        instType: "USDT-FUTURES",
        channel: "ticker",
        instId: formattedSymbol,
      },
    ],
  };
  bitgetWs.send(JSON.stringify(unsubscribeMsg));
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
      const formattedPrecosFuturos = Object.fromEntries(
        Object.entries(precosFuturos).map(([symbol, price]) => {
          const formattedSymbol = symbol.replace(/USDT$/, "_USDT");
          return [formattedSymbol, price];
        })
      );

      // Return all stored prices in memory with formatted keys
      return res.status(200).json({ precosFuturos: formattedPrecosFuturos });
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
