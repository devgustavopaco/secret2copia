import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calculator, Star, Trash } from "phosphor-react";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";
import { getCorrectSymbol } from "../../constants/symbolMappings";
import { TokenStats } from "../../server/router/orderbook";

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
interface ViewConfig {
  showCoinImage: boolean;
  showSpreadE: boolean;
  showSpreadS: boolean;
  showFunding: boolean;
  showExpiration: boolean;
  showValidTime: boolean;
  showSpotVolume: boolean;
  showFuturesVolume: boolean;
  showVolume24h: boolean;
  showLiquidity: boolean;
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
    tokenStats?: TokenStats;
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
  viewConfig?: ViewConfig;
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
  viewConfig = {
    showCoinImage: true,
    showSpreadE: true,
    showSpreadS: true,
    showFunding: true,
    showExpiration: true,
    showValidTime: true,
    showSpotVolume: true,
    showFuturesVolume: true,
    showVolume24h: true,
    showLiquidity: true,
  },
}: FuturosOperationCardProps) {
  const [showTokenStats, setShowTokenStats] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipElement, setTooltipElement] = useState<HTMLElement | null>(
    null
  );

  // Função para calcular posição do tooltip
  const calculateTooltipPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.left,
    };
  };

  // % → usar Intl como fração: dividir por 100
  const fmtPct = (x?: number) =>
    x === undefined
      ? "—"
      : new Intl.NumberFormat("pt-BR", {
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(x / 100);

  const fmtDateTime = (ts?: number) =>
    !ts
      ? ""
      : new Date(ts).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

  // classe para colorir valor (positivo/negativo/neutro)
  const valClass = (v?: number) => {
    if (v === undefined) return styles.neutralValue;
    if (v > 0) return styles.positiveValue;
    if (v < 0) return styles.negativeValue;
    return styles.neutralValue;
  };

  // Criar elemento para o tooltip
  useEffect(() => {
    const tooltipDiv = document.createElement("div");
    tooltipDiv.style.position = "fixed";
    tooltipDiv.style.zIndex = "999999";
    tooltipDiv.style.pointerEvents = "none";
    setTooltipElement(tooltipDiv);

    return () => {
      if (tooltipDiv.parentNode) {
        tooltipDiv.parentNode.removeChild(tooltipDiv);
      }
    };
  }, []);

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
        {viewConfig.showCoinImage && (
          <img
            src={
              coin.image ??
              `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
            }
            alt={coin.name}
            onMouseEnter={(e) => {
              if (coin.tokenStats && tooltipElement) {
                const position = calculateTooltipPosition(e.currentTarget);
                setTooltipPosition(position);
                setShowTokenStats(true);
                document.body.appendChild(tooltipElement);
              }
            }}
            onMouseLeave={() => {
              setShowTokenStats(false);
              if (tooltipElement && tooltipElement.parentNode) {
                tooltipElement.parentNode.removeChild(tooltipElement);
              }
            }}
          />
        )}
        <div
          className={styles.assetText}
          onMouseEnter={(e) => {
            if (coin.tokenStats && tooltipElement) {
              const position = calculateTooltipPosition(e.currentTarget);
              setTooltipPosition(position);
              setShowTokenStats(true);
              document.body.appendChild(tooltipElement);
            }
          }}
          onMouseLeave={() => {
            setShowTokenStats(false);
            if (tooltipElement && tooltipElement.parentNode) {
              tooltipElement.parentNode.removeChild(tooltipElement);
            }
          }}
        >
          <strong className={styles.sym}>{coin.symbol}</strong>
          <span className={styles.assetName}>{coin.name}</span>
        </div>

        {/* Token Stats Tooltip */}
        {showTokenStats &&
          coin.tokenStats &&
          tooltipElement &&
          createPortal(
            <div
              className={styles.tokenStatsTooltip}
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
              }}
            >
              <div className={styles.tooltipHeader}>
                <h3>Token {coin.symbol} | Estatísticas</h3>
                <div className={styles.tooltipMenu}>⋮</div>
              </div>

              <div className={styles.tooltipContent}>
                {/* COLUNA 1 — 1h */}
                <div className={styles.tooltipColumn}>
                  <div className={styles.tooltipSection}>
                    <h4>1 hora</h4>
                    <div className={styles.tooltipRow}>
                      <span>E Máx:</span>
                      <span className={valClass(coin.tokenStats?.maxE1h)}>
                        {fmtPct(coin.tokenStats?.maxE1h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>E Mín:</span>
                      <span className={valClass(coin.tokenStats?.minE1h)}>
                        {fmtPct(coin.tokenStats?.minE1h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>S Máx:</span>
                      <span className={valClass(coin.tokenStats?.maxS1h)}>
                        {fmtPct(coin.tokenStats?.maxS1h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>S Mín:</span>
                      <span className={valClass(coin.tokenStats?.minS1h)}>
                        {fmtPct(coin.tokenStats?.minS1h)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUNA 2 — 6h */}
                <div className={styles.tooltipColumn}>
                  <div className={styles.tooltipSection}>
                    <h4>6 horas</h4>
                    <div className={styles.tooltipRow}>
                      <span>E Máx:</span>
                      <span className={valClass(coin.tokenStats?.maxE6h)}>
                        {fmtPct(coin.tokenStats?.maxE6h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>E Mín:</span>
                      <span className={valClass(coin.tokenStats?.minE6h)}>
                        {fmtPct(coin.tokenStats?.minE6h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>S Máx:</span>
                      <span className={valClass(coin.tokenStats?.maxS6h)}>
                        {fmtPct(coin.tokenStats?.maxS6h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>S Mín:</span>
                      <span className={valClass(coin.tokenStats?.minS6h)}>
                        {fmtPct(coin.tokenStats?.minS6h)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUNA 3 — 24h + atualizado em */}
                <div className={styles.tooltipColumn}>
                  <div className={styles.tooltipSection}>
                    <h4>24 horas</h4>
                    <div className={styles.tooltipRow}>
                      <span>E Máx:</span>
                      <span className={valClass(coin.tokenStats?.maxE24h)}>
                        {fmtPct(coin.tokenStats?.maxE24h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>E Mín:</span>
                      <span className={valClass(coin.tokenStats?.minE24h)}>
                        {fmtPct(coin.tokenStats?.minE24h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>S Máx:</span>
                      <span className={valClass(coin.tokenStats?.maxS24h)}>
                        {fmtPct(coin.tokenStats?.maxS24h)}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>S Mín:</span>
                      <span className={valClass(coin.tokenStats?.minS24h)}>
                        {fmtPct(coin.tokenStats?.minS24h)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.tooltipSection}>
                    <div className={styles.tooltipRow}>
                      <span className={styles.timestamp}>
                        {coin.tokenStats?.updatedAt
                          ? `Atualizado: ${fmtDateTime(
                              coin.tokenStats.updatedAt
                            )}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            tooltipElement
          )}
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
          {viewConfig.showLiquidity && (
            <div className={styles.subKpi}>
              Liq.: ${Math.floor(spotLiquidity).toLocaleString("pt-BR")}
            </div>
          )}
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
          {viewConfig.showLiquidity && (
            <div className={styles.subKpi}>
              Liq.: ${Math.floor(futuresLiquidity).toLocaleString("pt-BR")}
            </div>
          )}
        </div>
      </div>

      {/* Spreads */}
      <div className={styles.cellSpreads}>
        {viewConfig.showSpreadE && (
          <span
            className={`${styles.chip} ${
              (coin.spread ?? 0) > 0 ? styles.green : styles.red
            }`}
            title="Lucro E"
          >
            E {formatterSpread.format((coin.spread ?? 0) / 100)}
          </span>
        )}

        {viewConfig.showSpreadS && (
          <span
            className={`${styles.chip} ${
              (coin.spreadS ?? 0) > 0 ? styles.green : styles.red
            }`}
            title="Lucro S"
          >
            S {formatterSpread.format((coin.spreadS ?? 0) / 100)}
          </span>
        )}
      </div>

      {/* Funding + Expiração */}
      <div className={styles.cellFunding}>
        {viewConfig.showFunding && (
          <span
            className={`${styles.funding} ${
              coin.fundingRate && coin.fundingRate > 0
                ? styles.green
                : styles.red
            }`}
            title="Taxa de financiamento (8h)"
          >
            {coin.fundingRate !== undefined
              ? fundingFormatter.format(coin.fundingRate)
              : "—"}
          </span>
        )}
        {viewConfig.showExpiration && (
          <small
            className={styles.expire}
            title={expMs ? new Date(expMs).toLocaleString("pt-BR") : "—"}
          >
            {expirationLabel}
          </small>
        )}

        {/* Tempo de vida da oportunidade */}
        {viewConfig.showValidTime && coin.validSince && (
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
        {viewConfig.showSpotVolume && (
          <span className={styles.volItem} title="Volume Spot (book)">
            S: {numberFormatter.format(spotVolume)}
          </span>
        )}
        {viewConfig.showFuturesVolume && (
          <span className={styles.volItem} title="Volume Futuros (book)">
            F: {numberFormatter.format(futuresVolume)}
          </span>
        )}
        {viewConfig.showVolume24h && coin.spotVolume24H !== undefined && (
          <span className={styles.volBadge} title="Spot 24h">
            S24h {formatCompactNumber(coin.spotVolume24H)}
          </span>
        )}
        {viewConfig.showVolume24h && coin.futVolume24H !== undefined && (
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
