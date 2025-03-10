import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { exchangeSymbolMappings } from "../../constants/symbolMappings";

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
          // Verificar se o símbolo tem mapeamento e se não está vazio
          const mapping =
            exchangeSymbolMappings["mexc"]?.[symbol.toUpperCase()];
          if (mapping?.futures === "") {
            return res.status(200).json({
              message: `Moeda ${symbol.toUpperCase()} não é processada`,
              price: null,
            });
          }

          // Formatar o símbolo para o formato correto usando o mapping
          const formattedSymbol =
            mapping?.futures || `${symbol.toUpperCase()}_USDT`;

          // Verificar se já temos o preço em cache
          if (formattedSymbol in precosFuturos) {
            const price = precosFuturos[formattedSymbol];
            return res.status(200).json({
              message: `Preço para ${formattedSymbol}: ${price}`,
              price: price,
            });
          }

          // Se não temos o preço, buscar especificamente
          try {
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
              }
            }

            // Se chegou aqui, não encontrou preço válido
            return res.status(200).json({
              message: `Nenhum preço disponível para ${formattedSymbol}`,
              price: null,
            });
          } catch (error) {
            console.error("Erro ao buscar preço específico:", error);
            // Retornar vazio em caso de erro, em vez de erro 500
            return res.status(200).json({
              message: `Erro ao buscar preço para ${formattedSymbol}`,
              price: null,
            });
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
