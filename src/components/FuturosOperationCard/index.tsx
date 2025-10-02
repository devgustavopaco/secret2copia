import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calculator,
  Star,
  Trash,
  ChartLine,
  ArrowSquareOut,
  CaretDown,
  CaretRight,
} from "phosphor-react";
import { trpc } from "../../utils/trpc";
import { getCorrectSymbol } from "../../constants/symbolMappings";
import { TokenStats } from "../../server/router/orderbook";

// Material-UI imports
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";

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
  // Propriedades de grupo
  isGroup?: boolean;
  groupCount?: number;
  groupedOps?: any[];
  isExpanded?: boolean;
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

// Styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  "&:nth-of-type(even)": {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  "&:hover": {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    cursor: "pointer",
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  color: "#ffffff",
  fontSize: "0.9rem",
  padding: "12px 8px",
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: "rgba(59, 130, 246, 0.15)",
  "& .MuiTableCell-head": {
    color: "#e0f2ff",
    fontWeight: 700,
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid rgba(59, 130, 246, 0.3)",
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: "transparent",
  borderRadius: "12px",
  overflow: "hidden",
  "&::-webkit-scrollbar": {
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(59, 130, 246, 0.5)",
    borderRadius: "4px",
  },
}));

const ExchangeChip = styled(Chip)(({ theme }) => ({
  backgroundColor: "rgba(59, 130, 246, 0.2)",
  color: "#60a5fa",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  fontSize: "0.75rem",
  height: "24px",
  "&:hover": {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    color: "#ffffff",
  },
}));

const PriceTypography = styled(Typography)(({ theme }) => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontWeight: 700,
  color: "#ffffff",
}));

