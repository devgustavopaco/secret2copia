import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { BeatLoader, PacmanLoader } from "react-spinners";
import { toast } from "react-toastify";
import { XCircle, Pause, Play, Funnel, Calculator, Gear } from "phosphor-react";

import { Header } from "../components/Header";
import CurrencyCarousel from "../components/MarketCarousel";
import { BuyExchangeMobile } from "../components/Mobile/BuyExchangeMobile";
import { SellExchangeMobile } from "../components/Mobile/SellExchangeMobile";
import { ModalOrderBook } from "../components/Modals/ModalOrderBook";
import { FuturosTable } from "../components/FuturosOperationCard/FuturosTable";
import { FuturosSidebar } from "../components/FuturosSidebar";

import { updateIP } from "../server/db/checkIP";
import { fetchTickerData } from "../server/db/fetchTicketData";
import { getSupportNumber } from "../server/db/getSuportNumber";
import { ArbitrageOpportunity } from "../server/router/orderbook";

import styles from "../styles/futuros.module.scss";
import { Currency } from "../types/dto";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import { useArbitrageSocket } from "../hooks/useArbitrageSocket";
import { useQueryClient } from "react-query";

const Lottie = dynamic(() => import("react-lottie"), { ssr: false });
import loadingAnimation from "../animations/dollar.json";

interface FuturosProps {
  ip: string;
  supportNumber: string;
  hasIPChanged: boolean;
  isAdmin: boolean;
  isNewUser: boolean;
  tickerData: Currency[];
}

