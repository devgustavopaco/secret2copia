import CryptoJS from "crypto-js";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import { ServerSingleton } from "../../ServerSingleton";
import { proxies } from "../../proxies/proxies";
import { Orderbook, OrderbookOperation } from "../../router/orderbook";
import { Exchange, ExchangeStrategy } from "./ExchangeStrategy";

async function fetchDollarPriceKrw() {
  return await ServerSingleton.getInstance().getDollarToKrw();
}
async function fetchDollarPriceJpy() {
  return await ServerSingleton.getInstance().getDollarToJpy();
}
async function fetchDollarPriceThb() {
  return await ServerSingleton.getInstance().getDollarToThb();
}
async function fetchDollarPriceEur() {
  return await ServerSingleton.getInstance().getDollarToEur();
}

async function fetchWithProxy(
  url: string,
  proxies: string[],
  timeout: number = 70000,
  gateio: boolean = false,
  okx: boolean = false,
  headers?: object
): Promise<any> {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  const proxy = proxies[randomIndex] || "";

  const [host, portStr, username, password] = proxy.split(":");

  const port = parseInt(portStr || "", 10);
  const auth = `${username}:${password}`;
  const agent = new HttpsProxyAgent({ host, port, auth });

  const defaultOptions: any = { agent };

  let fetchOptions = defaultOptions;

  if (gateio) {
    fetchOptions = {
      ...defaultOptions,
      headers: { "Content-Type": "application/json" },
    };
  } else if (okx) {
    fetchOptions = {
      ...defaultOptions,
      headers,
    };
  }

  const fetchPromise = fetch(url, fetchOptions);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), timeout)
  );

  const response = await Promise.race([fetchPromise, timeoutPromise]);

  return response;
}

interface BinanceOrderbook {
  bids: string[][];
  asks: string[][];
}

export class BinanceStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BinanceOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "binance") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    let url = "";

    if (pair.toUpperCase() !== "GALUSDT") {
      url = `https://api.binance.com/api/v3/depth?limit=10&symbol=${pair}`;
    }

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BinanceOrderbook;

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Binance",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface BitsoOrderbook {
  payload: {
    bids: {
      book: string;
      price: string;
      amount: string;
    }[];
    asks: {
      book: string;
      price: string;
      amount: string;
    }[];
  };
}

export class BitsoStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitsoOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.payload.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid.amount);
        } else {
          sumVolume = Number(bid.amount);
        }

        acc.push({
          price: Number(bid.price),
          amount: Number(bid.amount),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.payload.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask.amount);
        } else {
          sumVolume = Number(ask.amount);
        }

        acc.push({
          price: Number(ask.price),
          amount: Number(ask.amount),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}_usd`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitso") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.bitso.com/v3/order_book/?book=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitsoOrderbook;

    this.orderbook[pair] = json;

    const bids = json.payload.bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asks = json.payload.asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Bitso",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface BrasilBitcoinOrderbook {
  buy: {
    preco: number;
    quantidade: number;
    valor: number;
  }[];
  sell: {
    preco: number;
    quantidade: number;
    valor: number;
  }[];
}

export class BrasilBitcoinStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BrasilBitcoinOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.buy.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + bid.quantidade;
        } else {
          sumVolume = bid.quantidade;
        }

        acc.push({
          price: Number(bid.preco),
          amount: Number(bid.quantidade),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.sell.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + ask.quantidade;
        } else {
          sumVolume = ask.quantidade;
        }

        acc.push({
          price: Number(ask.preco),
          amount: Number(ask.quantidade),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "brasilbitcoin") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    const url = `https://brasilbitcoin.com.br/API/orderbook/${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BrasilBitcoinOrderbook;

    this.orderbook[pair] = json;

    const bids = json.buy.map((bid) => ({
      price: Number(bid.preco),
      amount: Number(bid.quantidade),
      exchangeUrl: "",
    }));
    const asks = json.sell.map((ask) => ({
      price: Number(ask.preco),
      amount: Number(ask.preco),
      exchangeUrl: "",
    }));

    return {
      name: "BrasilBitcoin",
      bids,
      asks,
      isUSD: false,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface CoinBaseOrderbook {
  bids: (string | number)[][];
  asks: (string | number)[][];
}

export class CoinBaseStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CoinBaseOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}-${destinationToken.toLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "coinbase") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.exchange.coinbase.com/products/${pair}/book?level=2`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CoinBaseOrderbook;

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "CoinBase",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface ChilizOrderbook {
  bids: string[][];
  asks: string[][];
}

export class ChilizStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: ChilizOrderbook;
  } = {};

  chzPrice = 0;

  convertOrderbook(pair: string, isFanToken = false): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]) * (isFanToken ? this.chzPrice : 1),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]) * (isFanToken ? this.chzPrice : 1),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(
    baseToken: string,
    destinationToken: string,
    isFanToken = false
  ): string {
    return `${baseToken.toUpperCase()}${
      isFanToken ? "CHZ" : destinationToken.toUpperCase()
    }`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "chiliz") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    methodCount++;

    if (isFanToken) {
      const url = `https://api.chiliz.net/openapi/quote/v1/ticker/price?symbol=CHZUSDT`;

      const response = await fetchWithProxy(url, proxies);

      const chzPriceJson = (await response.json()) as {
        symbol: string;
        price: string;
      };
      this.chzPrice = Number(chzPriceJson.price);
    }

    const url = `https://api.chiliz.net/openapi/quote/v1/depth?limit=10&symbol=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as ChilizOrderbook;

    callCount++;

    this.orderbook[pair] = json;

    const bids = json.bids
      .map((bid) => ({
        price: Number(bid[0]) * (isFanToken ? this.chzPrice : 1),
        amount: Number(bid[1]),
        exchangeUrl: "",
      }))
      .filter((bid) => bid.price && bid.amount);

    const asks = json.asks
      .map((ask) => ({
        price: Number(ask[0]) * (isFanToken ? this.chzPrice : 1),
        amount: Number(ask[1]),
        exchangeUrl: "",
      }))
      .filter((ask) => ask.price && ask.amount);

    return {
      name: "Chiliz",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

type CoinextOrderbook = number[][];

// TODO - Implementar InstrumentId de cada moeda
export class CoinextStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CoinextOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    // const bids =
    //   this.orderbook[pair]?.bids.map((bid) => {
    //     return { price: Number(bid[0]), amount: Number(bid[1]) }
    //   }) ?? []

    // const asks =
    //   this.orderbook[pair]?.asks.map((ask) => {
    //     return { price: Number(ask[0]), amount: Number(ask[1]) }
    //   }) ?? []

    return { bids: [], asks: [] };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    const response = await fetch(
      `https://api.coinext.com.br:8443/AP/GetL2Snapshot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ OMSId: 1, InstrumentId: 1, Depth: 10 }),
      }
    );

    const json = (await response.json()) as CoinextOrderbook;
    this.orderbook[pair] = json;

    const bids = json[0]?.map((bid) => ({
      price: Number(bid),
      amount: Number(bid),
      exchangeUrl: "",
    }));
    const asks = json[10]?.map((ask) => ({
      price: Number(ask),
      amount: Number(ask),
      exchangeUrl: "",
    }));

    return {
      name: "Coinext",
      bids,
      asks,
      isUSD: false,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface GeminiOrderbook {
  bids: {
    price: string;
    amount: string;
  }[];
  asks: {
    price: string;
    amount: string;
  }[];
}

export class GeminiStategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: GeminiOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid.amount);
        } else {
          sumVolume = Number(bid.amount);
        }

        acc.push({
          price: Number(bid.price),
          amount: Number(bid.amount),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask.amount);
        } else {
          sumVolume = Number(ask.amount);
        }

        acc.push({
          price: Number(ask.price),
          amount: Number(ask.amount),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "USD";
    }
    return `${baseToken.toLowerCase()}${destinationToken.toLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "gemini") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.gemini.com/v1/book/${pair}`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as GeminiOrderbook;
    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Gemini",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface HuobiOrderbook {
  tick: {
    bids: number[][];
    asks: number[][];
  };
}

