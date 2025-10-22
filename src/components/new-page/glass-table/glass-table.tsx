"use client";

import React from "react";
import Image from "next/image";
import styles from "./glass-table.module.scss";
import LockIcon from "../../Icons/LockIcon";
import GroupIcon from "../../Icons/GroupIcon";
import FilterIcon from "../../Icons/FilterIcon";
import CalculatorIcon from "../../Icons/CalculatorIcon";
import ConfigIcon from "../../Icons/ConfigIcon";
import CalculatorTableIcon from "../../Icons/CalculatorTableIcon";
import TradingViewIcon from "../../Icons/TradingViewIcon";
import StarIcon from "../../Icons/StarIcon";
import StarFilledIcon from "../../Icons/StarFilledIcon";
import TrashIcon from "../../Icons/TrashIcon";

import type { ArbitrageOpportunity } from "../../../server/router/orderbook";
import { PacmanLoader } from "react-spinners";
import PauseIcon from "../../Icons/PauseIcon";
import PlayIcon from "../../Icons/PlayIcon";

// Função para abrir calculadora em popup
const openCalculatorPopup = () => {
  const width = 400;
  const height = 800;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const popup = window.open(
    "/calculator",
    "calculator",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
  );

  if (popup) {
    popup.focus();
  }
};

// Função para abrir oportunidade em popup
const openOpportunityPopup = (params: URLSearchParams) => {
  const width = 400;
  const height = 500;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const popup = window.open(
    `/oportunidade?${params.toString()}`,
    "opportunity",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
  );

  if (popup) {
    popup.focus();
  }
};

export type Align = "left" | "center" | "right";

export type Column<T> = {
  /** ID única da coluna */
  id: string;
  /** Cabeçalho (string/JSX) */
  header: React.ReactNode;
  /** Chave do objeto ou função para renderizar a célula */
  field?: keyof T;
  accessor?: (row: T, rowIndex: number) => React.ReactNode;
  /** Largura (ex.: '120px', '12%', 'minmax(160px,1fr)') */
  width?: string;
  /** Alinhamento */
  align?: Align;
  /** Classe extra */
  className?: string;
};

export type GlassTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  zebra?: boolean;
  dense?: boolean;
  emptyMessage?: string;
  className?: string;
  isSidebarOpen?: boolean;

  /** ⬇️ NOVO: controle de busca + clique no filtro */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;

  /** ⬇️ NOVO: elemento extra na toolbar */
  toolbarExtra?: React.ReactNode;

  /** ⬇️ NOVO: controle de agrupamento */
  isGrouped?: boolean;
  onToggleGrouping?: () => void;

  /** ⬇️ NOVO: controle de modo de fechamento */
  isExitMode?: boolean;
  onToggleExitMode?: () => void;
};

function classnames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const fmtMoney = (n?: number) =>
  typeof n === "number" && isFinite(n)
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
    : "—";
const fmtPct = (n?: number) =>
  typeof n === "number" && isFinite(n) ? `${n.toFixed(2)}%` : "—";
const fmtPctFunding = (n?: number) =>
  typeof n === "number" && isFinite(n) ? `${n.toFixed(5)}%` : "—";
const safe = (s?: string) => s ?? "—";

// Função para formatar volumes com abreviações
const formatVolume = (volume: number) => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  } else {
    return volume.toFixed(0);
  }
};

type CoinRow = {
  id: string;
  coin: { ticker: string; logo: string };
  spot: { price: string; bingo: string; live: string };
  futures: { price: string; bingo: string; live: string };
  spreads: { long: string; short: string };
  funding: string;
  fundingExpiry: string;
  tempo: string;
  volumes: { s: string; f: string };
  volumes24h: { s: string; f: string };
};

// mapeia ArbitrageOpportunity -> CoinRow
function mapOppToRow(op: ArbitrageOpportunity): CoinRow {
  const askP = op?.lowestAsk?.price ?? 0;
  const askAmt = op?.lowestAsk?.amount ?? 0;
  const bidP = op?.highestBid?.price ?? 0;
  const bidAmt = op?.highestBid?.amount ?? 0;

  const askLiq = askP * askAmt;
  const bidLiq = bidP * bidAmt;

  return {
    id: `${op.ticker}-${op.lowestAsk?.exchange}-${op.highestBid?.exchange}`,
    coin: {
      ticker: op.ticker?.replace(/USDT$/i, "") || op.ticker || "—",
      logo: op.coinImage || "/default-exchange.png",
    },
    spot: {
      bingo: safe(op.lowestAsk?.exchange),
      price: fmtMoney(askP),
      live: askLiq ? `Liq $${askLiq.toFixed(0)}` : "—",
    },
    futures: {
      bingo: safe(op.highestBid?.exchange),
      price: fmtMoney(bidP),
      live: bidLiq ? `Liq $${bidLiq.toFixed(0)}` : "—",
    },
    spreads: {
      long: `E: ${fmtPct(op.spread)}`,
      short: `S: ${fmtPct(op.spreadS)}`,
    },
    funding:
      typeof (op as any).fundingRate === "number"
        ? fmtPctFunding((op as any).fundingRate * 100)
        : safe((op as any).funding),
    fundingExpiry: "—", // será calculado no useMemo
    tempo: "—", // será calculado no useMemo
    volumes: {
      s: `S: ${askLiq ? askLiq.toFixed(0) : 0}`,
      f: `F: ${bidLiq ? bidLiq.toFixed(0) : 0}`,
    },
    volumes24h: {
      s: `S: ${op.spotVolume24h ? formatVolume(op.spotVolume24h) : "0"}`,
      f: `F: ${op.futVolume24h ? formatVolume(op.futVolume24h) : "0"}`,
    },
  };
}

