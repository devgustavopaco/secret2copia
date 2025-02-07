import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MdArrowForwardIos } from "react-icons/md";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";
import Image from "next/image";

//
type Ticker =
  | "SHIB"
  | "ELON"
  | "FLOKI"
  | "NFT"
  | "PEPE"
  | "EPX"
  | "BONK"
  | "WIN"
  | "RACA"
  | "CAPO"
  | "SATS";

interface FuturosOperationCardProps {
  coin: {
    image?: string;
    name: string;
    ask: {
      exchange: string;
      price: number;
      image_url?: string;
      isUSD: boolean;
      orderbook?: {
        asks: { sumVolume: number }[];
      };
    };
    bid: {
      exchange: string;
      price: number;
      image_url?: string;
      isUSD: boolean;
      orderbook?: {
        bids: { sumVolume: number }[];
      };
    };
    symbol: string;
    fee: number;
    tax: number;
    spread: number;
    volume?: number;
  };
  dollarPrice?: number;
  onClick: () => void;
  isChecked?: boolean;
  meetsCriteria?: boolean;
  isAdmin?: boolean;
}

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "decimal",
  maximumFractionDigits: 4,
});
const dynamicDecimalFormatter = (value: number, ticker: string): string => {
  const currencyDecimalMapping: { [key: string]: number } = {
    SHIB: 8,
    ELON: 10,
    FLOKI: 7,
    NFT: 9,
    PEPE: 9,
    EPX: 6,
    BONK: 8,
    WIN: 7,
    RACA: 7,
    CAPO: 6,
    SATS: 9,
    BTT: 9,
    REEF: 6,
  };

  let fractionDigits = currencyDecimalMapping[ticker] || 4;

  if (value !== 0 && value < Math.pow(10, -fractionDigits)) {
    fractionDigits = Math.max(Math.ceil(-Math.log10(value)), fractionDigits);
  }

  const formatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return formatter.format(value);
};

const formatterSpread = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const calculatePrice = (price: number, isUSD: boolean, dolarValue: number) => {
  // Inverte a lógica: se isUSD é true, o preço já está em dólar.
  // Se isUSD for false, então o preço está em BRL e dividimos por dolarValue.
  const calculatedPrice = isUSD ? price : price / dolarValue;
  return calculatedPrice;
};