export class HuobiStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: HuobiOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.tick.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.tick.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}${destinationToken.toLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "huobi") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.huobi.pro/market/depth?symbol=${pair}&type=step0&depth=10`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as HuobiOrderbook;
    this.orderbook[pair] = json;

    const bids = json.tick.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.tick.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Huobi",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface KrakenOrderbook {
  result: {
    [key: string]: {
      bids: (string | number)[][];
      asks: (string | number)[][];
    };
  };
}

let callCount = 0;
let methodCount = 0;

export class KrakenStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: KrakenOrderbook;
  } = {};
  pairResult: string = "";

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.result[this.pairResult]!.bids.reduce(
        (acc, bid, index) => {
          let sumVolume = 0;
          if (index - 1 >= 0) {
            sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
          } else {
            sumVolume = Number(bid[1]);
          }

          acc.push({
            price: Number(bid[0]),
            amount: Number(bid[1]),
            sumVolume,
          });

          return acc;
        },
        [] as OrderbookOperation[]
      ) ?? [];

    const asks =
      this.orderbook[pair]?.result[this.pairResult]!.asks.reduce(
        (acc, ask, index) => {
          let sumVolume = 0;
          if (index - 1 >= 0) {
            sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
          } else {
            sumVolume = Number(ask[1]);
          }

          acc.push({
            price: Number(ask[0]),
            amount: Number(ask[1]),
            sumVolume,
          });

          return acc;
        },
        [] as OrderbookOperation[]
      ) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}USD`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "kraken") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    const url = `https://api.kraken.com/0/public/Depth?pair=${pair}&count=50`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as KrakenOrderbook;

    this.orderbook[pair] = json;

    this.pairResult = Object.keys(json.result)[0]!;

    const bids = json.result[this.pairResult]!.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.result[this.pairResult]!.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Kraken",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface KuCoinOrderbook {
  data: {
    bids: string[][];
    asks: string[][];
  };
}

export class KuCoinStratefy implements ExchangeStrategy {
  orderbook: {
    [key: string]: KuCoinOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (
      baseToken.toUpperCase() === "MC" &&
      baseToken.toUpperCase() === "MIR" &&
      baseToken.toUpperCase() === "NAVI"
    ) {
      return "";
    }
    return `${baseToken.toUpperCase()}-${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "kucoin") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    let url = "";

    if (
      pair.toUpperCase() !== "NAVIUSDT" &&
      pair.toUpperCase() !== "MCUSDT" &&
      pair.toUpperCase() !== "MIRUSDT"
    ) {
      url = `https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=${pair}`;
    }

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as KuCoinOrderbook;
    this.orderbook[pair] = json;

    const bids = json.data.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.data.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "KuCoin",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface NovaDAXOrderbook {
  data: {
    bids: string[][];
    asks: string[][];
  };
}

export class NovaDAXStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: NovaDAXOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_BRL`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "novadax") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.novadax.com/v1/market/depth?symbol=${pair}&limit=10`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as NovaDAXOrderbook;
    this.orderbook[pair] = json;

    const bids = json.data.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.data.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "NovaDAX",
      bids,
      asks,
      isUSD: false,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface MercadoBitcoinOrderbook {
  bids: number[][];
  asks: number[][];
}

export class MercadoBitcoinStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: MercadoBitcoinOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(
    baseToken: string,
    destinationToken: string,
    isFanToken = false
  ): string {
    return `${baseToken.toLowerCase()}${isFanToken ? "ft" : ""}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "mercadobitcoin") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://www.mercadobitcoin.net/api/${pair}/orderbook/`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as MercadoBitcoinOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
    }));

    return {
      name: "MercadoBitcoin",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: false,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface HitBTCOrderbook {
  bid: string[][];
  ask: string[][];
}

export class HitBTCStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: HitBTCOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bid.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.ask.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}${destinationToken.toLowerCase()}`;
  }
  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "hitbtc") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    let url = "";

    if (
      pair.toUpperCase() !== "DOGEUSDT" &&
      pair.toUpperCase() !== "SMARTUSDT" &&
      pair.toUpperCase() !== "GSTUSDT" &&
      pair.toUpperCase() !== "PLAUSDT"
    ) {
      url = `https://api.hitbtc.com/api/3/public/orderbook/${pair}?depth=10`;
    }

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as HitBTCOrderbook;
    this.orderbook[pair] = json;

    const bids = json.bid.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.ask.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "HitBTC",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface BitfinexOrder {
  price: string;
  amount: string;
  timestamp: string;
}

interface BitfinexOrderbook {
  bids: BitfinexOrder[];
  asks: BitfinexOrder[];
}

