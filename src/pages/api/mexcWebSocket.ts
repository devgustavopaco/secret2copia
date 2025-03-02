import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws";

let mexcWs: WebSocket | null = null;
let subscribedSymbols: Set<string> = new Set();

function connectMexcWs() {
  // Se já estiver conectado, não conecte novamente
  if (mexcWs && mexcWs.readyState === WebSocket.OPEN) {
    console.log("Já conectado ao WebSocket da MEXC.");
    return;
  }

  // Tente conectar à MEXC
  const endpoint = "wss://contract.mexc.com/edge";

  console.log("Conectando ao WebSocket MEXC...");
  mexcWs = new WebSocket(endpoint);

  mexcWs.on("open", () => {
    console.log("WebSocket MEXC aberto.");

    // Após abrir, reenviar assinaturas que já existiam
    subscribedSymbols.forEach((symbol) => {
      subscribeSymbol(symbol);
    });

    // Envie ping periodicamente para manter a conexão viva
    const pingInterval = setInterval(() => {
      if (mexcWs && mexcWs.readyState === WebSocket.OPEN) {
        mexcWs.send(JSON.stringify({ method: "ping" }));
      }
    }, 20000); // A cada 20s, por exemplo
    if (!mexcWs) return;
    // Limpa o interval se o socket fechar ou der erro
    mexcWs.on("close", () => clearInterval(pingInterval));
    mexcWs.on("error", () => clearInterval(pingInterval));
  });

  mexcWs.on("message", (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      // Aqui você pode tratar os dados da MEXC e fazer o que desejar:
      console.log("[MEXC Message Received]:", parsedData);
    } catch (err) {
      console.error("Erro ao interpretar mensagem da MEXC:", err);
    }
  });

  mexcWs.on("error", (error) => {
    console.error("Erro no WebSocket da MEXC:", error);
    // Em caso de erro, tente desconectar e reconectar
    reconnectMexcWs();
  });

  mexcWs.on("close", (code, reason) => {
    console.warn(`WebSocket da MEXC fechado: ${code} - ${reason.toString()}`);
    // Tenta reconexão somente se não foi um close manual
    reconnectMexcWs();
  });
}

// Função de reconexão
function reconnectMexcWs() {
  if (mexcWs) {
    mexcWs.removeAllListeners();
    mexcWs = null;
  }
  // Tenta reconectar depois de um tempo
  setTimeout(connectMexcWs, 5000);
}

// Subscrição de um símbolo
function subscribeSymbol(symbol: string) {
  if (!mexcWs || mexcWs.readyState !== WebSocket.OPEN) {
    console.log("Tentando se inscrever antes de conectar: reconectando...");
    connectMexcWs();
    return;
  }

  const baseSymbol = symbol.toUpperCase().includes("_USDT")
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}_USDT`;

  const subscribeMsg = {
    method: "sub.ticker",
    param: {
      symbol: baseSymbol,
    },
  };
  mexcWs.send(JSON.stringify(subscribeMsg));
  console.log(`Inscrito no par: ${baseSymbol}`);
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
  // GARANTIR que a conexão existe
  if (!mexcWs) {
    connectMexcWs();
  }

  const { method } = req;

  switch (method) {
    case "GET": {
      // Retorna símbolos atuais inscritos
      return res.status(200).json({
        subscribedSymbols: Array.from(subscribedSymbols),
      });
    }

    case "POST": {
      const { action, symbol } = req.body || {};

      if (!symbol || typeof symbol !== "string") {
        return res.status(400).json({
          error: "É necessário um 'symbol' (string) no body.",
        });
      }

      if (!action || (action !== "subscribe" && action !== "unsubscribe")) {
        return res.status(400).json({
          error: "O 'action' deve ser 'subscribe' ou 'unsubscribe'.",
        });
      }

      if (action === "subscribe") {
        subscribedSymbols.add(symbol.toUpperCase());
        subscribeSymbol(symbol);
        return res.status(200).json({
          message: `Inscrito no par: ${symbol.toUpperCase()}`,
          subscribedSymbols: Array.from(subscribedSymbols),
        });
      } else {
        subscribedSymbols.delete(symbol.toUpperCase());
        unsubscribeSymbol(symbol);
        return res.status(200).json({
          message: `Desinscrito do par: ${symbol.toUpperCase()}`,
          subscribedSymbols: Array.from(subscribedSymbols),
        });
      }
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Método ${method} Não Permitido`);
    }
  }
}