const Futuros: NextPage<FuturosProps> = ({
  ip,
  hasIPChanged,
  isAdmin,
  isNewUser,
  supportNumber,
  tickerData,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isCleaned, setIsCleaned] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [minProfit, setMinProfit] = useState<number>(0.5);
  const [maxProfit, setMaxProfit] = useState<number>(200);
  const [minLiquidity, setMinLiquidity] = useState<number>(0);
  const [minVolume24h, setMinVolume24h] = useState<number>(0);

  const [orphanCoins, setOrphanCoins] = useState<any[]>([]);
  const [isWebSocketPaused, setIsWebSocketPaused] = useState(false);

  const [tickerInput, setTickerInput] = useState("");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbolFilter, setSymbolFilter] = useState("");

  const [isTradingViewOpen, setIsTradingViewOpen] = useState(false);
  const [tradingViewUrl, setTradingViewUrl] = useState<string | null>(null);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [isViewConfigOpen, setIsViewConfigOpen] = useState(false);
  const [viewConfig, setViewConfig] = useState({
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
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  const router = useRouter();
  useEffect(() => {
    if (isChecked && router.pathname === "/futuros") {
      document.body.classList.add("monitor-scrollbar-active");
    } else {
      document.body.classList.remove("monitor-scrollbar-active");
    }
    return () => document.body.classList.remove("monitor-scrollbar-active");
  }, [isChecked, router.pathname]);

  const [modalOpenOrderBook, setModalOpenOrderBook] = useState(false);
  const [selectedOperationForCalculator, setSelectedOperationForCalculator] =
    useState<ArbitrageOpportunity | null>(null);
  const [modalState, setModalState] = useState(false);
  const handleModalState = (state: boolean) => setModalState(state);

  const { data: ActiveExchanges } = trpc.useQuery(
    ["exchange.getActiveExchanges"],
    { ssr: true }
  );

  const [buyExchanges, setBuyExchanges] = useState<
    Array<{ name: string; image_url: string }>
  >(() => {
    if (typeof window !== "undefined") {
      const savedExchanges = localStorage.getItem("buyExchanges");
      return savedExchanges ? JSON.parse(savedExchanges) : [];
    }
    return ActiveExchanges ? ActiveExchanges : [];
  });

  const [sellExchanges, setSellExchanges] = useState<
    Array<{ name: string; image_url: string }>
  >(() => {
    if (typeof window !== "undefined") {
      const savedExchanges = localStorage.getItem("sellExchanges");
      return savedExchanges ? JSON.parse(savedExchanges) : [];
    }
    return ActiveExchanges ? ActiveExchanges : [];
  });

  const [sidebarClickCount, setSidebarClickCount] = useState(0);
  const clickOnSidebar = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSidebarClickCount((prev) => prev + 1);
  };

  const updateMutation = trpc.useMutation("user.updateUserDollarValue");
  const { data: auth } = useSession();
  const userEmail = auth?.user?.email;

  const [selectedOperation, setSelectedOperation] =
    useState<ArbitrageOpportunity | null>(null);

  const [loadingDolarChange, setLoadingDolarChange] = useState(false);
  const [dolarValue, setDolarValue] = useState<number | undefined>(undefined);
  const [isExcludedModalOpen, setIsExcludedModalOpen] = useState(false);

  const queryInfo = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);
  useEffect(() => {
    if (!queryInfo.data) queryInfo.refetch();
  }, [queryInfo]);

  const user = queryInfo.data;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(
    null
  );
  useEffect(() => {
    const saved = localStorage.getItem("favoriteOperations");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  const [excluded, setExcluded] = useState<string[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("excludedOperations");
    if (saved) setExcluded(JSON.parse(saved));

    const savedViewConfig = localStorage.getItem("viewConfig");
    if (savedViewConfig) setViewConfig(JSON.parse(savedViewConfig));
  }, []);

  const excludeOperation = (key: string) => {
    setExcluded((prev) => {
      const updated = [...prev, key];
      localStorage.setItem("excludedOperations", JSON.stringify(updated));
      return updated;
    });
  };
  const restoreOperation = (key: string) => {
    setExcluded((prev) => {
      const updated = prev.filter((f) => f !== key);
      localStorage.setItem("excludedOperations", JSON.stringify(updated));
      return updated;
    });
  };
  const toggleFavorite = (key: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(key)
        ? prev.filter((f) => f !== key)
        : [...prev, key];
      localStorage.setItem("favoriteOperations", JSON.stringify(updated));
      return updated;
    });
  };

  const buyExchangesName = Array.isArray(buyExchanges)
    ? buyExchanges.map((e) => e.name)
    : [];
  const sellExchangesName = Array.isArray(sellExchanges)
    ? sellExchanges.map((e) => e.name)
    : [];

  const queryClient = useQueryClient();

  const { data: dollarValue } = trpc.useQuery([
    "user.getUserDollarValueByEmail",
    { email: userEmail ?? "" },
  ]);

  const queryResult = trpc.useInfiniteQuery(
    [
      "orderBook.getPaginated",
      {
        buyExchanges: buyExchangesName ?? undefined,
        sellExchanges: sellExchangesName ?? undefined,
        email: userEmail ?? undefined,
        isChecked: isChecked,
        isFutures: true,
        isOpen: isOpen,
      },
    ],
    {
      getNextPageParam: (lastPage) => {
        const morePagesExist = lastPage.arbitrageOpportunities.length === 50;
        return morePagesExist ? lastPage.nextCursor : undefined;
      },
      refetchInterval: 2 * 1000,
      retry: (count) => count <= 3,
      keepPreviousData: false,
      onSuccess(data) {
        if (data?.pages.flat().length === 0 && !queryResult.isFetching) {
          queryResult.refetch();
        }
      },
      onError() {
        if (!queryResult.isFetching) queryResult.refetch();
      },
    }
  );

  const { refetch, data, isLoading, isFetching, hasNextPage, fetchNextPage } =
    queryResult;

  useEffect(() => {
    if (!isAdmin) {
      queryClient.removeQueries({
        queryKey: ["orderBook.getPaginated"],
        exact: true,
      });
      refetch();
      const t = setTimeout(() => refetch(), 0);
      return () => clearTimeout(t);
    }
  }, [
    buyExchanges,
    sellExchanges,
    isChecked,
    dollarValue,
    queryClient,
    refetch,
    isAdmin,
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPagesFromServer, setTotalPagesFromServer] = useState(1);
  const [refreshRate, setRefreshRate] = useState(1000);
  const progressPercentage = (currentPage / totalPagesFromServer) * 100;

  useEffect(() => {
    if (data && data.pages.length > 0) {
      // totalPages does not exist on the page object, so we must infer it
      // Assume each page has up to 50 items, so estimate total pages from the first page's arbitrageOpportunities count and nextCursor
      const firstPage = data.pages[0];
      const lastPage = data.pages[data.pages.length - 1];
      // If the API ever returns a total count, use that instead
      // For now, estimate total pages as (lastPage.nextCursor || 1)
      const nextCursor = lastPage?.nextCursor ?? 1;
      setCurrentPage(nextCursor - 1);

      // Estimate total pages based on whether there are more pages
      // If the last page is full (50 items), assume there may be more pages
      // Otherwise, total pages = current page
      const isLastPageFull = lastPage?.arbitrageOpportunities?.length === 50;
      const estimatedTotalPages = isLastPageFull ? nextCursor : nextCursor - 1;
      setTotalPagesFromServer(Math.max(estimatedTotalPages, 1));
    }
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      refetch();
      // @ts-ignore
      queryClient.removeQueries(["orderBook.getPaginated"], { exact: true });

      const savedBuyExchanges = localStorage.getItem("buyExchanges");
      if (savedBuyExchanges) setBuyExchanges(JSON.parse(savedBuyExchanges));

      const savedSellExchanges = localStorage.getItem("sellExchanges");
      if (savedSellExchanges) setSellExchanges(JSON.parse(savedSellExchanges));
    }
  }, [sidebarClickCount, refetch, queryClient]);

  if (hasNextPage && !isLoading && !isFetching) {
    fetchNextPage();
  }

  const dollarPrice = trpc.useQuery(["orderBook.getDollar"], {
    refetchInterval: 20_000,
  }).data;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("buyExchanges", JSON.stringify(buyExchanges));
    }
  }, [buyExchanges]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sellExchanges", JSON.stringify(sellExchanges));
    }
  }, [sellExchanges]);

  useEffect(() => {
    if (dolarValue === 0) refetch();
  }, []);

  const onChangeDolar = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, "");
      const numValue = parseFloat(rawValue) / 100;
      if (isNaN(numValue)) {
        toast.dark(`Dólar Editável Não Pode Ser Nulo!`, {
          icon: <XCircle size={32} color="#ff3838" weight="fill" />,
        });
        return;
      }
      setLoadingDolarChange(true);
      refetch();
      setDolarValue(numValue);
      if (user) {
        const newDolar =
          isNaN(numValue) || numValue === 0 ? dollarPrice : numValue;
        updateMutation.mutate(
          { id: String(user?.id), dolarValue: newDolar as number },
          { onSettled: () => setLoadingDolarChange(false) }
        );
      }
    },
    [user, dollarPrice, refetch, updateMutation]
  );

  const {
    opportunities: socketOpportunities,
    setOpportunities,
    isConnected,
  } = useArbitrageSocket(
    symbols,
    refreshRate,
    buyExchangesName,
    sellExchangesName
  );

  useEffect(() => {
    if (isConnected) {
      toast.success("CONEXÃO ABERTA");
    }
  }, [isConnected]);

  const handleAddTicker = () => {
    if (!tickerInput.trim()) return;
    let formatted = tickerInput.toUpperCase().trim();
    if (!formatted.endsWith("USDT")) formatted = `${formatted}USDT`;
    if (!symbols.includes(formatted))
      setSymbols((prev) => [...prev, formatted]);
    setTickerInput("");
  };

  const allArbitrageOpportunities =
    data?.pages.flatMap((page: any) => page.arbitrageOpportunities) ?? [];

  let validOperations = allArbitrageOpportunities
    .filter((operation: ArbitrageOpportunity) => !!operation)
    .sort(
      (a: ArbitrageOpportunity, b: ArbitrageOpportunity) => b.spread - a.spread
    );

  if (orphanCoins.length > 0 && (!isAdmin || !isNewUser)) {
    validOperations = validOperations.filter(
      (operation: ArbitrageOpportunity) => {
        const isOrphan = orphanCoins.some(
          (coin: any) =>
            coin.ticker.toUpperCase() === operation.ticker.toUpperCase()
        );
        return !isOrphan;
      }
    );
  }

  const sortedOperations = useMemo(() => {
    const base = socketOpportunities.filter((op) => {
      const askLiquidity = op.lowestAsk.price * op.lowestAsk.amount;
      const bidLiquidity = op.highestBid.price * op.highestBid.amount;
      const spotVolume = op.spotVolume24h ?? 0;
      const futVolume = op.futVolume24h ?? 0;

      const p = isOpen ? op.spread : op.spreadS;
      return (
        p < maxProfit &&
        p > minProfit &&
        askLiquidity >= minLiquidity &&
        bidLiquidity >= minLiquidity &&
        (spotVolume >= minVolume24h || futVolume >= minVolume24h)
      );
    });
    return base.sort((a, b) =>
      isOpen ? b.spread - a.spread : b.spreadS - a.spreadS
    );
  }, [
    socketOpportunities,
    isOpen,
    maxProfit,
    minProfit,
    minLiquidity,
    minVolume24h,
  ]);

  const numberFormatter = new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    maximumFractionDigits: 3,
  });

  useEffect(() => {
    if (hasIPChanged) {
      signOut({ callbackUrl: "/" });
    }
  }, [hasIPChanged]);

  const isSpecialUser =
    userEmail === "herbertcarnaubadesouza@gmail.com" ||
    userEmail === "theoken05@hotmail.com" ||
    userEmail === "leolimadorea@gmail.com";

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["orderBook.getPaginated"] });
    refetch();
  }, [isChecked, queryClient, refetch]);

  const [isUpdatingDollar, setIsUpdatingDollar] = useState(false);
  const operationsWithFavoriteFirst = useMemo(() => {
    return [...sortedOperations]
      .filter((op) => {
        const key = `${op.ticker}-${op.lowestAsk.exchange}-${op.highestBid.exchange}`;
        return !excluded.includes(key);
      })
      .sort((a, b) => {
        const keyA = `${a.ticker}-${a.lowestAsk.exchange}-${a.highestBid.exchange}`;
        const keyB = `${b.ticker}-${b.lowestAsk.exchange}-${b.highestBid.exchange}`;
        const favA = favorites.includes(keyA);
        const favB = favorites.includes(keyB);
        if (favA && !favB) return -1;
        if (!favA && favB) return 1;
        return 0;
      });
  }, [sortedOperations, excluded, favorites]);

  const filteredOperations = useMemo(() => {
    if (!symbolFilter) return operationsWithFavoriteFirst;
    return operationsWithFavoriteFirst.filter((op) =>
      op.ticker.toUpperCase().includes(symbolFilter.toUpperCase())
    );
  }, [operationsWithFavoriteFirst, symbolFilter]);

  const groupedOperations = useMemo(() => {
    if (!isGrouped) return filteredOperations;
    const groups: Record<string, typeof filteredOperations> = {};
    filteredOperations?.forEach((op) => {
      if (!groups[op.ticker]) groups[op.ticker] = [];
      groups[op.ticker]!.push(op);
    });
    return Object.entries(groups)
      .map(([ticker, ops]) => {
        const sortedOps = [...ops].sort(
          (a, b) =>
            (isOpen ? b.spread : b.spreadS) - (isOpen ? a.spread : a.spreadS)
        );
        const bestOp = sortedOps[0];
        if (!bestOp) return null;
        return {
          ...bestOp,
          _isGroup: ops.length > 1,
          _groupedOps: sortedOps,
          _groupCount: ops.length,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [filteredOperations, isGrouped, isOpen]);

  const operationsToShow = isGrouped ? groupedOperations : filteredOperations;
  const totalPages = Math.ceil(operationsToShow.length / itemsPerPage);
  const startIndex = currentPageIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOperations = operationsToShow.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [
    symbolFilter,
    minProfit,
    maxProfit,
    minLiquidity,
    minVolume24h,
    itemsPerPage,
    isGrouped,
  ]);

  const handleDollarChange = useCallback(() => {
    if (dolarValue === undefined || dolarValue === 0) {
      toast.dark(`Dólar Editável Não Pode Ser Nulo!`, {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
      return;
    }
    setIsUpdatingDollar(true);
    setLoadingDolarChange(true);

    queryClient.removeQueries({
      queryKey: ["orderBook.getPaginated"],
      exact: true,
    });

    if (user) {
      const newDolar = dolarValue === 0 ? dollarPrice : dolarValue;
      updateMutation.mutate(
        { id: String(user?.id), dolarValue: newDolar as number },
        {
          onSettled: () => {
            setLoadingDolarChange(false);
            queryClient.invalidateQueries({
              queryKey: ["orderBook.getPaginated"],
            });
            if (typeof window !== "undefined") window.location.reload();
            refetch();
          },
        }
      );
    }
  }, [dolarValue, user, dollarPrice, refetch, queryClient, updateMutation]);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  };

  useEffect(() => {
    const handler = () => {
      const savedBuy = localStorage.getItem("buyExchanges");
      const savedSell = localStorage.getItem("sellExchanges");
      if (savedBuy) setBuyExchanges(JSON.parse(savedBuy));
      if (savedSell) setSellExchanges(JSON.parse(savedSell));
      setOpportunities([]); // limpa oportunidades em tela
    };
    window.addEventListener("exchangeUpdated", handler);
    return () => window.removeEventListener("exchangeUpdated", handler);
  }, [setOpportunities]);

  const handleCalculatorClick = (operation: ArbitrageOpportunity) => {
    const params = new URLSearchParams({
      ticker: operation.ticker,
      coin: operation.coin,
      buyExchange: operation.highestBid?.exchange ?? "",
      buyPrice: operation.highestBid?.price?.toString() ?? "0",
      buyIsUSD: operation.highestBid?.isUSD ? "true" : "false",
      sellExchange: operation.lowestAsk?.exchange ?? "",
      sellPrice: operation.lowestAsk?.price?.toString() ?? "0",
      sellIsUSD: operation.lowestAsk?.isUSD ? "true" : "false",
      spread: operation.spread?.toString() ?? "0",
    });

    const url = `/oportunidade?${params.toString()}`;
    const width = 400;
    const height = 500;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,scrollbars=yes,resizable=yes`;
    const newWindow = window.open(url, "calculatorWindow", features);
    if (newWindow) newWindow.focus();
    else alert("Popup bloqueado! Verifique as configurações do navegador.");
  };

  return (
    <>
      <Head>
        <title>Monitor - NEXTGAIN</title>
        <meta name="description" content="Monitor - NEXTGAIN" />
      </Head>

      {/* Modais de TradingView / Filtros / ViewConfig / Excluídas / Confirmação */}
      <div>
        {isTradingViewOpen && tradingViewUrl && (
          <div
            className={`${styles.modalOverlay} ${
              isTradingViewOpen ? styles.active : ""
            }`}
          >
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
                height="700"
                style={{ border: "none" }}
              />
            </div>
          </div>
        )}

        {isFilterModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ marginBottom: "10px" }}>
              <h3>Filtro de Lucro</h3>
              <div className={styles.modalContent}>
                <label>
                  Lucro Mínimo (%):
                  <input
                    type="number"
                    value={minProfit}
                    onChange={(e) => setMinProfit(Number(e.target.value))}
                  />
                </label>
                <label>
                  Lucro Máximo (%):
                  <input
                    type="number"
                    value={maxProfit}
                    onChange={(e) => setMaxProfit(Number(e.target.value))}
                  />
                </label>
                <label>
                  Liquidez Mínima (USDT):
                  <input
                    type="number"
                    value={minLiquidity}
                    onChange={(e) => setMinLiquidity(Number(e.target.value))}
                  />
                </label>
                <label>
                  Volume Mínimo (24h USDT):
                  <input
                    type="number"
                    value={minVolume24h}
                    onChange={(e) => setMinVolume24h(Number(e.target.value))}
                  />
                </label>
              </div>
              <div className={styles.modalButtons}>
                <button
                  className={styles.confirmButton}
                  onClick={() => setIsFilterModalOpen(false)}
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
            </div>
          </div>
        )}

        {isViewConfigOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>⚙️ Configurar Visualização</h3>
              <p style={{ fontSize: 13, marginBottom: "1rem" }}>
                Selecione quais informações deseja ver nos cards
              </p>
              <div className={styles.viewConfigGrid}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showCoinImage}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showCoinImage: e.target.checked,
                      }))
                    }
                  />
                  <span>Imagem da Moeda</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showSpreadE}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showSpreadE: e.target.checked,
                      }))
                    }
                  />
                  <span>Lucro Entrada (E)</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showSpreadS}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showSpreadS: e.target.checked,
                      }))
                    }
                  />
                  <span>Lucro Saída (S)</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showFunding}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showFunding: e.target.checked,
                      }))
                    }
                  />
                  <span>Taxa de Funding</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showExpiration}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showExpiration: e.target.checked,
                      }))
                    }
                  />
                  <span>Expiração Funding</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showValidTime}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showValidTime: e.target.checked,
                      }))
                    }
                  />
                  <span>Tempo de Vida</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showLiquidity}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showLiquidity: e.target.checked,
                      }))
                    }
                  />
                  <span>Liquidez</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showSpotVolume}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showSpotVolume: e.target.checked,
                      }))
                    }
                  />
                  <span>Volume Spot (Book)</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showFuturesVolume}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showFuturesVolume: e.target.checked,
                      }))
                    }
                  />
                  <span>Volume Futuros (Book)</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showVolume24h}
                    onChange={(e) =>
                      setViewConfig((p) => ({
                        ...p,
                        showVolume24h: e.target.checked,
                      }))
                    }
                  />
                  <span>Volume 24h</span>
                </label>
              </div>
              <div className={styles.modalButtons}>
                <button
                  className={styles.confirmButton}
                  onClick={() => {
                    localStorage.setItem(
                      "viewConfig",
                      JSON.stringify(viewConfig)
                    );
                    setIsViewConfigOpen(false);
                  }}
                >
                  Salvar
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsViewConfigOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {isExcludedModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Oportunidades Excluídas</h3>
              {excluded.length === 0 ? (
                <p>Nenhuma oportunidade excluída.</p>
              ) : (
                <ul className={styles.excludedList}>
                  {excluded.map((key) => (
                    <li key={key}>
                      <span>{key}</span>
                      <button
                        className={styles.restoreButton}
                        onClick={() => restoreOperation(key)}
                      >
                        Restaurar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.modalButtons}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsExcludedModalOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {operationToDelete && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Excluir Oportunidade</h3>
              <p>Tem certeza que deseja excluir esta oportunidade?</p>
              <div className={styles.modalButtons}>
                <button
                  className={styles.confirmButton}
                  onClick={() => {
                    excludeOperation(operationToDelete);
                    setOperationToDelete(null);
                  }}
                >
                  Sim, excluir
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setOperationToDelete(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {isUpdatingDollar && loadingAnimation && (
          <div className={styles.loadingOverlay}>
            <Lottie options={defaultOptions} height={200} width={200} />
          </div>
        )}

        {modalState ? null : (
          <>
            <Header
              supportNumber={supportNumber}
              isChecked={isChecked}
              invisibleBackground
            />
            <CurrencyCarousel tickerData={tickerData} />
          </>
        )}

        {modalOpenOrderBook && (
          <ModalOrderBook
            symbol={selectedOperation?.ticker ?? ""}
            orderbookBid={{
              isUSD: selectedOperation?.highestBid?.isUSD ?? false,
              orderbook: selectedOperation?.highestBid?.orderbook ?? {
                bids: [],
                asks: [],
              },
            }}
            orderbookAsk={{
              isUSD: selectedOperation?.lowestAsk?.isUSD ?? false,
              orderbook: selectedOperation?.lowestAsk?.orderbook ?? {
                bids: [],
                asks: [],
              },
            }}
            buyWhere={selectedOperation?.highestBid?.image_url ?? ""}
            sellWhere={selectedOperation?.lowestAsk?.image_url ?? ""}
            buyEchangeName={selectedOperation?.highestBid?.exchange ?? ""}
            sellEchangeName={selectedOperation?.lowestAsk?.exchange ?? ""}
            coin={selectedOperation?.coin ?? ""}
            coinImage={selectedOperation?.coinImage ?? ""}
            setOpenModal={setModalOpenOrderBook}
            dollarPrice={dollarPrice ?? 0}
            fee={selectedOperation?.fee ?? 0}
            tax={selectedOperation?.tax ?? 0}
          />
        )}
      </div>

      {/* Fundo animado */}
      <div
        className={`${styles.backgroundMonitor} ${
          isCleaned
            ? styles.backgroundCleaned
            : isChecked
            ? styles.backgroundChecked
            : ""
        }`}
      >
        <div className={styles.bgBokeh} />
        <div className={styles.particles} />
      </div>

      {/* Conteúdo */}
      <div className={`${styles.content} container`}>
        {modalState ? null : (
          <div className={styles.dolarBlock}>
            <span>Operações</span>
          </div>
        )}

        {/* filtros mobile */}
        <div className={styles.mobileFilter} onClick={clickOnSidebar}>
          <span>Exchanges Compra</span>
          <BuyExchangeMobile
            dollarPrice={dollarPrice}
            defaultExchanges={ActiveExchanges || []}
            buyExchanges={buyExchanges || []}
            sellExchanges={sellExchanges || []}
            onChangeDolar={onChangeDolar}
            dolarValue={dolarValue as number}
            onModalChange={handleModalState}
            isChecked={isChecked}
            isCleaned={isCleaned}
            isAdmin={isAdmin}
          />
        </div>

        <div className={styles.mobileFilter} onClick={clickOnSidebar}>
          <span>Exchanges Venda</span>
          <SellExchangeMobile
            dollarPrice={dollarPrice}
            defaultExchanges={ActiveExchanges || []}
            buyExchanges={buyExchanges || []}
            sellExchanges={sellExchanges || []}
            onChangeDolar={onChangeDolar}
            dolarValue={dolarValue as number}
            onModalChange={handleModalState}
            isChecked={isChecked}
            isCleaned={isCleaned}
            isAdmin={isAdmin}
          />
        </div>

        <button
          className={`${styles.sidebarToggle} ${
            !isSidebarOpen ? styles.toggleClosed : ""
          }`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Fechar Sidebar" : "Abrir Sidebar"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isSidebarOpen ? (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <polyline points="15 6 21 12 15 18" />
              </>
            )}
          </svg>
        </button>

        <div
          className={`${styles.sidebarWrapper} ${
            !isSidebarOpen ? styles.sidebarClosed : ""
          }`}
          onClick={clickOnSidebar}
        >
          <FuturosSidebar
            isChecked={isChecked}
            dollarPrice={dollarPrice}
            defaultExchanges={ActiveExchanges || []}
            buyExchanges={buyExchanges || []}
            sellExchanges={sellExchanges || []}
            onChangeDolar={onChangeDolar}
            dolarValue={dolarValue as number}
            onModalChange={handleModalState}
            isAdmin={isAdmin}
            isCleaned={isCleaned}
            onDollarChange={handleDollarChange}
            setIsOpen={setIsOpen}
            isOpen={isOpen}
          />
        </div>

        <main
          className={`${styles.mainContent} ${
            !isSidebarOpen ? styles.mainExpanded : ""
          }`}
        >
          <div className={styles.topPart}>
            <h1>
              {isFetching && <BeatLoader color="#969696" size="0.5rem" />}
            </h1>

            {/* progresso (somente users especiais) */}
            {!isAdmin &&
              (userEmail === "herbertcarnaubadesouza@gmail.com" ||
                userEmail === "theoken05@hotmail.com" ||
                userEmail === "leolimadorea@gmail.com") && (
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarContent}>
                    <progress value={progressPercentage} max={100}></progress>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                </div>
              )}

            <div className={styles.tickerInputBlock}>
              <div className={styles.refreshRateBlock}>
                <label htmlFor="refreshRate">Velocidade de atualização:</label>
                <select
                  id="refreshRate"
                  value={refreshRate}
                  onChange={(e) => setRefreshRate(Number(e.target.value))}
                  className={styles.refreshRateSelect}
                >
                  <option value={500}>0.5 segundo</option>
                  <option value={1000}>1 segundo</option>
                  <option value={2000}>2 segundos</option>
                  <option value={3000}>3 segundos</option>
                  <option value={4000}>4 segundos</option>
                  <option value={5000}>5 segundos</option>
                </select>
              </div>

              {excluded.length > 0 && (
                <button
                  onClick={() => setIsExcludedModalOpen(true)}
                  className={styles.excludedButton}
                >
                  Ver Excluídas ({excluded.length})
                </button>
              )}

              <div
                className={styles.filterBlock}
                style={{ gap: 20, display: "flex" }}
              >
                <input
                  type="text"
                  value={symbolFilter}
                  onChange={(e) =>
                    setSymbolFilter(e.target.value.toUpperCase())
                  }
                  placeholder="Filtrar por símbolo (ex: BTC)"
                  className={styles.filterInput}
                />
                <button
                  className={styles.filterButton}
                  onClick={() => setIsFilterModalOpen(true)}
                  title="Filtro de Lucro"
                >
                  <Funnel size={20} weight="bold" />
                </button>
                <button
                  className={styles.filterButton2}
                  onClick={() => setIsViewConfigOpen(true)}
                  title="Configurar Visualização"
                >
                  <Gear size={20} weight="bold" />
                </button>
                <button
                  className={styles.filterButton2}
                  onClick={() =>
                    window.open(
                      "/calculator",
                      "calculatorWindow",
                      "width=400,height=700,toolbar=no,menubar=no,location=no,status=no,scrollbars=yes,resizable=yes"
                    )
                  }
                  title="Calculadora"
                >
                  <Calculator size={20} weight="bold" />
                </button>
              </div>

              <div style={{ display: "flex" }}>
                {symbols.map((s) => (
                  <span key={s} className={styles.tickerTag}>
                    {s}
                    <button
                      onClick={() => {
                        setSymbols((prev) => prev.filter((sym) => sym !== s));
                        setOpportunities((prev) =>
                          prev.filter((opp) => opp.ticker !== s)
                        );
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {loadingDolarChange || sortedOperations?.length === 0 ? (
            <div className={styles.loading}>
              <PacmanLoader
                size="3rem"
                className={styles.loader}
                color={isChecked ? "#007305" : "#957dff"}
              />
            </div>
          ) : (
            <>
              <div className={styles.operationsHeader}>
                <div className={styles.headerLeft}>
                  <p className={styles.totalCount}>
                    Mostrando {startIndex + 1}-
                    {Math.min(endIndex, operationsToShow.length)} de{" "}
                    {operationsToShow.length}{" "}
                    {isGrouped ? "grupos" : "oportunidades"}
                  </p>
                </div>
                <div className={styles.headerRight}>
                  <button
                    className={`${styles.groupButton} ${
                      isGrouped ? styles.active : ""
                    }`}
                    onClick={() => {
                      setIsGrouped(!isGrouped);
                      setExpandedGroups(new Set());
                    }}
                    title={
                      isGrouped ? "Desagrupar moedas" : "Agrupar por moeda"
                    }
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>{isGrouped ? "Desagrupar" : "Agrupar"}</span>
                  </button>
                  <div className={styles.rowsSelector}>
                    <label>Linhas:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>

              <FuturosTable
                operations={paginatedOperations}
                viewConfig={viewConfig}
                dollarPrice={dollarPrice}
                isOpen={isOpen}
                isFavorite={(key: string) => favorites.includes(key)}
                onToggleFavorite={(key: string) => toggleFavorite(key)}
                onDeleteClick={(key: string) => setOperationToDelete(key)}
                onCalculatorClick={(operation: any) =>
                  handleCalculatorClick(operation)
                }
                onChartClick={(url: string) => {
                  setTradingViewUrl(url);
                  setIsTradingViewOpen(true);
                }}
                onClick={(operation: any) => setSelectedOperation(operation)}
              />

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPageIndex(0)}
                    disabled={currentPageIndex === 0}
                    className={styles.paginationBtn}
                  >
                    ««
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPageIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentPageIndex === 0}
                    className={styles.paginationBtn}
                  >
                    ‹
                  </button>
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i;
                      else if (currentPageIndex < 3) pageNum = i;
                      else if (currentPageIndex > totalPages - 4)
                        pageNum = totalPages - 5 + i;
                      else pageNum = currentPageIndex - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPageIndex(pageNum)}
                          className={`${styles.pageBtn} ${
                            currentPageIndex === pageNum ? styles.active : ""
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPageIndex((prev) =>
                        Math.min(totalPages - 1, prev + 1)
                      )
                    }
                    disabled={currentPageIndex >= totalPages - 1}
                    className={styles.paginationBtn}
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setCurrentPageIndex(totalPages - 1)}
                    disabled={currentPageIndex >= totalPages - 1}
                    className={styles.paginationBtn}
                  >
                    »»
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default Futuros;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const forwarded = req.headers["x-forwarded-for"] as string;
  const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;

  const session = await getServerSession(req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  let hasIPChanged = false;
  let isNewUser = false;
  const isAdmin = session?.role === "admin";
  let supportNumber: string | null = null;
  let tickerData: Currency[] = [];

  try {
    const result = await updateIP(session.id as string, ip as string);
    hasIPChanged = isAdmin ? false : (result.hasIPChanged as boolean);
    const userCreationDate = session.createdAt as Date;
    isNewUser =
      new Date(userCreationDate) >=
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    supportNumber = await getSupportNumber();
    tickerData = await fetchTickerData();
  } catch (error) {
    console.error("Error updating IP record or fetching data:", error);
  }

  return {
    props: { ip, hasIPChanged, isAdmin, isNewUser, supportNumber, tickerData },
  };
};