export class BitfinexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitfinexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const orderbook = this.orderbook[pair];

    if (!orderbook) {
      return { asks: [], bids: [] };
    }

    const convertOrders = (
      orders: BitfinexOrder[],
      isAsk: boolean
    ): OrderbookOperation[] => {
      return orders.map((order, index) => {
        const sumVolume =
          index > 0
            ? Number(order.amount) + Number(orders[index - 1]!.amount)
            : Number(order.amount);

        return {
          price: Number(order.price),
          amount: isAsk ? -1 * Number(order.amount) : Number(order.amount),
          sumVolume,
        };
      });
    };

    return {
      bids: convertOrders(orderbook.bids, false),
      asks: convertOrders(orderbook.asks, true),
    };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (baseToken.toUpperCase() === "AMP") {
      return "";
    }
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitfinex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    let url = "";

    if (pair.toUpperCase() !== "AMPUSDT") {
      url = `https://api.bitfinex.com/v1/book/${pair}`;
    }

    const response = await fetchWithProxy(url, proxies);
    const json = (await response.json()) as BitfinexOrderbook;

    this.orderbook[pair] = json;

    if (json.bids.length > 0 && json.asks.length > 0) {
      const bids = json.bids.map((bid) => ({
        price: Number(bid.price),
        amount: Number(bid.amount),
        exchangeUrl: "",
      }));
      const asks = json.asks.map((ask) => ({
        price: Number(ask.price),
        amount: Number(ask.amount),
        exchangeUrl: "",
      }));

      return {
        name: "Bitfinex",
        bids,
        asks,
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    } else {
      throw new Error("Bids or Asks are empty");
    }
  }
}

interface ByBitOrderbook {
  result: {
    b: string[][];
    a: string[][];
  };
}

export class ByBitStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: ByBitOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.result.b.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.result.a.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bybit") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    const url = `https://api.bybit.com/spot/v3/public/quote/depth?symbol=${pair}`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as ByBitOrderbook;
    this.orderbook[pair] = json;

    const bids = json.result.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.result.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Bybit",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Mexc ---------------------------------------------------------------------

interface MexcOrderbook {
  data: {
    bids: string[][];
    asks: string[][];
  };
}

export class MexcStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: MexcOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "mexc") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.mexc.com/api/v3/depth?symbol=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as MexcOrderbook;
    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Mexc",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Poloniex ---------------------------------------------------------------------

interface PoloniexOrderbook {
  asks: string[][];
  bids: string[][];
}

export class PolonieskStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: PoloniexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        if (index % 2 === 0) {
          let sumVolume = 0;

          if (index / 2 - 1 >= 0) {
            sumVolume = acc[index / 2 - 1]!.sumVolume + Number(bid);
          } else {
            sumVolume = Number(bid);
          }

          acc.push({
            price: Number(bid),
            amount: 0,
            sumVolume,
          });
        } else {
          acc[(index - 1) / 2]!.amount = Number(bid);
        }

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        if (index % 2 === 0) {
          let sumVolume = 0;

          if (index / 2 - 1 >= 0) {
            sumVolume = acc[index / 2 - 1]!.sumVolume + Number(ask);
          } else {
            sumVolume = Number(ask);
          }

          acc.push({
            price: Number(ask),
            amount: 0,
            sumVolume,
          });
        } else {
          acc[(index - 1) / 2]!.amount = Number(ask);
        }

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "poloniex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    const url = `https://api.poloniex.com/markets/${pair}/orderBook`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as PoloniexOrderbook;
    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Poloniex",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bitstamp ---------------------------------------------------------------------

interface BitstampOrderbook {
  asks: string[][];
  bids: string[][];
}

export class BitstampStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitstampOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}usd`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitstamp") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://www.bitstamp.net/api/v2/order_book/${pair}`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitstampOrderbook;

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Bitstamp",
      asks,
      bids,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bitget ---------------------------------------------------------------------

interface BidgetOrderbook {
  data: {
    bids: string[][];
    asks: string[][];
  };
}

export class BidgetStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BidgetOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitget") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    const url = `https://api.bitget.com/api/spot/v1/market/depth?symbol=${pair}_SPBL`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BidgetOrderbook;
    this.orderbook[pair] = json;

    const bids = json.data.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.data.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Bitget",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Okx ---------------------------------------------------------------------

interface OkxOrderbook {
  data: [
    {
      bids: string[][];
      asks: string[][];
    }
  ];
}

