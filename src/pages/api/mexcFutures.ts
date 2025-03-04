import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Store prices of symbols (e.g., { "BTC_USDT": 93220.5, ... })
const precosFuturos: Record<string, number> = {};
let lastFetchTime = 0;
const FETCH_INTERVAL = 1000; // 1 segundo

// Função para buscar preços da API REST
async function fetchPricesFutures() {
  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL) {
    return; // Evitar chamadas muito frequentes
  }

  lastFetchTime = now;

  try {
    // Esta chamada obtém TODOS os preços de futuros de uma vez
    const response = await axios.get(
      "https://contract.mexc.com/api/v1/contract/ticker"
    );

    if (
      response.status === 200 &&
      response.data.success &&
      Array.isArray(response.data.data)
    ) {
      response.data.data.forEach((item: any) => {
        // Verificar se o item tem os campos necessários
        if (item.symbol && item.lastPrice) {
          // O símbolo já está no formato correto (ERN_USDT)
          const symbol = item.symbol;

          // Usar o último preço (lastPrice)
          const price = parseFloat(item.lastPrice);

          // Verificar se o preço é um número válido
          if (!isNaN(price)) {
            precosFuturos[symbol] = price;
          }
        }
      });
    } else {
      console.error("Formato de resposta inesperado:", response.data);
    }
  } catch (error) {
    console.error("Erro ao buscar preços futuros da MEXC:", error);
  }
}

// Buscar preços iniciais
fetchPricesFutures();

// Configurar intervalo para buscar preços regularmente
setInterval(fetchPricesFutures, FETCH_INTERVAL);

// Handler da rota
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET": {
      // Buscar preços atualizados antes de responder
      await fetchPricesFutures();

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

      if (action === "getPrice") {
        try {
          // Formatar o símbolo para o formato correto (BTC_USDT)
          const formattedSymbol = symbol.includes("_")
            ? symbol.toUpperCase()
            : `${symbol.toUpperCase()}_USDT`;

          // Verificar se já temos o preço em cache
          if (
            precosFuturos[formattedSymbol] &&
            !isNaN(precosFuturos[formattedSymbol])
          ) {
            return res.status(200).json({
              message: `Preço para ${formattedSymbol}: ${precosFuturos[formattedSymbol]}`,
              price: precosFuturos[formattedSymbol],
            });
          }

          // Se não temos o preço, buscar especificamente
          const response = await axios.get(
            `https://contract.mexc.com/api/v1/contract/detail?symbol=${formattedSymbol}`
          );

          if (
            response.status === 200 &&
            response.data.success &&
            response.data.data
          ) {
            const price = parseFloat(response.data.data.lastPrice);
            if (!isNaN(price)) {
              precosFuturos[formattedSymbol] = price;

              return res.status(200).json({
                message: `Preço atualizado para ${formattedSymbol}: ${price}`,
                price: price,
              });
            } else {
              return res
                .status(404)
                .json({ error: `Preço inválido para ${formattedSymbol}` });
            }
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

      return res.status(400).json({ error: "Ação deve ser getPrice" });
    }

    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Método ${method} Não Permitido`);
    }
  }
}