const SpreadChip = styled(Chip)(({ theme }) => ({
  fontSize: "0.8rem",
  fontWeight: 700,
  height: "28px",
  "&.positive": {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    color: "#10b981",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },
  "&.negative": {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: "rgba(255, 255, 255, 0.7)",
  padding: "6px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
  },
  "&.favorite": {
    color: "#fbbf24",
    "&:hover": {
      backgroundColor: "rgba(251, 191, 36, 0.2)",
    },
  },
}));

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
  isGroup = false,
  groupCount = 0,
  groupedOps = [],
  isExpanded = false,
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
    if (v === undefined) return "neutralValue";
    if (v > 0) return "positiveValue";
    if (v < 0) return "negativeValue";
    return "neutralValue";
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
    <StyledTableRow onClick={onClick}>
      {/* Asset */}
      <StyledTableCell>
        <Box display="flex" alignItems="center" gap={1}>
          {viewConfig.showCoinImage && (
            <Avatar
              src={
                coin.image ??
                `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
              }
              alt={coin.name}
              sx={{ width: 32, height: 32 }}
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
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              {isGroup && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    color: "#60a5fa",
                    "&:hover": {
                      color: "#ffffff",
                    },
                  }}
                >
                  {isExpanded ? (
                    <CaretDown size={16} weight="bold" />
                  ) : (
                    <CaretRight size={16} weight="bold" />
                  )}
                </Box>
              )}
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#ffffff" }}
              >
                {coin.symbol}
              </Typography>
              {isGroup && groupCount > 1 && (
                <Chip
                  label={`+${groupCount - 1}`}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    color: "#60a5fa",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    fontSize: "0.7rem",
                    height: "20px",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              {coin.name}
            </Typography>
          </Box>
        </Box>
      </StyledTableCell>

      {/* Spot Info */}
      <StyledTableCell>
        <Box>
          <ExchangeChip
            label={coin.ask.exchange}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRedirect(coin.ask.exchange, coin.symbol, "USDT", false);
            }}
            icon={<ArrowSquareOut size={10} />}
          />
          <Box mt={0.5}>
            <PriceTypography variant="body2">
              $
              {dynamicDecimalFormatter(spotDisplayPrice, coin.symbol as Ticker)}
            </PriceTypography>
            {viewConfig.showLiquidity && (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                Liq: ${Math.floor(spotLiquidity).toLocaleString("pt-BR")}
              </Typography>
            )}
          </Box>
        </Box>
      </StyledTableCell>

      {/* Futures Info */}
      <StyledTableCell>
        <Box>
          <ExchangeChip
            label={coin.bid.exchange}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRedirect(coin.bid.exchange, coin.symbol, "USDT", true);
            }}
            icon={<ArrowSquareOut size={10} />}
          />
          <Box mt={0.5}>
            <PriceTypography variant="body2">
              $
              {dynamicDecimalFormatter(
                futuresDisplayPrice,
                coin.symbol as Ticker
              )}
            </PriceTypography>
            {viewConfig.showLiquidity && (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                Liq: ${Math.floor(futuresLiquidity).toLocaleString("pt-BR")}
              </Typography>
            )}
          </Box>
        </Box>
      </StyledTableCell>

      {/* Spreads */}
      <StyledTableCell>
        <Box display="flex" flexDirection="column" gap={0.5}>
          <SpreadChip
            label={`E: ${formatterSpread.format((coin.spread ?? 0) / 100)}`}
            size="small"
            className={(coin.spread ?? 0) > 0 ? "positive" : "negative"}
          />
          <SpreadChip
            label={`S: ${formatterSpread.format((coin.spreadS ?? 0) / 100)}`}
            size="small"
            className={(coin.spreadS ?? 0) > 0 ? "positive" : "negative"}
          />
        </Box>
      </StyledTableCell>

      {/* Funding & Time */}
      <StyledTableCell>
        <Box display="flex" flexDirection="column" gap={0.3}>
          {viewConfig.showFunding && (
            <Typography
              variant="caption"
              sx={{
                color:
                  coin.fundingRate && coin.fundingRate > 0
                    ? "#10b981"
                    : "#ef4444",
                fontFamily: "monospace",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              F:{" "}
              {coin.fundingRate !== undefined
                ? fundingFormatter.format(coin.fundingRate)
                : "—"}
            </Typography>
          )}
          {viewConfig.showValidTime && (
            <Typography
              variant="caption"
              sx={{
                color: "#fbbf24",
                fontFamily: "monospace",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              T: {formatElapsed(now - coin.validSince)}
            </Typography>
          )}
        </Box>
      </StyledTableCell>

      {/* Volumes */}
      <StyledTableCell>
        <Box display="flex" flexDirection="column" gap={0.3}>
          {viewConfig.showSpotVolume && (
            <Typography
              variant="caption"
              sx={{
                color: "#ffffff",
                fontFamily: "monospace",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              S: {numberFormatter.format(spotVolume)}
            </Typography>
          )}
          {viewConfig.showFuturesVolume && (
            <Typography
              variant="caption"
              sx={{
                color: "#ffffff",
                fontFamily: "monospace",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              F: {numberFormatter.format(futuresVolume)}
            </Typography>
          )}
        </Box>
      </StyledTableCell>

      {/* Volumes 24h */}
      <StyledTableCell>
        <Box display="flex" flexDirection="column" gap={0.3}>
          {viewConfig.showVolume24h && (
            <>
              {coin.spotVolume24H !== undefined && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#60a5fa",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                >
                  S: {formatCompactNumber(coin.spotVolume24H)}
                </Typography>
              )}
              {coin.futVolume24H !== undefined && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#60a5fa",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                >
                  F: {formatCompactNumber(coin.futVolume24H)}
                </Typography>
              )}
            </>
          )}
        </Box>
      </StyledTableCell>

      {/* Actions */}
      <StyledTableCell>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Favorito">
            <ActionButton
              size="small"
              className={isFavorite ? "favorite" : ""}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Star size={16} weight={isFavorite ? "fill" : "regular"} />
            </ActionButton>
          </Tooltip>

          <Tooltip title="Calculadora">
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCalculatorClick?.();
              }}
            >
              <Calculator size={16} />
            </ActionButton>
          </Tooltip>

          <Tooltip title="Gráfico">
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleChartRedirect();
              }}
            >
              <ChartLine size={16} />
            </ActionButton>
          </Tooltip>

          <Tooltip title="Excluir">
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick();
              }}
            >
              <Trash size={16} />
            </ActionButton>
          </Tooltip>
        </Box>
      </StyledTableCell>

      {/* Token Stats Tooltip */}
      {showTokenStats &&
        coin.tokenStats &&
        tooltipElement &&
        createPortal(
          <Card
            sx={{
              position: "fixed",
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              backgroundColor: "rgba(15, 35, 65, 0.95)",
              border: "1px solid rgba(64, 156, 255, 0.3)",
              borderRadius: "12px",
              backdropFilter: "blur(20px)",
              zIndex: 999999,
              maxWidth: 500,
              minWidth: 350,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: "#e0f2ff", mb: 1 }}>
                Token {coin.symbol} | Estatísticas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#60a5fa", mb: 1 }}
                  >
                    1 hora
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">E Máx:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.maxE1h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.maxE1h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">E Mín:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.minE1h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.minE1h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">S Máx:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.maxS1h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.maxS1h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">S Mín:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.minS1h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.minS1h)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#60a5fa", mb: 1 }}
                  >
                    6 horas
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">E Máx:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.maxE6h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.maxE6h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">E Mín:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.minE6h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.minE6h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">S Máx:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.maxS6h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.maxS6h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">S Mín:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.minS6h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.minS6h)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#60a5fa", mb: 1 }}
                  >
                    24 horas
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">E Máx:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.maxE24h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.maxE24h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">E Mín:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.minE24h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.minE24h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">S Máx:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.maxS24h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.maxS24h)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">S Mín:</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          valClass(coin.tokenStats?.minS24h) === "positiveValue"
                            ? "#10b981"
                            : "#ef4444",
                        fontFamily: "monospace",
                      }}
                    >
                      {fmtPct(coin.tokenStats?.minS24h)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {coin.tokenStats?.updatedAt && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontStyle: "italic",
                    mt: 1,
                    display: "block",
                  }}
                >
                  Atualizado: {fmtDateTime(coin.tokenStats.updatedAt)}
                </Typography>
              )}
            </CardContent>
          </Card>,
          tooltipElement
        )}
    </StyledTableRow>
  );
}