export class OkxStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: OkxOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.data[0].bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data[0].asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}-${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "okx") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const apiKey = "75c69478-01e0-4000-ad47-15ca3e6d6ca1";
    const secretKey = "6DCE61E22D667F5C476B9AB7D0159052";

    const timestamp = Math.floor(Date.now() / 1000).toString(); // convert to string
    const message = `${timestamp}GET/api/v5/market/books-lite?instId=${pair}`;

    const signature = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(message, secretKey)
    );

    const headers = {
      "OK-ACCESS-KEY": apiKey,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": "your_passphrase_here",
    };

    const url = `https://www.okx.com/api/v5/market/books-lite?instId=${pair}`;
    const response = await fetchWithProxy(
      url,
      proxies,
      70000,
      false,
      true,
      headers
    );

    const json = (await response.json()) as OkxOrderbook;

    this.orderbook[pair] = json;

    const bids = json.data[0].bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
    }));
    const asks = json.data[0].asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
    }));

    return {
      name: "Okx",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// BITCOINTRADE ---------------------------------------------------------------------

interface BitcoinTradeOrderbook {
  data: {
    asks: [
      {
        amount: number;
        unit_price: number;
      }
    ];
    bids: [
      {
        amount: number;
        unit_price: number;
      }
    ];
  };
}

export class BitcoinTradeStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitcoinTradeOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid.amount);
        } else {
          sumVolume = Number(bid.amount);
        }

        acc.push({
          price: Number(bid.unit_price),
          amount: Number(bid.amount),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask.amount);
        } else {
          sumVolume = Number(ask.amount);
        }

        acc.push({
          price: Number(ask.unit_price),
          amount: Number(ask.amount),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitcointrade") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }

    const url = `https://api.bitcointrade.com.br/v3/public/BRL${pair}/orders`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitcoinTradeOrderbook;

    this.orderbook[pair] = json;

    const bids = json.data.bids.map((bid) => ({
      price: Number(bid.unit_price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asks = json.data.asks.map((ask) => ({
      price: Number(ask.unit_price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "BitcoinTrade",
      bids,
      asks,
      isUSD: false,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// GATE.IO ---------------------------------------------------------------------

interface GateIoTradeOrderbook {
  asks: string[][];
  bids: string[][];
}

export class GateIoTradeStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: GateIoTradeOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }
  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "gateio") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    let url = "";

    if (
      pair.toUpperCase() !== "NAVIUSDT" &&
      pair.toUpperCase() !== "ACMUSDT" &&
      pair.toUpperCase() !== "BFCUSDT"
    ) {
      url = `https://api.gateio.ws/api/v4/spot/order_book?currency_pair=${pair}&limit=50`;
    }

    const response = await fetchWithProxy(url, proxies, 70000, true);

    const json = (await response.json()) as GateIoTradeOrderbook;

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Gateio",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

interface CryptoComOrderbook {
  result: {
    data: {
      bids: number[][];
      asks: number[][];
    }[];
  };
}

export class CryptoComStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CryptoComOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.result.data[0]!.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.result.data[0]!.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "cryptocom") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.crypto.com/v2/public/get-book?instrument_name=${pair}&depth=10`;
    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CryptoComOrderbook;
    this.orderbook[pair] = json;

    const bids = json.result.data[0]!.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.result.data[0]!.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Cryptocom",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// FOXBIT ---------------------------------------------------------------------

type FoxBitOrder = [string, string];

interface FoxBitOrderbook {
  sequence_id: number;
  asks: FoxBitOrder[];
  bids: FoxBitOrder[];
}

export class FoxBitStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: FoxBitOrderbook;
  } = {};
  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}BRL`;
  }
  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "foxbit") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.foxbit.com.br/rest/v3/markets/${pair}/orderbook`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as FoxBitOrderbook;

    if (
      !json ||
      !json.bids ||
      !json.asks ||
      json.bids.length === 0 ||
      json.asks.length === 0
    ) {
      throw new Error(`Failed to fetch orderbook for pair: ${pair}`);
    }

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
    }));

    return {
      name: "Foxbit",
      bids,
      asks,
      isUSD: false,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// CEX.IO ---------------------------------------------------------------------

interface CexOrderbook {
  timestamp: number;
  timestamp_ms: number;
  bids: [number, number][];
  asks: [number, number][];
  pair: string;
  id: number;
  sell_total: string;
  buy_total: string;
}

export class CexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CexOrderbook;
  } = {};
  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}/USD`;
  }
  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "cex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://cex.io/api/order_book/${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CexOrderbook;

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Cex",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// BITHUMP ---------------------------------------------------------------------

interface BithumpOrderbook {
  status: string;
  data: {
    timestamp: string;
    payment_currency: string;
    order_currency: string;
    bids: {
      price: string;
      quantity: string;
    }[];
    asks: {
      price: string;
      quantity: string;
    }[];
  };
}
export class BithumpStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BithumpOrderbook;
  } = {};

  async convertOrderbook(pair: string): Promise<Orderbook> {
    const dollarPriceToKrw = await fetchDollarPriceKrw();

    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid.quantity);
        } else {
          sumVolume = Number(bid.quantity);
        }

        acc.push({
          price: Number(bid.price) / dollarPriceToKrw,
          amount: Number(bid.quantity),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask.quantity);
        } else {
          sumVolume = Number(ask.quantity);
        }

        acc.push({
          price: Number(ask.price) / dollarPriceToKrw,
          amount: Number(ask.quantity),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "KRW";
    }
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bithumb") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.bithumb.com/public/orderbook/${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BithumpOrderbook;

    const dollarPriceToKrw = await fetchDollarPriceKrw();

    this.orderbook[pair] = json;

    const bids = json.data.bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.quantity),
      exchangeUrl: "",
    }));
    const asks = json.data.asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.quantity),
      exchangeUrl: "",
    }));

    return {
      name: "Bithump",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// PROBIT ---------------------------------------------------------------------

interface ProbitOrderResponse {
  data: {
    side: string;
    price: string;
    quantity: string;
  }[];
}

export class ProbitStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: ProbitOrderResponse;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const orders = this.orderbook[pair]?.data;

    const bids: OrderbookOperation[] =
      orders
        ?.filter((order) => order.side === "buy")
        .sort((a, b) => Number(b.price) - Number(a.price))
        .reduce((acc: OrderbookOperation[], bid, index) => {
          let sumVolume = 0;
          if (index - 1 >= 0) {
            sumVolume = acc[index - 1]!.sumVolume + Number(bid.quantity);
          } else {
            sumVolume = Number(bid.quantity);
          }

          acc.push({
            price: Number(bid.price),
            amount: Number(bid.quantity),
            sumVolume,
          });

          return acc;
        }, []) ?? [];

    const asks: OrderbookOperation[] =
      orders
        ?.filter((order) => order.side === "sell")
        .sort((a, b) => Number(a.price) - Number(b.price))
        .reduce((acc: OrderbookOperation[], ask, index) => {
          let sumVolume = 0;
          if (index - 1 >= 0) {
            sumVolume = acc[index - 1]!.sumVolume + Number(ask.quantity);
          } else {
            sumVolume = Number(ask.quantity);
          }

          acc.push({
            price: Number(ask.price),
            amount: Number(ask.quantity),
            sumVolume,
          });

          return acc;
        }, []) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (baseToken.toUpperCase() === "NAVI") {
      return "";
    }
    return `${baseToken.toUpperCase()}-${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "probit") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.probit.com/api/exchange/v1/order_book?market_id=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as ProbitOrderResponse;

    this.orderbook[pair] = json;

    const bids = json.data.filter((order) => order.side === "buy");
    const asks = json.data.filter((order) => order.side === "sell");

    const bids1 = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.quantity),
      exchangeUrl: "",
    }));
    const asks2 = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.quantity),
      exchangeUrl: "",
    }));

    return {
      name: "Probit",
      bids: bids1,
      asks: asks2,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// P2PB2B ---------------------------------------------------------------------

interface P2PB2BOrderResponse {
  result: {
    limit: number;
    total: number;
    orders: {
      market: string;
      amount: string;
      type: string;
      price: string;
      timestamp: number;
      side: string;
    }[];
  };
}

export class P2PB2BStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: P2PB2BOrderResponse;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const orders = this.orderbook[pair]?.result.orders;

    const bids =
      orders
        ?.filter((order) => order.side === "buy")
        .reduce((acc, bid, index) => {
          let sumVolume = 0;
          if (index - 1 >= 0) {
            sumVolume = acc[index - 1]!.sumVolume + Number(bid.amount);
          } else {
            sumVolume = Number(bid.amount);
          }

          acc.push({
            price: Number(bid.price),
            amount: Number(bid.amount),
            sumVolume,
          });

          return acc;
        }, [] as OrderbookOperation[]) ?? [];

    const asks =
      orders
        ?.filter((order) => order.side === "sell")
        .reduce((acc, ask, index) => {
          let sumVolume = 0;
          if (index - 1 >= 0) {
            sumVolume = acc[index - 1]!.sumVolume + Number(ask.amount);
          } else {
            sumVolume = Number(ask.amount);
          }

          acc.push({
            price: Number(ask.price),
            amount: Number(ask.amount),
            sumVolume,
          });

          return acc;
        }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "p2pb2b") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.p2pb2b.io/api/v2/public/book?market=${pair}&offset=0&limit=40`;

    const responseSell = await fetchWithProxy(`${url}&side=sell`, proxies);
    const responseBuy = await fetchWithProxy(`${url}&side=buy`, proxies);

    const jsonSell = (await responseSell.json()) as P2PB2BOrderResponse;
    const jsonBuy = (await responseBuy.json()) as P2PB2BOrderResponse;

    const bids = jsonBuy.result.orders;
    const asks = jsonSell.result.orders;

    const highestBid = bids.reduce(
      (prev, current) =>
        Number(prev!.price) > Number(current.price) ? prev : current,
      bids[0]
    );
    const lowestAsk = asks.reduce(
      (prev, current) =>
        Number(prev!.price) < Number(current.price) ? prev : current,
      asks[0]
    );

    this.orderbook[pair] = {
      result: {
        limit: 0, // Ou um valor adequado
        total: 0, // Ou um valor adequado
        orders: [...jsonBuy.result.orders, ...jsonSell.result.orders],
      },
    };

    const bids1 = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const ask2 = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "P2PB2B",
      bids: bids1,
      asks: ask2,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Digifinex ---------------------------------------------------------------------

interface DigifinexOrderBook {
  bids: [number, number][];
  asks: [number, number][];
}

export class DigifinexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: DigifinexOrderBook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const orderbook = this.orderbook[pair];

    const bids =
      orderbook?.bids.map((bid) => ({
        price: bid[0],
        amount: bid[1],
        sumVolume: bid[1], // You may need to change this, depending on how you want to calculate sumVolume
      })) ?? [];

    const asks =
      orderbook?.asks.map((ask) => ({
        price: ask[0],
        amount: ask[1],
        sumVolume: ask[1], // You may need to change this, depending on how you want to calculate sumVolume
      })) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}_${destinationToken.toLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "digifinex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://openapi.digifinex.com/v3/order_book?symbol=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as DigifinexOrderBook;

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Digifinex",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Coinw ---------------------------------------------------------------------

interface CoinwOrderBook {
  data: {
    asks: [string, string][];
    bids: [string, string][];
  };
}

export class CoinwStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CoinwOrderBook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const orderbook = this.orderbook[pair];

    const bids =
      orderbook?.data.bids.map((bid) => ({
        price: Number(bid[0]),
        amount: Number(bid[1]),
        sumVolume: Number(bid[1]),
      })) ?? [];

    const asks =
      orderbook?.data.asks.map((ask) => ({
        price: Number(ask[0]),
        amount: Number(ask[1]),
        sumVolume: Number(ask[1]),
      })) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (baseToken.toUpperCase() === "GAS") {
      return "";
    }
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "coinw") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    let url = "";

    if (pair.toUpperCase() !== "GASUSDT") {
      url = `https://api.coinw.com/api/v1/public?command=returnOrderBook&symbol=${pair}&size=20`;
    }

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CoinwOrderBook;

    this.orderbook[pair] = json;

    const bids = json.data.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.data.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Coinw",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// XT ---------------------------------------------------------------------