export default function GlassTable<T extends object>({
  searchValue,
  onSearchChange,
  onFilterClick,
  columns,
  data,
  rowKey,
  onRowClick,
  stickyHeader = true,
  maxHeight,
  zebra = false,
  dense = false,
  emptyMessage = "Sem dados",
  className,
  isSidebarOpen,
  toolbarExtra,
  isGrouped = false,
  onToggleGrouping,
  isExitMode = false,
  onToggleExitMode,
}: GlassTableProps<T>) {
  const styleVars: React.CSSProperties | undefined = maxHeight
    ? {
        ["--gt-max-h" as any]:
          typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
      }
    : undefined;

  const renderColgroup = () => (
    <colgroup>
      {columns.map((col) => (
        <col
          key={col.id}
          style={col.width ? { width: col.width } : undefined}
        />
      ))}
    </colgroup>
  );

  const Header = (
    <div className={styles.tableHead}>
      <table className={styles.table}>
        {renderColgroup()}
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={classnames(
                  styles.th,
                  col.align && styles[`align-${col.align}`],
                  col.className
                )}
                style={col.width ? { width: col.width } : undefined}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </div>
  );

  const Body = (
    <div className={styles.tableBody}>
      <div className={styles.scroller}>
        <table className={styles.table}>
          {renderColgroup()}
          {!stickyHeader && (
            <thead className={styles.thead}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={classnames(
                      styles.th,
                      col.align && styles[`align-${col.align}`],
                      col.className
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    scope="col"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody className={styles.tbody}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className={styles.loaderWrapper}>
                    <PacmanLoader color="#7B61FF" size={40} />
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const key = rowKey ? rowKey(row, i) : i;
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={key}
                    className={classnames(
                      styles.row,
                      clickable && styles.clickable
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : -1}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((col) => {
                      const content = col.accessor
                        ? col.accessor(row, i)
                        : col.field
                        ? // @ts-ignore
                          (row as any)[col.field]
                        : null;

                      return (
                        <td
                          key={col.id}
                          className={classnames(
                            styles.td,
                            col.align && styles[`align-${col.align}`],
                            col.className
                          )}
                          style={col.width ? { width: col.width } : undefined}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className={classnames(
        styles.wrapper,
        !isSidebarOpen && styles.sidebarClosed,
        zebra && styles.zebra,
        dense && styles.dense,
        className
      )}
      style={styleVars}
    >
      <div className={styles.toolbar}>
        <label className={styles.searchGlass}>
          <img
            src="/new-page/search-icon.svg"
            alt=""
            className={styles.searchIcon}
          />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filtrar por símbolo"
            aria-label="Filtrar por símbolo"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </label>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.iconGlass} ${isExitMode ? styles.active : ""}`}
            aria-label={isExitMode ? "Modo Fechamento" : "Modo Entrada"}
            onClick={onToggleExitMode}
            title={
              isExitMode
                ? "Mostrar oportunidades de fechamento"
                : "Mostrar oportunidades de entrada"
            }
          >
            <LockIcon />
          </button>
          <button
            type="button"
            className={`${styles.iconGlass} ${isGrouped ? styles.active : ""}`}
            aria-label="Modo grade"
            onClick={onToggleGrouping}
            title={isGrouped ? "Desagrupar por ticker" : "Agrupar por ticker"}
          >
            <GroupIcon />
          </button>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Filtrar"
            onClick={onFilterClick}
          >
            <FilterIcon />
          </button>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Calculadora"
            onClick={openCalculatorPopup}
          >
            <CalculatorIcon />
          </button>
          {toolbarExtra}
        </div>
      </div>

      <div className={styles.surface}>
        {stickyHeader && Header}
        {Body}
      </div>
    </div>
  );
}

/* =========================
   DEMO COM MOCK DE DADOS
   ========================= */

export function DemoGlassTable({
  searchValue,
  onSearchChange,
  onFilterClick,
  isSidebarOpen,
  opportunities,
  isExitMode,
  onToggleExitMode,
  refreshRate,
  onRefreshRateChange,
  isSocketPaused,
  onToggleSocketPause,
}: {
  isSidebarOpen: boolean;
  opportunities?: ArbitrageOpportunity[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  isExitMode?: boolean;
  onToggleExitMode?: () => void;
  refreshRate?: number;
  onRefreshRateChange?: (rate: number) => void;
  isSocketPaused?: boolean;
  onToggleSocketPause?: () => void;
}) {
  const [filter, setFilter] = React.useState("");

  // Estado para modal de TradingView
  const [isTradingViewOpen, setIsTradingViewOpen] = React.useState(false);
  const [tradingViewUrl, setTradingViewUrl] = React.useState<string | null>(
    null
  );

  // Estados para paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Estado para tempo atual (para calcular tempo decorrido)
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Função para gerar URL do TradingView (igual à tela antiga)
  const generateTradingViewURL = (row: CoinRow) => {
    const map: Record<string, string> = {
      MEXC: "MEXC",
      BITGET: "BITGET",
      BYBIT: "BYBIT",
      BINANCE: "BINANCE",
      GATE: "GATEIO",
      GATEIO: "GATEIO",
      KUCOIN: "KUCOIN",
    };

    const base = row.coin.ticker.toUpperCase();
    const cleanSpot = row.spot.bingo.replace(/ spot| futures/i, "").trim();
    const cleanFut = row.futures.bingo.replace(/ spot| futures/i, "").trim();

    const spotSymbol = `${
      map[cleanSpot.toUpperCase()] || cleanSpot.toUpperCase()
    }:${base}USDT`;
    const futSymbol = `${
      map[cleanFut.toUpperCase()] || cleanFut.toUpperCase()
    }:${base}USDT.P`;

    const cfg = {
      height: 500,
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
  };

  // Função para formatar par de moedas para cada exchange
  const formatPairForExchange = (
    exchange: string,
    coin: string,
    isFutures: boolean
  ) => {
    const pair = `${coin}USDT`;

    if (isFutures) {
      switch (exchange) {
        case "bybit":
        case "binance":
        case "gate":
        case "bitget":
        case "kucoin":
        case "mexc":
        case "bingx":
          return pair;
        default:
          return pair;
      }
    } else {
      switch (exchange) {
        case "bybit":
        case "binance":
        case "gate":
        case "bitget":
        case "kucoin":
        case "mexc":
        case "bingx":
          return pair;
        default:
          return pair;
      }
    }
  };

  // Links para exchanges spot
  const spotLinks = {
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
      return `https://www.binance.com/en/trade/${sc}${pair}`;
    },
    gate: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(base, "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.gate.io/trade/${base}_${quote}`;
    },

    bitget: (_: string, pair: string) =>
      `https://www.bitget.com/pt/spot/${pair}`,
    kucoin: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(base, "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://trade.kucoin.com/${base}-${quote}`;
    },

    mexc: (coin: string, pair: string) => {
      // Garante que o par termina com USDT, USDC, BTC, etc.
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(base, "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.mexc.com/exchange/${base}_${quote}`;
    },
    bingx: (coin: string, pair: string) =>
      `https://bingx.com/en-us/spot/${pair}`,
    huobi: (coin: string, pair: string) => {
      const base = coin.toLowerCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toLowerCase() || "usdt";
      return `https://www.htx.com/trade/${base}_${quote}?type=spot`;
    },
  };

  // Links para exchanges futures
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
    gate: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.gate.com/pt/futures/USDT/${base}_${quote}`;
    },

    bitget: (_: string, pair: string) =>
      `https://www.bitget.com/futures/usdt/${pair}`,
    kucoin: (_: string, pair: string) =>
      `https://futures.kucoin.com/trade/${pair.replace("-", "")}M`,
    mexc: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.mexc.com/futures/${base}_${quote}?type=linear_swap`;
    },

    bingx: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://bingx.com/en/perpetual/${base}-${quote}`;
    },

    huobi: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.htx.com/futures/linear_swap/exchange#contract_code=${base}-${quote}&contract_type=swap&type=cross`;
    },
  };

  // Função para redirecionar para exchange
  const handleRedirect = (
    exchange: string,
    coin: string,
    pair: string,
    isFutures = false
  ) => {
    let normalized = exchange.toLowerCase().replace(/ spot| futures/g, "");
    if (normalized.includes("gate")) normalized = "gate";

    const links = isFutures ? futuresLinks : spotLinks;
    const formattedPair = formatPairForExchange(normalized, coin, isFutures);
    const builder = (links as any)[normalized];

    if (!builder) return;

    const url = builder(coin, formattedPair);
    const newTab = window.open(url, "_blank");

    if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
      window.location.href = url;
    }
  };

  // Função para abrir TradingView
  const handleTradingViewClick = (row: CoinRow) => {
    const url = generateTradingViewURL(row);
    setTradingViewUrl(url);
    setIsTradingViewOpen(true);
  };

  // Função para formatar tempo decorrido (igual à tabela antiga)
  const formatElapsed = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Estado para favoritos
  const [favorites, setFavorites] = React.useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("favoriteOpportunities");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Função para toggle de favorito
  const toggleFavorite = (key: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(key)) {
        newFavorites.delete(key);
      } else {
        newFavorites.add(key);
      }

      // Salvar no localStorage
      localStorage.setItem(
        "favoriteOpportunities",
        JSON.stringify([...newFavorites])
      );
      return newFavorites;
    });
  };

  // Função para verificar se é favorito
  const isFavorite = React.useCallback(
    (key: string) => favorites.has(key),
    [favorites]
  );

  // Estado para oportunidades excluídas
  const [excluded, setExcluded] = React.useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("excludedOpportunities");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Estado para modal de confirmação
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    opportunityKey: string;
    opportunityName: string;
  }>({
    isOpen: false,
    opportunityKey: "",
    opportunityName: "",
  });

  // Estado para modal de restauração
  const [restoreModal, setRestoreModal] = React.useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  // Estado para modal de configuração de colunas
  const [columnConfigModal, setColumnConfigModal] = React.useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  // Estado para agrupamento por ticker
  const [isGrouped, setIsGrouped] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("isGroupedByTicker");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Estado para grupos expandidos
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    () => {
      if (typeof window === "undefined") return new Set();
      try {
        const saved = localStorage.getItem("expandedGroups");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    }
  );

  // Estado para colunas visíveis (persistido no localStorage)
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    () => {
      if (typeof window === "undefined") return new Set();
      try {
        const saved = localStorage.getItem("visibleColumns");
        return saved
          ? new Set(JSON.parse(saved))
          : new Set([
              "moeda",
              "showCoinLogo",
              "spot",
              "futuros",
              "spreads",
              "showSpreadBackground",
              "funding",
              "tempo",
              "volumes",
              "volumes24",
              "acoes",
            ]);
      } catch {
        return new Set([
          "moeda",
          "showCoinLogo",
          "spot",
          "futuros",
          "spreads",
          "showSpreadBackground",
          "funding",
          "tempo",
          "volumes",
          "volumes24",
          "acoes",
        ]);
      }
    }
  );

  // Função para excluir oportunidade
  const excludeOpportunity = (key: string) => {
    setExcluded((prev) => {
      const newExcluded = new Set(prev);
      newExcluded.add(key);

      // Salvar no localStorage
      localStorage.setItem(
        "excludedOpportunities",
        JSON.stringify([...newExcluded])
      );
      return newExcluded;
    });

    // Fechar modal
    setDeleteModal({ isOpen: false, opportunityKey: "", opportunityName: "" });
  };

  // Função para verificar se está excluída
  const isExcluded = React.useCallback(
    (key: string) => excluded.has(key),
    [excluded]
  );

  // Função para abrir modal de confirmação
  const openDeleteModal = (key: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      opportunityKey: key,
      opportunityName: name,
    });
  };

  // Função para restaurar oportunidade
  const restoreOpportunity = (key: string) => {
    setExcluded((prev) => {
      const newExcluded = new Set(prev);
      newExcluded.delete(key);

      // Salvar no localStorage
      localStorage.setItem(
        "excludedOpportunities",
        JSON.stringify([...newExcluded])
      );
      return newExcluded;
    });
  };

  // Função para obter oportunidades excluídas com nomes
  const getExcludedOpportunities = () => {
    if (!opportunities || !opportunities.length) return [];

    return Array.from(excluded).map((key) => {
      const [ticker, spotExchange, futuresExchange] = key.split("-");
      return {
        key,
        name: `${ticker} (${spotExchange} → ${futuresExchange})`,
        ticker,
        spotExchange,
        futuresExchange,
      };
    });
  };

  // Função para toggle de coluna
  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => {
      const newVisible = new Set(prev);
      if (newVisible.has(columnId)) {
        newVisible.delete(columnId);
      } else {
        newVisible.add(columnId);
      }

      // Salvar no localStorage
      localStorage.setItem("visibleColumns", JSON.stringify([...newVisible]));
      return newVisible;
    });
  };

  // Função para verificar se coluna está visível
  const isColumnVisible = (columnId: string) => visibleColumns.has(columnId);

  // Função para verificar se elemento está visível (usando o mesmo sistema de colunas)
  const isElementVisible = (elementId: string) => visibleColumns.has(elementId);

  // Função para toggle de agrupamento
  const toggleGrouping = () => {
    setIsGrouped((prev) => {
      const newValue = !prev;
      localStorage.setItem("isGroupedByTicker", JSON.stringify(newValue));
      return newValue;
    });
  };

  // Função para toggle de expansão de grupo
  const toggleGroupExpansion = (ticker: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(ticker)) {
        newExpanded.delete(ticker);
      } else {
        newExpanded.add(ticker);
      }
      localStorage.setItem("expandedGroups", JSON.stringify([...newExpanded]));
      return newExpanded;
    });
  };

  // Configuração das colunas com labels
  const columnConfig = [
    { id: "moeda", label: "Moeda", required: false },
    { id: "showCoinLogo", label: "Mostrar Logo da Moeda", required: false },
    { id: "spot", label: "Spot", required: false },
    { id: "futuros", label: "Futuros", required: false },
    { id: "spreads", label: "Spreads", required: false },
    {
      id: "showSpreadBackground",
      label: "Mostrar Background do Spread",
      required: false,
    },
    { id: "funding", label: "Funding", required: false },
    { id: "tempo", label: "Tempo", required: false },
    { id: "volumes", label: "Volumes", required: false },
    { id: "volumes24", label: "Volumes 24H", required: false },
    { id: "acoes", label: "Ações", required: false },
  ];

  // fallback para mock quando não houver socket (dev/test)
  const rows: CoinRow[] = React.useMemo(() => {
    if (!opportunities || !opportunities.length) return [];

    const mappedRows = opportunities.map(mapOppToRow);

    // Calcular tempo decorrido e expiração do funding para cada linha
    const rowsWithTime = mappedRows.map((row) => {
      const originalOpp = opportunities.find(
        (op) =>
          op.ticker?.replace(/USDT$/i, "") === row.coin.ticker &&
          op.lowestAsk?.exchange === row.spot.bingo &&
          op.highestBid?.exchange === row.futures.bingo
      );

      let updatedRow = { ...row };

      // Calcular tempo decorrido
      if (originalOpp && (originalOpp as any).validSince) {
        updatedRow.tempo = `T: ${formatElapsed(
          now - (originalOpp as any).validSince
        )}`;
      }

      // Calcular expiração do funding
      if (originalOpp && (originalOpp as any).fundingRateExpTs) {
        const expiryTime = (originalOpp as any).fundingRateExpTs;
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry > 0) {
          // Ainda não expirou
          updatedRow.fundingExpiry = `Exp: ${formatElapsed(timeUntilExpiry)}`;
        } else {
          // Já expirou - mostrar data e hora da expiração (no horário de Brasília)
          const expiryDate = new Date(expiryTime);
          const dateStr = expiryDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            timeZone: "America/Sao_Paulo",
          });
          const timeStr = expiryDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          });
          updatedRow.fundingExpiry = `Expirou em: ${dateStr} ${timeStr}`;
        }
      }

      return updatedRow;
    });

    // Filtrar oportunidades excluídas
    const filteredRows = rowsWithTime.filter((row) => {
      const key = `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`;
      return !isExcluded(key);
    });

    // Se não estiver agrupado, retorna ordenação normal
    if (!isGrouped) {
      return filteredRows.sort((a, b) => {
        const aKey = `${a.coin.ticker}-${a.spot.bingo}-${a.futures.bingo}`;
        const bKey = `${b.coin.ticker}-${b.spot.bingo}-${b.futures.bingo}`;

        const aIsFavorite = isFavorite(aKey);
        const bIsFavorite = isFavorite(bKey);

        // Se um é favorito e outro não, o favorito vem primeiro
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;

        // Usa spread de entrada ou fechamento baseado no modo
        const aSpread = isExitMode
          ? parseFloat(a.spreads.short.replace(/[^\d.-]/g, "")) || 0
          : parseFloat(a.spreads.long.replace(/[^\d.-]/g, "")) || 0;
        const bSpread = isExitMode
          ? parseFloat(b.spreads.short.replace(/[^\d.-]/g, "")) || 0
          : parseFloat(b.spreads.long.replace(/[^\d.-]/g, "")) || 0;

        return bSpread - aSpread; // Maior spread primeiro
      });
    }

    // Se estiver agrupado, agrupa por ticker (igual à tabela antiga)
    const groups: Record<string, CoinRow[]> = {};
    filteredRows.forEach((row) => {
      if (!groups[row.coin.ticker]) groups[row.coin.ticker] = [];
      groups[row.coin.ticker]!.push(row);
    });

    // Para cada grupo, pega apenas o melhor (maior spread) ou todas se expandido
    const groupedRows = Object.entries(groups)
      .flatMap(([ticker, rows]) => {
        // Ordena por favoritos primeiro, depois por spread (entrada ou fechamento)
        const sortedRows = [...rows].sort((a, b) => {
          const aKey = `${a.coin.ticker}-${a.spot.bingo}-${a.futures.bingo}`;
          const bKey = `${b.coin.ticker}-${b.spot.bingo}-${b.futures.bingo}`;

          const aIsFavorite = isFavorite(aKey);
          const bIsFavorite = isFavorite(bKey);

          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;

          // Usa spread de entrada ou fechamento baseado no modo
          const aSpread = isExitMode
            ? parseFloat(a.spreads.short.replace(/[^\d.-]/g, "")) || 0
            : parseFloat(a.spreads.long.replace(/[^\d.-]/g, "")) || 0;
          const bSpread = isExitMode
            ? parseFloat(b.spreads.short.replace(/[^\d.-]/g, "")) || 0
            : parseFloat(b.spreads.long.replace(/[^\d.-]/g, "")) || 0;

          return bSpread - aSpread;
        });

        const isExpanded = expandedGroups.has(ticker);

        if (isExpanded) {
          // Se expandido, retorna todas as linhas do grupo
          return sortedRows.map((row, index) => ({
            ...row,
            _isGroup: rows.length > 1,
            _groupCount: rows.length,
            _isExpanded: true,
            _isFirstInGroup: index === 0,
            _isLastInGroup: index === sortedRows.length - 1,
          }));
        } else {
          // Se não expandido, retorna apenas o melhor do grupo
          const bestRow = sortedRows[0];
          if (!bestRow) return [];

          return [
            {
              ...bestRow,
              _isGroup: rows.length > 1,
              _groupCount: rows.length,
              _isExpanded: false,
              _isFirstInGroup: true,
              _isLastInGroup: true,
            },
          ];
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Agrupa novamente para ordenar corretamente por grupos
    const finalGroups: Record<string, CoinRow[]> = {};
    groupedRows.forEach((row) => {
      if (!finalGroups[row.coin.ticker]) {
        finalGroups[row.coin.ticker] = [];
      }
      finalGroups[row.coin.ticker]!.push(row);
    });

    // Ordena os grupos por favoritos e melhor spread
    const sortedGroupKeys = Object.keys(finalGroups).sort(
      (aTicker, bTicker) => {
        const aGroup = finalGroups[aTicker]!;
        const bGroup = finalGroups[bTicker]!;

        // Verifica se algum item do grupo A é favorito
        const aHasFavorite = aGroup.some((row) =>
          isFavorite(
            `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
          )
        );

        // Verifica se algum item do grupo B é favorito
        const bHasFavorite = bGroup.some((row) =>
          isFavorite(
            `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
          )
        );

        // Grupos com favoritos vêm primeiro
        if (aHasFavorite && !bHasFavorite) return -1;
        if (!aHasFavorite && bHasFavorite) return 1;

        // Se ambos ou nenhum são favoritos, ordena por melhor spread do grupo
        const aBestSpread = Math.max(
          ...aGroup.map((row) => {
            const spread = isExitMode
              ? parseFloat(row.spreads.short.replace(/[^\d.-]/g, "")) || 0
              : parseFloat(row.spreads.long.replace(/[^\d.-]/g, "")) || 0;
            return spread;
          })
        );
        const bBestSpread = Math.max(
          ...bGroup.map((row) => {
            const spread = isExitMode
              ? parseFloat(row.spreads.short.replace(/[^\d.-]/g, "")) || 0
              : parseFloat(row.spreads.long.replace(/[^\d.-]/g, "")) || 0;
            return spread;
          })
        );

        return bBestSpread - aBestSpread;
      }
    );

    // Retorna os grupos ordenados, mantendo a ordem dentro de cada grupo
    return sortedGroupKeys.flatMap((ticker) => finalGroups[ticker]!);
  }, [
    opportunities,
    isExcluded,
    isFavorite,
    isGrouped,
    expandedGroups,
    isExitMode,
    now,
  ]);

  // Calcular dados de paginação
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = rows.slice(startIndex, endIndex);

  // Ajustar página atual se ela for maior que o total de páginas disponíveis
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Definir todas as colunas possíveis
  const allColumns: Column<CoinRow>[] = [
    {
      id: "moeda",
      header: "Moeda",
      accessor: (r) => (
        <div className={styles.cellCoin}>
          {isElementVisible("showCoinLogo") && (
            <img
              src={r.coin.logo}
              alt=""
              width={32}
              height={32}
              className={styles.coinLogo}
            />
          )}
          <span className={styles.coinTicker}>{r.coin.ticker}</span>
          {/* Setinha de expansão para grupos */}
          {(r as any)._isGroup && (r as any)._groupCount > 1 && (
            <button
              className={`${styles.expandButton} ${
                (r as any)._isExpanded ? styles.expanded : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleGroupExpansion(r.coin.ticker);
              }}
              title={
                (r as any)._isExpanded
                  ? "Colapsar grupo"
                  : `Expandir grupo (${(r as any)._groupCount} operações)`
              }
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      ),
      width: "160px",
    },
    {
      id: "spot",
      header: "Spot",
      accessor: (r) => (
        <div className={styles.cellStack}>
          <div
            className={styles.bingo}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRedirect(
                r.spot.bingo,
                r.coin.ticker,
                `${r.coin.ticker}USDT`,
                false
              );
            }}
            style={{ cursor: "pointer" }}
          >
            {r.spot.bingo.replace(/spot|futures/i, "")}
            <img src="/new-page/link.svg" alt="" width={12} height={12} />
          </div>
          <div className={styles.price}>{r.spot.price}</div>
          <div className={styles.live}>{r.spot.live}</div>
        </div>
      ),
      width: "150px",
      align: "center",
    },
    {
      id: "futuros",
      header: "Futuros",
      accessor: (r) => (
        <div className={styles.cellStack}>
          <div
            className={styles.bingo}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRedirect(
                r.futures.bingo,
                r.coin.ticker,
                `${r.coin.ticker}USDT`,
                true
              );
            }}
            style={{ cursor: "pointer" }}
          >
            {r.futures.bingo.replace(/spot|futures/i, "")}
            <img src="/new-page/link.svg" alt="" width={12} height={12} />
          </div>
          <div className={styles.price}>{r.futures.price}</div>
          <div className={styles.live}>{r.futures.live}</div>
        </div>
      ),
      width: "150px",
      align: "center",
    },
    {
      id: "spreads",
      header: "Spreads",
      accessor: (r) => (
        <div className={styles.cellSplitHorizontal}>
          <span
            className={classnames(
              isExitMode ? styles.negative : styles.positive,
              styles.bold,
              isElementVisible("showSpreadBackground") &&
                classnames(
                  styles.spreadCell,
                  isExitMode ? styles.negative : styles.positive
                )
            )}
          >
            {r.spreads.long}
          </span>
          <span
            className={classnames(
              isExitMode ? styles.positive : styles.negative,
              styles.bold,
              isElementVisible("showSpreadBackground") &&
                classnames(
                  styles.spreadCell,
                  isExitMode ? styles.positive : styles.negative
                )
            )}
          >
            {r.spreads.short}
          </span>
        </div>
      ),
      width: "160px",
      align: "center",
    },
    {
      id: "funding",
      header: "Funding",
      accessor: (r) => {
        // Extrair valor numérico do funding
        const fundingValue = parseFloat(r.funding.replace(/[^\d.-]/g, "")) || 0;

        // Determinar se é positivo ou negativo
        const isPositive = fundingValue > 0;
        const isNegative = fundingValue < 0;

        // Formatar com sinal
        const sign = isPositive ? "+" : isNegative ? "" : "";
        const displayValue = `${sign}${r.funding}`;

        return (
          <div className={styles.fundingContainer}>
            <span
              className={classnames(
                styles.fundingValue,
                isPositive && styles.fundingPositive,
                isNegative && styles.fundingNegative
              )}
            >
              {displayValue}
            </span>
            {r.fundingExpiry !== "—" && (
              <div className={styles.fundingExpiry}>{r.fundingExpiry}</div>
            )}
          </div>
        );
      },
      width: "140px",
    },

    {
      id: "volumes",
      header: "Volumes",
      accessor: (r) => (
        <div className={styles.cellSplit}>
          <span className={styles.muted}>{r.volumes.s}</span>
          <span className={styles.muted}>{r.volumes.f}</span>
        </div>
      ),
      width: "120px",
    },
    {
      id: "volumes24",
      header: "Volumes 24H",
      accessor: (r) => (
        <div className={styles.cellSplit}>
          <span className={styles.muted}>{r.volumes24h.s}</span>
          <span className={styles.muted}>{r.volumes24h.f}</span>
        </div>
      ),
      width: "140px",
    },
    {
      id: "tempo",
      header: "Tempo",
      accessor: (r) => <span className={styles.chip}>{r.tempo}</span>,
      width: "150px",
    },
    {
      id: "acoes",
      header: "Ações",
      accessor: (row: CoinRow) => (
        <div className={styles.actions}>
          <button
            className={`${styles.iconBtn} ${
              isFavorite(
                `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
              )
                ? styles.favorited
                : ""
            }`}
            aria-label="Favoritar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const key = `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`;
              toggleFavorite(key);
            }}
          >
            {isFavorite(
              `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
            ) ? (
              <StarFilledIcon />
            ) : (
              <StarIcon />
            )}
          </button>
          <button
            className={styles.iconBtn}
            aria-label="Abrir Calculadora"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Buscar a oportunidade original pelos dados da linha
              const originalOpp = opportunities?.find((opp) => {
                // Remover USDT do ticker da oportunidade para comparar
                const oppTickerClean = opp.ticker?.replace(/USDT$/i, "");
                const rowTickerClean = row.coin.ticker;

                const tickerMatch = oppTickerClean === rowTickerClean;
                const spotMatch = opp.lowestAsk?.exchange === row.spot.bingo;
                const futuresMatch =
                  opp.highestBid?.exchange === row.futures.bingo;

                return tickerMatch && spotMatch && futuresMatch;
              });

              if (!originalOpp) {
                // Fallback: usar a primeira oportunidade com o mesmo ticker
                const fallbackOpp = opportunities?.find(
                  (opp) => opp.ticker?.replace(/USDT$/i, "") === row.coin.ticker
                );

                if (fallbackOpp) {
                  const params = new URLSearchParams({
                    ticker: row.coin.ticker,
                    coin: row.coin.ticker,
                    buyExchange: fallbackOpp.highestBid?.exchange ?? "",
                    buyPrice: fallbackOpp.highestBid?.price?.toString() ?? "0",
                    buyIsUSD: fallbackOpp.highestBid?.isUSD ? "true" : "false",
                    sellExchange: fallbackOpp.lowestAsk?.exchange ?? "",
                    sellPrice: fallbackOpp.lowestAsk?.price?.toString() ?? "0",
                    sellIsUSD: fallbackOpp.lowestAsk?.isUSD ? "true" : "false",
                    spread: fallbackOpp.spread?.toString() ?? "0",
                  });

                  openOpportunityPopup(params);
                  return;
                }

                return;
              }

              const params = new URLSearchParams({
                ticker: row.coin.ticker, // Sem USDT
                coin: row.coin.ticker,
                buyExchange: originalOpp.highestBid?.exchange ?? "",
                buyPrice: originalOpp.highestBid?.price?.toString() ?? "0",
                buyIsUSD: originalOpp.highestBid?.isUSD ? "true" : "false",
                sellExchange: originalOpp.lowestAsk?.exchange ?? "",
                sellPrice: originalOpp.lowestAsk?.price?.toString() ?? "0",
                sellIsUSD: originalOpp.lowestAsk?.isUSD ? "true" : "false",
                spread: originalOpp.spread?.toString() ?? "0",
              });

              openOpportunityPopup(params);
            }}
          >
            <CalculatorTableIcon />
          </button>
          <button
            className={styles.iconBtn}
            aria-label="Abrir TradingView"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTradingViewClick(row);
            }}
          >
            <TradingViewIcon />
          </button>
          <button
            className={styles.iconBtn}
            aria-label="Excluir"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const key = `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`;
              const name = `${row.coin.ticker} (${row.spot.bingo} → ${row.futures.bingo})`;
              openDeleteModal(key, name);
            }}
          >
            <TrashIcon />
          </button>
        </div>
      ),
      width: "112px",
    },
  ];

  // Filtrar colunas visíveis
  const columns = allColumns.filter((col) => isColumnVisible(col.id));

  return (
    <>
      <GlassTable<CoinRow>
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onFilterClick={onFilterClick}
        columns={columns}
        data={paginatedRows}
        rowKey={(r) => r.id}
        maxHeight={560}
        zebra
        onRowClick={(r) => console.log("click row:", r.id)}
        isSidebarOpen={isSidebarOpen}
        isGrouped={isGrouped}
        onToggleGrouping={toggleGrouping}
        isExitMode={isExitMode}
        onToggleExitMode={onToggleExitMode}
        // Adicionar botões extras na toolbar
        toolbarExtra={
          <>
            {/* Select de Velocidade de Atualização */}

            <button
              type="button"
              className={styles.iconGlass}
              aria-label="Configurar Colunas"
              onClick={() => setColumnConfigModal({ isOpen: true })}
              title="Configurar colunas visíveis"
            >
              <ConfigIcon />
            </button>
            {excluded.size > 0 && (
              <button
                type="button"
                className={styles.iconGlass}
                aria-label="Gerenciar Excluídas"
                onClick={() => setRestoreModal({ isOpen: true })}
                title={`${excluded.size} oportunidade(s) excluída(s)`}
              >
                <TrashIcon />
              </button>
            )}
            {isSocketPaused !== undefined && onToggleSocketPause && (
              <button
                type="button"
                className={`${styles.iconGlass} ${
                  isSocketPaused ? styles.paused : styles.playing
                }`}
                aria-label={isSocketPaused ? "Retomar Socket" : "Pausar Socket"}
                onClick={onToggleSocketPause}
                title={
                  isSocketPaused
                    ? "Retomar atualizações"
                    : "Pausar atualizações"
                }
              >
                {isSocketPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
            )}
            {refreshRate !== undefined && onRefreshRateChange && (
              <div className={styles.refreshRateContainer}>
                <label className={styles.refreshRateLabel}>Velocidade:</label>
                <select
                  value={refreshRate}
                  onChange={(e) => onRefreshRateChange(Number(e.target.value))}
                  className={styles.refreshRateSelect}
                >
                  <option value={500}>0.5s</option>
                  <option value={1000}>1s</option>
                  <option value={2000}>2s</option>
                  <option value={3000}>3s</option>
                  <option value={4000}>4s</option>
                  <option value={5000}>5s</option>
                </select>
              </div>
            )}
          </>
        }
      />

      {/* Paginação */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            <span>
              Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de{" "}
              {totalItems} oportunidades
            </span>
            <div className={styles.itemsPerPage}>
              <label>
                Por página:
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
          </div>

          <div className={styles.paginationControls}>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="Primeira página"
            >
              ⏮
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              title="Página anterior"
            >
              ◀
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`${styles.paginationButton} ${
                      currentPage === pageNum ? styles.active : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Próxima página"
            >
              ▶
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Última página"
            >
              ⏭
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Excluir Oportunidade</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Tem certeza que deseja excluir esta oportunidade?</p>
              <div className={styles.opportunityInfo}>
                <strong>{deleteModal.opportunityName}</strong>
              </div>
              <p className={styles.warningText}>
                Esta ação removerá a oportunidade da sua tela. Você poderá
                restaurá-la mais tarde se necessário.
              </p>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.confirmButton}
                onClick={() => excludeOpportunity(deleteModal.opportunityKey)}
              >
                Sim, excluir
              </button>
              <button
                className={styles.cancelButton}
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    opportunityKey: "",
                    opportunityName: "",
                  })
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Restauração de Oportunidades */}
      {restoreModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Oportunidades Excluídas</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Selecione as oportunidades que deseja restaurar:</p>
              <div className={styles.excludedList}>
                {getExcludedOpportunities().map((opp) => (
                  <div key={opp.key} className={styles.excludedItem}>
                    <div className={styles.excludedInfo}>
                      <strong>{opp.name}</strong>
                    </div>
                    <button
                      className={styles.restoreButton}
                      onClick={() => restoreOpportunity(opp.key)}
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setRestoreModal({ isOpen: false })}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Colunas */}
      {columnConfigModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Configurar Colunas</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Selecione quais colunas deseja exibir na tabela:</p>
              <div className={styles.columnList}>
                {columnConfig.map((col) => (
                  <div key={col.id} className={styles.columnItem}>
                    <div className={styles.columnInfo}>
                      <strong>{col.label}</strong>
                      {col.required && (
                        <span className={styles.requiredBadge}>
                          Obrigatória
                        </span>
                      )}
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={isColumnVisible(col.id)}
                        onChange={() => toggleColumn(col.id)}
                        disabled={col.required}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setColumnConfigModal({ isOpen: false })}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de TradingView */}
      {isTradingViewOpen && tradingViewUrl && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalLarge}>
            <button
              onClick={() => setIsTradingViewOpen(false)}
              className={styles.closeButton}
            >
              ✕
            </button>
            <iframe
              src={tradingViewUrl}
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
