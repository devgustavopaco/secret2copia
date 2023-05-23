import CryptoJS from "crypto-js";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import { proxies } from "../../proxies/proxies";
import { Orderbook, OrderbookOperation } from "../../router/orderbook";
import { Exchange, ExchangeStrategy } from "./ExchangeStrategy";

async function fetchWithProxy(url: string, proxies: string[], timeout: number = 60000, gateio: boolean = false, okx: boolean = false, headers?: object): Promise<any> {
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
      headers: { "Content-Type": "application/json" }
    };
  } else if (okx) {
    fetchOptions = {
      ...defaultOptions,
      headers
    };
  }

  const fetchPromise = fetch(url, fetchOptions);
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout));

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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url = `https://api.binance.com/api/v3/depth?limit=10&symbol=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BinanceOrderbook;

    this.orderbook[pair] = json;

    return {
      name: "Binance",
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url = `https://api.bitso.com/v3/order_book/?book=${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitsoOrderbook;

    this.orderbook[pair] = json;

    return {
      name: "Bitso",
      bid: {
        price: Number(json.payload.bids[0]!.price),
        amount: Number(json.payload.bids[0]!.amount),
      },
      ask: {
        price: Number(json.payload.asks[0]!.price),
        amount: Number(json.payload.asks[0]!.amount),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url = `https://brasilbitcoin.com.br/API/orderbook/${pair}`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BrasilBitcoinOrderbook;

    this.orderbook[pair] = json;

    return {
      name: "BrasilBitcoin",
      bid: {
        price: Number(json.buy[0]!.preco),
        amount: Number(json.buy[0]!.quantidade),
      },
      ask: {
        price: Number(json.sell[0]!.preco),
        amount: Number(json.sell[0]!.quantidade),
      },
      isUSD: false,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url = `https://api.exchange.coinbase.com/products/${pair}/book?level=2`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CoinBaseOrderbook;

    this.orderbook[pair] = json;

    return {
      name: "CoinBase",
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
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

  convertOrderbook(pair: string, isFanToken: boolean = false): Orderbook {
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
    isFanToken: boolean = false
  ): string {
    return `${baseToken.toUpperCase()}${isFanToken ? "CHZ" : destinationToken.toUpperCase()
      }`;
  }

  async fetchOrderbook(
    pair: string,
    isFanToken: boolean = false
  ): Promise<Exchange> {
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

    return {
      name: "Chiliz",
      bid: {
        price: Number(json.bids[0]![0]) * (isFanToken ? this.chzPrice : 1),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]) * (isFanToken ? this.chzPrice : 1),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
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

    // TODO: Map até metade

    return {
      name: "Coinext",
      bid: {
        price: Number(json[0]![6]),
        amount: Number(json[0]![9]),
      },
      ask: {
        price: Number(json[10]![6]),
        amount: Number(json[10]![9]),
      },
      isUSD: false,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.gemini.com/v1/book/${pair}`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as GeminiOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "Gemini",
      bid: {
        price: Number(json.bids[0]!.price),
        amount: Number(json.bids[0]!.amount),
      },
      ask: {
        price: Number(json.asks[0]!.price),
        amount: Number(json.asks[0]!.amount),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.huobi.pro/market/depth?symbol=${pair}&type=step0&depth=10`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as HuobiOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "Huobi",
      bid: {
        price: Number(json.tick.bids[0]![0]),
        amount: Number(json.tick.bids[0]![1]),
      },
      ask: {
        price: Number(json.tick.asks[0]![0]),
        amount: Number(json.tick.asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    // methodCount++;

    const url = `https://api.kraken.com/0/public/Depth?pair=${pair}&count=50`;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as KrakenOrderbook;

    this.orderbook[pair] = json;

    this.pairResult = Object.keys(json.result)[0]!;

    return {
      name: "Kraken",
      bid: {
        price: Number(json.result[this.pairResult]!.bids[0]![0]),
        amount: Number(json.result[this.pairResult]!.bids[0]![1]),
      },
      ask: {
        price: Number(json.result[this.pairResult]!.asks[0]![0]),
        amount: Number(json.result[this.pairResult]!.asks[0]![1]),
      },
      isUSD: true,
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
    return `${baseToken.toUpperCase()}-${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=${pair}`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as KuCoinOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "KuCoin",
      bid: {
        price: Number(json.data.bids[0]![0]),
        amount: Number(json.data.bids[0]![1]),
      },
      ask: {
        price: Number(json.data.asks[0]![0]),
        amount: Number(json.data.asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.novadax.com/v1/market/depth?symbol=${pair}&limit=10`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as NovaDAXOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "NovaDAX",
      bid: {
        price: Number(json.data.bids[0]![0]),
        amount: Number(json.data.bids[0]![1]),
      },
      ask: {
        price: Number(json.data.asks[0]![0]),
        amount: Number(json.data.asks[0]![1]),
      },
      isUSD: false,
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
    isFanToken: boolean = false
  ): string {
    return `${baseToken.toLowerCase()}${isFanToken ? "ft" : ""}`;
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://www.mercadobitcoin.net/api/${pair}/orderbook/`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as MercadoBitcoinOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "Mercado Bitcoin",
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: false,
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
    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.hitbtc.com/api/3/public/orderbook/${pair}?depth=10`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as HitBTCOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "HitBTC",
      bid: {
        price: Number(json.bid[0]![0]),
        amount: Number(json.bid[0]![1]),
      },
      ask: {
        price: Number(json.ask[0]![0]),
        amount: Number(json.ask[0]![1]),
      },
      isUSD: true,
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

    const convertOrders = (orders: BitfinexOrder[], isAsk: boolean): OrderbookOperation[] => {
      return orders.map((order, index) => {
        const sumVolume = index > 0
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
    if (destinationToken.toUpperCase() === "USDT") {
      destinationToken = "USD";
    }

    return `${baseToken.toUpperCase()}${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url = `https://api.bitfinex.com/v1/book/${pair}`;

    const response = await fetchWithProxy(url, proxies);
    const json = (await response.json()) as BitfinexOrderbook;


    this.orderbook[pair] = json;

    // check if bids and asks are not empty
    if (json.bids.length > 0 && json.asks.length > 0) {
      return {
        name: "Bitfinex",
        bid: {
          price: Number(json.bids[0]!.price),
          amount: Number(json.bids[0]!.amount),
        },
        ask: {
          price: Number(json.asks[0]!.price),
          amount: -1 * Number(json.asks[0]!.amount),
        },
        isUSD: true,
      };
    } else {
      // handle the case where bids or asks are empty
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api-testnet.bybit.com/derivatives/v3/public/order-book/L2?category=linear&symbol=${pair}`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as ByBitOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "ByBit",
      bid: {
        price: Number(json.result.b[0]![0]),
        amount: Number(json.result.b[0]![1]),
      },
      ask: {
        price: Number(json.result.a[0]![0]),
        amount: Number(json.result.a[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://contract.mexc.com/api/v1/contract/depth/${pair}`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as MexcOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "Mexc",
      bid: {
        price: Number(json.data.bids[0]![0]),
        amount: Number(json.data.bids[0]![1]),
      },
      ask: {
        price: Number(json.data.asks[0]![0]),
        amount: Number(json.data.asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.poloniex.com/markets/${pair}/orderBook`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as PoloniexOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "Poloniex",
      bid: {
        price: Number(json.bids[0]),
        amount: Number(json.bids[0]),
      },
      ask: {
        price: Number(json.asks[0]),
        amount: Number(json.asks[0]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://www.bitstamp.net/api/v2/order_book/${pair}`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitstampOrderbook;

    this.orderbook[pair] = json;

    return {
      name: "Bitstamp",
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      isUSD: true,
    };
  }
}

// Bidget ---------------------------------------------------------------------

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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.bitget.com/api/spot/v1/market/depth?symbol=${pair}_SPBL`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BidgetOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "Bidget",
      bid: {
        price: Number(json.data.bids[0]![0]),
        amount: Number(json.data.bids[0]![1]),
      },
      ask: {
        price: Number(json.data.asks[0]![0]),
        amount: Number(json.data.asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
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

    const url =
      `https://www.okx.com/api/v5/market/books-lite?instId=${pair}`
      ;

    const response = await fetchWithProxy(url, proxies, 60000, false, true, headers);

    const json = (await response.json()) as OkxOrderbook;

    this.orderbook[pair] = json;

    return {
      name: "Okx",
      bid: {
        price: Number(json.data[0].bids[0]![0]),
        amount: Number(json.data[0].bids[0]![1]),
      },
      ask: {
        price: Number(json.data[0].asks[0]![0]),
        amount: Number(json.data[0].asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.bitcointrade.com.br/v3/public/BRL${pair}/orders`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as BitcoinTradeOrderbook;


    this.orderbook[pair] = json;

    return {
      name: "BitcoinTrade",
      bid: {
        price: Number(json.data.bids[0].unit_price),
        amount: Number(json.data.bids[0].amount),
      },
      ask: {
        price: Number(json.data.asks[0].unit_price),
        amount: Number(json.data.asks[0].amount),
      },
      isUSD: false,
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
    return `${baseToken.toUpperCase()}_${destinationToken.toUpperCase()}`;
  }

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.gateio.ws/api/v4/spot/order_book?currency_pair=${pair}&limit=50`
      ;

    const response = await fetchWithProxy(url, proxies, 60000, true);

    const json = (await response.json()) as GateIoTradeOrderbook;

    this.orderbook[pair] = json;

    return {
      name: "Gateio",
      bid: {
        price: Number(json.bids[0]![0]),
        amount: Number(json.bids[0]![1]),
      },
      ask: {
        price: Number(json.asks[0]![0]),
        amount: Number(json.asks[0]![1]),
      },
      isUSD: true,
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

  async fetchOrderbook(pair: string): Promise<Exchange> {
    const url =
      `https://api.crypto.com/v2/public/get-book?instrument_name=${pair}&depth=10`
      ;

    const response = await fetchWithProxy(url, proxies);

    const json = (await response.json()) as CryptoComOrderbook;
    this.orderbook[pair] = json;

    return {
      name: "Cryptocom",
      bid: {
        price: Number(json.result.data[0]!.bids[0]![0]),
        amount: Number(json.result.data[0]!.bids[0]![1]),
      },
      ask: {
        price: Number(json.result.data[0]!.asks[0]![0]),
        amount: Number(json.result.data[0]!.asks[0]![1]),
      },
      isUSD: true,
    };
  }
}