interface XTOrderBook {
  result: {
    bids: [string, string][];
    asks: [string, string][];
  };
}

export class XTStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: XTOrderBook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const orderbook = this.orderbook[pair];

    const bids =
      orderbook?.result.bids.map((bid) => ({
        price: Number(bid[0]),
        amount: Number(bid[1]),
        sumVolume: Number(bid[1]),
      })) ?? [];

    const asks =
      orderbook?.result.asks.map((ask) => ({
        price: Number(ask[0]),
        amount: Number(ask[1]),
        sumVolume: Number(ask[1]),
      })) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (baseToken.toLowerCase() === "POR") {
      return "";
    }
    return `${baseToken.toLowerCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "xt") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    let url = "";

    if (pair.toUpperCase() !== "GASUSDT") {
      url = `https://sapi.xt.com/v4/public/depth?symbol=${pair}&limit=20`;
    }

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as XTOrderBook;

    this.orderbook[pair] = json;

    const bids = json.result.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.result.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "XT",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Phemex ---------------------------------------------------------------------

interface PhemexOrderBook {
  error: any;
  id: number;
  result: {
    depth: number;
    orderbook_p: {
      asks: Array<[string, string]>;
      bids: Array<[string, string]>;
    };
    sequence: number;
    symbol: string;
    timestamp: number;
    type: string;
  };
}

export class PhemexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: PhemexOrderBook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const orderbook = this.orderbook[pair];

    const bids =
      orderbook?.result.orderbook_p.bids.map((bid) => ({
        price: Number(bid[0]),
        amount: Number(bid[1]),
        sumVolume: Number(bid[1]),
      })) ?? [];

    const asks =
      orderbook?.result.orderbook_p.asks.map((ask) => ({
        price: Number(ask[0]),
        amount: Number(ask[1]),
        sumVolume: Number(ask[1]),
      })) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "phemex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.phemex.com/md/v2/orderbook?symbol=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as PhemexOrderBook;

    this.orderbook[pair] = json;

    const bids = json.result.orderbook_p.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.result.orderbook_p.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Phemex",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Coincheck ---------------------------------------------------------------------

interface CoincheckOrderBook {
  asks: Array<[string, string]>;
  bids: Array<[string, string]>;
}

