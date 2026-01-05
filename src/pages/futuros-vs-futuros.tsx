"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../styles/futures-new.module.scss";
import FuturesFuturesSidebar from "../components/new-page/sidebar-futures-futures";
import NewPageHeader from "../components/new-page/header/header";
import { DemoGlassTable } from "../components/new-page/glass-table/glass-table";
import GlassModal from "../components/new-page/modal/glass-modal";
import { appRouter } from "../server/router";
import { GetServerSidePropsContext } from "next";
import { createContext } from "../server/router/context";
import { useArbitrageSocketFuturesFutures } from "../hooks/useArbitrageSocketFuturesFutures";
import {
  useSpreadAlert,
  type SpreadAlertConfig,
} from "../hooks/useSpreadAlert";
import type { ArbitrageOpportunity } from "../server/router/orderbook";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

export default function FuturesVsFuturesPage({
  initialExchanges,
}: {
  initialExchanges: any[];
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"buy" | "sell">("buy");
  const [selectedExchanges, setSelectedExchanges] = useState<any[]>([]);
  const closeFilter = useCallback(() => setIsFilterModalOpen(false), []);
  
  // Estados de filtro
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [minProfit, setMinProfit] = useState<number>(0.5);
  const [maxProfit, setMaxProfit] = useState<number>(200);
  const [minLiquidity, setMinLiquidity] = useState<number>(0);
  const [minVolume24h, setMinVolume24h] = useState<number>(0);
  const [tempMinProfit, setTempMinProfit] = useState(minProfit);
  const [tempMaxProfit, setTempMaxProfit] = useState(maxProfit);
  const [tempMinLiquidity, setTempMinLiquidity] = useState(minLiquidity);
  const [tempMinVolume24h, setTempMinVolume24h] = useState(minVolume24h);

  // Busca por símbolo
  const [symbolFilter, setSymbolFilter] = useState("");

  // Modal customizado
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Modo de fechamento
  const [isExitMode, setIsExitMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("futFutIsExitMode");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Pausar socket
  const [isSocketPaused, setIsSocketPaused] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("futFutIsSocketPaused");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Socket
  const [symbols] = useState<string[]>([]);
  const [refreshRate, setRefreshRate] = useState<number>(() => {
    if (typeof window === "undefined") return 1000;
    try {
      const saved = localStorage.getItem("futFutRefreshRate");
      return saved ? Number(saved) : 1000;
    } catch {
      return 1000;
    }
  });

  // Carrega exchanges salvas - FUTUROS BUY E SELL
  const [buyExNames, setBuyExNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const buyFutures = JSON.parse(
        localStorage.getItem("buyFuturesExchanges") || "[]"
      );
      return buyFutures.map((x: any) => x.name);
    } catch {
      return [];
    }
  });

  const [sellExNames, setSellExNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const sellFutures = JSON.parse(
        localStorage.getItem("sellFuturesExchanges") || "[]"
      );
      return sellFutures.map((x: any) => x.name);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        const buyFutures = JSON.parse(
          localStorage.getItem("buyFuturesExchanges") || "[]"
        );
        const sellFutures = JSON.parse(
          localStorage.getItem("sellFuturesExchanges") || "[]"
        );
        setBuyExNames(buyFutures.map((x: any) => x.name));
        setSellExNames(sellFutures.map((x: any) => x.name));
      } catch {}
    };
    window.addEventListener("exchangeUpdatedFutFut", handler);
    return () => window.removeEventListener("exchangeUpdatedFutFut", handler);
  }, []);

  const pullSelectedFromStorage = useCallback(() => {
    try {
      const buyFutures = JSON.parse(
        localStorage.getItem("buyFuturesExchanges") || "[]"
      );
      const sellFutures = JSON.parse(
        localStorage.getItem("sellFuturesExchanges") || "[]"
      );
      const buyFuturesNames = buyFutures.map((x: any) => x.name);
      const sellFuturesNames = sellFutures.map((x: any) => x.name);
      setBuyExNames(buyFuturesNames);
      setSellExNames(sellFuturesNames);
      return { buyFuturesNames, sellFuturesNames };
    } catch {
      return { buyFuturesNames: [], sellFuturesNames: [] };
    }
  }, []);

  // Só inicia o socket depois de ter as exchanges carregadas
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const { buyFuturesNames, sellFuturesNames } = pullSelectedFromStorage();
    if (buyFuturesNames.length || sellFuturesNames.length) {
      setIsReady(true);
    }
    const handler = () => {
      const { buyFuturesNames, sellFuturesNames } = pullSelectedFromStorage();
      if (buyFuturesNames.length || sellFuturesNames.length) {
        setIsReady(true);
      }
    };
    window.addEventListener("exchangeUpdatedFutFut", handler);
    return () => window.removeEventListener("exchangeUpdatedFutFut", handler);
  }, [pullSelectedFromStorage]);

  // Conecta ao socket APENAS quando exchanges estiverem prontas
  const { opportunities, isConnected } = useArbitrageSocketFuturesFutures(
    symbols,
    refreshRate,
    buyExNames,
    sellExNames,
    isSocketPaused
  );

  // Feedback visual no console
  useEffect(() => {
    if (isConnected && isReady) {
      console.log("✅ Socket Futures/Futures conectado com exchanges:", {
        buyExNames,
        sellExNames,
      });
    }
  }, [isConnected, isReady, buyExNames, sellExNames]);

  // Aplica filtros
  const filteredOpps: ArbitrageOpportunity[] = useMemo(() => {
    const base = (opportunities ?? []).filter((op) => {
      if (!op) return false;
      const askLiq = (op.lowestAsk?.price ?? 0) * (op.lowestAsk?.amount ?? 0);
      const bidLiq = (op.highestBid?.price ?? 0) * (op.highestBid?.amount ?? 0);
      const spotVol = op.spotVolume24h ?? 0;
      const futVol = op.futVolume24h ?? 0;
      if (op.ticker?.toUpperCase().includes("MET")) return false;
      
      const p = isExitMode ? op.spreadS : op.spread;
      const pass =
        p < maxProfit &&
        p > minProfit &&
        askLiq >= minLiquidity &&
        bidLiq >= minLiquidity &&
        (spotVol >= minVolume24h || futVol >= minVolume24h);

      if (!pass) return false;
      if (!symbolFilter) return true;

      return op.ticker?.toUpperCase().includes(symbolFilter.toUpperCase());
    });

    return base.sort((a, b) => {
      const aSpread = isExitMode ? a.spreadS ?? 0 : a.spread ?? 0;
      const bSpread = isExitMode ? b.spreadS ?? 0 : b.spread ?? 0;
      return bSpread - aSpread;
    });
  }, [
    opportunities,
    minProfit,
    maxProfit,
    minLiquidity,
    minVolume24h,
    symbolFilter,
    isExitMode,
  ]);

  // Estados para alerta de spread
  const [spreadAlertConfig, setSpreadAlertConfig] =
    useState<SpreadAlertConfig | null>(() => {
      if (typeof window === "undefined") return null;
      try {
        const saved = localStorage.getItem("futFutSpreadAlertConfig");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    });

  const [tempSpreadValue, setTempSpreadValue] = useState<number>(1.0);
  const [tempAlertDuration, setTempAlertDuration] = useState<number>(60);
  const [tempRepeatAlerts, setTempRepeatAlerts] = useState<boolean>(false);
  const [tempAlertInterval, setTempAlertInterval] = useState<number>(30);
  const [validationError, setValidationError] = useState<string>("");

  useEffect(() => {
    if (isCustomModalOpen && spreadAlertConfig) {
      setTempSpreadValue(spreadAlertConfig.spreadValue);
      setTempAlertDuration(spreadAlertConfig.alertDuration);
      setTempRepeatAlerts(spreadAlertConfig.repeatAlerts);
      setTempAlertInterval(spreadAlertConfig.alertInterval);
      setValidationError("");
    } else if (isCustomModalOpen && !spreadAlertConfig) {
      setTempSpreadValue(1.0);
      setTempAlertDuration(60);
      setTempRepeatAlerts(false);
      setTempAlertInterval(30);
      setValidationError("");
    }
  }, [isCustomModalOpen, spreadAlertConfig]);

  useSpreadAlert(filteredOpps, spreadAlertConfig, isExitMode);

  // Exchanges permitidas (apenas futures)
  const ALLOWED_FUTURES_EXCHANGES = [
    "Gateio",
    "Bitget",
    "Mexc",
    "Bingx",
    "Kucoin",
    "Bybit",
    "Huobi",
  ];
  
  const filteredFuturesExchanges = initialExchanges?.filter((e) =>
    ALLOWED_FUTURES_EXCHANGES.includes(e.name)
  );
  const exchangesToShow = filteredFuturesExchanges;

  useEffect(() => {
    if (modalOpen) {
      const storageKey =
        modalType === "buy" ? "buyFuturesExchanges" : "sellFuturesExchanges";
      const stored = localStorage.getItem(storageKey);
      setSelectedExchanges(stored ? JSON.parse(stored) : []);
    }
  }, [modalOpen, modalType]);

  const handleToggleExchange = (exchange: any) => {
    setSelectedExchanges((prev) => {
      const isAlready = prev.some((e) => e.id === exchange.id);
      const updated = isAlready
        ? prev.filter((e) => e.id !== exchange.id)
        : [...prev, exchange];
      const storageKey =
        modalType === "buy" ? "buyFuturesExchanges" : "sellFuturesExchanges";
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdatedFutFut"));
      return updated;
    });
  };
  
  const isExchangeSelected = (id: string) =>
    selectedExchanges.some((e) => e.id === id);

  return (
    <div className={styles.container}>
      <div className={styles.backgroundBlur}></div>

      <FuturesFuturesSidebar
        onToggleChange={setIsSidebarOpen}
        onAddExchange={(type) => {
          setModalType(type);
          setModalOpen(true);
        }}
      />
      <NewPageHeader />

      <main className={styles.main}>
        <DemoGlassTable
          isSidebarOpen={isSidebarOpen}
          opportunities={filteredOpps}
          searchValue={symbolFilter}
          onSearchChange={(v) => setSymbolFilter(v.toUpperCase())}
          onFilterClick={() => setIsFilterModalOpen(true)}
          isExitMode={isExitMode}
          onToggleExitMode={() => {
            const newValue = !isExitMode;
            setIsExitMode(newValue);
            localStorage.setItem("futFutIsExitMode", JSON.stringify(newValue));
          }}
          refreshRate={refreshRate}
          onRefreshRateChange={(rate) => {
            setRefreshRate(rate);
            localStorage.setItem("futFutRefreshRate", rate.toString());
          }}
          isSocketPaused={isSocketPaused}
          onToggleSocketPause={() => {
            const newValue = !isSocketPaused;
            setIsSocketPaused(newValue);
            localStorage.setItem("futFutIsSocketPaused", JSON.stringify(newValue));
          }}
          onCustomButtonClick={() => setIsCustomModalOpen(true)}
        />
      </main>

      {/* MODAL DE EXCHANGES */}
      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Selecionar exchanges FUTURES - ${
          modalType === "buy" ? "COMPRA" : "VENDA"
        }`}
      >
        <div className={styles.modalGrid}>
          {exchangesToShow?.map((exchange) => {
            const selected = isExchangeSelected(exchange.id);
            return (
              <div
                key={exchange.id}
                className={`${styles.exchangeCard} ${
                  selected ? styles.selected : ""
                }`}
                onClick={() => handleToggleExchange(exchange)}
              >
                <div className={styles.exchangeIcon}>
                  <img
                    src={exchange.image_url ?? ""}
                    alt={exchange.name}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "/default-exchange.png")
                    }
                  />
                </div>
                <div className={styles.exchangeName}>{exchange.name}</div>
                {selected && (
                  <img
                    src="/images/checkedIcon.svg"
                    className={styles.checkedIcon}
                    alt="Selecionada"
                  />
                )}
              </div>
            );
          })}
        </div>
      </GlassModal>

      {/* MODAL CUSTOMIZADO - ALERTA DE SPREAD */}
      <GlassModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Alerta Geral de Spread (Futures/Futures)"
      >
        <div className={styles.modalContent}>
          <div className={styles.alertDescription}>
            <p>
              Configure um valor de spread para arbitragem entre futuros.
            </p>
          </div>

          <label>
            Valor do Spread (%):
            <input
              type="number"
              step="0.01"
              min="0"
              value={tempSpreadValue}
              onChange={(e) => setTempSpreadValue(Number(e.target.value))}
              placeholder="Ex: 1.5"
            />
          </label>

          <label>
            Duração do Alerta (segundos):
            <input
              type="number"
              min="1"
              max="300"
              value={tempAlertDuration}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempAlertDuration(value);
                if (tempRepeatAlerts && value > tempAlertInterval) {
                  setValidationError(
                    "A duração não pode ser maior que o intervalo entre alertas"
                  );
                } else {
                  setValidationError("");
                }
              }}
              placeholder="Ex: 60"
            />
            <span className={styles.inputHint}>
              Máximo: 300 segundos (5 minutos)
            </span>
          </label>

          <div className={styles.switchContainer}>
            <label className={styles.switchLabel}>
              Enviar alertas repetidos?
            </label>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={tempRepeatAlerts}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setTempRepeatAlerts(checked);
                  if (checked && tempAlertDuration > tempAlertInterval) {
                    setTempAlertInterval(tempAlertDuration);
                    setValidationError("");
                  } else {
                    setValidationError("");
                  }
                }}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {tempRepeatAlerts && (
            <label>
              Intervalo entre Alertas (segundos):
              <input
                type="number"
                min="1"
                max="300"
                value={tempAlertInterval}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setTempAlertInterval(value);
                  if (value < tempAlertDuration) {
                    setValidationError(
                      "O intervalo deve ser maior ou igual à duração do alerta"
                    );
                  } else {
                    setValidationError("");
                  }
                }}
                placeholder="Ex: 30"
              />
              <span className={styles.inputHint}>
                Máximo: 300 segundos (5 minutos). Deve ser ≥ duração do alerta
              </span>
            </label>
          )}

          {validationError && (
            <div className={styles.validationError}>{validationError}</div>
          )}
        </div>

        <div className={styles.modalButtons}>
          <button
            className={styles.confirmButton}
            onClick={() => {
              if (tempRepeatAlerts && tempAlertDuration > tempAlertInterval) {
                setValidationError(
                  "A duração não pode ser maior que o intervalo entre alertas"
                );
                return;
              }

              const finalDuration = Math.min(tempAlertDuration, 300);
              const finalInterval = Math.min(tempAlertInterval, 300);

              const newConfig: SpreadAlertConfig = {
                spreadValue: tempSpreadValue,
                alertDuration: finalDuration,
                repeatAlerts: tempRepeatAlerts,
                alertInterval: finalInterval,
                isActive: true,
              };
              setSpreadAlertConfig(newConfig);
              localStorage.setItem(
                "futFutSpreadAlertConfig",
                JSON.stringify(newConfig)
              );
              setValidationError("");
              setIsCustomModalOpen(false);
            }}
            disabled={!!validationError}
          >
            {spreadAlertConfig?.isActive ? "Atualizar Alerta" : "Ativar Alerta"}
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
                  "futFutSpreadAlertConfig",
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
        title="Filtro de Lucro"
      >
        <div className={styles.modalContent}>
          <label>
            Lucro Mínimo (%):
            <input
              type="number"
              value={tempMinProfit}
              onChange={(e) => setTempMinProfit(Number(e.target.value))}
            />
          </label>
          <label>
            Lucro Máximo (%):
            <input
              type="number"
              value={tempMaxProfit}
              onChange={(e) => setTempMaxProfit(Number(e.target.value))}
            />
          </label>
          <label>
            Liquidez Mínima (USDT):
            <input
              type="number"
              value={tempMinLiquidity}
              onChange={(e) => setTempMinLiquidity(Number(e.target.value))}
            />
          </label>
          <label>
            Volume Mínimo (24h USDT):
            <input
              type="number"
              value={tempMinVolume24h}
              onChange={(e) => setTempMinVolume24h(Number(e.target.value))}
            />
          </label>
        </div>

        <div className={styles.modalButtons}>
          <button
            className={styles.confirmButton}
            onClick={() => {
              setMinProfit(tempMinProfit);
              setMaxProfit(tempMaxProfit);
              setMinLiquidity(tempMinLiquidity);
              setMinVolume24h(tempMinVolume24h);
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
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { initialExchanges: activeExchanges } };
}