export function FuturosOperationCard({
  coin,
  dollarPrice = 1,
  onClick,
  isChecked,
  isAdmin,
}: FuturosOperationCardProps) {
  const { data: auth } = useSession();
  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const dolarValue = user?.dolarValue ?? dollarPrice;

  const bidPrice = calculatePrice(coin.bid.price, coin.bid.isUSD, dolarValue);
  const askPrice = calculatePrice(coin.ask.price, coin.ask.isUSD, dolarValue);
  const animationData = isChecked
    ? require("/public/animations/checkPurple.json")
    : require("/public/animations/checkGreen.json");

  const [dimension, setDimension] = useState({ width: 40, height: 40 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setDimension({ width: 20, height: 20 });
      } else {
        setDimension({ width: 40, height: 40 });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const spotLinks = {
    bybit: (coin: string, pair: string) =>
      `https://www.bybit.com/trade/spot/${coin}/${pair}`,
    binance: (coin: string, pair: string) =>
      `https://www.binance.com/en/trade/${coin}_${pair}`,
    gate: (coin: string, pair: string) =>
      `https://www.gate.io/trade/${coin}_${pair}`,
    bitget: (coin: string, pair: string) =>
      `https://www.bitget.com/spot/${coin}${pair}`,
    mexc: (coin: string, pair: string) =>
      `https://www.mexc.com/exchange/${coin}_${pair}`,
  };

  const futuresLinks = {
    bybit: (coin: string, pair: string) => {
      const specialCases: Record<string, string> = {
        FIRE: "FIRE",
        VELO: "VELO",
        ZK: "ZK",
      };
      const specialCoin = specialCases[coin.toUpperCase()] || coin;
      return `https://www.bybit.com/trade/${specialCoin}${pair}`;
    },
    binance: (coin: string, pair: string) => {
      const specialCases: Record<string, string> = {
        TKO: "TKO",
        ZK: "ZK",
      };
      const specialCoin = specialCases[coin.toUpperCase()] || coin;
      return `https://www.binance.com/en/futures/${specialCoin}${pair}_PERP`;
    },
    gate: (coin: string, pair: string) => {
      const specialCases: Record<string, string> = {
        ELIZA: "ELIZA",
        ART: "ARTELA",
        CULT: "MILADYCULT",
        HOLD: "HOLD",
        TKO: "TKO",
        ZK: "ZK",
        GST: "GST",
        VELO: "VELO",
        CATTON: "CATTON",
      };
      const specialCoin = specialCases[coin.toUpperCase()] || coin;
      return `https://www.gate.io/futures/USDT/${specialCoin}_${pair}`;
    },
    bitget: (coin: string, pair: string) => {
      const specialCases: Record<string, string> = {
        ELIZA: "ELIZA",
        HOLD: "HOLDCOIN",
        FIRE: "FIRE",
        ZK: "ZK",
        VELO: "VELO",
        URO: "URO",
        CLR: "CELR",
      };
      const specialCoin = specialCases[coin.toUpperCase()] || coin;
      return `https://www.bitget.com/futures/${specialCoin}${pair}`;
    },
    kucoin: (coin: string, pair: string) => {
      const specialCases: Record<string, string> = {
        CULT: "MILADYCULT",
        HOLD: "HOLDCOIN",
        FIRE: "FIRE",
        VELO: "VELO",
      };
      const specialCoin = specialCases[coin.toUpperCase()] || coin;
      return `https://futures.kucoin.com/trade/${specialCoin}-${pair}`;
    },
    mexc: (coin: string, pair: string) => {
      const specialCases: Record<string, string> = {
        ELIZA: "AI16ZELIZA",
        ART: "ART",
        CULT: "CULT",
        HOLD: "HOLD",
        FIRE: "FIRE",
        TKO: "TKO",
        ZK: "ZKSYNC",
        GST: "GST",
        VELO: "VELO",
        URO: "URO",
        CATTON: "CATTON",
      };
      const specialCoin = specialCases[coin.toUpperCase()] || coin;
      return `https://futures.mexc.com/exchange/${specialCoin}_${pair}`;
    },
  };

  function handleRedirect(
    exchange: string,
    coin: string,
    pair: string,
    isFutures = false
  ) {
    let normalizedExchange = exchange.toLowerCase();

    if (normalizedExchange.includes("gate")) {
      normalizedExchange = "gate";
    }

    const links = isFutures ? futuresLinks : spotLinks;

    const urlBuilder = links[normalizedExchange as keyof typeof links];
    if (!urlBuilder) {
      console.error("Exchange não suportada:", exchange);
      return;
    }

    const url = urlBuilder(coin, pair);

    console.log("Tentando abrir URL:", url);

    const newTab = window.open(url, "_blank");

    if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
      window.location.href = url;
    }
  }

  return (
    <section
      className={`${styles.card} ${isChecked ? styles.cardChecked : ""} ${
        coin.spread > 0 ? styles.longPosition : styles.shortPosition
      }`}
      onClick={onClick}
    >
      <div className={`${styles.cardColumn} ${styles.symbolColumn}`}>
        <img
          src={
            coin.image ??
            `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
          }
          alt={coin.name}
        />
        <p>{coin.symbol}</p>
      </div>

      <div className={styles.cardColumn}>
        <h3>Spot</h3>
        <p
          onClick={() => handleRedirect(coin.ask.exchange, coin.symbol, "USDT")}
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            color: "inherit",
          }}
        >
          {coin.ask.exchange}
        </p>
        <p>$ {dynamicDecimalFormatter(askPrice, coin.symbol as Ticker)}</p>
      </div>

      <div className={styles.cardColumn}>
        <h3>Futuros</h3>
        <p
          onClick={() =>
            handleRedirect(coin.bid.exchange, coin.symbol, "USDT", true)
          }
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            color: "inherit",
          }}
        >
          {coin.bid.exchange}
        </p>
        <p>$ {dynamicDecimalFormatter(bidPrice, coin.symbol as Ticker)}</p>
      </div>

      <div className={`${styles.cardColumn} ${styles.spreadColumn}`}>
        <h3>Spread</h3>
        <p>{formatterSpread.format(coin.spread / 100)}</p>
      </div>

      <div className={styles.cardColumn}>
        <h3>Volume</h3>
        <p>
          {numberFormatter.format(
            Math.min(
              coin.ask.orderbook?.asks[0]?.sumVolume || 0,
              coin.bid.orderbook?.bids[0]?.sumVolume || 0
            )
          )}
        </p>
      </div>
    </section>
  );
}
