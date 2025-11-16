"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../styles/futures-new.module.scss";
import NewPageSidebar from "../components/new-page/sidebar";
import NewPageHeader from "../components/new-page/header/header";
import { DemoGlassTable } from "../components/new-page/glass-table/glass-table";
import GlassModal from "../components/new-page/modal/glass-modal";
import ConfigIcon from "../components/Icons/ConfigIcon";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"spot" | "futures">("spot");
  const [selectedExchanges, setSelectedExchanges] = useState<any[]>([]);
  const closeFilter = useCallback(() => setIsFilterModalOpen(false), []);
  // ✅ NOVO: estados de filtro
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [minProfit, setMinProfit] = useState<number>(0.5);
  const [maxProfit, setMaxProfit] = useState<number>(200);
  const [minLiquidity, setMinLiquidity] = useState<number>(0);
  const [minVolume24h, setMinVolume24h] = useState<number>(0);
  const [tempMinProfit, setTempMinProfit] = useState(minProfit);
  const [tempMaxProfit, setTempMaxProfit] = useState(maxProfit);
  const [tempMinLiquidity, setTempMinLiquidity] = useState(minLiquidity);
  const [tempMinVolume24h, setTempMinVolume24h] = useState(minVolume24h);

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

  // 🔌 conecta ao socket APENAS quando exchanges estiverem prontas
  const { opportunities, isConnected } = useArbitrageSocket(
    symbols,
    refreshRate,
    buyExNames,
    sellExNames,
    isSocketPaused
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
  const filteredOpps: ArbitrageOpportunity[] = useMemo(() => {
    const base = (opportunities ?? []).filter((op) => {
      if (!op) return false;
      const askLiq = (op.lowestAsk?.price ?? 0) * (op.lowestAsk?.amount ?? 0);
      const bidLiq = (op.highestBid?.price ?? 0) * (op.highestBid?.amount ?? 0);
      const spotVol = op.spotVolume24h ?? 0;
      const futVol = op.futVolume24h ?? 0;
      if (op.ticker?.toUpperCase().includes("MET")) return false;
      // Usa spread de entrada ou fechamento baseado no modo
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

    // ordena por melhor spread (entrada ou fechamento baseado no modo)
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
  console.log("filteredOpps", filteredOpps[0]);

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
  const [tempSpreadValue, setTempSpreadValue] = useState<number>(1.0);
  const [tempAlertDuration, setTempAlertDuration] = useState<number>(60);
  const [tempRepeatAlerts, setTempRepeatAlerts] = useState<boolean>(false);
  const [tempAlertInterval, setTempAlertInterval] = useState<number>(30);
  const [validationError, setValidationError] = useState<string>("");

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
  ];
  const ALLOWED_FUTURES_EXCHANGES = [
    "Gateio",
    "Bitget",
    "Mexc",
    "Bingx",
    "Kucoin",
    "Bybit",
    "Huobi",
  ];
  const filteredSpotExchanges = initialExchanges?.filter((e) =>
    ALLOWED_SPOT_EXCHANGES.includes(e.name)
  );
  const filteredFuturesExchanges = initialExchanges?.filter((e) =>
    ALLOWED_FUTURES_EXCHANGES.includes(e.name)
  );
  const exchangesToShow =
    modalType === "spot" ? filteredSpotExchanges : filteredFuturesExchanges;

  useEffect(() => {
    if (modalOpen) {
      const storageKey =
        modalType === "spot" ? "spotExchanges" : "futuresExchanges";
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
        modalType === "spot" ? "spotExchanges" : "futuresExchanges";
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdated"));
      return updated;
    });
  };
  const isExchangeSelected = (id: string) =>
    selectedExchanges.some((e) => e.id === id);

  return (
    <div className={styles.container}>
      <div className={styles.backgroundBlur}></div>

      <NewPageSidebar
        onToggleChange={setIsSidebarOpen}
        onAddExchange={(type) => {
          setModalType(type);
          setModalOpen(true);
        }}
      />
      <NewPageHeader />

      <main className={styles.main}>
        {/* ⬇️ Tabela já com filtros aplicados */}
        <DemoGlassTable
          isSidebarOpen={isSidebarOpen}
          opportunities={filteredOpps}
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

      {/* MODAL DE EXCHANGES (igual ao seu) */}
      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Selecionar exchanges ${
          modalType === "spot" ? "SPOT" : "FUTURES"
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
        title="Alerta Geral de Spread"
      >
        <div className={styles.modalContent}>
          <div className={styles.alertDescription}>
            <p>
              Configure um valor de spread que será monitorado em todas as
              oportunidades de arbitragem disponíveis.
            </p>
            <ul>
              <li>
                Monitora automaticamente todas as combinações de exchanges
              </li>
              <li>
                Receba notificação quando qualquer arbitragem atingir o spread
                desejado ou acima
              </li>
            </ul>
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
                // Validar quando alertas repetidos estão ativos
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
                  // Se ativar alertas repetidos, ajustar intervalo se necessário
                  if (checked && tempAlertDuration > tempAlertInterval) {
                    // Ajustar automaticamente o intervalo para ser igual à duração
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
                  // Validar: intervalo deve ser >= duração
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
              // Validar antes de salvar
              if (tempRepeatAlerts && tempAlertDuration > tempAlertInterval) {
                setValidationError(
                  "A duração não pode ser maior que o intervalo entre alertas"
                );
                return;
              }

              // Limitar valores máximos
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
                "spreadAlertConfig",
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
  // // verifique a session
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { initialExchanges: activeExchanges } };
}
