"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../styles/futures-new.module.scss";
import NewPageSidebar from "../components/new-page/sidebar";
import NewPageHeader from "../components/new-page/header/header";
import { DemoGlassTable } from "../components/new-page/glass-table/glass-table";
import GlassModal from "../components/new-page/modal/glass-modal";
import { appRouter } from "../server/router";
import { GetServerSidePropsContext } from "next";
import { createContext } from "../server/router/context";
import { useArbitrageSocket } from "../hooks/useArbitrageSocket";
import type { ArbitrageOpportunity } from "../server/router/orderbook";

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
  return { props: { initialExchanges: activeExchanges } };
}
