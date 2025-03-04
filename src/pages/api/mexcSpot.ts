import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Store prices of symbols (e.g., { "BTC_USDT": 93220.5, ... })
const precosSpot: Record<string, number> = {};
let lastFetchTime = 0;
const FETCH_INTERVAL = 1000; // 1 segundo

// Função para buscar preços da API REST
async function fetchPricesREST() {
  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL) {
    return; // Evitar chamadas muito frequentes
  }

  lastFetchTime = now;

  try {
    const response = await axios.get(
      "https://api.mexc.com/api/v3/ticker/price"
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      response.data.forEach((item: { symbol: string; price: string }) => {
        if (item.symbol.endsWith("USDT")) {
          const formattedSymbol = item.symbol.replace(/USDT$/, "_USDT");
          precosSpot[formattedSymbol] = parseFloat(item.price);
        }
      });
    }
  } catch (error) {
    console.error("Erro ao buscar preços spot da MEXC:", error);
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
      const { symbol } = req.body || {};
      if (!symbol || typeof symbol !== "string") {
        return res
          .status(400)
          .json({ error: "É necessário um 'symbol' string" });
      }

      try {
        // Buscar preço específico
        const formattedSymbol = symbol.replace(/_/g, "").toUpperCase();
        const response = await axios.get(
          `https://api.mexc.com/api/v3/ticker/price?symbol=${formattedSymbol}`
        );

        if (response.status === 200 && response.data.price) {
          const apiSymbol = formattedSymbol.replace(/USDT$/, "_USDT");
          precosSpot[apiSymbol] = parseFloat(response.data.price);

          return res.status(200).json({
            message: `Preço atualizado para ${apiSymbol}: ${response.data.price}`,
            price: response.data.price,
          });
        } else {
          return res
            .status(404)
            .json({ error: `Símbolo ${formattedSymbol} não encontrado` });
        }
      } catch (error) {
        console.error("Erro ao buscar preço específico:", error);
        return res.status(500).json({ error: "Erro ao buscar preço" });
      }
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Método ${method} Não Permitido`);
    }
  }
}
