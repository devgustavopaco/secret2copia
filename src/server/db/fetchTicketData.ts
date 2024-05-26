import { Currency } from "../../types/dto";

const symbols = [
  "BTCUSDT",
  "ETHUSDT",
  "XRPUSDT",
  "BNBUSDT",
  "ADAUSDT",
  "DOTUSDT",
  "LTCUSDT",
  "LINKUSDT",
  "BCHUSDT",
  "XLMUSDT",
  "ALICEUSDT",
  "ATMUSDT",
  "CHZUSDT",
  "PSGUSDT",
  "JUVUSDT",
  "PORTOUSDT",
  "ACMUSDT",
  "SANTOSUSDT",
  "BARUSDT",
  "ASRUSDT",
  "OGUSDT",
  "CITYUSDT",
  "BATUSDT",
  "MANAUSDT",
  "THETAUSDT",
];

export async function fetchTickerData(): Promise<Currency[]> {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    const rateData = await response.json();
    const exchangeRate = rateData.rates.BRL;

    const fetchData = async (symbol: string): Promise<Currency | null> => {
      try {
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
        const response = await fetch(url);
        const data = await response.json();
        return {
          name: data.symbol.replace("USDT", ""),
          price: `R$${(parseFloat(data.lastPrice) * exchangeRate).toFixed(2)}`,
          percentage: `${parseFloat(data.priceChangePercent).toFixed(2)}%`,
        };
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
        return null;
      }
    };

    const tickerDataResults = await Promise.all(symbols.map(fetchData));
    return tickerDataResults.filter(
      (result): result is Currency => result !== null
    );
  } catch (error) {
    console.error("Error fetching exchange rate or ticker data:", error);
    return [];
  }
}