export class CoincheckStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CoincheckOrderBook;
  } = {};

  async convertOrderbook(pair: string): Promise<Orderbook> {
    const dollarPriceToJpy = await fetchDollarPriceJpy();

    const orderbook = this.orderbook[pair];

    const bids =
      orderbook?.bids.map((bid) => ({
        price: Number(bid[0]) / dollarPriceToJpy,
        amount: Number(bid[1]),
        sumVolume: Number(bid[1]),
      })) ?? [];

    const asks =
      orderbook?.asks.map((ask) => ({
        price: Number(ask[0]) / dollarPriceToJpy,
        amount: Number(ask[1]),
        sumVolume: Number(ask[1]),
      })) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "JPY";
    }
    return `${baseToken.toLowerCase()}_${destinationToken.toLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "coincheck") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://coincheck.com/api/order_books?pair=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CoincheckOrderBook;

    const dollarPriceToJpy = await fetchDollarPriceJpy();

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Coincheck",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Ascendex ---------------------------------------------------------------------

interface AscendexOrderbook {
  data: {
    data: {
      asks: [string, string][];
      bids: [string, string][];
    };
  };
}

export class AscendexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: AscendexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.data.data.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid[1]);
        } else {
          sumVolume = Number(bid[1]);
        }

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.data.data.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask[1]);
        } else {
          sumVolume = Number(ask[1]);
        }

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toUpperCase()}/${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "ascendex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://ascendex.com/api/pro/v1/depth?symbol=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as AscendexOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bids1 = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asks1 = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Ascendex",
      bids: bids1,
      asks: asks1,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Lbkex ---------------------------------------------------------------------

interface LbkexOrderbook {
  result: string;
  data: {
    asks: [string, string][];
    bids: [string, string][];
    timestamp: number;
  };
  error_code: number;
  ts: number;
}

export class LbkexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: LbkexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid) => {
        bidSumVolume += Number(bid[1]);

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask) => {
        askSumVolume += Number(ask[1]);

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLowerCase()}${destinationToken.toLowerCase()}`;
  }
  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "lbkex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    let url = "";

    if (
      pair.toUpperCase() !== "PORUSDT" &&
      pair.toUpperCase() !== "TRUUSDT" &&
      pair.toUpperCase() !== "TRAUSDT"
    ) {
      url = `https://api.lbkex.com/v2/depth.do?symbol=${pair}&size=20`;
    }

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as LbkexOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bids1 = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asks1 = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "LBank",
      bids: bids1,
      asks: asks1,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bkex ---------------------------------------------------------------------

interface BkexOrderbook {
  code: number;
  data: {
    ask: [string, string][];
    bid: [string, string][];
    symbol: string;
    timestamp: number;
  };
  msg: string;
  status: number;
}

export class BkexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BkexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bid.reduce((acc, bid) => {
        bidSumVolume += Number(bid[1]);

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.ask.reduce((acc, ask) => {
        askSumVolume += Number(ask[1]);

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bkex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.bkex.com/v2/q/depth?symbol=${pair}&depth=20`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BkexOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bids1 = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asks1 = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Bkex",
      bids: bids1,
      asks: asks1,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bitrue ---------------------------------------------------------------------

interface BitrueOrderbook {
  lastUpdateId: number;
  bids: [string, string, any[]][];
  asks: [string, string, any[]][];
}

export class BitrueStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitrueOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        bidSumVolume += Number(bid[1]);

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        askSumVolume += Number(ask[1]);

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitrue") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://openapi.bitrue.com/api/v1/depth?symbol=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitrueOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Bitrue",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}
// Btcex ---------------------------------------------------------------------

interface BtcexOrderbook {
  result: {
    timestamp: number;
    bids: [string, string][];
    asks: [string, string][];
    ticker_id: string;
  };
}

export class BtcexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BtcexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.result.bids.reduce((acc, bid) => {
        bidSumVolume += Number(bid[1]);

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.result.asks.reduce((acc, ask) => {
        askSumVolume += Number(ask[1]);

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}-${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "btcex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://www.btcex.com/api/v1/public/cmc_spot_orderbook?market_pair=${pair}&depth=40`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BtcexOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Btcex",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Coinsbit ---------------------------------------------------------------------

interface CoinsbitOrderbook {
  timestamp: number;
  bids: [string, string][];
  asks: [string, string][];
  ticker_id: string;
}

export class CoinsbitStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CoinsbitOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        bidSumVolume += Number(bid[1]);

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        askSumVolume += Number(ask[1]);

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "coinsbit") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.coinsbit.io/api/v1/public/depth/result?market=${pair}&limit=30`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CoinsbitOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Coinsbit",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bingx ---------------------------------------------------------------------

interface BingxOrderbook {
  code: number;
  msg: string;
  data: {
    T: number;
    bids: [string, string][];
    asks: [string, string][];
  };
}

export class BingxStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BingxOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid) => {
        bidSumVolume += Number(bid[1]);

        acc.push({
          price: Number(bid[0]),
          amount: Number(bid[1]),
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask) => {
        askSumVolume += Number(ask[1]);

        acc.push({
          price: Number(ask[0]),
          amount: Number(ask[1]),
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}-${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bingx") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://open-api.bingx.com/openApi/swap/v2/quote/depth?symbol=${pair}&limit=20`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BingxOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Bingx",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// BigOne ---------------------------------------------------------------------

interface BigOneOrderbook {
  code: number;
  data: {
    asset_pair_name: string;
    bids: Array<{
      price: string;
      order_count: number;
      quantity: string;
    }>;
    asks: Array<{
      price: string;
      order_count: number;
      quantity: string;
    }>;
  };
}

export class BigOneStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BigOneOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid) => {
        bidSumVolume += Number(bid.quantity);

        acc.push({
          price: Number(bid.price),
          amount: Number(bid.quantity),
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask) => {
        askSumVolume += Number(ask.quantity);

        acc.push({
          price: Number(ask.price),
          amount: Number(ask.quantity),
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}-${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bigone") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://big.one/api/v3/asset_pairs/${pair}/depth`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BigOneOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Bigone",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Whitebit ---------------------------------------------------------------------

interface WhitebitOrderbook {
  asks: Array<[string, string]>;
  bids: Array<[string, string]>;
}

export class WhitebitStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: WhitebitOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        let quantity = Number(bid[1]);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid[0]),
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        let quantity = Number(ask[1]);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask[0]),
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "whitebit") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://whitebit.com/api/v1/public/depth/result?market=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as WhitebitOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Whitebit",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bitkub ---------------------------------------------------------------------

interface BitkubOrderbook {
  asks: Array<[number, number]>;
  bids: Array<[number, number]>;
}

export class BitkubStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitkubOrderbook;
  } = {};

  async convertOrderbook(pair: string): Promise<Orderbook> {
    const dollarPriceThb = await fetchDollarPriceThb();

    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        let quantity = Number(bid[1]);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid[0]) / dollarPriceThb,
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        let quantity = Number(ask[1]);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask[0]) / dollarPriceThb,
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "THB";
    }
    return `${destinationToken.toLocaleUpperCase()}_${baseToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitkub") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.bitkub.com/api/market/depth?sym=${pair}&lmt=40`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitkubOrderbook;

    const dollarPriceToThb = await fetchDollarPriceThb();

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid[0]),
      amount: Number(bid[1]),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask[0]),
      amount: Number(ask[1]),
      exchangeUrl: "",
    }));

    return {
      name: "Bitkub",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Dextrade ---------------------------------------------------------------------

interface DextradeOrderbook {
  buy: Array<{ volume: number; rate: number; count: number }>;
  sell: Array<{ volume: number; rate: number; count: number }>;
}

export class DextradeStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: DextradeOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.buy.reduce((acc, bid) => {
        let quantity = Number(bid.volume);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid.rate),
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.sell.reduce((acc, ask) => {
        let quantity = Number(ask.volume);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask.rate),
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (baseToken.toUpperCase() === "GMX") {
      return "";
    }
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "dextrade") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    let url = "";

    if (pair.toUpperCase() !== "GMWUSDT") {
      url = `https://api.dex-trade.com/v1/public/book?pair=${pair}&limit=20`;
    }

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()).data as DextradeOrderbook;

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Dextrade",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Pionex ---------------------------------------------------------------------

interface PionexOrderbook {
  result: boolean;
  data: {
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
    updateTime: number;
  };
  timestamp: number;
}

export class PionexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: PionexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid) => {
        let quantity = Number(bid[1]);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid[0]),
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask) => {
        let quantity = Number(ask[1]);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask[0]),
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "pionex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.pionex.com/api/v1/market/depth?symbol=${pair}&limit=30`;

    const response = await fetchWithProxy(url, proxies);

    const json: PionexOrderbook = await response.json();

    this.orderbook[pair] = json; // store full PionexOrderbook

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Pionex",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bitforex ---------------------------------------------------------------------

