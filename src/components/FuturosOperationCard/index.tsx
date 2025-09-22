import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MdArrowForwardIos } from "react-icons/md";
import { Calculator, Star, Trash } from "phosphor-react";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";
import Image from "next/image";
import { getCorrectSymbol } from "../../constants/symbolMappings";

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
    spreadS: number;
    volume?: number;
  };
  dollarPrice?: number;
  onClick: () => void;
  onCalculatorClick?: () => void;
  isChecked?: boolean;
  meetsCriteria?: boolean;
  isAdmin?: boolean;
  isOpen?: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDeleteClick: () => void;
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

  // Definir o número mínimo de casas decimais como 7
  let fractionDigits = Math.max(currencyDecimalMapping[ticker] || 7, 7);

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
  onCalculatorClick,
  isChecked,
  isAdmin,
  isOpen,
  isFavorite,
  onToggleFavorite,
  onDeleteClick,
}: FuturosOperationCardProps) {
  const { data: auth } = useSession();
  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);
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

  const dolarValue = user?.dolarValue ?? dollarPrice;

  const bidPrice = calculatePrice(coin.bid.price, coin.bid.isUSD, dolarValue);
  const askPrice = calculatePrice(coin.ask.price, coin.ask.isUSD, dolarValue);
  const spotVolume = coin.ask.orderbook?.asks[0]?.sumVolume || 0;
  const futuresVolume = coin.bid.orderbook?.bids[0]?.sumVolume || 0;
  // Get correct symbols for each exchange
  const buySymbol = getCorrectSymbol(coin.bid.exchange, coin.symbol, true);
  const sellSymbol = getCorrectSymbol(coin.ask.exchange, coin.symbol, false);

  // Create price keys using correct symbols
  const buyPriceKey = `${coin.bid.exchange.toLowerCase()}_${coin.symbol}`;
  const sellPriceKey = `${coin.ask.exchange.toLowerCase()}_${coin.symbol}`;

  // Format pairs for spot and futures
  const spotPair = getCorrectSymbol(coin.ask.exchange, coin.symbol, false);
  const futuresPair = getCorrectSymbol(coin.bid.exchange, coin.symbol, true);

  const spread = isOpen
    ? ((bidPrice - askPrice) / askPrice) * 100
    : ((askPrice - bidPrice) / bidPrice) * 100;

  const animationData = isChecked
    ? require("/public/animations/checkPurple.json")
    : require("/public/animations/checkGreen.json");

  // Se algum dos símbolos for null, não renderizar o card
  if (!buySymbol || !sellSymbol) {
    console.warn(
      `Skipping invalid pair: ${coin.symbol} for exchanges ${coin.bid.exchange}/${coin.ask.exchange}`
    );
    return null;
  }

  function formatPairForExchange(
    exchange: string,
    coin: string,
    isFutures: boolean = false
  ): string {
    const normalizedExchange = exchange.toLowerCase();

    const formatters = {
      bitget: {
        spot: (c: string) => {
          const specialCases: Record<string, string> = {
            URO: "UROUSDT",
            CLR: "CELRUSDT",
            ELIZA: "ELIZAUSDT",
            HOLD: "HOLDCOINUSDT",
            FIRE: "FIREUSDT",
            ZK: "ZKUSDT",
            VELO: "VELOUSDT",
          };
          return specialCases[c] || `${c}USDT`;
        },
        futures: (c: string) => {
          const specialCases: Record<string, string> = {
            URO: "UROUSDT",
            CLR: "CELRUSDT",
            ELIZA: "ELIZAUSDT",
            HOLD: "HOLDCOINUSDT",
            FIRE: "FIREUSDT",
            ZK: "ZKUSDT",
            VELO: "VELOUSDT",
          };
          return specialCases[c] || `${c}USDT`;
        },
      },
      gate: {
        spot: (c: string) => {
          const specialCases: Record<string, string> = {
            URO: "URO_USDT",
            CATTON: "CATTON_USDT",
            ELIZA: "ELIZA_USDT",
            ART: "ARTELA_USDT",
            CULT: "MILADYCULT_USDT",
            HOLD: "HOLD_USDT",
            TKO: "TKO_USDT",
            ZK: "ZK_USDT",
            GST: "GST_USDT",
            VELO: "VELO_USDT",
          };
          return specialCases[c] || `${c}_USDT`;
        },
        futures: (c: string) => {
          const specialCases: Record<string, string> = {
            URO: "URO_USDT",
            CATTON: "CATTON_USDT",
            ELIZA: "ELIZA_USDT",
            ART: "ARTELA_USDT",
            CULT: "MILADYCULT_USDT",
            HOLD: "HOLD_USDT",
            TKO: "TKO_USDT",
            ZK: "ZK_USDT",
            GST: "GST_USDT",
            VELO: "VELO_USDT",
          };
          return specialCases[c] || `${c}_USDT`;
        },
      },
      mexc: {
        spot: (c: string) => {
          const specialCases: Record<string, string> = {
            URO: "URO_USDT",
            CATTON: "CATTON_USDT",
            ELIZA: "ELIZA_USDT",
            ART: "ART_USDT",
            CULT: "CULT_USDT",
            HOLD: "HOLD_USDT",
            TKO: "TKO_USDT",
            ZK: "ZKSYNC_USDT",
            GST: "GST_USDT",
            VELO: "VELO_USDT",
          };
          return specialCases[c] || `${c}_USDT`;
        },
        futures: (c: string) => {
          const specialCases: Record<string, string> = {
            URO: "URO_USDT",
            CATTON: "CATTON_USDT",
            ELIZA: "AI16ZELIZA_USDT",
            ART: "ART_USDT",
            CULT: "CULT_USDT",
            HOLD: "HOLD_USDT",
            TKO: "TKO_USDT",
            ZK: "ZKSYNC_USDT",
            GST: "GST_USDT",
            VELO: "VELO_USDT",
          };
          return specialCases[c] || `${c}_USDT`;
        },
      },
      kucoin: {
        spot: (c: string) => {
          const specialCases: Record<string, string> = {
            CULT: "MILADYCULT-USDT",
            HOLD: "HOLDCOIN-USDT",
            FIRE: "FIRE-USDT",
            VELO: "VELO-USDT",
          };
          return specialCases[c] || `${c}-USDT`;
        },
        futures: (c: string) => {
          const specialCases: Record<string, string> = {
            CULT: "MILADYCULT-USDT",
            HOLD: "HOLDCOIN-USDT",
            FIRE: "FIRE-USDT",
            VELO: "VELO-USDT",
          };
          return specialCases[c] || `${c}-USDT`;
        },
      },
    };

    const formatter = formatters[normalizedExchange as keyof typeof formatters];
    if (!formatter) return isFutures ? `${coin}USDT` : `${coin}_USDT`;

    return isFutures
      ? formatter.futures(coin.toUpperCase())
      : formatter.spot(coin.toUpperCase());
  }

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
    const formattedPair = formatPairForExchange(
      normalizedExchange,
      coin,
      isFutures
    );

    const urlBuilder = links[normalizedExchange as keyof typeof links];
    if (!urlBuilder) {
      console.error("Exchange não suportada:", exchange);
      return;
    }

    const url = urlBuilder(coin, pair);

    const newTab = window.open(url, "_blank");

    if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
      window.location.href = url;
    }
  }

  const spotLinks = {
    bybit: (coin: string, pair: string) =>
      `https://www.bybit.com/trade/spot/${coin}/${pair}`,
    binance: (coin: string, pair: string) =>
      `https://www.binance.com/en/trade/${coin}_${pair}`,
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
      return `https://www.gate.io/trade/${specialCoin}_${pair}`;
    },
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

  // Função para gerar URLs do TradingView
  function generateTradingViewURL() {
    // Mapear exchanges para códigos do TradingView (simplificado)
    const exchangeMapping: Record<string, string> = {
      Mexc: "MEXC",
      Bitget: "BITGET",
      Bybit: "BYBIT",
      Binance: "BINANCE",
      Gateio: "GATEIO",
      Gate: "GATEIO",
      Kucoin: "KUCOIN",
    };

    // Usar o símbolo básico sem modificações especiais
    const baseSymbol = coin.symbol.toUpperCase();

    // Obter códigos das exchanges
    const spotExchangeCode =
      exchangeMapping[coin.ask.exchange] || coin.ask.exchange.toUpperCase();
    const futuresExchangeCode =
      exchangeMapping[coin.bid.exchange] || coin.bid.exchange.toUpperCase();

    // Formar símbolos seguindo o padrão do exemplo que funcionou
    const spotSymbol = `${spotExchangeCode}:${baseSymbol}USDT`;
    const futuresSymbol = `${futuresExchangeCode}:${baseSymbol}USDT.P`;

    // Configuração do TradingView seguindo exatamente o padrão que funcionou
    const config = {
      height: 700,
      symbol: spotSymbol,
      interval: "5",
      timezone: "America/Sao_Paulo",
      theme: "dark",
      style: "2",
      hide_volume: true,
      allow_symbol_change: true,
      compareSymbols: [
        {
          symbol: futuresSymbol,
          position: "SameScale",
        },
      ],
      support_host: "https://www.tradingview.com",
      width: "100%",
    };

    // Codificar a configuração
    const encodedConfig = encodeURIComponent(JSON.stringify(config));

    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=br#${encodedConfig}`;
  }

  function handleChartRedirect() {
    const url = generateTradingViewURL();
    const newTab = window.open(url, "_blank");

    if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
      window.location.href = url;
    }
  }

  return (
    <section
      className={`${styles.card} ${isChecked ? styles.cardChecked : ""} ${
        spread > 0 ? styles.longPosition : styles.shortPosition
      }`}
      onClick={onClick}
    >
      <div className={`${styles.cardColumn} ${styles.symbolColumn}`}>
        <div className={styles.actionButtons}>
          <button
            className={styles.favoriteButton}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            title={
              isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
          >
            <Star
              size={20}
              weight={isFavorite ? "fill" : "regular"}
              color={isFavorite ? "#facc15" : "#aaa"}
            />
          </button>
          <button
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            title="Excluir esta oportunidade"
          >
            <Trash size={20} color="#ef4444" />
          </button>
        </div>

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
        <h3>Spreads</h3>
        <div className={styles.spreadsRow}>
          <div
            className={`${styles.spreadItem} ${
              coin.spread > 0 ? styles.positive : styles.negative
            }`}
          >
            <span className={styles.spreadLabel}>Lucro E </span>
            <span className={styles.spreadValue}>
              {formatterSpread.format(coin.spread / 100)}
            </span>
          </div>
          <div
            className={`${styles.spreadItem} ${
              coin.spreadS > 0 ? styles.positive : styles.negative
            }`}
          >
            <span className={styles.spreadLabel}>Lucro S </span>
            <span className={styles.spreadValue}>
              {formatterSpread.format(coin.spreadS / 100)}
            </span>
          </div>
        </div>
      </div>

      <div className={`${styles.cardColumn} ${styles.volumeSection}`}>
        <h3>Volumes</h3>
        <div className={styles.volumesRow}>
          <div className={`${styles.volumeItem} ${styles.spotVolume}`}>
            <span className={styles.volumeLabel}>Spot</span>
            <span className={styles.volumeValue}>
              {numberFormatter.format(spotVolume)}
            </span>
          </div>
          <div className={`${styles.volumeItem} ${styles.futuresVolume}`}>
            <span className={styles.volumeLabel}>Futuros</span>
            <span className={styles.volumeValue}>
              {numberFormatter.format(futuresVolume)}
            </span>
          </div>
        </div>
        <div className={styles.buttonContainer}>
          <button
            className={styles.calculatorButton}
            onClick={(e) => {
              e.stopPropagation();
              onCalculatorClick?.();
            }}
            title="Calculadora da Oportunidade"
          >
            <Calculator size={16} />
          </button>
          <button
            className={styles.chartButton}
            onClick={(e) => {
              e.stopPropagation();
              handleChartRedirect();
            }}
            title="Ver Gráfico no TradingView"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3V21H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 9L12 6L16 10L20 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
