import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Calculator, Star, Trash } from "phosphor-react";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";
import { getCorrectSymbol } from "../../constants/symbolMappings";

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

interface OrderbookOperation {
  price: number;
  amount: number;
  sumVolume: number;
}
interface SideInfo {
  exchange: string;
  price: number;
  image_url?: string;
  isUSD: boolean;
  orderbook?: { asks: OrderbookOperation[]; bids: OrderbookOperation[] };
}
interface FuturosOperationCardProps {
  coin: {
    image?: string;
    name: string;
    ask: SideInfo;
    bid: SideInfo;
    symbol: string;
    fee: number;
    tax: number;
    spread: number;
    spreadS: number;
    volume?: number;
    fundingRate?: number;
    spotVolume24H?: number;
    futVolume24H?: number;
    validSince: number;
    fundingRateExpTs?: number | null;
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
  onChartClick?: (url: string) => void;
}

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "decimal",
  maximumFractionDigits: 4,
});
const formatterSpread = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fundingFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

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
  let fractionDigits = Math.max(currencyDecimalMapping[ticker] || 7, 7);
  if (value !== 0 && value < Math.pow(10, -fractionDigits)) {
    fractionDigits = Math.max(Math.ceil(-Math.log10(value)), fractionDigits);
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

const calculatePrice = (price: number, isUSD: boolean, dolarValue: number) =>
  isUSD ? price : price / dolarValue;

export function FuturosOperationCard({
  coin,
  dollarPrice = 1,
  onClick,
  onCalculatorClick,
  isOpen,
  isFavorite,
  onToggleFavorite,
  onDeleteClick,
  onChartClick,
}: FuturosOperationCardProps) {
  const { data: auth } = useSession();
  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatElapsed = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const dolarValue = user?.dolarValue ?? dollarPrice;

  // preços topo
  const spotAsk = calculatePrice(
    coin.ask.orderbook?.asks[0]?.price ?? coin.ask.price,
    coin.ask.isUSD,
    dolarValue
  );
  const spotBid = calculatePrice(
    coin.ask.orderbook?.bids[0]?.price ?? coin.ask.price,
    coin.ask.isUSD,
    dolarValue
  );
  const futBid = calculatePrice(
    coin.bid.orderbook?.bids[0]?.price ?? coin.bid.price,
    coin.bid.isUSD,
    dolarValue
  );
  const futAsk = calculatePrice(
    coin.bid.orderbook?.asks[0]?.price ?? coin.bid.price,
    coin.bid.isUSD,
    dolarValue
  );

  const spotDisplayPrice = isOpen ? spotAsk : spotBid;
  const futuresDisplayPrice = isOpen ? futBid : futAsk;

  const spread = isOpen
    ? (futBid / spotAsk - 1) * 100
    : (spotBid / futAsk - 1) * 100;
  const isLong = spread > 0;

  // validação símbolos
  const buySymbol = getCorrectSymbol(coin.bid.exchange, coin.symbol, true);
  const sellSymbol = getCorrectSymbol(coin.ask.exchange, coin.symbol, false);
  if (!buySymbol || !sellSymbol) return null;

  // funding expiration
  const expMs =
    coin.fundingRateExpTs &&
    (coin.fundingRateExpTs < 1e12
      ? coin.fundingRateExpTs * 1000
      : coin.fundingRateExpTs);
  const expirationLabel = (() => {
    if (!expMs) return "—";
    if (expMs > now) return `expira em: ${formatElapsed(expMs - now)}`;
    const expDate = new Date(expMs).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `expirou em: ${expDate}`;
  })();

  // links/helpers
  function formatPairForExchange(
    exchange: string,
    c: string,
    isFutures = false
  ): string {
    const normalizedExchange = exchange.toLowerCase();
    const formatters = {
      bitget: {
        spot: (x: string) =>
          ({
            URO: "UROUSDT",
            CLR: "CELRUSDT",
            ELIZA: "ELIZAUSDT",
            HOLD: "HOLDCOINUSDT",
            FIRE: "FIREUSDT",
            ZK: "ZKUSDT",
            VELO: "VELOUSDT",
          }[x] || `${x}USDT`),
        futures: (x: string) =>
          ({
            URO: "UROUSDT",
            CLR: "CELRUSDT",
            ELIZA: "ELIZAUSDT",
            HOLD: "HOLDCOINUSDT",
            FIRE: "FIREUSDT",
            ZK: "ZKUSDT",
            VELO: "VELOUSDT",
          }[x] || `${x}USDT`),
      },
      gate: {
        spot: (x: string) =>
          ({
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
          }[x] || `${x}_USDT`),
        futures: (x: string) =>
          ({
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
          }[x] || `${x}_USDT`),
      },
      mexc: {
        spot: (x: string) =>
          ({
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
          }[x] || `${x}_USDT`),
        futures: (x: string) =>
          ({
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
          }[x] || `${x}_USDT`),
      },
      kucoin: {
        spot: (x: string) =>
          ({
            CULT: "MILADYCULT-USDT",
            HOLD: "HOLDCOIN-USDT",
            FIRE: "FIRE-USDT",
            VELO: "VELO-USDT",
          }[x] || `${x}-USDT`),
        futures: (x: string) =>
          ({
            CULT: "MILADYCULT-USDT",
            HOLD: "HOLDCOIN-USDT",
            FIRE: "FIRE-USDT",
            VELO: "VELO-USDT",
          }[x] || `${x}-USDT`),
      },
    } as const;
    const f = (formatters as any)[normalizedExchange];
    if (!f) return isFutures ? `${c}USDT` : `${c}_USDT`;
    const up = c.toUpperCase();
    return isFutures ? f.futures(up) : f.spot(up);
  }

  const spotLinks = {
    bybit: (coin: string, pair: string) =>
      `https://www.bybit.com/trade/spot/${coin}/${pair}`,
    binance: (coin: string, pair: string) =>
      `https://www.binance.com/en/trade/${coin}_${pair}`,
    gate: (coin: string, pair: string) => {
      const special: Record<string, string> = {
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
      const sc = special[coin.toUpperCase()] || coin;
      return `https://www.gate.io/trade/${sc}_${pair}`;
    },
    bitget: (_: string, pair: string) => `https://www.bitget.com/spot/${pair}`,
    mexc: (_: string, pair: string) => `https://www.mexc.com/exchange/${pair}`,
    kucoin: (_: string, pair: string) => `https://www.kucoin.com/trade/${pair}`,
    bingx: (_: string, pair: string) =>
      `https://bingx.com/spot/${pair.replace("_", "")}`,
  };
  const futuresLinks = {
    bybit: (coin: string, pair: string) => {
      const special: Record<string, string> = {
        FIRE: "FIRE",
        VELO: "VELO",
        ZK: "ZK",
      };
      const sc = special[coin.toUpperCase()] || coin;
      return `https://www.bybit.com/trade/${sc}${pair}`;
    },
    binance: (coin: string, pair: string) => {
      const special: Record<string, string> = { TKO: "TKO", ZK: "ZK" };
      const sc = special[coin.toUpperCase()] || coin;
      return `https://www.binance.com/en/futures/${sc}${pair}_PERP`;
    },
    gate: (_: string, pair: string) =>
      `https://www.gate.io/futures/USDT/${pair}`,
    bitget: (_: string, pair: string) =>
      `https://www.bitget.com/futures/usdt/${pair}`,
    kucoin: (_: string, pair: string) =>
      `https://futures.kucoin.com/trade/${pair.replace("-", "")}M`,
    mexc: (_: string, pair: string) =>
      `https://futures.mexc.com/exchange/${pair}`,
    bingx: (coin: string, pair: string) =>
      `https://bingx.com/en-us/futures/${coin.toUpperCase()}_${pair}`,
  };

  function handleRedirect(
    exchange: string,
    c: string,
    _pair: string,
    isFutures = false
  ) {
    let normalized = exchange.toLowerCase().replace(/ spot| futures/g, "");
    if (normalized.includes("gate")) normalized = "gate";
    const links = isFutures ? futuresLinks : spotLinks;
    const formattedPair = formatPairForExchange(normalized, c, isFutures);
    const builder = (links as any)[normalized];
    if (!builder) return;
    const url = builder(c, formattedPair);
    const newTab = window.open(url, "_blank");
    if (!newTab || newTab.closed || typeof newTab.closed === "undefined")
      window.location.href = url;
  }

  function handleBothExchangesRedirect() {
    const sEx = coin.ask.exchange.toLowerCase().replace(/ spot| futures/g, "");
    const fEx = coin.bid.exchange.toLowerCase().replace(/ spot| futures/g, "");
    const sPair = formatPairForExchange(sEx, coin.symbol, false);
    const fPair = formatPairForExchange(fEx, coin.symbol, true);
    const sUrl = (spotLinks as any)[sEx]?.(coin.symbol, sPair);
    const fUrl = (futuresLinks as any)[fEx]?.(coin.symbol, fPair);
    if (sUrl)
      window.open(
        sUrl,
        "SpotWindow",
        "width=1200,height=800,scrollbars=yes,resizable=yes"
      );
    if (fUrl)
      window.open(
        fUrl,
        "FuturesWindow",
        "width=1200,height=800,scrollbars=yes,resizable=yes"
      );
  }

  function generateTradingViewURL() {
    const map: Record<string, string> = {
      MEXC: "MEXC",
      BITGET: "BITGET",
      BYBIT: "BYBIT",
      BINANCE: "BINANCE",
      GATE: "GATEIO",
      GATEIO: "GATEIO",
      KUCOIN: "KUCOIN",
    };
    const base = coin.symbol.toUpperCase();
    const cleanSpot = coin.ask.exchange.replace(/ spot| futures/i, "").trim();
    const cleanFut = coin.bid.exchange.replace(/ spot| futures/i, "").trim();
    const spotSymbol = `${
      map[cleanSpot.toUpperCase()] || cleanSpot.toUpperCase()
    }:${base}USDT`;
    const futSymbol = `${
      map[cleanFut.toUpperCase()] || cleanFut.toUpperCase()
    }:${base}USDT.P`;
    const cfg = {
      height: 700,
      symbol: spotSymbol,
      interval: "5",
      timezone: "America/Sao_Paulo",
      theme: "dark",
      style: "2",
      hide_volume: true,
      allow_symbol_change: true,
      compareSymbols: [{ symbol: futSymbol, position: "SameScale" }],
      support_host: "https://www.tradingview.com",
      width: "100%",
    };
    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=br#${encodeURIComponent(
      JSON.stringify(cfg)
    )}`;
  }
  function handleChartRedirect() {
    onChartClick?.(generateTradingViewURL());
  }

  const spotVolume =
    (isOpen
      ? coin.ask.orderbook?.asks[0]?.sumVolume
      : coin.ask.orderbook?.bids[0]?.sumVolume) ?? 0;
  const futuresVolume =
    (isOpen
      ? coin.bid.orderbook?.bids[0]?.sumVolume
      : coin.bid.orderbook?.asks[0]?.sumVolume) ?? 0;
  const spotLiquidity = spotDisplayPrice * spotVolume;
  const futuresLiquidity = futuresDisplayPrice * futuresVolume;
  return (
    <section
      className={`${styles.row} ${isLong ? styles.long : styles.short}`}
      onClick={onClick}
      title={`${coin.name} (${coin.symbol})`}
    >
      {/* Asset */}
      <div className={styles.cellAsset}>
        <img
          src={
            coin.image ??
            `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
          }
          alt={coin.name}
        />
        <div className={styles.assetText}>
          <strong className={styles.sym}>{coin.symbol}</strong>
          <span className={styles.assetName}>{coin.name}</span>
        </div>
      </div>

      {/* Spot */}
      <div className={styles.cell}>
        <button
          className={styles.exLink}
          onClick={(e) => {
            e.stopPropagation();
            handleRedirect(coin.ask.exchange, coin.symbol, "USDT", false);
          }}
          title="Abrir Spot"
        >
          {coin.ask.exchange}
        </button>
        <div className={styles.priceMono}>
          ${dynamicDecimalFormatter(spotDisplayPrice, coin.symbol as Ticker)}{" "}
          <div className={styles.subKpi}>
            Liq.: ${Math.floor(spotLiquidity).toLocaleString("pt-BR")}
          </div>
        </div>
      </div>

      {/* Futures */}
      <div className={styles.cell}>
        <button
          className={styles.exLink}
          onClick={(e) => {
            e.stopPropagation();
            handleRedirect(coin.bid.exchange, coin.symbol, "USDT", true);
          }}
          title="Abrir Futuros"
        >
          {coin.bid.exchange}
        </button>
        <div className={styles.priceMono}>
          ${dynamicDecimalFormatter(futuresDisplayPrice, coin.symbol as Ticker)}
          <div className={styles.subKpi}>
            Liq.: ${Math.floor(futuresLiquidity).toLocaleString("pt-BR")}
          </div>
        </div>
      </div>

      {/* Spreads */}
      <div className={styles.cellSpreads}>
        <span
          className={`${styles.chip} ${isLong ? styles.green : styles.red}`}
          title="Lucro E"
        >
          E {formatterSpread.format(coin.spread / 100)}
        </span>
        <span
          className={`${styles.chip} ${
            coin.spreadS > 0 ? styles.green : styles.red
          }`}
          title="Lucro S"
        >
          S {formatterSpread.format(coin.spreadS / 100)}
        </span>
      </div>

      {/* Funding + Expiração */}
      {/* Funding + Expiração */}
      <div className={styles.cellFunding}>
        <span
          className={`${styles.funding} ${
            coin.fundingRate && coin.fundingRate > 0 ? styles.green : styles.red
          }`}
          title="Taxa de financiamento (8h)"
        >
          {coin.fundingRate !== undefined
            ? fundingFormatter.format(coin.fundingRate)
            : "—"}
        </span>
        <small
          className={styles.expire}
          title={expMs ? new Date(expMs).toLocaleString("pt-BR") : "—"}
        >
          {expirationLabel}
        </small>

        {/* 👇 Novo bloco: tempo de vida */}
        {coin.validSince && (
          <small
            className={styles.expire2}
            title="Tempo de vida da oportunidade"
          >
            time: {formatElapsed(now - coin.validSince)}
          </small>
        )}
      </div>

      {/* Volumes (compacto) */}
      <div className={styles.cellVol}>
        <span className={styles.volItem} title="Volume Spot (book)">
          S: {numberFormatter.format(spotVolume)}
        </span>
        <span className={styles.volItem} title="Volume Futuros (book)">
          F: {numberFormatter.format(futuresVolume)}
        </span>
        {coin.spotVolume24H !== undefined && (
          <span className={styles.volBadge} title="Spot 24h">
            S24h {formatCompactNumber(coin.spotVolume24H)}
          </span>
        )}
        {coin.futVolume24H !== undefined && (
          <span className={styles.volBadge} title="Futuros 24h">
            F24h {formatCompactNumber(coin.futVolume24H)}
          </span>
        )}
      </div>

      {/* Ações */}
      <div className={styles.cellActions}>
        <button
          className={styles.iconBtn}
          title="Favorito"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Star size={16} weight={isFavorite ? "fill" : "regular"} />
        </button>

        <button
          className={styles.iconBtn}
          title="Calculadora"
          onClick={(e) => {
            e.stopPropagation();
            onCalculatorClick?.();
          }}
        >
          <Calculator size={16} />
        </button>

        <button
          className={styles.iconBtn}
          title="Gráfico"
          onClick={(e) => {
            e.stopPropagation();
            handleChartRedirect();
          }}
        >
          📈
        </button>

        <button
          className={`${styles.iconBtn} ${styles.danger}`}
          title="Excluir"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
        >
          <Trash size={16} />
        </button>
      </div>
    </section>
  );
}