interface BitforexOrderbook {
  success: boolean;
  time: number;
  data: {
    bids: Array<{ price: number; amount: number }>;
    asks: Array<{ price: number; amount: number }>;
  };
}

export class BitforexStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitforexOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid) => {
        let quantity = bid.amount;
        bidSumVolume += quantity;

        acc.push({
          price: bid.price,
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask) => {
        let quantity = ask.amount;
        askSumVolume += quantity;

        acc.push({
          price: ask.price,
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${destinationToken.toLocaleLowerCase()}-${baseToken.toLocaleLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitforex") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.bitforex.com/api/v1/market/depth?symbol=coin-${pair}&size=20`;

    const response = await fetchWithProxy(url, proxies);

    const json: BitforexOrderbook = await response.json();

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Bitforex",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Cryptology ---------------------------------------------------------------------

interface CryptologyOrderbook {
  status: string;
  error: string | null;
  data: {
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
  };
}

export class CryptologyStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CryptologyOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid) => {
        let quantity = Number(bid[1]);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid[0]),
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask) => {
        let quantity = Number(ask[1]);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask[0]),
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "USD";
    }
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "cryptology") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api-sandbox.cryptology.com/v1/public/get-order-book?trade_pair=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json: CryptologyOrderbook = await response.json();

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Cryptology",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Woo ---------------------------------------------------------------------

interface WooOrderbook {
  success: boolean;
  timestamp: number;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
}

export class WooStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: WooOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        let quantity = bid.quantity;
        bidSumVolume += quantity;

        acc.push({
          price: bid.price,
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        let quantity = ask.quantity;
        askSumVolume += quantity;

        acc.push({
          price: ask.price,
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "woo") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.woo.org/v1/orderbook/SPOT_${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json: WooOrderbook = await response.json();

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Woo",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Latoken ---------------------------------------------------------------------

interface LatokenOrderbook {
  ask: Array<{
    price: string;
    quantity: string;
    cost: string;
    accumulated: string;
  }>;
  bid: Array<{
    price: string;
    quantity: string;
    cost: string;
    accumulated: string;
  }>;
  totalAsk: string;
  totalBid: string;
}

export class LatokenStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: LatokenOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bid.reduce((acc, bid) => {
        let quantity = Number(bid.quantity);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid.price),
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.ask.reduce((acc, ask) => {
        let quantity = Number(ask.quantity);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask.price),
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}/${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "latoken") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.latoken.com/v2/book/${pair}?limit=20`;

    const response = await fetchWithProxy(url, proxies);

    const json: LatokenOrderbook = await response.json();

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Latoken",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Blockchain ---------------------------------------------------------------------

interface BlockchainOrderbook {
  symbol: string;
  bids: Array<{
    px: number;
    qty: number;
    num: number;
  }>;
  asks: Array<{
    px: number;
    qty: number;
    num: number;
  }>;
}

export class BlockchainStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BlockchainOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        let quantity = bid.qty;
        bidSumVolume += quantity;

        acc.push({
          price: bid.px,
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        let quantity = ask.qty;
        askSumVolume += quantity;

        acc.push({
          price: ask.px,
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "USD";
    }
    return `${baseToken.toLocaleUpperCase()}-${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "blockchain") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.blockchain.com/v3/exchange/l2/${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json: BlockchainOrderbook = await response.json();

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Blockchain",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bitpanda ---------------------------------------------------------------------

interface BitpandaOrderbook {
  instrument_code: string;
  time: string;
  sequence: number;
  bids: Array<{
    price: string;
    amount: string;
    order_id: string;
  }>;
  asks: Array<{
    price: string;
    amount: string;
    order_id: string;
  }>;
}

export class BitpandaStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitpandaOrderbook;
  } = {};

  async convertOrderbook(pair: string): Promise<Orderbook> {
    const dollarPriceToEur = await fetchDollarPriceEur();

    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        let quantity = Number(bid.amount);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid.price) / dollarPriceToEur,
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        let quantity = Number(ask.amount);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask.price) / dollarPriceToEur,
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "EUR";
    }
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitpanda") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.exchange.bitpanda.com/public/v1/order-book/${pair}?depth=20`;

    const response = await fetchWithProxy(url, proxies);

    const json: BitpandaOrderbook = await response.json();

    this.orderbook[pair] = json;

    const dollarPriceToEur = await fetchDollarPriceEur();

    const bids = json.bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Bitpanda",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Cointr ---------------------------------------------------------------------

interface CointrOrderbook {
  code: number;
  message: string;
  data: {
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
    utime: number;
  };
}

export class CointrStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: CointrOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.data.bids.reduce((acc, bid) => {
        let quantity = Number(bid[1]); // bid[1] corresponds to the amount
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid[0]), // bid[0] corresponds to the price
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.data.asks.reduce((acc, ask) => {
        let quantity = Number(ask[1]); // ask[1] corresponds to the amount
        askSumVolume += quantity;

        acc.push({
          price: Number(ask[0]), // ask[0] corresponds to the price
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleUpperCase()}${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "cointr") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.cointr.pro/v1/spot/market/depths?instId=${pair}&limit=20`;

    const response = await fetchWithProxy(url, proxies);

    const json: CointrOrderbook = await response.json();

    this.orderbook[pair] = json; // store full CointrOrderbook

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Cointr",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Exmarkets ---------------------------------------------------------------------

interface ExmarketsOrderbook {
  bids: Array<{
    price: string;
    amount: string;
  }>;
  asks: Array<{
    price: string;
    amount: string;
  }>;
}

export class ExmarketsStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: ExmarketsOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        let quantity = Number(bid.amount);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid.price),
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        let quantity = Number(ask.amount);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask.price),
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    return `${baseToken.toLocaleLowerCase()}-${destinationToken.toLocaleLowerCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "exmarkets") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://exmarkets.com/api/trade/v1/market/order-book?market=${pair}&limit=20`;

    const response = await fetchWithProxy(url, proxies);

    const json: ExmarketsOrderbook = await response.json();

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Exmarkets",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Ztb ---------------------------------------------------------------------

interface ZtbOrderbook {
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
}

export class ZtbStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: ZtbOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid) => {
        let quantity = Number(bid[1]); // bid[1] corresponds to the amount
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid[0]), // bid[0] corresponds to the price
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask) => {
        let quantity = Number(ask[1]); // ask[1] corresponds to the amount
        askSumVolume += quantity;

        acc.push({
          price: Number(ask[0]), // ask[0] corresponds to the price
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (baseToken.toUpperCase() === "NAVI") {
      return "";
    }
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "ztb") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://www.ztb.im/api/v1/depth?symbol=${pair}&size=40`;

    const response = await fetchWithProxy(url, proxies);

    const json: ZtbOrderbook = await response.json();

    this.orderbook[pair] = json;

    const { bids, asks } = this.convertOrderbook(pair);

    const bidsOrderbook = bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.amount),
      exchangeUrl: "",
    }));
    const asksOrderbook = asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.amount),
      exchangeUrl: "",
    }));

