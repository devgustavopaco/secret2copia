import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

let gateioWs: WebSocket | null = null;
let subscribedSymbols: Set<string> = new Set();

const precosSpot: Record<string, number> = {};

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

  const baseSymbol = symbol.toUpperCase().includes("_USDT")
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

// Inicializa a conexão quando o servidor carrega
connectGateioWs();

// Handler da rota
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Garante que a conexão existe
  if (!gateioWs) {
    connectGateioWs();
  }

  const { method } = req;

  switch (method) {
    case "GET": {
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
