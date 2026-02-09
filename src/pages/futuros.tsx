"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../styles/futures-new.module.scss";
import NewPageSidebar from "../components/new-page/sidebar";
import NewPageHeader from "../components/new-page/header/header";
import { DemoGlassTable } from "../components/new-page/glass-table/glass-table";
import GlassModal from "../components/new-page/modal/glass-modal";
import FilterIcon from "../components/Icons/FilterIcon";
import AlertIcon from "../components/Icons/AlertIcon";
import { appRouter } from "../server/router";
import { GetServerSidePropsContext } from "next";
import { createContext } from "../server/router/context";
import { useArbitrageSocket } from "../hooks/useArbitrageSocket";
import {
  useSpreadAlert,
  type SpreadAlertConfig,
} from "../hooks/useSpreadAlert";
import type { ArbitrageOpportunity } from "../server/router/orderbook";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

export default function FuturosNewPage({
  initialExchanges,
}: {
  initialExchanges: any[];
}) {
  const uiTheme: "purple-new" = "purple-new";

  const [useMockData] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("useMockData") === "true";
    } catch {
      return false;
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [spotSelectedExchanges, setSpotSelectedExchanges] = useState<any[]>([]);
  const [futuresSelectedExchanges, setFuturesSelectedExchanges] = useState<
    any[]
  >([]);
  const closeFilter = useCallback(() => setIsFilterModalOpen(false), []);
  // ✅ NOVO: estados de filtro
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [minProfit, setMinProfit] = useState<number>(0.5);
  const [maxProfit, setMaxProfit] = useState<number>(200);
  const [minLiquidity, setMinLiquidity] = useState<number>(0);
  const [minVolume24h, setMinVolume24h] = useState<number>(0);
  const [minInverted, setMinInverted] = useState<number>(0);
  const [minMaxOpenSpread, setMinMaxOpenSpread] = useState<number>(0);
  const [minMaxCloseSpread, setMinMaxCloseSpread] = useState<number>(0);
  const [tempMinProfit, setTempMinProfit] = useState(minProfit);
  const [tempMaxProfit, setTempMaxProfit] = useState(maxProfit);
  const [tempMinLiquidity, setTempMinLiquidity] = useState(minLiquidity);
  const [tempMinVolume24h, setTempMinVolume24h] = useState(minVolume24h);
  const [tempMinInverted, setTempMinInverted] = useState(minInverted);
  const [tempMinMaxOpenSpread, setTempMinMaxOpenSpread] =
    useState(minMaxOpenSpread);
  const [tempMinMaxCloseSpread, setTempMinMaxCloseSpread] =
    useState(minMaxCloseSpread);

  // ✅ NOVO: busca por símbolo (controla a search da tabela)
  const [symbolFilter, setSymbolFilter] = useState("");

  // ✅ NOVO: estado para modal customizado
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // ✅ NOVO: estado para modo de fechamento (lock icon)
  const [isExitMode, setIsExitMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("isExitMode");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // ✅ NOVO: estado para pausar socket
  const [isSocketPaused, setIsSocketPaused] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("isSocketPaused");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // socket
  const [symbols] = useState<string[]>([]);
  const [refreshRate, setRefreshRate] = useState<number>(() => {
    if (typeof window === "undefined") return 1000;
    try {
      const saved = localStorage.getItem("refreshRate");
      return saved ? Number(saved) : 1000;
    } catch {
      return 1000;
    }
  });
  // Carrega exchanges salvas e depois inicializa o socket
  const [buyExNames, setBuyExNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const spot = JSON.parse(localStorage.getItem("spotExchanges") || "[]");
      return spot.map((x: any) => x.name);
    } catch {
      return [];
    }
  });

  const [sellExNames, setSellExNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const futures = JSON.parse(
        localStorage.getItem("futuresExchanges") || "[]"
      );
      return futures.map((x: any) => x.name);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        const spot = JSON.parse(localStorage.getItem("spotExchanges") || "[]");
        const futures = JSON.parse(
          localStorage.getItem("futuresExchanges") || "[]"
        );
        setBuyExNames(spot.map((x: any) => x.name));
        setSellExNames(futures.map((x: any) => x.name));
      } catch {}
    };
    window.addEventListener("exchangeUpdated", handler);
    return () => window.removeEventListener("exchangeUpdated", handler);
  }, []);

  const pullSelectedFromStorage = useCallback(() => {
    try {
      const spot = JSON.parse(localStorage.getItem("spotExchanges") || "[]");
      const futures = JSON.parse(
        localStorage.getItem("futuresExchanges") || "[]"
      );
      const spotNames = spot.map((x: any) => x.name);
      const futuresNames = futures.map((x: any) => x.name);
      setBuyExNames(spotNames);
      setSellExNames(futuresNames);
      return { spotNames, futuresNames };
    } catch {
      return { spotNames: [], futuresNames: [] };
    }
  }, []);

  // ✅ só inicia o socket depois de ter as exchanges carregadas
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const { spotNames, futuresNames } = pullSelectedFromStorage();
    if (spotNames.length || futuresNames.length) {
      setIsReady(true);
    }
    const handler = () => {
      const { spotNames, futuresNames } = pullSelectedFromStorage();
      if (spotNames.length || futuresNames.length) {
        setIsReady(true);
      }
    };
    window.addEventListener("exchangeUpdated", handler);
    return () => window.removeEventListener("exchangeUpdated", handler);
  }, [pullSelectedFromStorage]);

  const [metricsPeriod, setMetricsPeriod] = useState<
    "30m" | "1h" | "4h" | "12h" | "24h"
  >("4h");
  const metricsIntent = isExitMode ? "fechamento" : "abertura";

  // 🔌 conecta ao socket APENAS quando exchanges estiverem prontas
  const { opportunities, isConnected, metricsByKey } = useArbitrageSocket(
    symbols,
    refreshRate,
    buyExNames,
    sellExNames,
    isSocketPaused,
    true,
    0.5,
    metricsPeriod,
    metricsIntent
  );

  const mockOpportunities: ArbitrageOpportunity[] = useMemo(
    () => [
      {
        coin: "FLOW",
        coinImage: "/default-coin.png",
        ticker: "FLOWUSDT",
        lowestAsk: {
          exchange: "MEXC",
          price: 0.0432,
          amount: 15800,
          isUSD: true,
          orderbook: {
            bids: [{ price: 0.0431, amount: 8000, sumVolume: 0 }],
            asks: [{ price: 0.0432, amount: 15800, sumVolume: 0 }],
          },
        },
        highestBid: {
          exchange: "GATE",
          price: 0.0445,
          amount: 12200,
          isUSD: true,
          orderbook: {
            bids: [{ price: 0.0445, amount: 12200, sumVolume: 0 }],
            asks: [{ price: 0.0447, amount: 9000, sumVolume: 0 }],
          },
        },
        tax: 0,
        fee: 0,
        spread: 2.98,
        spreadS: 1.42,
        fundingRate: 0.00032,
        spotVolume24h: 2_540_000,
        futVolume24h: 5_100_000,
        validSince: Date.now() - 1000 * 60 * 42,
        fundingRateExpTs: Date.now() + 1000 * 60 * 90,
      },
      {
        coin: "PIPE",
        coinImage: "/default-coin.png",
        ticker: "PIPEUSDT",
        lowestAsk: {
          exchange: "BINGX",
          price: 0.0103,
          amount: 73000,
          isUSD: true,
          orderbook: {
            bids: [{ price: 0.0102, amount: 21000, sumVolume: 0 }],
            asks: [{ price: 0.0103, amount: 73000, sumVolume: 0 }],
          },
        },
        highestBid: {
          exchange: "MEXC",
          price: 0.0109,
          amount: 65000,
          isUSD: true,
          orderbook: {
            bids: [{ price: 0.0109, amount: 65000, sumVolume: 0 }],
            asks: [{ price: 0.0111, amount: 30000, sumVolume: 0 }],
          },
        },
        tax: 0,
        fee: 0,
        spread: 5.82,
        spreadS: 2.15,
        fundingRate: -0.00012,
        spotVolume24h: 840_000,
        futVolume24h: 2_050_000,
        validSince: Date.now() - 1000 * 60 * 8,
        fundingRateExpTs: Date.now() + 1000 * 60 * 40,
      },
      {
        coin: "AIAI",
        coinImage: "/default-coin.png",
        ticker: "AIAIUSDT",
        lowestAsk: {
          exchange: "OKX",
          price: 0.093,
          amount: 22000,
          isUSD: true,
          orderbook: {
            bids: [{ price: 0.0928, amount: 15000, sumVolume: 0 }],
            asks: [{ price: 0.093, amount: 22000, sumVolume: 0 }],
          },
        },
        highestBid: {
          exchange: "BITGET",
          price: 0.0962,
          amount: 18000,
          isUSD: true,
          orderbook: {
            bids: [{ price: 0.0962, amount: 18000, sumVolume: 0 }],
            asks: [{ price: 0.0964, amount: 12000, sumVolume: 0 }],
          },
        },
        tax: 0,
        fee: 0,
        spread: 3.44,
        spreadS: 0.89,
        fundingRate: 0.00005,
        spotVolume24h: 1_240_000,
        futVolume24h: 1_980_000,
        validSince: Date.now() - 1000 * 60 * 19,
        fundingRateExpTs: Date.now() + 1000 * 60 * 120,
      },
    ],
    []
  );

  const sourceOpportunities = useMockData ? mockOpportunities : opportunities;

  const normalizeExchangeName = (raw: string) => {
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
    return raw.trim();
  };

  const getMetricsForOpp = useCallback(
    (op: ArbitrageOpportunity) => {
      const rawTicker = (op.ticker ?? "").toUpperCase().trim();
      const baseTicker = rawTicker.replace(/USDT$/i, "");
      const symbolCandidates = Array.from(
        new Set([rawTicker, baseTicker, `${baseTicker}USDT`].filter(Boolean))
      );

      const rawSpot = (op.lowestAsk?.exchange ?? "").trim();
      const rawFutures = (op.highestBid?.exchange ?? "").trim();
      const normalizedSpot = normalizeExchangeName(rawSpot);
      const normalizedFutures = normalizeExchangeName(rawFutures);
      const spotCandidates = Array.from(
        new Set([normalizedSpot, rawSpot].filter(Boolean))
      );
      const futuresCandidates = Array.from(
        new Set([normalizedFutures, rawFutures].filter(Boolean))
      );

      for (const symbol of symbolCandidates) {
        for (const spotExchange of spotCandidates) {
          for (const futuresExchange of futuresCandidates) {
            const key = `${symbol}:${spotExchange}:${futuresExchange}:${metricsPeriod}:${metricsIntent}`;
            const found = metricsByKey[key];
            if (found) return found;
          }
        }
      }
      return undefined;
    },
    [metricsByKey, metricsPeriod, metricsIntent]
  );

  // ✅ opcional: feedback visual no console
  useEffect(() => {
    if (isConnected && isReady) {
      console.log("✅ Socket conectado com exchanges:", {
        buyExNames,
        sellExNames,
      });
    }
  }, [isConnected, isReady, buyExNames, sellExNames]);

  // ✅ NOVO: aplica filtros iguais aos da tela antiga
  const deferredOpportunities = useMemo(
    () => sourceOpportunities ?? [],
    [sourceOpportunities]
  );
  const filteredOpps: ArbitrageOpportunity[] = useMemo(() => {
    const base = deferredOpportunities.filter((op) => {
      if (!op) return false;
      const askLiq = (op.lowestAsk?.price ?? 0) * (op.lowestAsk?.amount ?? 0);
      const bidLiq = (op.highestBid?.price ?? 0) * (op.highestBid?.amount ?? 0);
      const spotVol = op.spotVolume24h ?? 0;
      const futVol = op.futVolume24h ?? 0;
      if (op.ticker?.toUpperCase().includes("MET")) return false;
      // Usa spread de entrada ou fechamento baseado no modo
      const p = isExitMode ? op.spreadS : op.spread;
      const metrics = getMetricsForOpp(op);
      const invertedCount = Number(metrics?.invertidas ?? 0);
      const maxOpenPct = Number(metrics?.maxOpenPct ?? 0);
      const maxClosePct = Number(metrics?.maxClosePct ?? 0);
      const minInvertedSafe = Number.isFinite(minInverted)
        ? Math.max(0, Math.trunc(minInverted))
        : 0;
      const pass =
        p < maxProfit &&
        p > minProfit &&
        askLiq >= minLiquidity &&
        bidLiq >= minLiquidity &&
        (spotVol >= minVolume24h || futVol >= minVolume24h) &&
        invertedCount >= minInvertedSafe &&
        maxOpenPct >= minMaxOpenSpread &&
        maxClosePct >= minMaxCloseSpread;

      if (!pass) return false;
      if (!symbolFilter) return true;

      return op.ticker?.toUpperCase().includes(symbolFilter.toUpperCase());
    });

    // ordena por melhor spread (entrada ou fechamento baseado no modo)
    return base.sort((a, b) => {
      const aSpread = isExitMode ? a.spreadS ?? 0 : a.spread ?? 0;
      const bSpread = isExitMode ? b.spreadS ?? 0 : b.spread ?? 0;
      return bSpread - aSpread;
    });
  }, [
    deferredOpportunities,
    minProfit,
    maxProfit,
    minLiquidity,
    minVolume24h,
    minInverted,
    minMaxOpenSpread,
    minMaxCloseSpread,
    symbolFilter,
    isExitMode,
    metricsByKey,
    metricsPeriod,
    metricsIntent,
  ]);

  const displayOpps = useMemo(() => {
    return filteredOpps;
  }, [filteredOpps]);

  // Estados para alerta de spread
  const [spreadAlertConfig, setSpreadAlertConfig] =
    useState<SpreadAlertConfig | null>(() => {
      if (typeof window === "undefined") return null;
      try {
        const saved = localStorage.getItem("spreadAlertConfig");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    });

  // Estados temporários para o modal
  const [tempSpreadValue, setTempSpreadValue] = useState<number | "">(1.0);
  const [tempAlertDuration, setTempAlertDuration] = useState<number | "">(60);
  const [tempRepeatAlerts, setTempRepeatAlerts] = useState<boolean>(false);
  const [tempAlertInterval, setTempAlertInterval] = useState<number | "">(30);
  const [validationError, setValidationError] = useState<string>("");
  const toNumber = (value: number | "") =>
    value === "" ? Number.NaN : Number(value);

  // Carregar valores salvos quando abrir o modal
  useEffect(() => {
    if (isCustomModalOpen && spreadAlertConfig) {
      setTempSpreadValue(spreadAlertConfig.spreadValue);
      setTempAlertDuration(spreadAlertConfig.alertDuration);
      setTempRepeatAlerts(spreadAlertConfig.repeatAlerts);
      setTempAlertInterval(spreadAlertConfig.alertInterval);
      setValidationError("");
    } else if (isCustomModalOpen && !spreadAlertConfig) {
      // Valores padrão
      setTempSpreadValue(1.0);
      setTempAlertDuration(60);
      setTempRepeatAlerts(false);
      setTempAlertInterval(30);
      setValidationError("");
    }
  }, [isCustomModalOpen, spreadAlertConfig]);

  // Hook para monitorar alertas (deve estar depois de filteredOpps e isExitMode)
  useSpreadAlert(filteredOpps, spreadAlertConfig, isExitMode);

  // ---- resto igual ao seu código (exchanges permitidas + modal de exchanges) ----
  const ALLOWED_SPOT_EXCHANGES = [
    "Gateio",
    "Bitget",
    "Mexc",
    "Bingx",
    "Kucoin",
    "Bybit",
    "Huobi",
    "Okx",
  ];
  const ALLOWED_FUTURES_EXCHANGES = [
    "Gateio",
    "Bitget",
    "Mexc",
    "Bingx",
    "Kucoin",
    "Bybit",
    "Huobi",
    "Okx",
  ];
  const filteredSpotExchanges = initialExchanges?.filter((e) =>
    ALLOWED_SPOT_EXCHANGES.includes(e.name)
  );
  const filteredFuturesExchanges = initialExchanges?.filter((e) =>
    ALLOWED_FUTURES_EXCHANGES.includes(e.name)
  );

  useEffect(() => {
    if (modalOpen) {
      const storedSpot = localStorage.getItem("spotExchanges");
      const storedFutures = localStorage.getItem("futuresExchanges");
      setSpotSelectedExchanges(storedSpot ? JSON.parse(storedSpot) : []);
      setFuturesSelectedExchanges(
        storedFutures ? JSON.parse(storedFutures) : []
      );
    }
  }, [modalOpen]);

  const handleToggleExchange = (exchange: any, type: "spot" | "futures") => {
    const setSelected =
      type === "spot" ? setSpotSelectedExchanges : setFuturesSelectedExchanges;
    const storageKey = type === "spot" ? "spotExchanges" : "futuresExchanges";
    setSelected((prev) => {
      const isAlready = prev.some((e) => e.id === exchange.id);
      const updated = isAlready
        ? prev.filter((e) => e.id !== exchange.id)
        : [...prev, exchange];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdated"));
      return updated;
    });
  };
  const isExchangeSelected = (
    id: string,
    type: "spot" | "futures"
  ): boolean => {
    const selected =
      type === "spot" ? spotSelectedExchanges : futuresSelectedExchanges;
    return selected.some((e) => e.id === id);
  };

  const handleSelectAll = (type: "spot" | "futures") => {
    const storageKey = type === "spot" ? "spotExchanges" : "futuresExchanges";
    const all =
      type === "spot"
        ? [...(filteredSpotExchanges ?? [])]
        : [...(filteredFuturesExchanges ?? [])];
    localStorage.setItem(storageKey, JSON.stringify(all));
    window.dispatchEvent(new Event("exchangeUpdated"));
    if (type === "spot") {
      setSpotSelectedExchanges(all);
      return;
    }
    setFuturesSelectedExchanges(all);
  };

  const handleClearAll = (type: "spot" | "futures") => {
    const storageKey = type === "spot" ? "spotExchanges" : "futuresExchanges";
    localStorage.setItem(storageKey, JSON.stringify([]));
    window.dispatchEvent(new Event("exchangeUpdated"));
    if (type === "spot") {
      setSpotSelectedExchanges([]);
      return;
    }
    setFuturesSelectedExchanges([]);
  };

  // Função para abrir/fechar a sidebar em mobile
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Fecha a sidebar quando o modal abre (especialmente em mobile)
  useEffect(() => {
    if (
      modalOpen &&
      typeof window !== "undefined" &&
      window.innerWidth <= 768
    ) {
      setSidebarCollapsed(true);
    }
  }, [modalOpen]);

  return (
    <div className={styles.container} data-theme={uiTheme}>
      <div className={styles.backgroundBlur}></div>

      <NewPageSidebar
        onToggleChange={setIsSidebarOpen}
        onAddExchange={() => setModalOpen(true)}
        forceCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />
      <NewPageHeader onMenuClick={toggleSidebar} />

      <main className={styles.main}>
        {/* ⬇️ Tabela já com filtros aplicados */}
        <DemoGlassTable
          metricsByKey={metricsByKey}
          metricsPeriod={metricsPeriod}
          metricsIntent={metricsIntent}
          onMetricsPeriodChange={setMetricsPeriod}
          isSidebarOpen={isSidebarOpen}
          opportunities={displayOpps}
          /** ⬇️ busca controlada + abrir modal de filtros */
          searchValue={symbolFilter}
          onSearchChange={(v) => setSymbolFilter(v.toUpperCase())}
          onFilterClick={() => setIsFilterModalOpen(true)}
          /** ⬇️ modo de fechamento */
          isExitMode={isExitMode}
          onToggleExitMode={() => {
            const newValue = !isExitMode;
            setIsExitMode(newValue);
            localStorage.setItem("isExitMode", JSON.stringify(newValue));
          }}
          /** ⬇️ velocidade de atualização */
          refreshRate={refreshRate}
          onRefreshRateChange={(rate) => {
            setRefreshRate(rate);
            localStorage.setItem("refreshRate", rate.toString());
          }}
          /** ⬇️ pausar socket */
          isSocketPaused={isSocketPaused}
          onToggleSocketPause={() => {
            const newValue = !isSocketPaused;
            setIsSocketPaused(newValue);
            localStorage.setItem("isSocketPaused", JSON.stringify(newValue));
          }}
          /** ⬇️ botão customizado acima do header */
          onCustomButtonClick={() => setIsCustomModalOpen(true)}
        />
      </main>

      {/* MODAL DE EXCHANGES */}
      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        shellless
        panelClassName={styles.exchangeShelllessPanel}
        bodyClassName={styles.exchangeShelllessBody}
      >
        <div className={styles.exchangePickerRoot}>
          <button
            type="button"
            className={styles.exchangeFloatingClose}
            onClick={() => setModalOpen(false)}
            aria-label="Fechar modal de corretoras"
          >
            ×
          </button>

          <div className={styles.exchangeDualModal}>
            <section className={styles.exchangePanel}>
              <h3 className={styles.exchangePanelTitle}>SPOT</h3>
              <div className={styles.exchangePanelBox}>
                <div className={styles.exchangePanelToolbar}>
                  <span className={styles.exchangeCountPill}>
                    {spotSelectedExchanges.length} selecionadas
                  </span>
                  <div className={styles.exchangePanelActions}>
                    <button
                      type="button"
                      className={styles.exchangeToolbarBtn}
                      onClick={() => handleSelectAll("spot")}
                    >
                      Selecionar todas
                    </button>
                    <button
                      type="button"
                      className={styles.exchangeToolbarBtn}
                      onClick={() => handleClearAll("spot")}
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className={styles.exchangeCircleGrid}>
                  {(filteredSpotExchanges ?? []).map((exchange) => {
                    const selected = isExchangeSelected(exchange.id, "spot");
                    return (
                      <button
                        type="button"
                        key={`spot-${exchange.id}`}
                        className={`${styles.exchangeCircleCard} ${
                          selected ? styles.exchangeCircleSelected : ""
                        }`}
                        onClick={() => handleToggleExchange(exchange, "spot")}
                      >
                        {selected && (
                          <img
                            src="/images/checkedIcon.svg"
                            className={styles.exchangeCircleCheck}
                            alt="Selecionada"
                          />
                        )}
                        <div className={styles.exchangeCircleIconWrap}>
                          <img
                            src={exchange.image_url ?? ""}
                            alt={exchange.name}
                            onError={(e) =>
                              ((e.target as HTMLImageElement).src =
                                "/default-exchange.png")
                            }
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className={styles.exchangePanel}>
              <h3 className={styles.exchangePanelTitle}>FUTUROS</h3>
              <div className={styles.exchangePanelBox}>
                <div className={styles.exchangePanelToolbar}>
                  <span className={styles.exchangeCountPill}>
                    {futuresSelectedExchanges.length} selecionadas
                  </span>
                  <div className={styles.exchangePanelActions}>
                    <button
                      type="button"
                      className={styles.exchangeToolbarBtn}
                      onClick={() => handleSelectAll("futures")}
                    >
                      Selecionar todas
                    </button>
                    <button
                      type="button"
                      className={styles.exchangeToolbarBtn}
                      onClick={() => handleClearAll("futures")}
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className={styles.exchangeCircleGrid}>
                  {(filteredFuturesExchanges ?? []).map((exchange) => {
                    const selected = isExchangeSelected(exchange.id, "futures");
                    return (
                      <button
                        type="button"
                        key={`futures-${exchange.id}`}
                        className={`${styles.exchangeCircleCard} ${
                          selected ? styles.exchangeCircleSelected : ""
                        }`}
                        onClick={() =>
                          handleToggleExchange(exchange, "futures")
                        }
                      >
                        {selected && (
                          <img
                            src="/images/checkedIcon.svg"
                            className={styles.exchangeCircleCheck}
                            alt="Selecionada"
                          />
                        )}
                        <div className={styles.exchangeCircleIconWrap}>
                          <img
                            src={exchange.image_url ?? ""}
                            alt={exchange.name}
                            onError={(e) =>
                              ((e.target as HTMLImageElement).src =
                                "/default-exchange.png")
                            }
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </GlassModal>

      {/* MODAL CUSTOMIZADO - ALERTA DE SPREAD */}
      <GlassModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Alerta Geral de Spread"
        shellless
        panelClassName={styles.alertNarrowPanel}
        bodyClassName={styles.alertNarrowBody}
      >
        <div className={`${styles.modalContent} ${styles.alertModalBody}`}>
          <div className={styles.alertConfigV2}>
            <div className={styles.alertInlineHeader}>
              <h3 className={styles.alertInlineTitle}>
                Alerta Geral de Spread
                <AlertIcon className={styles.alertInlineTitleIcon} />
              </h3>
              <button
                type="button"
                className={styles.alertInlineClose}
                onClick={() => setIsCustomModalOpen(false)}
                aria-label="Fechar modal de alerta"
              >
                ×
              </button>
            </div>
            <div className={styles.alertIntroCard}>
              <h4 className={styles.alertIntroTitle}>Alerta Geral de Spread</h4>
              <p className={styles.alertIntroText}>
                Monitora automaticamente todas as combinações de exchanges e
                dispara alerta quando qualquer oportunidade atingir o spread
                definido.
              </p>
            </div>

            <div className={styles.alertFieldGrid}>
              <label className={styles.alertField}>
                Valor do Spread (%)
                <div className={styles.alertInputWrap}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tempSpreadValue}
                    onChange={(e) =>
                      setTempSpreadValue(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Ex: 1.5"
                  />
                  <span className={styles.alertUnit}>%</span>
                </div>
                <div className={styles.alertPresets}>
                  {[0.5, 1, 1.5, 2].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`${styles.alertPresetBtn} ${
                        toNumber(tempSpreadValue) === preset
                          ? styles.activePreset
                          : ""
                      }`}
                      onClick={() => setTempSpreadValue(preset)}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </label>

              <label className={styles.alertField}>
                Duração do Alerta (segundos)
                <div className={styles.alertInputWrap}>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={tempAlertDuration}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? Number.NaN
                          : Number(e.target.value);
                      setTempAlertDuration(
                        e.target.value === "" ? "" : Number(e.target.value)
                      );
                      if (
                        tempRepeatAlerts &&
                        Number.isFinite(value) &&
                        Number.isFinite(toNumber(tempAlertInterval)) &&
                        value > toNumber(tempAlertInterval)
                      ) {
                        setValidationError(
                          "A duração não pode ser maior que o intervalo entre alertas"
                        );
                      } else {
                        setValidationError("");
                      }
                    }}
                    placeholder="Ex: 60"
                  />
                  <span className={styles.alertUnit}>s</span>
                </div>
                <span className={styles.inputHint}>Máximo: 300 segundos</span>
              </label>
            </div>

            <div className={styles.alertToggleRow}>
              <div className={styles.alertToggleMeta}>
                <span className={styles.switchLabel}>
                  Ativar alertas repetidos
                </span>
                <span className={styles.inputHint}>
                  Reenvia alerta caso a arbitragem continue acima do spread.
                </span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={tempRepeatAlerts}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTempRepeatAlerts(checked);
                    if (
                      checked &&
                      Number.isFinite(toNumber(tempAlertDuration)) &&
                      Number.isFinite(toNumber(tempAlertInterval)) &&
                      toNumber(tempAlertDuration) > toNumber(tempAlertInterval)
                    ) {
                      setTempAlertInterval(toNumber(tempAlertDuration));
                    }
                    setValidationError("");
                  }}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {tempRepeatAlerts && (
              <label className={styles.alertField}>
                Intervalo entre Alertas (segundos)
                <div className={styles.alertInputWrap}>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={tempAlertInterval}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? Number.NaN
                          : Number(e.target.value);
                      setTempAlertInterval(
                        e.target.value === "" ? "" : Number(e.target.value)
                      );
                      if (
                        Number.isFinite(value) &&
                        Number.isFinite(toNumber(tempAlertDuration)) &&
                        value < toNumber(tempAlertDuration)
                      ) {
                        setValidationError(
                          "O intervalo deve ser maior ou igual à duração do alerta"
                        );
                      } else {
                        setValidationError("");
                      }
                    }}
                    placeholder="Ex: 30"
                  />
                  <span className={styles.alertUnit}>s</span>
                </div>
                <span className={styles.inputHint}>
                  Deve ser maior ou igual à duração do alerta.
                </span>
              </label>
            )}

            <div className={styles.alertPreview}>
              Vai alertar quando spread &ge;{" "}
              <strong>
                {Number.isFinite(toNumber(tempSpreadValue))
                  ? toNumber(tempSpreadValue).toFixed(2)
                  : "0.00"}
                %
              </strong>{" "}
              por{" "}
              <strong>
                {Math.max(
                  0,
                  Number.isFinite(toNumber(tempAlertDuration))
                    ? toNumber(tempAlertDuration)
                    : 0
                )}
                s
              </strong>
              {tempRepeatAlerts && (
                <>
                  {" "}
                  a cada{" "}
                  <strong>
                    {Math.max(
                      0,
                      Number.isFinite(toNumber(tempAlertInterval))
                        ? toNumber(tempAlertInterval)
                        : 0
                    )}
                    s
                  </strong>
                </>
              )}
              .
            </div>

            {validationError && (
              <div className={styles.validationError}>{validationError}</div>
            )}
          </div>
        </div>

        <div className={`${styles.modalButtons} ${styles.alertModalActions}`}>
          <button
            className={styles.confirmButton}
            onClick={() => {
              const spreadValue = toNumber(tempSpreadValue);
              const alertDuration = toNumber(tempAlertDuration);
              const alertInterval = toNumber(tempAlertInterval);

              if (!Number.isFinite(spreadValue) || spreadValue < 0) {
                setValidationError("Informe um valor de spread válido.");
                return;
              }

              if (!Number.isFinite(alertDuration) || alertDuration <= 0) {
                setValidationError("Informe uma duração válida para o alerta.");
                return;
              }

              // Validar antes de salvar
              if (
                tempRepeatAlerts &&
                (!Number.isFinite(alertInterval) || alertInterval <= 0)
              ) {
                setValidationError(
                  "Informe um intervalo válido entre alertas."
                );
                return;
              }

              if (tempRepeatAlerts && alertDuration > alertInterval) {
                setValidationError(
                  "A duração não pode ser maior que o intervalo entre alertas"
                );
                return;
              }

              // Limitar valores máximos
              const finalDuration = Math.min(alertDuration, 300);
              const finalInterval = Math.min(
                Number.isFinite(alertInterval) ? alertInterval : finalDuration,
                300
              );

              const newConfig: SpreadAlertConfig = {
                spreadValue,
                alertDuration: finalDuration,
                repeatAlerts: tempRepeatAlerts,
                alertInterval: finalInterval,
                isActive: true,
              };
              setSpreadAlertConfig(newConfig);
              localStorage.setItem(
                "spreadAlertConfig",
                JSON.stringify(newConfig)
              );
              setValidationError("");
              setIsCustomModalOpen(false);
            }}
            disabled={!!validationError}
          >
            {spreadAlertConfig?.isActive
              ? "Salvar Alterações"
              : "Ativar Alerta"}
          </button>
          {spreadAlertConfig?.isActive && (
            <button
              className={styles.cancelButton}
              onClick={() => {
                const deactivatedConfig: SpreadAlertConfig = {
                  ...spreadAlertConfig,
                  isActive: false,
                };
                setSpreadAlertConfig(deactivatedConfig);
                localStorage.setItem(
                  "spreadAlertConfig",
                  JSON.stringify(deactivatedConfig)
                );
                setIsCustomModalOpen(false);
              }}
              style={{ background: "#ff3838" }}
            >
              Desativar
            </button>
          )}
          <button
            className={styles.cancelButton}
            onClick={() => setIsCustomModalOpen(false)}
          >
            Cancelar
          </button>
        </div>
      </GlassModal>

      <GlassModal
        isOpen={isFilterModalOpen}
        onClose={closeFilter}
        title="Filtro de Dados"
        shellless
        panelClassName={styles.filterNarrowPanel}
        bodyClassName={styles.filterNarrowBody}
      >
        <div className={styles.filterModalBody}>
          <div className={styles.filterConfigV2}>
            <div className={styles.filterInlineHeader}>
              <h3 className={styles.filterInlineTitle}>
                Filtro de Dados
                <FilterIcon className={styles.filterInlineTitleIcon} />
              </h3>
              <button
                type="button"
                className={styles.alertInlineClose}
                onClick={closeFilter}
                aria-label="Fechar modal de filtros"
              >
                ×
              </button>
            </div>

            <div className={styles.filterIntroCard}>
              <h4 className={styles.filterIntroTitle}>Filtro Operacional</h4>
              <p className={styles.filterIntroText}>
                Defina faixa de lucro e mínimos de liquidez/volume para mostrar
                apenas oportunidades relevantes no monitor.
              </p>
            </div>

            <div className={styles.filterPreview}>
              <div className={styles.filterPreviewGrid}>
                <div className={styles.filterPreviewItem}>
                  <span className={styles.filterPreviewLabel}>Lucro Mín.</span>
                  <div className={styles.filterPreviewEditable}>
                    <input
                      className={styles.filterPreviewInput}
                      type="number"
                      aria-label="Lucro mínimo"
                      placeholder="0.5"
                      value={tempMinProfit}
                      onChange={(e) => setTempMinProfit(Number(e.target.value))}
                    />
                    <span className={styles.filterPreviewValue}>%</span>
                  </div>
                </div>
                <div className={styles.filterPreviewItem}>
                  <span className={styles.filterPreviewLabel}>Lucro Máx.</span>
                  <div className={styles.filterPreviewEditable}>
                    <input
                      className={styles.filterPreviewInput}
                      type="number"
                      aria-label="Lucro máximo"
                      placeholder="200"
                      value={tempMaxProfit}
                      onChange={(e) => setTempMaxProfit(Number(e.target.value))}
                    />
                    <span className={styles.filterPreviewValue}>%</span>
                  </div>
                </div>
                <div className={styles.filterPreviewItem}>
                  <span className={styles.filterPreviewLabel}>
                    Liquidez Mín.
                  </span>
                  <div className={styles.filterPreviewEditable}>
                    <input
                      className={styles.filterPreviewInput}
                      type="number"
                      value={tempMinLiquidity}
                      onChange={(e) =>
                        setTempMinLiquidity(Number(e.target.value))
                      }
                    />
                    <span className={styles.filterPreviewValue}>USDT</span>
                  </div>
                </div>
                <div className={styles.filterPreviewItem}>
                  <span className={styles.filterPreviewLabel}>
                    Volume 24h Mín.
                  </span>
                  <div className={styles.filterPreviewEditable}>
                    <input
                      className={styles.filterPreviewInput}
                      type="number"
                      value={tempMinVolume24h}
                      onChange={(e) =>
                        setTempMinVolume24h(Number(e.target.value))
                      }
                    />
                    <span className={styles.filterPreviewValue}>USDT</span>
                  </div>
                </div>
                <div className={styles.filterPreviewItem}>
                  <span
                    className={`${styles.filterPreviewLabel} ${styles.filterPreviewLabelLong}`}
                  >
                    Maior Spread de Abertura Mín.
                  </span>
                  <div className={styles.filterPreviewEditable}>
                    <input
                      className={styles.filterPreviewInput}
                      type="number"
                      step="0.01"
                      value={tempMinMaxOpenSpread}
                      onChange={(e) =>
                        setTempMinMaxOpenSpread(Number(e.target.value))
                      }
                    />
                    <span className={styles.filterPreviewValue}>%</span>
                  </div>
                </div>
                <div className={styles.filterPreviewItem}>
                  <span
                    className={`${styles.filterPreviewLabel} ${styles.filterPreviewLabelLong}`}
                  >
                    Maior Spread de Fechamento Mín.
                  </span>
                  <div className={styles.filterPreviewEditable}>
                    <input
                      className={styles.filterPreviewInput}
                      type="number"
                      step="0.01"
                      value={tempMinMaxCloseSpread}
                      onChange={(e) =>
                        setTempMinMaxCloseSpread(Number(e.target.value))
                      }
                    />
                    <span className={styles.filterPreviewValue}>%</span>
                  </div>
                </div>
                <div className={styles.filterPreviewItem}>
                  <span className={styles.filterPreviewLabel}>
                    Invertidas Mín.
                  </span>
                  <div className={styles.filterPreviewEditable}>
                    <input
                      className={styles.filterPreviewInput}
                      type="number"
                      min="0"
                      value={tempMinInverted}
                      onChange={(e) =>
                        setTempMinInverted(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.modalButtons} ${styles.filterModalActions}`}>
          <button
            className={styles.confirmButton}
            onClick={() => {
              setMinProfit(tempMinProfit);
              setMaxProfit(tempMaxProfit);
              setMinLiquidity(tempMinLiquidity);
              setMinVolume24h(tempMinVolume24h);
              setMinInverted(tempMinInverted);
              setMinMaxOpenSpread(tempMinMaxOpenSpread);
              setMinMaxCloseSpread(tempMinMaxCloseSpread);
              setIsFilterModalOpen(false);
            }}
          >
            Aplicar
          </button>
          <button
            className={styles.cancelButton}
            onClick={() => setIsFilterModalOpen(false)}
          >
            Cancelar
          </button>
        </div>
      </GlassModal>
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const trpcCtx = await createContext({ req: ctx.req, res: ctx.res });
  const caller = appRouter.createCaller(trpcCtx);
  const activeExchanges = await caller.query("exchange.getActiveExchanges");
  // // verifique a session
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { initialExchanges: activeExchanges } };
}