    return {
      name: "Ztb",
      bids: bidsOrderbook,
      asks: asksOrderbook,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

// Bitflyer ---------------------------------------------------------------------

interface BitflyerOrderbook {
  mid_price: number;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
}

export class BitflyerStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: BitflyerOrderbook;
  } = {};

  async convertOrderbook(pair: string): Promise<Orderbook> {
    const dollarPriceToJpy = await fetchDollarPriceJpy();

    if (!this.orderbook.hasOwnProperty(pair)) {
      throw new Error(`Orderbook does not contain pair: ${pair}`);
    }

    let bidSumVolume = 0;
    const bids =
      this.orderbook[pair]!.bids.reduce((acc, bid) => {
        let quantity = Number(bid.size);
        bidSumVolume += quantity;

        acc.push({
          price: Number(bid.price) / dollarPriceToJpy,
          amount: quantity,
          sumVolume: bidSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    let askSumVolume = 0;
    const asks =
      this.orderbook[pair]!.asks.reduce((acc, ask) => {
        let quantity = Number(ask.size);
        askSumVolume += quantity;

        acc.push({
          price: Number(ask.price) / dollarPriceToJpy,
          amount: quantity,
          sumVolume: askSumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "JPY";
    }
    return `${baseToken.toLocaleUpperCase()}_${destinationToken.toLocaleUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "bitflyer") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.bitflyer.com/v1/getboard?product_code=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json: BitflyerOrderbook = await response.json();

    this.orderbook[pair] = json;

    const dollarPriceToJpy = await fetchDollarPriceJpy();

    const bids = json.bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.size),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.size),
      exchangeUrl: "",
    }));

    return {
      name: "Bitflyer",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}

/* DYDYX */

export interface DYDYXOrderbook {
  asks: {
    size: string;
    price: string;
  }[];
  bids: {
    size: string;
    price: string;
  }[];
}

export class DYDYXStrategy implements ExchangeStrategy {
  orderbook: {
    [key: string]: DYDYXOrderbook;
  } = {};

  convertOrderbook(pair: string): Orderbook {
    const bids =
      this.orderbook[pair]?.bids.reduce((acc, bid, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(bid.size);
        } else {
          sumVolume = Number(bid.size);
        }

        acc.push({
          price: Number(bid.price),
          amount: Number(bid.size),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    const asks =
      this.orderbook[pair]?.asks.reduce((acc, ask, index) => {
        let sumVolume = 0;
        if (index - 1 >= 0) {
          sumVolume = acc[index - 1]!.sumVolume + Number(ask.size);
        } else {
          sumVolume = Number(ask.size);
        }

        acc.push({
          price: Number(ask.price),
          amount: Number(ask.size),
          sumVolume,
        });

        return acc;
      }, [] as OrderbookOperation[]) ?? [];

    return { bids, asks };
  }

  formatPair(baseToken: string, destinationToken: string): string {
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "USD";
    }
    return `${baseToken.toUpperCase()}-${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(
    pair: string,
    ticker: string,
    exchangeName: string,
    exchangeType: "buy" | "sell",
    isFanToken: boolean
  ): Promise<Exchange> {
    if (exchangeName !== "dydx") {
      return {
        name: "",
        isUSD: true,
        exchangeType: exchangeType,
        isFanToken,
        ticker,
      };
    }
    const url = `https://api.dydx.exchange/v3/orderbook/${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as DYDYXOrderbook;

    console.log(json);

    this.orderbook[pair] = json;

    const bids = json.bids.map((bid) => ({
      price: Number(bid.price),
      amount: Number(bid.size),
      exchangeUrl: "",
    }));
    const asks = json.asks.map((ask) => ({
      price: Number(ask.price),
      amount: Number(ask.price),
      exchangeUrl: "",
    }));

    return {
      name: "dydyx",
      bids,
      asks,
      isUSD: true,
      exchangeType: exchangeType,
      isFanToken,
      ticker,
    };
  }
}
