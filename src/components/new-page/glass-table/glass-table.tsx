"use client";

import React, { useState, useEffect } from "react";
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
import MuteIcon from "../../Icons/MuteIcon";
import { useCoinLogo } from "../../../hooks/useCoinLogo";

import type { ArbitrageOpportunity } from "../../../server/router/orderbook";
import { PacmanLoader } from "react-spinners";
import PauseIcon from "../../Icons/PauseIcon";
import PlayIcon from "../../Icons/PlayIcon";
import AlertIcon from "../../Icons/AlertIcon";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Função para abrir calculadora em popup
const openCalculatorPopup = () => {
  const width = 800;
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

  const windowName = `opportunity-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const popup = window.open(
    `/oportunidade?${params.toString()}`,
    windowName,
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

type MetricsIntent = "abertura" | "fechamento";
type MetricsPeriod = "30m" | "1h" | "4h" | "12h" | "24h";
type MetricsKey = {
  symbol: string;
  spotExchange: string;
  futuresExchange: string;
};
type MetricsUpdate = {
  key: MetricsKey;
  period: MetricsPeriod;
  intent: MetricsIntent;
  maxOpenPct?: number;
  maxClosePct?: number;
  invertidas?: number;
  lastInversionMs?: number;
  lastInversionAt?: number;
  updatedAt: number;
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
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  isSidebarOpen?: boolean;
  virtualized?: boolean;

  /** ⬇️ NOVO: controle de busca + clique no filtro */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;

  /** ⬇️ NOVO: elemento extra na toolbar */
  toolbarExtra?: React.ReactNode;
  toolbarStatus?: React.ReactNode;
  filterSummary?: React.ReactNode;

  /** ⬇️ NOVO: controle de agrupamento */
  isGrouped?: boolean;
  onToggleGrouping?: () => void;

  /** ⬇️ NOVO: controle de modo de fechamento */
  isExitMode?: boolean;
  onToggleExitMode?: () => void;

  /** ⬇️ NOVO: botão customizado acima do header */
  onCustomButtonClick?: () => void;
};

type NextGainTick = {
  ticker_formatted: string;
  exchange_id: number;
  ask_price: string;
  ask_size: string;
  bid_price: string;
  bid_size: string;
  volume: string;
  timestamp: string | number;
};

type NextGainChartPoint = {
  ts: number;
  time: string;
  spot: number;
  futures: number;
  spread: number;
  spreadPct: number;
};

type NextGainTooltipProps = TooltipProps<ValueType, NameType> & {
  data: NextGainChartPoint[];
  spotLabel: string;
  futuresLabel: string;
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
const fmtNumber = (n?: number) =>
  typeof n === "number" && isFinite(n) ? String(n) : "—";

const normalizeExchangeLabel = (raw: string) => {
  const cleaned = raw
    .replace(/ spot| futures/gi, "")
    .trim()
    .toLowerCase();
  if (cleaned.includes("gate")) return "Gate";
  if (cleaned.includes("mexc")) return "MEXC";
  if (cleaned.includes("bitget")) return "Bitget";
  if (cleaned.includes("bybit")) return "Bybit";
  if (cleaned.includes("huobi") || cleaned.includes("htx")) return "Huobi";
  if (cleaned.includes("bingx")) return "Bingx";
  if (cleaned.includes("kucoin")) return "Kucoin";
  if (cleaned.includes("okx")) return "Okx";
  if (!cleaned) return raw.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const metricsKeyString = (
  key: MetricsKey,
  period: MetricsPeriod,
  intent: MetricsIntent
) =>
  `${key.symbol}:${key.spotExchange}:${key.futuresExchange}:${period}:${intent}`;

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
  fundingRateExpTs?: number;
  validSince?: number;
  volumes: { s: string; f: string };
  volumes24h: { s: string; f: string };
};

const oppKey = (op: ArbitrageOpportunity) =>
  `${op.ticker}-${op.lowestAsk?.exchange}-${op.highestBid?.exchange}`;

const useNow = () => {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return now;
};

// mapeia ArbitrageOpportunity -> CoinRow
// mapeia ArbitrageOpportunity -> CoinRow
function mapOppToRow(op: ArbitrageOpportunity, isExitMode?: boolean): CoinRow {
  const askP = op?.lowestAsk?.price ?? 0;
  const askAmt = op?.lowestAsk?.amount ?? 0;
  const bidP = op?.highestBid?.price ?? 0;
  const bidAmt = op?.highestBid?.amount ?? 0;

  const askLiq = askP * askAmt;
  const bidLiq = bidP * bidAmt;
  const spotAsk = op?.lowestAsk?.orderbook?.asks?.[0]?.price ?? askP;
  const spotBid = op?.lowestAsk?.orderbook?.bids?.[0]?.price ?? askP;
  const futBid = op?.highestBid?.orderbook?.bids?.[0]?.price ?? bidP;
  const futAsk = op?.highestBid?.orderbook?.asks?.[0]?.price ?? bidP;
  const spotPrice = isExitMode ? spotBid : spotAsk;
  const futuresPrice = isExitMode ? futAsk : futBid;

  return {
    id: `${op.ticker}-${op.lowestAsk?.exchange}-${op.highestBid?.exchange}`,
    coin: {
      ticker: op.ticker?.replace(/USDT$/i, "") || op.ticker || "—",
      logo: op.coinImage || "/default-coin.png",
    },
    spot: {
      bingo: op.lowestAsk?.exchange || "—",
      price: fmtNumber(spotPrice),
      live: askLiq ? `Liq $${askLiq.toFixed(0)}` : "—",
    },
    futures: {
      bingo: op.highestBid?.exchange || "—",
      price: fmtNumber(futuresPrice),
      live: bidLiq ? `Liq $${bidLiq.toFixed(0)}` : "—",
    },
    spreads: {
      long: `E: ${(op.spread ?? 0).toFixed(2)}%`,
      short: `S: ${(op.spreadS ?? 0).toFixed(2)}%`,
    },
    funding:
      typeof op.fundingRate === "number"
        ? `${(op.fundingRate * 100).toFixed(5)}%`
        : "—",
    fundingRateExpTs: (op as any).fundingRateExpTs,
    validSince: (op as any).validSince,
    volumes: {
      s: `S: ${formatVolume(askLiq)}`,
      f: `F: ${formatVolume(bidLiq)}`,
    },
    volumes24h: {
      s: `S: ${formatVolume(op.spotVolume24h ?? 0)}`,
      f: `F: ${formatVolume(op.futVolume24h ?? 0)}`,
    },
  };
}

function CoinCell({
  r,
  getOpp,
  showTooltip,
  hideTooltip,
  showLogo,
  isFavorited,
  onToggleFavorite,
  toggleGroupExpansion,
  styles,
}: any) {
  const logoUrl = useCoinLogo(r.coin.ticker, r.coin.ticker);

  // Busca a oportunidade original para o tooltip
  const originalOpp = getOpp ? getOpp(r.id) : null;

  const tooltipContent = originalOpp?.tokenStats ? (
    <>
      <div className={styles.tooltipHeader}>
        <Image
          src={logoUrl}
          alt=""
          width={24}
          height={24}
          className={styles.tooltipLogo}
        />
        <span className={styles.tooltipTitle}>{r.coin.ticker}</span>
      </div>
      <div className={styles.tooltipBody}>
        <div className={styles.tooltipSection}>
          <h4 className={styles.tooltipSectionTitle}>Picos de Entrada (E)</h4>
          <div className={styles.tooltipStatsGrid}>
            {["1h", "6h", "24h"].map((period) => {
              const value = originalOpp.tokenStats[`maxE${period}`];
              return (
                <div key={period} className={styles.tooltipStatItem}>
                  <span className={styles.tooltipStatLabel}>{period}</span>
                  <span
                    className={`${styles.tooltipStatValue} ${
                      value > 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {value ? `${value > 0 ? "+" : ""}${value.toFixed(4)}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.tooltipSection}>
          <h4 className={styles.tooltipSectionTitle}>Picos de Saída (S)</h4>
          <div className={styles.tooltipStatsGrid}>
            {["1h", "6h", "24h"].map((period) => {
              const value = originalOpp.tokenStats[`maxS${period}`];
              return (
                <div key={period} className={styles.tooltipStatItem}>
                  <span className={styles.tooltipStatLabel}>{period}</span>
                  <span
                    className={`${styles.tooltipStatValue} ${
                      value > 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {value ? `${value > 0 ? "+" : ""}${value.toFixed(4)}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div
      className={styles.cellCoin}
      onMouseEnter={(e) => tooltipContent && showTooltip(e, tooltipContent)}
      onMouseLeave={hideTooltip}
      onMouseMove={(e) => tooltipContent && showTooltip(e, tooltipContent)}
    >
      <button
        className={`${styles.favoriteBtn} ${
          isFavorited ? styles.favorited : ""
        }`}
        aria-label={isFavorited ? "Remover dos favoritos" : "Favoritar"}
        title={isFavorited ? "Remover dos favoritos" : "Favoritar"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.();
        }}
      >
        {isFavorited ? <StarFilledIcon /> : <StarIcon />}
      </button>

      {/* Balão de contagem no estilo EasyArb (+N) */}
      {(r as any)._isGroup && (r as any)._groupCount > 1 && (
        <button
          className={styles.groupCountBadge}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleGroupExpansion(r.coin.ticker);
          }}
          title={`Mostrar ${(r as any)._groupCount} operações`}
          aria-label={`Mostrar ${(r as any)._groupCount} operações`}
        >
          +{Math.max((r as any)._groupCount - 1, 1)}
        </button>
      )}
      {showLogo && (
        <Image
          src={logoUrl}
          alt=""
          width={32}
          height={32}
          className={styles.coinLogo}
        />
      )}
      <span className={styles.coinTicker}>{r.coin.ticker}</span>
    </div>
  );
}

const ActionCell = React.memo(
  ({
    ticker,
    spotExchange,
    futuresExchange,
    isMuted,
    onToggleMute,
    onOpenOpportunity,
    onOpenTradingView,
    onDelete,
    styles,
  }: {
    ticker: string;
    spotExchange: string;
    futuresExchange: string;
    isMuted: boolean;
    onToggleMute: (ticker: string) => void;
    onOpenOpportunity: (
      ticker: string,
      spotExchange: string,
      futuresExchange: string
    ) => void;
    onOpenTradingView: (
      ticker: string,
      spotExchange: string,
      futuresExchange: string
    ) => void;
    onDelete: (key: string, name: string) => void;
    styles: any;
  }) => {
    const key = `${ticker}-${spotExchange}-${futuresExchange}`;
    const name = `${ticker} (${spotExchange} → ${futuresExchange})`;

    return (
      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          aria-label="Ver gráfico"
          title="Ver gráfico"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenTradingView(ticker, spotExchange, futuresExchange);
          }}
        >
          <TradingViewIcon />
        </button>
        <button
          className={styles.iconBtn}
          aria-label="Abrir Calculadora"
          title="Abrir calculadora da oportunidade"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenOpportunity(ticker, spotExchange, futuresExchange);
          }}
        >
          <CalculatorTableIcon />
        </button>
        <button
          className={`${styles.iconBtn} ${isMuted ? styles.mutedAction : ""}`}
          aria-label={isMuted ? "Reativar moeda" : "Silenciar moeda"}
          title={isMuted ? "Reativar moeda" : "Silenciar moeda"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleMute(ticker);
          }}
        >
          <MuteIcon />
        </button>
        <button
          className={styles.iconBtn}
          aria-label="Excluir"
          title="Excluir oportunidade"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(key, name);
          }}
        >
          <TrashIcon />
        </button>
      </div>
    );
  },
  (prev, next) =>
    prev.ticker === next.ticker &&
    prev.spotExchange === next.spotExchange &&
    prev.futuresExchange === next.futuresExchange &&
    prev.isMuted === next.isMuted
);

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
  emptyState,
  isLoading = false,
  className,
  isSidebarOpen,
  virtualized = false,
  toolbarExtra,
  toolbarStatus,
  filterSummary,
  isGrouped = false,
  onToggleGrouping,
  isExitMode = false,
  onToggleExitMode,
  onCustomButtonClick,
}: GlassTableProps<T>) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const rowHeight = dense ? 60 : 86;
  const overscan = 6;
  const useVirtual = virtualized && data.length > 0;
  const styleVars: React.CSSProperties = {
    ["--gt-row-h" as any]: `${rowHeight}px`,
    ...(maxHeight
      ? {
          ["--gt-max-h" as any]:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }
      : {}),
  };

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setScrollTop(el.scrollTop);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    setViewportHeight(el.clientHeight);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        setViewportHeight(el.clientHeight);
      });
      ro.observe(el);
    } else {
      const onResize = () => setViewportHeight(el.clientHeight);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        el.removeEventListener("scroll", onScroll);
        if (raf) window.cancelAnimationFrame(raf);
      };
    }

    return () => {
      if (ro) ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const virtualWindow = React.useMemo(() => {
    if (!useVirtual || viewportHeight <= 0) {
      return {
        startIndex: 0,
        endIndex: data.length,
        items: data,
        topPad: 0,
        bottomPad: 0,
      };
    }

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - overscan
    );
    const endIndex = Math.min(
      data.length,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
    );
    const topPad = startIndex * rowHeight;
    const bottomPad = Math.max(0, (data.length - endIndex) * rowHeight);

    return {
      startIndex,
      endIndex,
      items: data.slice(startIndex, endIndex),
      topPad,
      bottomPad,
    };
  }, [useVirtual, viewportHeight, scrollTop, rowHeight, overscan, data]);

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
      <div className={styles.scroller} ref={scrollerRef}>
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
                  {isLoading ? (
                    <div className={styles.loaderWrapper}>
                      <PacmanLoader color="#7B61FF" size={40} />
                    </div>
                  ) : emptyState ? (
                    <div className={styles.emptyState}>{emptyState}</div>
                  ) : (
                    <div className={styles.emptyMessage}>{emptyMessage}</div>
                  )}
                </td>
              </tr>
            ) : (
              <>
                {virtualWindow.topPad > 0 && (
                  <tr className={styles.virtualSpacer}>
                    <td
                      colSpan={columns.length}
                      style={{ height: virtualWindow.topPad }}
                    />
                  </tr>
                )}
                {virtualWindow.items.map((row, i) => {
                  const actualIndex = virtualWindow.startIndex + i;
                  const key = rowKey ? rowKey(row, actualIndex) : actualIndex;
                  const clickable = Boolean(onRowClick);
                  const zebraRow =
                    zebra && actualIndex % 2 === 0
                      ? styles.zebraRow
                      : undefined;
                  return (
                    <tr
                      key={key}
                      className={classnames(
                        styles.row,
                        zebraRow,
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
                          ? col.accessor(row, actualIndex)
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
                })}
                {virtualWindow.bottomPad > 0 && (
                  <tr className={styles.virtualSpacer}>
                    <td
                      colSpan={columns.length}
                      style={{ height: virtualWindow.bottomPad }}
                    />
                  </tr>
                )}
              </>
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
          <span className={styles.searchIconWrapper}>
            <Image
              src="/new-page/search-icon.svg"
              alt=""
              width={16}
              height={16}
              className={styles.searchIcon}
            />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filtrar por símbolo"
            aria-label="Filtrar por símbolo"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </label>

        {filterSummary && (
          <div className={styles.filterSummary}>{filterSummary}</div>
        )}

        <div className={styles.toolbarRight}>
          {toolbarStatus && (
            <div className={styles.toolbarStatus}>{toolbarStatus}</div>
          )}
          {onCustomButtonClick && (
            <button
              type="button"
              className={styles.iconGlass}
              aria-label={"Alertas"}
              onClick={onCustomButtonClick}
              title={"Alertas"}
            >
              {<AlertIcon />}
            </button>
          )}
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
            title="Abrir filtros"
          >
            <FilterIcon />
          </button>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Calculadora"
            onClick={openCalculatorPopup}
            title="Abrir calculadora"
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
  isConnected,
  isLoading,
  activeFilters,
  onClearFilters,
  dollarPrice,
  onCustomButtonClick,
  customButtonLabel,
  metricsByKey,
  metricsPeriod: metricsPeriodProp,
  metricsIntent,
  onMetricsPeriodChange,
  customButtonIcon,
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
  isConnected?: boolean;
  isLoading?: boolean;
  activeFilters?: string[];
  onClearFilters?: () => void;
  dollarPrice?: number;
  onCustomButtonClick?: () => void;
  customButtonLabel?: string;
  metricsByKey?: Record<string, MetricsUpdate>;
  metricsPeriod?: MetricsPeriod;
  metricsIntent?: MetricsIntent;
  onMetricsPeriodChange?: (period: MetricsPeriod) => void;
  customButtonIcon?: React.ReactNode;
}) {
  const [filter, setFilter] = React.useState("");

  // Estado para modal de TradingView
  const [isTradingViewOpen, setIsTradingViewOpen] = React.useState(false);
  const [tradingViewUrl, setTradingViewUrl] = React.useState<string | null>(
    null
  );
  const [chartProvider, setChartProvider] = React.useState<
    "tradingview" | "nextgain"
  >("tradingview");
  const [chartTicker, setChartTicker] = React.useState<string | null>(null);
  const [chartSpotExchange, setChartSpotExchange] = React.useState<
    string | null
  >(null);
  const [chartFuturesExchange, setChartFuturesExchange] = React.useState<
    string | null
  >(null);
  const [nextGainSpotTicks, setNextGainSpotTicks] = React.useState<
    NextGainTick[]
  >([]);
  const [nextGainFuturesTicks, setNextGainFuturesTicks] = React.useState<
    NextGainTick[]
  >([]);
  const [nextGainLoading, setNextGainLoading] = React.useState(false);
  const [nextGainError, setNextGainError] = React.useState<string | null>(null);
  const [crossIntent, setCrossIntent] = React.useState<
    "abertura" | "fechamento"
  >("abertura");
  const nextGainChartRef = React.useRef<HTMLDivElement | null>(null);
  const [nextGainXDomain, setNextGainXDomain] = React.useState<
    [number, number] | null
  >(null);
  const [nextGainYDomain, setNextGainYDomain] = React.useState<
    [number, number] | null
  >(null);
  const panStateRef = React.useRef<{
    startX: number;
    startY: number;
    xDomain: [number, number];
    yDomain: [number, number];
  } | null>(null);
  const [chartPeriod, setChartPeriod] = React.useState<MetricsPeriod>(
    metricsPeriodProp ?? "4h"
  );
  React.useEffect(() => {
    if (metricsPeriodProp && metricsPeriodProp !== chartPeriod) {
      setChartPeriod(metricsPeriodProp);
    }
  }, [metricsPeriodProp, chartPeriod]);
  const selectedMetricsPeriod = metricsPeriodProp ?? chartPeriod;
  const selectedMetricsIntent = metricsIntent ?? "abertura";
  const [isDenseMode, setIsDenseMode] = React.useState(true);
  const embedVolumeInMarketColumns = isDenseMode;
  const handleMetricsPeriodChange = (value: MetricsPeriod) => {
    if (onMetricsPeriodChange) {
      onMetricsPeriodChange(value);
    } else {
      setChartPeriod(value);
    }
  };

  // Estados para paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(40);

  // Estado para tooltip
  const [tooltip, setTooltip] = React.useState<{
    isVisible: boolean;
    content: React.ReactNode;
    x: number;
    y: number;
  }>({
    isVisible: false,
    content: null,
    x: 0,
    y: 0,
  });

  const now = useNow();
  const oppMap = React.useMemo(() => {
    if (!opportunities?.length) return new Map<string, ArbitrageOpportunity>();
    return new Map(opportunities.map((op) => [oppKey(op), op] as const));
  }, [opportunities]);

  const getOpp = React.useCallback((id: string) => oppMap.get(id), [oppMap]);
  const oppsRef = React.useRef<ArbitrageOpportunity[]>([]);

  React.useEffect(() => {
    oppsRef.current = opportunities ?? [];
  }, [opportunities]);

  // Função para gerar URL do TradingView (igual à tela antiga)
  const generateTradingViewURL = (
    ticker: string,
    spotExchange: string,
    futuresExchange: string
  ) => {
    const map: Record<string, string> = {
      MEXC: "MEXC",
      BITGET: "BITGET",
      BYBIT: "BYBIT",
      BINANCE: "BINANCE",
      GATE: "GATEIO",
      GATEIO: "GATEIO",
      KUCOIN: "KUCOIN",
      OKX: "OKX",
    };

    const base = ticker.toUpperCase();
    const cleanSpot = spotExchange.replace(/ spot| futures/i, "").trim();
    const cleanFut = futuresExchange.replace(/ spot| futures/i, "").trim();

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

  const normalizeExchangeName = React.useCallback((raw?: string | null) => {
    if (!raw) return null;
    const cleaned = raw
      .replace(/ spot| futures/gi, "")
      .trim()
      .toLowerCase();
    if (cleaned.includes("gate")) return "Gate";
    if (cleaned.includes("mexc")) return "MEXC";
    if (cleaned.includes("bitget")) return "Bitget";
    if (cleaned.includes("bybit")) return "Bybit";
    if (cleaned.includes("huobi") || cleaned.includes("htx")) return "Huobi";
    if (cleaned.includes("bingx")) return "Bingx";
    if (cleaned.includes("kucoin")) return "Kucoin";
    if (cleaned.includes("okx")) return "Okx";
    return cleaned ? cleaned[0]!.toUpperCase() + cleaned.slice(1) : null;
  }, []);

  React.useEffect(() => {
    if (chartProvider !== "nextgain") return;
    const symbol = chartTicker ? `${chartTicker}USDT` : null;
    const spot = normalizeExchangeName(chartSpotExchange);
    const futures = normalizeExchangeName(chartFuturesExchange);

    if (!symbol || !spot || !futures) {
      setNextGainSpotTicks([]);
      setNextGainFuturesTicks([]);
      return;
    }

    const controller = new AbortController();
    setNextGainLoading(true);
    setNextGainError(null);

    const spotUrl = `/api/spread-history?symbol=${encodeURIComponent(
      symbol
    )}&spot=${encodeURIComponent(spot)}`;
    const futuresUrl = `/api/spread-history?symbol=${encodeURIComponent(
      symbol
    )}&futures=${encodeURIComponent(futures)}`;

    const parsePayload = async (res: Response) => {
      const data = await res.json();
      if (Array.isArray(data)) return data as NextGainTick[];
      if (Array.isArray(data?.data)) return data.data as NextGainTick[];
      return [];
    };

    Promise.all([
      fetch(spotUrl, { signal: controller.signal }).then(parsePayload),
      fetch(futuresUrl, { signal: controller.signal }).then(parsePayload),
    ])
      .then(([spotTicks, futuresTicks]) => {
        setNextGainSpotTicks(spotTicks);
        setNextGainFuturesTicks(futuresTicks);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setNextGainError("Falha ao carregar dados da NextGain.");
        setNextGainSpotTicks([]);
        setNextGainFuturesTicks([]);
      })
      .finally(() => setNextGainLoading(false));

    return () => controller.abort();
  }, [
    chartProvider,
    chartTicker,
    chartSpotExchange,
    chartFuturesExchange,
    normalizeExchangeName,
  ]);

  const nextGainData = React.useMemo<NextGainChartPoint[]>(() => {
    const list = nextGainSpotTicks || [];
    const list2 = nextGainFuturesTicks || [];
    const normalizedTicker = chartTicker
      ? `${chartTicker}USDT`.toUpperCase()
      : null;
    const filtered = normalizedTicker
      ? list.filter(
          (row) => row.ticker_formatted?.toUpperCase() === normalizedTicker
        )
      : list;
    const filtered2 = normalizedTicker
      ? list2.filter(
          (row) => row.ticker_formatted?.toUpperCase() === normalizedTicker
        )
      : list2;

    const normalizeTs = (raw: string | number) => {
      const tsNum = Number(raw);
      if (!Number.isFinite(tsNum)) return NaN;
      // API pode vir em ms ou s; acima de 1e12 tratamos como ms.
      return tsNum > 1e12 ? tsNum : tsNum * 1000;
    };

    const spotSeries = filtered
      .map((row) => {
        const ts = normalizeTs(row.timestamp);
        const price =
          crossIntent === "fechamento"
            ? Number(row.ask_price)
            : Number(row.bid_price);
        return {
          ts,
          price,
        };
      })
      .filter((row) => Number.isFinite(row.ts) && Number.isFinite(row.price))
      .sort((a, b) => a.ts - b.ts);

    const futuresSeries = filtered2
      .map((row) => {
        const ts = normalizeTs(row.timestamp);
        const price =
          crossIntent === "fechamento"
            ? Number(row.bid_price)
            : Number(row.ask_price);
        return {
          ts,
          price,
        };
      })
      .filter((row) => Number.isFinite(row.ts) && Number.isFinite(row.price))
      .sort((a, b) => a.ts - b.ts);

    const timestamps = new Set<number>();
    spotSeries.forEach((row) => timestamps.add(row.ts));
    futuresSeries.forEach((row) => timestamps.add(row.ts));
    const mergedTs = Array.from(timestamps).sort((a, b) => a - b);

    let spotIndex = 0;
    let futuresIndex = 0;
    let lastSpot = NaN;
    let lastFutures = NaN;
    const merged: NextGainChartPoint[] = [];

    mergedTs.forEach((ts) => {
      while (spotIndex < spotSeries.length && spotSeries[spotIndex]!.ts <= ts) {
        lastSpot = spotSeries[spotIndex]!.price;
        spotIndex += 1;
      }
      while (
        futuresIndex < futuresSeries.length &&
        futuresSeries[futuresIndex]!.ts <= ts
      ) {
        lastFutures = futuresSeries[futuresIndex]!.price;
        futuresIndex += 1;
      }

      if (!Number.isFinite(lastSpot) || !Number.isFinite(lastFutures)) return;
      const spread =
        crossIntent === "fechamento"
          ? lastSpot - lastFutures
          : lastFutures - lastSpot;
      const spreadPct = lastSpot ? (spread / lastSpot) * 100 : NaN;
      merged.push({
        ts,
        time: new Date(ts).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/Sao_Paulo",
        }),
        spot: lastSpot,
        futures: lastFutures,
        spread,
        spreadPct,
      });
    });

    return merged;
  }, [chartTicker, nextGainSpotTicks, nextGainFuturesTicks, crossIntent]);

  const periodMs = React.useMemo(() => {
    switch (selectedMetricsPeriod) {
      case "1h":
        return 60 * 60 * 1000;
      case "30m":
        return 30 * 60 * 1000;
      case "12h":
        return 12 * 60 * 60 * 1000;
      case "24h":
        return 24 * 60 * 60 * 1000;
      case "4h":
      default:
        return 4 * 60 * 60 * 1000;
    }
  }, [selectedMetricsPeriod]);

  const nextGainWindowData = React.useMemo(() => {
    if (!nextGainData.length) return [];
    const nowTs = Date.now();
    const minTs = nowTs - periodMs;
    return nextGainData.filter((row) => row.ts >= minTs && row.ts <= nowTs);
  }, [nextGainData, periodMs]);

  const nextGainMaxSpreads = React.useMemo(() => {
    const list = nextGainSpotTicks || [];
    const list2 = nextGainFuturesTicks || [];
    const normalizedTicker = chartTicker
      ? `${chartTicker}USDT`.toUpperCase()
      : null;
    const filteredSpot = normalizedTicker
      ? list.filter(
          (row) => row.ticker_formatted?.toUpperCase() === normalizedTicker
        )
      : list;
    const filteredFutures = normalizedTicker
      ? list2.filter(
          (row) => row.ticker_formatted?.toUpperCase() === normalizedTicker
        )
      : list2;

    const normalizeTs = (raw: string | number) => {
      const tsNum = Number(raw);
      if (!Number.isFinite(tsNum)) return NaN;
      return tsNum > 1e12 ? tsNum : tsNum * 1000;
    };

    const spotBidSeries = filteredSpot
      .map((row) => ({
        ts: normalizeTs(row.timestamp),
        price: Number(row.bid_price),
      }))
      .filter((row) => Number.isFinite(row.ts) && Number.isFinite(row.price))
      .sort((a, b) => a.ts - b.ts);
    const spotAskSeries = filteredSpot
      .map((row) => ({
        ts: normalizeTs(row.timestamp),
        price: Number(row.ask_price),
      }))
      .filter((row) => Number.isFinite(row.ts) && Number.isFinite(row.price))
      .sort((a, b) => a.ts - b.ts);

    const futuresBidSeries = filteredFutures
      .map((row) => ({
        ts: normalizeTs(row.timestamp),
        price: Number(row.bid_price),
      }))
      .filter((row) => Number.isFinite(row.ts) && Number.isFinite(row.price))
      .sort((a, b) => a.ts - b.ts);
    const futuresAskSeries = filteredFutures
      .map((row) => ({
        ts: normalizeTs(row.timestamp),
        price: Number(row.ask_price),
      }))
      .filter((row) => Number.isFinite(row.ts) && Number.isFinite(row.price))
      .sort((a, b) => a.ts - b.ts);

    const timestamps = new Set<number>();
    spotBidSeries.forEach((row) => timestamps.add(row.ts));
    spotAskSeries.forEach((row) => timestamps.add(row.ts));
    futuresBidSeries.forEach((row) => timestamps.add(row.ts));
    futuresAskSeries.forEach((row) => timestamps.add(row.ts));
    const mergedTs = Array.from(timestamps).sort((a, b) => a - b);

    if (!mergedTs.length) {
      return { maxOpenPct: NaN, maxClosePct: NaN };
    }

    const maxTs = mergedTs[mergedTs.length - 1]!;
    const minTs = maxTs - periodMs;

    let spotBidIdx = 0;
    let spotAskIdx = 0;
    let futBidIdx = 0;
    let futAskIdx = 0;
    let lastSpotBid = NaN;
    let lastSpotAsk = NaN;
    let lastFutBid = NaN;
    let lastFutAsk = NaN;
    let maxOpenPct = -Infinity;
    let maxClosePct = -Infinity;

    mergedTs.forEach((ts) => {
      if (ts < minTs) {
        while (
          spotBidIdx < spotBidSeries.length &&
          spotBidSeries[spotBidIdx]!.ts <= ts
        ) {
          lastSpotBid = spotBidSeries[spotBidIdx]!.price;
          spotBidIdx += 1;
        }
        while (
          spotAskIdx < spotAskSeries.length &&
          spotAskSeries[spotAskIdx]!.ts <= ts
        ) {
          lastSpotAsk = spotAskSeries[spotAskIdx]!.price;
          spotAskIdx += 1;
        }
        while (
          futBidIdx < futuresBidSeries.length &&
          futuresBidSeries[futBidIdx]!.ts <= ts
        ) {
          lastFutBid = futuresBidSeries[futBidIdx]!.price;
          futBidIdx += 1;
        }
        while (
          futAskIdx < futuresAskSeries.length &&
          futuresAskSeries[futAskIdx]!.ts <= ts
        ) {
          lastFutAsk = futuresAskSeries[futAskIdx]!.price;
          futAskIdx += 1;
        }
        return;
      }

      while (
        spotBidIdx < spotBidSeries.length &&
        spotBidSeries[spotBidIdx]!.ts <= ts
      ) {
        lastSpotBid = spotBidSeries[spotBidIdx]!.price;
        spotBidIdx += 1;
      }
      while (
        spotAskIdx < spotAskSeries.length &&
        spotAskSeries[spotAskIdx]!.ts <= ts
      ) {
        lastSpotAsk = spotAskSeries[spotAskIdx]!.price;
        spotAskIdx += 1;
      }
      while (
        futBidIdx < futuresBidSeries.length &&
        futuresBidSeries[futBidIdx]!.ts <= ts
      ) {
        lastFutBid = futuresBidSeries[futBidIdx]!.price;
        futBidIdx += 1;
      }
      while (
        futAskIdx < futuresAskSeries.length &&
        futuresAskSeries[futAskIdx]!.ts <= ts
      ) {
        lastFutAsk = futuresAskSeries[futAskIdx]!.price;
        futAskIdx += 1;
      }

      if (Number.isFinite(lastSpotBid) && Number.isFinite(lastFutAsk)) {
        const spreadOpen = lastFutAsk - lastSpotBid;
        const pctOpen = lastSpotBid ? (spreadOpen / lastSpotBid) * 100 : NaN;
        if (Number.isFinite(pctOpen)) {
          maxOpenPct = Math.max(maxOpenPct, pctOpen);
        }
      }
      if (Number.isFinite(lastSpotAsk) && Number.isFinite(lastFutBid)) {
        const spreadClose = lastSpotAsk - lastFutBid;
        const pctClose = lastSpotAsk ? (spreadClose / lastSpotAsk) * 100 : NaN;
        if (Number.isFinite(pctClose)) {
          maxClosePct = Math.max(maxClosePct, pctClose);
        }
      }
    });

    return {
      maxOpenPct: Number.isFinite(maxOpenPct) ? maxOpenPct : NaN,
      maxClosePct: Number.isFinite(maxClosePct) ? maxClosePct : NaN,
    };
  }, [chartTicker, nextGainSpotTicks, nextGainFuturesTicks, periodMs]);

  const nextGainInvertidasCount = React.useMemo(() => {
    if (!nextGainWindowData.length) return 0;
    let count = 0;
    let prevSign: number | null = null;
    nextGainWindowData.forEach((row) => {
      if (!Number.isFinite(row.spot) || !Number.isFinite(row.futures)) return;
      const diff = row.spot - row.futures;
      if (diff === 0) return;
      const sign = diff > 0 ? 1 : -1;
      if (prevSign === null) {
        prevSign = sign;
        return;
      }
      if (sign !== prevSign) {
        count += 1;
        prevSign = sign;
      }
    });
    return count;
  }, [nextGainWindowData]);
  const nextGainExtents = React.useMemo(() => {
    if (!nextGainWindowData.length) {
      return {
        minTs: 0,
        maxTs: 0,
        minY: 0,
        maxY: 0,
      };
    }
    let minTs = nextGainWindowData[0]!.ts;
    let maxTs = nextGainWindowData[nextGainWindowData.length - 1]!.ts;
    let minY = Infinity;
    let maxY = -Infinity;
    nextGainWindowData.forEach((row) => {
      if (row.ts < minTs) minTs = row.ts;
      if (row.ts > maxTs) maxTs = row.ts;
      if (Number.isFinite(row.spot)) {
        minY = Math.min(minY, row.spot);
        maxY = Math.max(maxY, row.spot);
      }
      if (Number.isFinite(row.futures)) {
        minY = Math.min(minY, row.futures);
        maxY = Math.max(maxY, row.futures);
      }
    });
    return { minTs, maxTs, minY, maxY };
  }, [nextGainWindowData]);

  const nextGainZoomBounds = React.useMemo(() => {
    const maxTs = Date.now();
    const minByPeriod = maxTs - periodMs;
    return {
      minTs: minByPeriod,
      maxTs,
    };
  }, [periodMs]);

  React.useEffect(() => {
    if (!nextGainWindowData.length) {
      setNextGainXDomain(null);
      setNextGainYDomain(null);
      return;
    }
    if (!nextGainXDomain || !nextGainYDomain) {
      setNextGainXDomain([nextGainZoomBounds.minTs, nextGainZoomBounds.maxTs]);
      setNextGainYDomain([nextGainExtents.minY, nextGainExtents.maxY]);
    }
  }, [
    nextGainWindowData,
    nextGainZoomBounds.minTs,
    nextGainZoomBounds.maxTs,
    nextGainExtents.minY,
    nextGainExtents.maxY,
    nextGainXDomain,
    nextGainYDomain,
  ]);

  // Resetar zoom quando muda contexto do gráfico/filtro.
  React.useEffect(() => {
    setNextGainXDomain(null);
    setNextGainYDomain(null);
  }, [
    chartTicker,
    chartSpotExchange,
    chartFuturesExchange,
    selectedMetricsPeriod,
    crossIntent,
  ]);

  const resetNextGainZoom = React.useCallback(() => {
    if (!nextGainWindowData.length) return;
    setNextGainXDomain([nextGainZoomBounds.minTs, nextGainZoomBounds.maxTs]);
    setNextGainYDomain([nextGainExtents.minY, nextGainExtents.maxY]);
  }, [
    nextGainWindowData.length,
    nextGainZoomBounds.minTs,
    nextGainZoomBounds.maxTs,
    nextGainExtents.minY,
    nextGainExtents.maxY,
  ]);

  const nextGainLast = React.useMemo(() => {
    if (!nextGainWindowData.length) return null;
    return nextGainWindowData[nextGainWindowData.length - 1];
  }, [nextGainWindowData]);

  const nextGainStats = React.useMemo(() => {
    if (!nextGainWindowData.length) {
      return {
        maxSpreadPct: NaN,
        avgTop10SpreadPct: NaN,
        avgSpreadPct: NaN,
      };
    }
    const spreads = nextGainWindowData
      .map((row) => row.spreadPct)
      .filter((value) => Number.isFinite(value)) as number[];
    if (!spreads.length) {
      return {
        maxSpreadPct: NaN,
        avgTop10SpreadPct: NaN,
        avgSpreadPct: NaN,
      };
    }
    const maxSpreadPct = Math.max(...spreads);
    const avgSpreadPct =
      spreads.reduce((sum, value) => sum + value, 0) / spreads.length;
    const top10 = [...spreads].sort((a, b) => b - a).slice(0, 10);
    const avgTop10SpreadPct =
      top10.reduce((sum, value) => sum + value, 0) / top10.length;

    return {
      maxSpreadPct,
      avgTop10SpreadPct,
      avgSpreadPct,
    };
  }, [nextGainWindowData]);

  const nextGainPeakTs = React.useMemo(() => {
    if (!nextGainWindowData.length) return new Set<number>();
    const sorted = [...nextGainWindowData]
      .filter((row) => Number.isFinite(row.spreadPct))
      .sort((a, b) => b.spreadPct - a.spreadPct)
      .slice(0, 10)
      .map((row) => row.ts);
    return new Set(sorted);
  }, [nextGainWindowData]);

  const spotLabel = React.useMemo(() => {
    return chartSpotExchange
      ? chartSpotExchange.replace(/ spot| futures/gi, "").trim()
      : "Spot";
  }, [chartSpotExchange]);

  const futuresLabel = React.useMemo(() => {
    return chartFuturesExchange
      ? chartFuturesExchange.replace(/ spot| futures/gi, "").trim()
      : "Futures";
  }, [chartFuturesExchange]);

  const formatTimeLabel = React.useCallback((value: number | string) => {
    const ts = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(ts)) return String(value);
    return new Date(ts).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const NextGainTooltip = React.useCallback(
    ({
      active,
      payload,
      label,
      data,
      spotLabel,
      futuresLabel,
    }: NextGainTooltipProps) => {
      if (!active || !payload?.length) return null;
      const point = payload[0]?.payload;
      if (!point) return null;
      const index = data.findIndex((row) => row.ts === point.ts);
      const tail = index >= 0 ? data.slice(index) : [];
      const avgTail =
        tail.length > 0
          ? tail.reduce((sum, row) => sum + row.spreadPct, 0) / tail.length
          : NaN;
      const endTime = data.length
        ? formatTimeLabel(data[data.length - 1]!.ts)
        : "";
      const labelTime = label ? formatTimeLabel(label) : "";

      return (
        <div className={styles.nextGainTooltip}>
          <div className={styles.tooltipTime}>{labelTime}</div>
          <div className={styles.tooltipLine}>
            <span className={styles.tooltipSwatch} data-legend="spot" />
            {spotLabel}: {point.spot.toFixed(10)}
          </div>
          <div className={styles.tooltipLine}>
            <span className={styles.tooltipSwatch} data-legend="futures" />
            {futuresLabel} Futures: {point.futures.toFixed(10)}
          </div>
          <div className={styles.tooltipLine}>
            Spread: {point.spreadPct.toFixed(2)}%
          </div>
          <div className={styles.tooltipLine}>
            Spread Medio {labelTime} - {endTime}:{" "}
            {Number.isFinite(avgTail) ? `${avgTail.toFixed(2)}%` : "—"}
          </div>
        </div>
      );
    },
    [formatTimeLabel]
  );

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
        case "okx":
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
        case "okx":
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
    okx: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.okx.com/trade-spot/${base}-${quote}`;
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
    okx: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.okx.com/trade-swap/${base}-${quote}-SWAP`;
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
  const handleTradingViewClick = React.useCallback(
    (ticker: string, spotExchange: string, futuresExchange: string) => {
      const url = generateTradingViewURL(ticker, spotExchange, futuresExchange);
      setTradingViewUrl(url);
      setChartTicker(ticker);
      setChartSpotExchange(spotExchange);
      setChartFuturesExchange(futuresExchange);
      setChartProvider("tradingview");
      setIsTradingViewOpen(true);
    },
    []
  );

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

  const formatElapsedHms = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const FundingExpiry = ({ expiryTime }: { expiryTime?: number }) => {
    const now = useNow();

    if (!expiryTime) return null;

    const timeUntilExpiry = expiryTime - now;

    if (timeUntilExpiry > 0) {
      return (
        <div className={styles.fundingExpiry}>
          {`Exp: ${formatElapsed(timeUntilExpiry)}`}
        </div>
      );
    }

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

    return (
      <div className={styles.fundingExpiry}>
        {`Expirou em: ${dateStr} ${timeStr}`}
      </div>
    );
  };

  const TempoCell = ({ validSince }: { validSince?: number }) => {
    const now = useNow();

    if (!validSince) return <span className={styles.chip}>—</span>;

    const elapsedMs = now - validSince;
    const isFresh = elapsedMs < 60 * 1000;

    return (
      <span
        className={`${styles.chip} ${isFresh ? styles.chipFresh : ""}`}
        title="Duração da oportunidade"
      >
        <span className={styles.chipIcon} aria-hidden="true">
          <svg viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M10 6v4l3 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {formatElapsedHms(elapsedMs)}
      </span>
    );
  };

  // Funções para controlar tooltip
  const showTooltip = (event: React.MouseEvent, content: React.ReactNode) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      isVisible: true,
      content,
      x: rect.right + 8, // Posição à direita
      y: rect.top + rect.height / 2, // Centralizado verticalmente
    });
  };

  const hideTooltip = () => {
    setTooltip({
      isVisible: false,
      content: null,
      x: 0,
      y: 0,
    });
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
  const toggleFavorite = React.useCallback((key: string) => {
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
  }, []);

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

  // Estado para moedas silenciadas
  const [mutedTickers, setMutedTickers] = React.useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("mutedTickers");
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

  const [mutedModal, setMutedModal] = React.useState<{
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
  ActionCell.displayName = "ActionCell";

  const alwaysVisibleColumns = ["moeda", "spot", "futuros", "spreads"];
  const ensureAlwaysVisibleColumns = (columns: Set<string>) => {
    const next = new Set(columns);
    for (const id of alwaysVisibleColumns) next.add(id);
    return next;
  };

  // Estado para colunas visíveis (persistido no localStorage)
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    () => {
      if (typeof window === "undefined") return new Set();
      try {
        const saved = localStorage.getItem("visibleColumns");
        return saved
          ? ensureAlwaysVisibleColumns(new Set(JSON.parse(saved)))
          : ensureAlwaysVisibleColumns(
              new Set([
                "moeda",
                "showCoinLogo",
                "spot",
                "futuros",
                "spreads",
                "showSpreadBackground",
                "funding",
                "tempo",
                "historico",
                "acoes",
              ])
            );
      } catch {
        return ensureAlwaysVisibleColumns(
          new Set([
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
            "historico",
            "acoes",
          ])
        );
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

  const isMuted = React.useCallback(
    (ticker: string) => mutedTickers.has(ticker),
    [mutedTickers]
  );

  const toggleMuteTicker = React.useCallback((ticker: string) => {
    setMutedTickers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
      } else {
        next.add(ticker);
      }
      localStorage.setItem("mutedTickers", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const getMutedTickers = React.useCallback(
    () => Array.from(mutedTickers).sort(),
    [mutedTickers]
  );

  // Função para abrir modal de confirmação
  const openDeleteModal = React.useCallback((key: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      opportunityKey: key,
      opportunityName: name,
    });
  }, []);

  const handleOpenOpportunity = React.useCallback(
    (ticker: string, spotExchange: string, futuresExchange: string) => {
      const list = oppsRef.current;

      const originalOpp = list.find((opp) => {
        const oppTickerClean = opp.ticker?.replace(/USDT$/i, "");
        const tickerMatch = oppTickerClean === ticker;
        const spotMatch = opp.lowestAsk?.exchange === spotExchange;
        const futuresMatch = opp.highestBid?.exchange === futuresExchange;
        return tickerMatch && spotMatch && futuresMatch;
      });

      if (!originalOpp) {
        const fallbackOpp = list.find(
          (opp) => opp.ticker?.replace(/USDT$/i, "") === ticker
        );

        if (fallbackOpp) {
          const params = new URLSearchParams({
            ticker,
            coin: ticker,
            buyExchange: fallbackOpp.highestBid?.exchange ?? "",
            buyPrice: fallbackOpp.highestBid?.price?.toString() ?? "0",
            buyIsUSD: fallbackOpp.highestBid?.isUSD ? "true" : "false",
            sellExchange: fallbackOpp.lowestAsk?.exchange ?? "",
            sellPrice: fallbackOpp.lowestAsk?.price?.toString() ?? "0",
            sellIsUSD: fallbackOpp.lowestAsk?.isUSD ? "true" : "false",
            spread: fallbackOpp.spread?.toString() ?? "0",
          });

          openOpportunityPopup(params);
        }

        return;
      }

      const params = new URLSearchParams({
        ticker,
        coin: ticker,
        buyExchange: originalOpp.highestBid?.exchange ?? "",
        buyPrice: originalOpp.highestBid?.price?.toString() ?? "0",
        buyIsUSD: originalOpp.highestBid?.isUSD ? "true" : "false",
        sellExchange: originalOpp.lowestAsk?.exchange ?? "",
        sellPrice: originalOpp.lowestAsk?.price?.toString() ?? "0",
        sellIsUSD: originalOpp.lowestAsk?.isUSD ? "true" : "false",
        spread: originalOpp.spread?.toString() ?? "0",
      });

      openOpportunityPopup(params);
    },
    []
  );

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
      localStorage.setItem(
        "visibleColumns",
        JSON.stringify([...ensureAlwaysVisibleColumns(newVisible)])
      );
      return ensureAlwaysVisibleColumns(newVisible);
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
    { id: "showCoinLogo", label: "Mostrar Logo da Moeda", required: false },
    {
      id: "showSpreadBackground",
      label: "Mostrar Background do Spread",
      required: false,
    },
    { id: "funding", label: "Funding", required: false },
    { id: "tempo", label: "Tempo", required: false },
    { id: "volumes", label: "Volumes", required: false },
    { id: "volumes24", label: "Volumes 24H", required: false },
    { id: "historico", label: "Histórico", required: false },
    { id: "acoes", label: "Ações", required: false },
  ];
  const visibleColumnCount = columnConfig.filter((col) =>
    isColumnVisible(col.id)
  ).length;

  const [rows, setRows] = React.useState<CoinRow[]>([]);
  const pendingRowsRef = React.useRef<CoinRow[]>([]);
  const sortTimerRef = React.useRef<number | null>(null);

  const sortRows = React.useCallback(
    (rowsToSort: CoinRow[]) => {
      if (!rowsToSort.length) return rowsToSort;

      if (!isGrouped) {
        return [...rowsToSort].sort((a, b) => {
          const aKey = `${a.coin.ticker}-${a.spot.bingo}-${a.futures.bingo}`;
          const bKey = `${b.coin.ticker}-${b.spot.bingo}-${b.futures.bingo}`;

          const aIsFavorite = isFavorite(aKey);
          const bIsFavorite = isFavorite(bKey);

          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;

          const aSpread = isExitMode
            ? parseFloat(a.spreads.short.replace(/[^\d.-]/g, "")) || 0
            : parseFloat(a.spreads.long.replace(/[^\d.-]/g, "")) || 0;
          const bSpread = isExitMode
            ? parseFloat(b.spreads.short.replace(/[^\d.-]/g, "")) || 0
            : parseFloat(b.spreads.long.replace(/[^\d.-]/g, "")) || 0;

          return bSpread - aSpread;
        });
      }

      const groups: Record<string, CoinRow[]> = {};
      rowsToSort.forEach((row) => {
        if (!groups[row.coin.ticker]) groups[row.coin.ticker] = [];
        groups[row.coin.ticker]!.push(row);
      });

      const groupedRows = Object.entries(groups)
        .flatMap(([ticker, rowsInGroup]) => {
          const sortedRows = [...rowsInGroup].sort((a, b) => {
            const aKey = `${a.coin.ticker}-${a.spot.bingo}-${a.futures.bingo}`;
            const bKey = `${b.coin.ticker}-${b.spot.bingo}-${b.futures.bingo}`;

            const aIsFavorite = isFavorite(aKey);
            const bIsFavorite = isFavorite(bKey);

            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;

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
            return sortedRows.map((row, index) => ({
              ...row,
              _isGroup: rowsInGroup.length > 1,
              _groupCount: rowsInGroup.length,
              _isExpanded: true,
              _isFirstInGroup: index === 0,
              _isLastInGroup: index === sortedRows.length - 1,
            }));
          }

          const bestRow = sortedRows[0];
          if (!bestRow) return [];

          return [
            {
              ...bestRow,
              _isGroup: rowsInGroup.length > 1,
              _groupCount: rowsInGroup.length,
              _isExpanded: false,
              _isFirstInGroup: true,
              _isLastInGroup: true,
            },
          ];
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const finalGroups: Record<string, CoinRow[]> = {};
      groupedRows.forEach((row) => {
        if (!finalGroups[row.coin.ticker]) {
          finalGroups[row.coin.ticker] = [];
        }
        finalGroups[row.coin.ticker]!.push(row);
      });

      const sortedGroupKeys = Object.keys(finalGroups).sort(
        (aTicker, bTicker) => {
          const aGroup = finalGroups[aTicker]!;
          const bGroup = finalGroups[bTicker]!;

          const aHasFavorite = aGroup.some((row) =>
            isFavorite(
              `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
            )
          );
          const bHasFavorite = bGroup.some((row) =>
            isFavorite(
              `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
            )
          );

          if (aHasFavorite && !bHasFavorite) return -1;
          if (!aHasFavorite && bHasFavorite) return 1;

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

      return sortedGroupKeys.flatMap((ticker) => finalGroups[ticker]!);
    },
    [isGrouped, isExitMode, isFavorite, expandedGroups]
  );

  // fallback para mock quando não houver socket (dev/test)
  const mappedRows: CoinRow[] = React.useMemo(() => {
    if (!opportunities || !opportunities.length) return [];

    const mappedRows = opportunities.map((op) => mapOppToRow(op, isExitMode));

    // Filtrar oportunidades excluídas
    const filteredRows = mappedRows.filter((row) => {
      const key = `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`;
      return !isExcluded(key) && !isMuted(row.coin.ticker);
    });

    return filteredRows;
  }, [opportunities, isExcluded, isExitMode]);

  React.useEffect(() => {
    if (!mappedRows.length) {
      pendingRowsRef.current = [];
      setRows([]);
      return;
    }
    pendingRowsRef.current = mappedRows;
    if (sortTimerRef.current != null) return;
    sortTimerRef.current = window.setTimeout(() => {
      sortTimerRef.current = null;
      setRows(sortRows(pendingRowsRef.current));
    }, 500);
  }, [mappedRows, sortRows]);

  React.useEffect(() => {
    return () => {
      if (sortTimerRef.current != null) {
        window.clearTimeout(sortTimerRef.current);
      }
    };
  }, []);

  // Calcular dados de paginação
  const totalItems = rows.length;
  const clampedItemsPerPage = Math.min(itemsPerPage, 40);
  const totalPages = Math.ceil(totalItems / clampedItemsPerPage);
  const startIndex = (currentPage - 1) * clampedItemsPerPage;
  const endIndex = startIndex + clampedItemsPerPage;
  const paginatedRows = rows.slice(startIndex, endIndex);

  // Ajustar página atual se ela for maior que o total de páginas disponíveis
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    if (itemsPerPage > 40) {
      setItemsPerPage(40);
      setCurrentPage(1);
    }
  }, [itemsPerPage]);

  const resolveRowMetrics = (row: CoinRow) => {
    if (!metricsByKey) {
      return { invertidas: 0, maxOpen: undefined, maxClose: undefined };
    }
    const key: MetricsKey = {
      symbol: `${row.coin.ticker}USDT`,
      spotExchange: normalizeExchangeLabel(row.spot.bingo),
      futuresExchange: normalizeExchangeLabel(row.futures.bingo),
    };
    const periods: MetricsPeriod[] = [
      selectedMetricsPeriod,
      "4h",
      "1h",
      "12h",
      "30m",
      "24h",
    ];
    const intents: MetricsIntent[] = [
      selectedMetricsIntent,
      "abertura",
      "fechamento",
    ];
    let metrics: MetricsUpdate | undefined;
    for (const intent of intents) {
      for (const period of periods) {
        const lookupKey = metricsKeyString(key, period, intent);
        const candidate = metricsByKey[lookupKey];
        if (candidate) {
          metrics = candidate;
          break;
        }
      }
      if (metrics) break;
    }
    return {
      invertidas: metrics?.invertidas ?? 0,
      maxOpen: metrics?.maxOpenPct,
      maxClose: metrics?.maxClosePct,
      lastInversionMs: metrics?.lastInversionMs,
      updatedAt: metrics?.updatedAt,
    };
  };

  // Definir todas as colunas possíveis
  const allColumns: Column<CoinRow>[] = [
    {
      id: "moeda",
      header: "Moeda",
      accessor: (r) => {
        const favoriteKey = `${r.coin.ticker}-${r.spot.bingo}-${r.futures.bingo}`;
        return (
          <CoinCell
            r={r}
            getOpp={getOpp}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
            showLogo={isElementVisible("showCoinLogo")}
            isFavorited={isFavorite(favoriteKey)}
            onToggleFavorite={() => toggleFavorite(favoriteKey)}
            toggleGroupExpansion={toggleGroupExpansion}
            styles={styles}
          />
        );
      },

      width: "184px",
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
            <Image src="/new-page/link.svg" alt="" width={12} height={12} />
          </div>
          <div className={styles.priceRow}>
            <div className={styles.price}>{r.spot.price}</div>
            <div
              className={styles.priceLiq}
              title="Liquidez primeira linha (USDT)"
            >
              {r.spot.live === "—" ? "—" : r.spot.live.replace(/^Liq\s*/i, "")}
            </div>
          </div>
          {embedVolumeInMarketColumns && (
            <div className={styles.live} title="Volume 24H (USDT)">
              VOL: ${r.volumes24h.s.replace(/^S:\s*/i, "")}
            </div>
          )}
        </div>
      ),
      width: "140px",
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
            <Image src="/new-page/link.svg" alt="" width={12} height={12} />
          </div>
          <div className={styles.priceRow}>
            <div className={styles.price}>{r.futures.price}</div>
            <div
              className={styles.priceLiq}
              title="Liquidez primeira linha (USDT)"
            >
              {r.futures.live === "—"
                ? "—"
                : r.futures.live.replace(/^Liq\s*/i, "")}
            </div>
          </div>
          {embedVolumeInMarketColumns && (
            <div className={styles.live} title="Volume 24H (USDT)">
              VOL: ${r.volumes24h.f.replace(/^F:\s*/i, "")}
            </div>
          )}
        </div>
      ),
      width: "140px",
    },
    {
      id: "spreads",
      header: "Spreads",
      accessor: (r) => {
        const longValue = parseFloat(r.spreads.long.replace(/[^\d.-]/g, ""));
        const shortValue = parseFloat(r.spreads.short.replace(/[^\d.-]/g, ""));
        return (
          <div className={styles.cellSplitHorizontal}>
            <span
              className={classnames(
                styles.spreadGroup,
                styles.positive,
                isElementVisible("showSpreadBackground") &&
                  classnames(styles.spreadCell, styles.positive)
              )}
            >
              <span className={styles.spreadLabel} title="Lucro entrada">
                E:
              </span>
              <span className={styles.spreadValue}>
                {Number.isFinite(longValue)
                  ? `${longValue > 0 ? "+" : ""}${longValue.toFixed(2)}%`
                  : "—"}
              </span>
            </span>
            <span
              className={classnames(
                styles.spreadGroup,
                styles.negative,
                isElementVisible("showSpreadBackground") &&
                  classnames(styles.spreadCell, styles.negative)
              )}
            >
              <span className={styles.spreadLabel} title="Lucro saída">
                S:
              </span>
              <span className={styles.spreadValue}>
                {Number.isFinite(shortValue)
                  ? `${shortValue > 0 ? "+" : ""}${shortValue.toFixed(2)}%`
                  : "—"}
              </span>
            </span>
          </div>
        );
      },
      width: "154px",
      align: "center",
      className: styles.colSpread,
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
            <FundingExpiry expiryTime={r.fundingRateExpTs} />
          </div>
        );
      },
      width: "108px",
      align: "right",
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
      width: "78px",
      align: "right",
      className: styles.colCompact,
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
      width: "90px",
      align: "right",
      className: styles.colCompact,
    },
    {
      id: "historico",
      header: (
        <div className={styles.historyHeader}>
          <span>Histórico</span>
          <select
            className={styles.historyPeriodSelect}
            value={selectedMetricsPeriod}
            onChange={(e) =>
              handleMetricsPeriodChange(e.target.value as MetricsPeriod)
            }
            aria-label="Período das métricas"
          >
            <option value="30m">30m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="12h">12h</option>
          </select>
        </div>
      ),
      accessor: (row: CoinRow) => {
        const { invertidas, maxOpen, maxClose, lastInversionMs } =
          resolveRowMetrics(row);
        const age =
          typeof lastInversionMs === "number"
            ? formatElapsed(lastInversionMs)
            : null;
        const onOpenChart = () =>
          handleTradingViewClick(
            row.coin.ticker,
            row.spot.bingo,
            row.futures.bingo
          );
        return (
          <div className={styles.historyCell}>
            <div className={styles.historyInner}>
              <div className={styles.historyTitle}>
                <span className={styles.historyCount}>{invertidas}</span>
                <span className={styles.historyLabelText}>invertidas</span>
                {age && (
                  <span
                    className={styles.historyAge}
                    title="Duração da última invertida"
                  >
                    <span className={styles.historyIcon}>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <circle
                          cx="10"
                          cy="10"
                          r="7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M10 6v4l3 2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {age}
                  </span>
                )}
              </div>
              <div className={styles.historyRow}>
                <span className={styles.historyPair}>
                  <span
                    className={styles.historyMiniLabel}
                    title={`Maior spread de abertura (${selectedMetricsPeriod})`}
                  >
                    ↑ A
                  </span>
                  <span
                    className={classnames(
                      styles.historyValue,
                      typeof maxOpen === "number"
                        ? maxOpen >= 0
                          ? styles.positive
                          : styles.negative
                        : undefined
                    )}
                  >
                    {typeof maxOpen === "number"
                      ? `${maxOpen > 0 ? "+" : ""}${maxOpen.toFixed(2)}%`
                      : "—"}
                  </span>
                </span>
                <span className={styles.historyPair}>
                  <span
                    className={styles.historyMiniLabel}
                    title={`Maior spread de fechamento (${selectedMetricsPeriod})`}
                  >
                    ↑ F
                  </span>
                  <span
                    className={classnames(
                      styles.historyValue,
                      typeof maxClose === "number"
                        ? maxClose >= 0
                          ? styles.positive
                          : styles.negative
                        : undefined
                    )}
                  >
                    {typeof maxClose === "number"
                      ? `${maxClose > 0 ? "+" : ""}${maxClose.toFixed(2)}%`
                      : "—"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      },
      width: "188px",
      className: styles.colHistoryCompact,
    },
    {
      id: "tempo",
      header: "Tempo",
      accessor: (r) => <TempoCell validSince={r.validSince} />,
      width: "116px",
      align: "center",
    },
    {
      id: "acoes",
      header: "Ações",
      accessor: (row: CoinRow) => (
        <ActionCell
          ticker={row.coin.ticker}
          spotExchange={row.spot.bingo}
          futuresExchange={row.futures.bingo}
          isMuted={isMuted(row.coin.ticker)}
          onToggleMute={toggleMuteTicker}
          onOpenOpportunity={handleOpenOpportunity}
          onOpenTradingView={handleTradingViewClick}
          onDelete={openDeleteModal}
          styles={styles}
        />
      ),
      width: "122px",
      align: "center",
    },
  ];

  // Filtrar colunas visíveis
  const columns = allColumns.filter((col) => {
    if (col.id === "volumes24") {
      return !embedVolumeInMarketColumns;
    }
    return isColumnVisible(col.id);
  });

  // Estado para detectar mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Estado para controlar modal de paginação mobile
  const [isPaginationModalOpen, setIsPaginationModalOpen] = useState(false);
  const [isPaginationModalClosing, setIsPaginationModalClosing] =
    useState(false);

  // Função para fechar o modal com animação
  const closePaginationModal = () => {
    setIsPaginationModalClosing(true);
    setTimeout(() => {
      setIsPaginationModalOpen(false);
      setIsPaginationModalClosing(false);
    }, 300); // Duração da animação
  };

  // Componente separado para o card mobile (para usar o hook corretamente)
  const MobileOpportunityCard = ({ row }: { row: CoinRow }) => {
    const { invertidas, maxOpen, maxClose, lastInversionMs } =
      resolveRowMetrics(row);
    const age =
      typeof lastInversionMs === "number"
        ? formatElapsed(lastInversionMs)
        : null;
    const logoUrl = useCoinLogo(row.coin.ticker, row.coin.ticker);
    const opp = getOpp(row.id);
    if (!opp) return null;

    // Extrai os valores numéricos dos spreads (remove "E: " e "%")
    const spreadLong = parseFloat(row.spreads.long.replace(/[^\d.-]/g, ""));
    const spreadShort = parseFloat(row.spreads.short.replace(/[^\d.-]/g, ""));
    const spreadClass = spreadLong > 0 ? "positive" : "negative";

    // Verifica se o header deve ser exibido
    const showHeader =
      isColumnVisible("showCoinLogo") || isColumnVisible("moeda");

    return (
      <div key={row.id} className={styles.opportunityCard}>
        {showHeader && (
          <div className={styles.cardHeader}>
            {isColumnVisible("showCoinLogo") && (
              <Image
                src={logoUrl}
                alt=""
                width={40}
                height={40}
                className={styles.cardLogo}
              />
            )}
            {isColumnVisible("moeda") && (
              <div className={styles.cardTitle}>
                <h3>{row.coin.ticker}</h3>
                <div className={styles.cardExchanges}>
                  <span
                    className={styles.exchangeLink}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRedirect(
                        row.spot.bingo,
                        row.coin.ticker,
                        `${row.coin.ticker}USDT`,
                        false
                      );
                    }}
                  >
                    {row.spot.bingo.replace(/spot|futures/i, "")}
                    <Image
                      src="/new-page/link.svg"
                      alt=""
                      width={10}
                      height={10}
                    />
                  </span>
                  {" → "}
                  <span
                    className={styles.exchangeLink}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRedirect(
                        row.futures.bingo,
                        row.coin.ticker,
                        `${row.coin.ticker}USDT`,
                        true
                      );
                    }}
                  >
                    {row.futures.bingo.replace(/spot|futures/i, "")}
                    <Image
                      src="/new-page/link.svg"
                      alt=""
                      width={10}
                      height={10}
                    />
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.cardBody}>
          {isColumnVisible("spot") && (
            <div className={styles.cardField}>
              <label>Spot</label>
              <div className={styles.cardValue}>{row.spot.price}</div>
              <div className={styles.cardSubValue}>{row.spot.live}</div>
            </div>
          )}

          {isColumnVisible("futuros") && (
            <div className={styles.cardField}>
              <label>Futuros</label>
              <div className={styles.cardValue}>{row.futures.price}</div>
              <div className={styles.cardSubValue}>{row.futures.live}</div>
            </div>
          )}

          {isColumnVisible("funding") && (
            <div className={styles.cardField}>
              <label>Funding</label>
              <div className={styles.cardValue}>
                {row.funding
                  ? `${parseFloat(row.funding) > 0 ? "+" : ""}${row.funding}%`
                  : "—"}
              </div>
            </div>
          )}

          {isColumnVisible("volumes") && (
            <div className={styles.cardField}>
              <label>Volumes</label>
              <div className={styles.cardValue}>
                {typeof row.volumes === "string"
                  ? row.volumes
                  : row.volumes && typeof row.volumes === "object"
                  ? `S: ${row.volumes.s} / F: ${row.volumes.f}`
                  : "—"}
              </div>
            </div>
          )}

          {isColumnVisible("volumes24") && (
            <div className={styles.cardField}>
              <label>Volume 24h</label>
              <div className={styles.cardValue}>
                {typeof row.volumes24h === "string"
                  ? row.volumes24h
                  : row.volumes24h && typeof row.volumes24h === "object"
                  ? `S: ${row.volumes24h.s} / F: ${row.volumes24h.f}`
                  : "—"}
              </div>
            </div>
          )}

          {isColumnVisible("historico") && (
            <div className={styles.cardField}>
              <label>Histórico</label>
              <div className={styles.cardValue}>
                <div className={styles.historyCell}>
                  <div className={styles.historyTitle}>
                    <span className={styles.historyCount}>{invertidas}</span>
                    <span className={styles.historyLabelText}>invertidas</span>
                    <button
                      className={styles.historyChartBtn}
                      type="button"
                      aria-label="Abrir Grafico"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTradingViewClick(
                          row.coin.ticker,
                          row.spot.bingo,
                          row.futures.bingo
                        );
                      }}
                    >
                      <span className={styles.historyIcon}>
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path
                            d="M3 14l4-4 3 3 5-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3 17h14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </button>
                    {age && (
                      <span
                        className={styles.historyAge}
                        title="Duração da última invertida"
                      >
                        <span className={styles.historyIcon}>
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <circle
                              cx="10"
                              cy="10"
                              r="7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M10 6v4l3 2"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        {age}
                      </span>
                    )}
                  </div>
                  <div className={styles.historyRow}>
                    <span
                      className={styles.historyMiniLabel}
                      title={`Maior spread de abertura (${selectedMetricsPeriod})`}
                    >
                      ↑ A
                    </span>
                    <span
                      className={classnames(
                        styles.historyValue,
                        typeof maxOpen === "number"
                          ? maxOpen >= 0
                            ? styles.positive
                            : styles.negative
                          : undefined
                      )}
                    >
                      {typeof maxOpen === "number"
                        ? `${maxOpen.toFixed(2)}%`
                        : "—"}
                    </span>
                    <span
                      className={styles.historyMiniLabel}
                      title={`Maior spread de fechamento (${selectedMetricsPeriod})`}
                    >
                      ↑ F
                    </span>
                    <span
                      className={classnames(
                        styles.historyValue,
                        typeof maxClose === "number"
                          ? maxClose >= 0
                            ? styles.positive
                            : styles.negative
                          : undefined
                      )}
                    >
                      {typeof maxClose === "number"
                        ? `${maxClose.toFixed(2)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isColumnVisible("tempo") && (
            <div className={styles.cardField}>
              <label>Tempo</label>
              <div className={styles.cardValue}>
                <TempoCell validSince={row.validSince} />
              </div>
            </div>
          )}

          {isColumnVisible("spreads") && (
            <div className={styles.cardSpread}>
              <div
                className={`${styles.cardSpreadItem} ${
                  isElementVisible("showSpreadBackground")
                    ? styles[spreadClass]
                    : ""
                }`}
              >
                <label>Entrada (E)</label>
                <div className={styles.spreadValue}>
                  {spreadLong > 0 ? "+" : ""}
                  {spreadLong.toFixed(2)}%
                </div>
              </div>
              <div
                className={`${styles.cardSpreadItem} ${
                  isElementVisible("showSpreadBackground")
                    ? spreadShort > 0
                      ? styles.positive
                      : styles.negative
                    : ""
                }`}
              >
                <label>Saída (S)</label>
                <div className={styles.spreadValue}>
                  {spreadShort > 0 ? "+" : ""}
                  {spreadShort.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {isColumnVisible("acoes") && (
            <div className={styles.cardActions}>
              <button
                className={`${styles.cardActionBtn} ${
                  isFavorite(
                    `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
                  )
                    ? styles.favorited
                    : ""
                }`}
                onClick={() =>
                  toggleFavorite(
                    `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`
                  )
                }
                title="Favoritar"
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
                className={styles.cardActionBtn}
                onClick={() => {
                  const url = generateTradingViewURL(
                    row.coin.ticker,
                    row.spot.bingo,
                    row.futures.bingo
                  );
                  setTradingViewUrl(url);
                  setChartTicker(row.coin.ticker);
                  setChartSpotExchange(row.spot.bingo);
                  setChartFuturesExchange(row.futures.bingo);
                  setChartProvider("tradingview");
                  setIsTradingViewOpen(true);
                }}
                title="Ver grafico"
              >
                <TradingViewIcon />
              </button>
              <button
                className={styles.cardActionBtn}
                onClick={() => openCalculatorPopup()}
                title="Abrir calculadora"
              >
                <CalculatorTableIcon />
              </button>
              <button
                className={`${styles.cardActionBtn} ${
                  isMuted(row.coin.ticker) ? styles.mutedAction : ""
                }`}
                onClick={() => toggleMuteTicker(row.coin.ticker)}
                title={
                  isMuted(row.coin.ticker)
                    ? "Reativar moeda"
                    : "Silenciar moeda"
                }
              >
                <MuteIcon />
              </button>
              <button
                className={styles.cardActionBtn}
                onClick={() =>
                  openDeleteModal(
                    `${row.coin.ticker}-${row.spot.bingo}-${row.futures.bingo}`,
                    `${row.coin.ticker} (${row.spot.bingo} → ${row.futures.bingo})`
                  )
                }
                title="Excluir oportunidade"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderiza cards mobile
  const renderMobileCards = () => {
    if (paginatedRows.length === 0) {
      if (isLoading) {
        return (
          <div className={styles.emptyCards}>
            <PacmanLoader color="#7B61FF" size={30} />
            <p>Carregando oportunidades...</p>
          </div>
        );
      }
      return <div className={styles.emptyCards}>{emptyStateNode}</div>;
    }

    return paginatedRows.map((r) => (
      <MobileOpportunityCard key={r.id} row={r} />
    ));
  };

  const activeFilterLabels = (activeFilters ?? []).filter(Boolean);
  const showClearFilters = activeFilterLabels.length > 0 && onClearFilters;

  const filterSummaryNode =
    activeFilterLabels.length > 0 ? (
      <div className={styles.filterSummaryInner}>
        <span className={styles.filterLabel}>Filtros ativos:</span>
        <div className={styles.filterChips}>
          {activeFilterLabels.map((label) => (
            <span key={label} className={styles.filterChip}>
              {label}
            </span>
          ))}
        </div>
        {showClearFilters && (
          <button
            type="button"
            className={styles.clearFiltersBtn}
            onClick={onClearFilters}
          >
            Limpar filtros
          </button>
        )}
      </div>
    ) : null;

  const emptyStateNode = (
    <div className={styles.emptyStateCard}>
      <div className={styles.emptyTitle}>Nenhuma oportunidade</div>
      <div className={styles.emptyBody}>
        {isSocketPaused
          ? "Atualizações pausadas. Retome o socket para ver novas oportunidades."
          : isConnected
          ? activeFilterLabels.length > 0
            ? "Os filtros atuais estão muito restritivos."
            : "Ainda não há oportunidades disponíveis."
          : "Conectando ao servidor..."}
      </div>
      {showClearFilters && (
        <button
          type="button"
          className={styles.emptyAction}
          onClick={onClearFilters}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Cards Container */}
      {isMobile && (
        <div className={styles.mobileCardsContainer}>{renderMobileCards()}</div>
      )}

      {/* Botão Flutuante de Paginação Mobile */}
      {isMobile && totalItems > 0 && (
        <button
          className={styles.paginationFloatingBtn}
          onClick={() => {
            if (isPaginationModalOpen) {
              closePaginationModal();
            } else {
              setIsPaginationModalOpen(true);
            }
          }}
          title={isPaginationModalOpen ? "Fechar navegação" : "Abrir navegação"}
          style={{
            position: "fixed",
            bottom: "250px",
            right: "20px",
            zIndex: 99999,
          }}
        >
          {isPaginationModalOpen ? (
            // Ícone X quando está aberto
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            // Ícone de lista quando está fechado
            <>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 6H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 12H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 18H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="7" cy="6" r="1.5" fill="currentColor" />
                <circle cx="7" cy="12" r="1.5" fill="currentColor" />
                <circle cx="7" cy="18" r="1.5" fill="currentColor" />
              </svg>
              <span className={styles.pageIndicator}>
                {currentPage}/{totalPages}
              </span>
            </>
          )}
        </button>
      )}

      {/* Modal de Paginação Mobile */}
      {isMobile && isPaginationModalOpen && (
        <>
          <div
            className={`${styles.paginationModalOverlay} ${
              isPaginationModalClosing ? styles.fadeOut : ""
            }`}
            onClick={closePaginationModal}
          />
          <div
            className={`${styles.paginationModal} ${
              isPaginationModalClosing ? styles.slideDown : ""
            }`}
          >
            <div className={styles.paginationModalHeader}>
              <h3>Navegação</h3>
            </div>

            <div className={styles.paginationModalBody}>
              <div className={styles.paginationInfo}>
                <span className={styles.paginationInfoText}>
                  Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)}{" "}
                  de {totalItems} oportunidades
                </span>
                <div className={styles.itemsPerPageSelector}>
                  <label>Por página:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={40}>40</option>
                  </select>
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
                        onClick={() => {
                          setCurrentPage(pageNum);
                          closePaginationModal();
                        }}
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
          </div>
        </>
      )}

      {/* Desktop Table */}
      <GlassTable<CoinRow>
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onFilterClick={onFilterClick}
        columns={columns}
        data={paginatedRows}
        rowKey={(r) => r.id}
        maxHeight={560}
        dense={isDenseMode}
        virtualized
        zebra
        onRowClick={(r) => console.log("click row:", r.id)}
        isSidebarOpen={isSidebarOpen}
        isGrouped={isGrouped}
        onToggleGrouping={toggleGrouping}
        isExitMode={isExitMode}
        onToggleExitMode={onToggleExitMode}
        onCustomButtonClick={onCustomButtonClick}
        isLoading={Boolean(isLoading)}
        emptyState={emptyStateNode}
        filterSummary={filterSummaryNode}
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
            {mutedTickers.size > 0 && (
              <button
                type="button"
                className={styles.iconGlass}
                aria-label="Gerenciar Silenciadas"
                onClick={() => setMutedModal({ isOpen: true })}
                title={`${mutedTickers.size} moeda(s) silenciada(s)`}
              >
                <MuteIcon />
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
      {
        <div className={`${styles.pagination} ${styles.paginationTextOnly}`}>
          <div className={styles.paginationInfo}>
            <span>
              {totalItems > 0
                ? `Mostrando ${startIndex + 1} - ${Math.min(
                    endIndex,
                    totalItems
                  )} de ${totalItems} oportunidades`
                : "Sem oportunidades no momento"}
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
                  <option value={40}>40</option>
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
      }

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
          <div className={`${styles.modal} ${styles.restoreNarrowPanel}`}>
            <div className={styles.restoreNarrowBody}>
              <div className={styles.restoreModalBody}>
                <div className={styles.restoreConfigV2}>
                  <div className={styles.restoreInlineHeader}>
                    <h3 className={styles.restoreInlineTitle}>
                      Oportunidades Excluídas
                      <TrashIcon className={styles.restoreInlineTitleIcon} />
                    </h3>
                    <button
                      type="button"
                      className={styles.restoreInlineClose}
                      onClick={() => setRestoreModal({ isOpen: false })}
                      aria-label="Fechar modal de oportunidades excluídas"
                    >
                      ×
                    </button>
                  </div>

                  <div className={styles.restoreIntroCard}>
                    <h4 className={styles.restoreIntroTitle}>
                      Restauração de Oportunidades
                    </h4>
                    <p className={styles.restoreIntroText}>
                      Selecione as oportunidades que deseja restaurar para
                      voltarem ao monitor.
                    </p>
                    <p className={styles.restoreIntroMeta}>
                      {excluded.size} oportunidade(s) excluída(s)
                    </p>
                  </div>

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
                    {getExcludedOpportunities().length === 0 && (
                      <div className={styles.restoreEmptyState}>
                        Nenhuma oportunidade excluída no momento.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={`${styles.modalButtons} ${styles.restoreModalActions}`}
              >
                <button
                  className={styles.cancelButton}
                  onClick={() => setRestoreModal({ isOpen: false })}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mutedModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Moedas Silenciadas</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Selecione as moedas que deseja reativar:</p>
              <div className={styles.excludedList}>
                {getMutedTickers().map((ticker) => (
                  <div key={ticker} className={styles.excludedItem}>
                    <div className={styles.excludedInfo}>
                      <strong>{ticker}</strong>
                    </div>
                    <button
                      className={styles.restoreButton}
                      onClick={() => toggleMuteTicker(ticker)}
                    >
                      Reativar
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setMutedModal({ isOpen: false })}
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
          <div className={`${styles.modal} ${styles.settingsNarrowPanel}`}>
            <div className={styles.settingsNarrowBody}>
              <div className={styles.settingsModalBody}>
                <div className={styles.settingsConfigV2}>
                  <div className={styles.settingsInlineHeader}>
                    <h3 className={styles.settingsInlineTitle}>
                      Configurar Colunas
                      <ConfigIcon className={styles.settingsInlineTitleIcon} />
                    </h3>
                    <button
                      type="button"
                      className={styles.settingsInlineClose}
                      onClick={() => setColumnConfigModal({ isOpen: false })}
                      aria-label="Fechar modal de configurações"
                    >
                      ×
                    </button>
                  </div>

                  <div className={styles.settingsIntroCard}>
                    <h4 className={styles.settingsIntroTitle}>
                      Visibilidade da Tabela
                    </h4>
                    <p className={styles.settingsIntroText}>
                      Defina quais colunas e densidade devem aparecer no
                      monitor.
                    </p>
                    <p className={styles.settingsIntroMeta}>
                      {visibleColumnCount} de {columnConfig.length} colunas
                      ativas
                    </p>
                  </div>

                  <div className={styles.settingsGrid}>
                    <div className={styles.settingsItem}>
                      <div className={styles.settingsItemInfo}>
                        <span className={styles.settingsItemLabel}>
                          Densidade da tabela
                        </span>
                        <span className={styles.settingsItemMeta}>
                          {isDenseMode ? "Compacta" : "Confortável"}
                        </span>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={isDenseMode}
                          onChange={() => setIsDenseMode((prev) => !prev)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>

                    {columnConfig.map((col) => (
                      <div key={col.id} className={styles.settingsItem}>
                        <div className={styles.settingsItemInfo}>
                          <span className={styles.settingsItemLabel}>
                            {col.label}
                          </span>
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
              </div>
              <div
                className={`${styles.modalButtons} ${styles.settingsModalActions}`}
              >
                <button
                  className={styles.cancelButton}
                  onClick={() => setColumnConfigModal({ isOpen: false })}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Grafico */}
      {isTradingViewOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalLarge}>
            <button
              onClick={() => setIsTradingViewOpen(false)}
              className={styles.closeButton}
            >
              ✕
            </button>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>
                <span>Grafico</span>
                {chartTicker && (
                  <span className={styles.chartTicker}>{chartTicker}USDT</span>
                )}
              </div>
              <div className={styles.providerTabs}>
                <button
                  type="button"
                  className={`${styles.providerTab} ${
                    chartProvider === "tradingview" ? styles.activeTab : ""
                  }`}
                  onClick={() => setChartProvider("tradingview")}
                >
                  TradingView
                </button>
                <button
                  type="button"
                  className={`${styles.providerTab} ${
                    chartProvider === "nextgain" ? styles.activeTab : ""
                  }`}
                  onClick={() => setChartProvider("nextgain")}
                >
                  NextGain
                </button>
              </div>
            </div>
            <div className={styles.chartBody}>
              {chartProvider === "tradingview" ? (
                tradingViewUrl ? (
                  <iframe
                    src={tradingViewUrl}
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                  />
                ) : (
                  <div className={styles.chartEmpty}>
                    Nenhum grafico do TradingView disponivel.
                  </div>
                )
              ) : (
                <div className={styles.nextGainChart}>
                  <div className={styles.chartTopRow}>
                    <div className={styles.chartTopLeft}>
                      <label className={styles.chartFilterLabel}>
                        Periodo das Metricas
                      </label>
                      <select
                        className={styles.chartFilterSelect}
                        value={selectedMetricsPeriod}
                        onChange={(e) =>
                          handleMetricsPeriodChange(
                            e.target.value as MetricsPeriod
                          )
                        }
                      >
                        <option value="24h">24h</option>
                        <option value="12h">12h</option>
                        <option value="4h">4h</option>
                        <option value="1h">1h</option>
                        <option value="30m">30m</option>
                      </select>
                      <label className={styles.chartFilterLabel}>
                        Intencao
                      </label>
                      <select
                        className={styles.chartFilterSelect}
                        value={crossIntent}
                        onChange={(e) =>
                          setCrossIntent(e.target.value as typeof crossIntent)
                        }
                      >
                        <option value="abertura">Abertura</option>
                        <option value="fechamento">Fechamento</option>
                      </select>
                    </div>
                    <div className={styles.chartTopCenter}>
                      <div className={styles.chartOverlayInfo}>
                        <div className={styles.statsTitle}>
                          {chartTicker ? `${chartTicker}USDT` : "Ticker"}
                        </div>
                        <div className={styles.statsLine}>
                          Maior Spread:{" "}
                          {Number.isFinite(nextGainStats.maxSpreadPct)
                            ? `${nextGainStats.maxSpreadPct.toFixed(2)}%`
                            : "—"}
                        </div>
                        <div className={styles.statsLine}>
                          Media dos 10 Maiores Spreads:{" "}
                          {Number.isFinite(nextGainStats.avgTop10SpreadPct)
                            ? `${nextGainStats.avgTop10SpreadPct.toFixed(2)}%`
                            : "—"}
                        </div>
                        <div className={styles.statsLine}>
                          Spread Medio:{" "}
                          {Number.isFinite(nextGainStats.avgSpreadPct)
                            ? `${nextGainStats.avgSpreadPct.toFixed(2)}%`
                            : "—"}
                        </div>
                        <div className={styles.statsLegend}>
                          <span className={styles.legendItem}>
                            <span
                              className={styles.legendDot}
                              data-legend="spot"
                            />
                            {spotLabel}
                          </span>
                          <span className={styles.legendItem}>
                            <span
                              className={styles.legendDot}
                              data-legend="futures"
                            />
                            {futuresLabel} Futures
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.chartTopRight}>
                      <div className={styles.chartRightStats}>
                        <div className={styles.rightStatsTitle}>
                          <span className={styles.rightStatsCount}>
                            {nextGainInvertidasCount}
                          </span>{" "}
                          invertidas
                        </div>
                        <div className={styles.rightStatsRow}>
                          <span className={styles.rightStatsLabel}>
                            ↑ Maior Spread Abertura:
                          </span>
                          <span
                            className={classnames(
                              styles.rightStatsValue,
                              Number.isFinite(nextGainMaxSpreads.maxOpenPct) &&
                                nextGainMaxSpreads.maxOpenPct >= 0
                                ? styles.rightStatsPositive
                                : styles.rightStatsNegative
                            )}
                          >
                            {Number.isFinite(nextGainMaxSpreads.maxOpenPct)
                              ? `${nextGainMaxSpreads.maxOpenPct.toFixed(2)}%`
                              : "—"}
                          </span>
                        </div>
                        <div className={styles.rightStatsRow}>
                          <span className={styles.rightStatsLabel}>
                            ↑ Maior Spread Fechamento:
                          </span>
                          <span
                            className={classnames(
                              styles.rightStatsValue,
                              Number.isFinite(nextGainMaxSpreads.maxClosePct) &&
                                nextGainMaxSpreads.maxClosePct >= 0
                                ? styles.rightStatsPositive
                                : styles.rightStatsNegative
                            )}
                          >
                            {Number.isFinite(nextGainMaxSpreads.maxClosePct)
                              ? `${nextGainMaxSpreads.maxClosePct.toFixed(2)}%`
                              : "—"}
                          </span>
                        </div>
                      </div>
                      {nextGainLoading && <span>Carregando...</span>}
                      {nextGainError && <span>{nextGainError}</span>}
                    </div>
                  </div>
                  <div
                    className={styles.chartCanvas}
                    ref={nextGainChartRef}
                    onWheel={(event) => {
                      if (!nextGainWindowData.length) return;
                      event.preventDefault();
                      const rect =
                        nextGainChartRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      const x = event.clientX - rect.left;
                      const y = event.clientY - rect.top;
                      const width = rect.width;
                      const height = rect.height;
                      if (width <= 0 || height <= 0) return;

                      const xDomain = nextGainXDomain ?? [
                        nextGainZoomBounds.minTs,
                        nextGainZoomBounds.maxTs,
                      ];
                      const yDomain = nextGainYDomain ?? [
                        nextGainExtents.minY,
                        nextGainExtents.maxY,
                      ];

                      const [xMin, xMax] = xDomain;
                      const [yMin, yMax] = yDomain;
                      const rangeX = xMax - xMin;
                      const rangeY = yMax - yMin;
                      if (!Number.isFinite(rangeX) || !Number.isFinite(rangeY))
                        return;

                      if (!Number.isFinite(event.deltaY) || event.deltaY === 0)
                        return;
                      const zoomIn = event.deltaY < 0;
                      const zoomFactor = zoomIn ? 0.9 : 1.1;
                      const ratioX = x / width;
                      const ratioY = y / height;
                      const xVal = xMin + ratioX * rangeX;
                      const yVal = yMax - ratioY * rangeY;

                      const nextXMin = xVal - (xVal - xMin) * zoomFactor;
                      const nextXMax = xVal + (xMax - xVal) * zoomFactor;
                      const nextYMin = yVal - (yVal - yMin) * zoomFactor;
                      const nextYMax = yVal + (yMax - yVal) * zoomFactor;

                      const minRangeX = Math.max(
                        5000,
                        (nextGainZoomBounds.maxTs - nextGainZoomBounds.minTs) /
                          500
                      );
                      const minRangeY = Math.max(
                        Number.EPSILON,
                        (nextGainExtents.maxY - nextGainExtents.minY) / 500
                      );

                      const clampDomain = (
                        min: number,
                        max: number,
                        absMin: number,
                        absMax: number,
                        minRange: number
                      ): [number, number] => {
                        if (max - min < minRange) {
                          const center = (min + max) / 2;
                          min = center - minRange / 2;
                          max = center + minRange / 2;
                        }
                        if (min < absMin) {
                          const delta = absMin - min;
                          min += delta;
                          max += delta;
                        }
                        if (max > absMax) {
                          const delta = max - absMax;
                          min -= delta;
                          max -= delta;
                        }
                        return [min, max];
                      };

                      const [clampedXMin, clampedXMax] = clampDomain(
                        nextXMin,
                        nextXMax,
                        nextGainZoomBounds.minTs,
                        nextGainZoomBounds.maxTs,
                        minRangeX
                      );
                      const [clampedYMin, clampedYMax] = clampDomain(
                        nextYMin,
                        nextYMax,
                        nextGainExtents.minY,
                        nextGainExtents.maxY,
                        minRangeY
                      );

                      if (event.shiftKey) {
                        setNextGainYDomain([clampedYMin, clampedYMax]);
                      } else if (event.altKey) {
                        setNextGainXDomain([clampedXMin, clampedXMax]);
                      } else {
                        setNextGainXDomain([clampedXMin, clampedXMax]);
                        setNextGainYDomain([clampedYMin, clampedYMax]);
                      }
                    }}
                    onMouseDown={(event) => {
                      if (!nextGainWindowData.length) return;
                      if (event.button !== 0) return;
                      if (!nextGainChartRef.current) return;
                      const rect =
                        nextGainChartRef.current.getBoundingClientRect();
                      panStateRef.current = {
                        startX: event.clientX - rect.left,
                        startY: event.clientY - rect.top,
                        xDomain: nextGainXDomain ?? [
                          nextGainZoomBounds.minTs,
                          nextGainZoomBounds.maxTs,
                        ],
                        yDomain: nextGainYDomain ?? [
                          nextGainExtents.minY,
                          nextGainExtents.maxY,
                        ],
                      };
                    }}
                    onMouseMove={(event) => {
                      if (!panStateRef.current || !nextGainChartRef.current)
                        return;
                      const rect =
                        nextGainChartRef.current.getBoundingClientRect();
                      const dx =
                        event.clientX - rect.left - panStateRef.current.startX;
                      const dy =
                        event.clientY - rect.top - panStateRef.current.startY;
                      const width = rect.width || 1;
                      const height = rect.height || 1;

                      const [xMin, xMax] = panStateRef.current.xDomain;
                      const [yMin, yMax] = panStateRef.current.yDomain;
                      const rangeX = xMax - xMin;
                      const rangeY = yMax - yMin;

                      const shiftX = -(dx / width) * rangeX;
                      const shiftY = (dy / height) * rangeY;

                      const nextX: [number, number] = [
                        xMin + shiftX,
                        xMax + shiftX,
                      ];
                      const nextY: [number, number] = [
                        yMin + shiftY,
                        yMax + shiftY,
                      ];

                      const clampDomain = (
                        min: number,
                        max: number,
                        absMin: number,
                        absMax: number
                      ): [number, number] => {
                        if (min < absMin) {
                          const delta = absMin - min;
                          min += delta;
                          max += delta;
                        }
                        if (max > absMax) {
                          const delta = max - absMax;
                          min -= delta;
                          max -= delta;
                        }
                        return [min, max];
                      };

                      const [clampedXMin, clampedXMax] = clampDomain(
                        nextX[0],
                        nextX[1],
                        nextGainZoomBounds.minTs,
                        nextGainZoomBounds.maxTs
                      );
                      const [clampedYMin, clampedYMax] = clampDomain(
                        nextY[0],
                        nextY[1],
                        nextGainExtents.minY,
                        nextGainExtents.maxY
                      );

                      setNextGainXDomain([clampedXMin, clampedXMax]);
                      setNextGainYDomain([clampedYMin, clampedYMax]);
                    }}
                    onMouseUp={() => {
                      panStateRef.current = null;
                    }}
                    onMouseLeave={() => {
                      panStateRef.current = null;
                    }}
                    onDoubleClick={() => {
                      resetNextGainZoom();
                    }}
                  >
                    {!nextGainLoading && nextGainWindowData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={nextGainWindowData}>
                          <defs>
                            <linearGradient
                              id="chartSpotFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="rgba(109, 225, 255, 0.26)"
                              />
                              <stop
                                offset="100%"
                                stopColor="rgba(109, 225, 255, 0.00)"
                              />
                            </linearGradient>
                            <linearGradient
                              id="chartFuturesFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="rgba(180, 117, 255, 0.25)"
                              />
                              <stop
                                offset="100%"
                                stopColor="rgba(180, 117, 255, 0.00)"
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            stroke="rgba(255,255,255,0.09)"
                            strokeDasharray="2 8"
                            vertical={false}
                            horizontal={true}
                          />
                          <XAxis
                            dataKey="ts"
                            type="number"
                            domain={nextGainXDomain ?? ["auto", "auto"]}
                            minTickGap={40}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) =>
                              formatTimeLabel(value as number)
                            }
                            tick={{
                              fill: "rgba(255,255,255,0.54)",
                              fontSize: 10,
                            }}
                          />
                          <YAxis
                            domain={nextGainYDomain ?? ["auto", "auto"]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "rgba(255,255,255,0.54)",
                              fontSize: 10,
                            }}
                          />
                          <Tooltip
                            content={(props) => (
                              <NextGainTooltip
                                {...props}
                                data={nextGainWindowData}
                                spotLabel={spotLabel}
                                futuresLabel={futuresLabel}
                              />
                            )}
                          />
                          <Area
                            type="monotone"
                            dataKey="spot"
                            stroke="none"
                            fill="url(#chartSpotFill)"
                            isAnimationActive={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="futures"
                            stroke="none"
                            fill="url(#chartFuturesFill)"
                            isAnimationActive={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="spot"
                            stroke="#67deff"
                            strokeWidth={1.7}
                            dot={false}
                            activeDot={{
                              r: 3,
                              fill: "#8ae7ff",
                              stroke: "#0f111c",
                              strokeWidth: 1.5,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="futures"
                            stroke="#b979ff"
                            strokeWidth={1.9}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              if (!payload || !nextGainPeakTs.has(payload.ts)) {
                                return <g />;
                              }
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={5}
                                  fill="none"
                                  stroke="#f7f4ff"
                                  strokeWidth={1.8}
                                />
                              );
                            }}
                            activeDot={{
                              r: 3,
                              fill: "#d3b2ff",
                              stroke: "#0f111c",
                              strokeWidth: 1.5,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={styles.chartEmpty}>
                        {nextGainLoading
                          ? "Carregando dados..."
                          : nextGainError
                          ? nextGainError
                          : "Sem dados para este ticker."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.isVisible && (
        <div
          className={`${styles.tooltip} ${styles.visible}`}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className={styles.tooltipContent}>{tooltip.content}</div>
        </div>
      )}
    </>
  );
}
