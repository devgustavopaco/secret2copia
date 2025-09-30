import React from "react";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { XCircle, Pause, Play, Funnel, Calculator } from "phosphor-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { BeatLoader, PacmanLoader } from "react-spinners";
import { toast } from "react-toastify";
import loadingAnimation from "../animations/dollar.json";
import { Header } from "../components/Header";
import CurrencyCarousel from "../components/MarketCarousel";
import { BuyExchangeMobile } from "../components/Mobile/BuyExchangeMobile";
import { SellExchangeMobile } from "../components/Mobile/SellExchangeMobile";
import { ModalOrderBook } from "../components/Modals/ModalOrderBook";
import { FuturosOperationCard } from "../components/FuturosOperationCard";
import { FuturosSidebar } from "../components/FuturosSidebar";
import Soccer from "../icons/Soccer";
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
import { Filter, Filter1 } from "@material-ui/icons";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });

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
}: FuturosProps): React.ReactElement => {
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

  // Paginação
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filtros de visualização
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

  // Toggle do Sidebar (com persistência)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Salvar estado do sidebar
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

    return () => {
      document.body.classList.remove("monitor-scrollbar-active");
    };
  }, [isChecked, router.pathname]);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };
  const handleCheckboxCleanChange = () => {
    setIsCleaned(!isCleaned);
  };
  const [modalOpenOrderBook, setModalOpenOrderBook] = useState(false);
  const [selectedOperationForCalculator, setSelectedOperationForCalculator] =
    useState<ArbitrageOpportunity | null>(null);

  const [modalState, setModalState] = useState(false);

  const handleModalState = (state: boolean) => {
    setModalState(state);
  };

  useEffect(() => {
    document.body.style.background = "rgba(13, 15, 18, 0.721)";

    return () => {
      document.body.style.background = "";
    };
  }, []);

  const { data: ActiveExchanges, isLoading: isLoadingExchanges } =
    trpc.useQuery(["exchange.getActiveExchanges"], { ssr: true });

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
  interface PaginatedResponse {
    arbitrageOpportunities: ArbitrageOpportunity[];
    nextCursor: number | undefined;
  }

  const clickOnSidebar = (event: any) => {
    event.stopPropagation();
    setSidebarClickCount((prevCount) => prevCount + 1);
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
    if (!queryInfo.data) {
      queryInfo.refetch();
    }
  }, [queryInfo]);

  const user = queryInfo.data;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(
    null
  );

  useEffect(() => {
    const saved = localStorage.getItem("favoriteOperations");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);
  const [excluded, setExcluded] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("excludedOperations");
    if (saved) {
      setExcluded(JSON.parse(saved));
    }

    const savedViewConfig = localStorage.getItem("viewConfig");
    if (savedViewConfig) {
      setViewConfig(JSON.parse(savedViewConfig));
    }
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
      let updated;
      if (prev.includes(key)) {
        updated = prev.filter((f) => f !== key);
      } else {
        updated = [...prev, key];
      }
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

  const { data: dollarValue, isLoading: isLoadingDollarValue } = trpc.useQuery([
    "user.getUserDollarValueByEmail",
    { email: userEmail ?? "" },
  ]);
  let queryResult: any;

  queryResult = trpc.useInfiniteQuery(
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
        if (!morePagesExist) return undefined;
        return lastPage.nextCursor;
      },
      refetchInterval: 2 * 1000,
      retry(failureCount) {
        return failureCount <= 3;
      },
      keepPreviousData: false,
      onSuccess(data) {
        if (data?.pages.flat().length === 0 && !queryResult.isFetching) {
          queryResult.refetch();
        }
      },
      onError() {
        if (!queryResult.isFetching) {
          queryResult.refetch();
        }
      },
    }
  );

  const {
    refetch,
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isError,
    isSuccess,
  } = queryResult;

  useEffect(() => {
    if (!isAdmin) {
      queryClient.removeQueries({
        queryKey: ["orderBook.getPaginated"],
        exact: true,
      });

      refetch();

      const debounceRefetch = setTimeout(() => {
        refetch();
      }, 0); // Adjust debounce time as needed

      return () => clearTimeout(debounceRefetch); // Clean up timeout on component unmount or re-render
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
      const totalPagesFromData = data.pages[0]?.totalPages ?? 1;
      setTotalPagesFromServer(totalPagesFromData);

      // Extract nextCursor from the last page
      const lastPage = data.pages[data.pages.length - 1];
      const nextCursor = lastPage?.nextCursor ?? 1;

      // Calculate currentPage
      const currentPageFromData = nextCursor - 1;
      setCurrentPage(currentPageFromData);
    }
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      refetch();
      //@ts-ignore
      queryClient.removeQueries(["orderBook.getPaginated"], { exact: true });

      const savedBuyExchanges = localStorage.getItem("buyExchanges");
      if (savedBuyExchanges) {
        setBuyExchanges(JSON.parse(savedBuyExchanges));
      }

      const savedSellExchanges = localStorage.getItem("sellExchanges");
      if (savedSellExchanges) {
        setSellExchanges(JSON.parse(savedSellExchanges));
      }
    }
  }, [sidebarClickCount, refetch, queryClient]);

  if (hasNextPage && !isLoading && !isFetching) {
    fetchNextPage();
  }

  const dollarPrice = trpc.useQuery(["orderBook.getDollar"], {
    refetchInterval: 20 * 1000,
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
    if (dolarValue === 0) {
      refetch();
    }
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
          {
            id: String(user?.id),
            dolarValue: newDolar as number,
          },
          {
            onSettled: () => {
              setLoadingDolarChange(false);
            },
          }
        );
      }
    },
    [user, dollarPrice]
  );
  // const symbols = useMemo(() => [], []);
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
    // if (!isConnected) {
    //   toast.error("⚠️ Conexão com servidor perdida. Aguardando reconexão...");
    // }
    if (isConnected) {
      toast.success("CONEXAO ABERTA");
    }
  }, [isConnected]);
  const handleAddTicker = () => {
    if (!tickerInput.trim()) return;

    let formatted = tickerInput.toUpperCase().trim();
    if (!formatted.endsWith("USDT")) {
      formatted = `${formatted}USDT`;
    }

    if (!symbols.includes(formatted)) {
      setSymbols((prev) => [...prev, formatted]);
    }
    setTickerInput("");
  };

  let allArbitrageOpportunities =
    data?.pages.flatMap((page: any) => page.arbitrageOpportunities) ?? [];

  // Filtrar e ordenar todas as operações válidas
  let validOperations = allArbitrageOpportunities
    .filter((operation: ArbitrageOpportunity) => {
      // Verificar se a operação é válida e tem spread positivo
      if (!operation) return false;
      return true;
    })
    .sort(
      (a: ArbitrageOpportunity, b: ArbitrageOpportunity) => b.spread - a.spread
    );

  // Remover moedas órfãs se necessário
  if (orphanCoins.length > 0 && (!isAdmin || !isNewUser)) {
    validOperations = validOperations.filter(
      (operation: ArbitrageOpportunity) => {
        const isOrphan = orphanCoins.some(
          (coin: any) =>
            coin.ticker.toUpperCase() === operation.ticker.toUpperCase()
        );
        if (isOrphan) {
          console.log(`Removendo moeda órfã: ${operation.ticker}`);
          return false;
        }
        return true;
      }
    );
  }

  const sortedOperations = useMemo(() => {
    if (isOpen) {
      return socketOpportunities
        .filter((op) => {
          const askLiquidity = op.lowestAsk.price * op.lowestAsk.amount;
          const bidLiquidity = op.highestBid.price * op.highestBid.amount;

          const spotVolume = op.spotVolume24h ?? 0;
          const futVolume = op.futVolume24h ?? 0;

          return (
            op.spread < maxProfit &&
            op.spread > minProfit &&
            askLiquidity >= minLiquidity &&
            bidLiquidity >= minLiquidity &&
            (spotVolume >= minVolume24h || futVolume >= minVolume24h) // 🔥 filtro único
          );
        })
        .sort((a, b) => b.spread - a.spread);
    } else {
      return socketOpportunities
        .filter((op) => {
          const askLiquidity = op.lowestAsk.price * op.lowestAsk.amount;
          const bidLiquidity = op.highestBid.price * op.highestBid.amount;

          const spotVolume = op.spotVolume24h ?? 0;
          const futVolume = op.futVolume24h ?? 0;

          return (
            op.spreadS < maxProfit &&
            op.spreadS > minProfit &&
            askLiquidity >= minLiquidity &&
            bidLiquidity >= minLiquidity &&
            (spotVolume >= minVolume24h || futVolume >= minVolume24h)
          );
        })
        .sort((a, b) => b.spreadS - a.spreadS);
    }
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
      signOut({
        callbackUrl: "/",
      });
    }
  }, []);
  const isSpecialUser =
    userEmail === "herbertcarnaubadesouza@gmail.com" ||
    userEmail === "theoken05@hotmail.com" ||
    userEmail === "leolimadorea@gmail.com";

  useEffect(() => {
    queryClient.removeQueries({
      queryKey: ["orderBook.getPaginated"],
    });
    refetch();
  }, [isChecked, queryClient, refetch]);

  const [isUpdatingDollar, setIsUpdatingDollar] = useState(false);
  const operationsWithFavoriteFirst = useMemo(() => {
    return [...sortedOperations]
      .filter((op) => {
        const key = `${op.ticker}-${op.lowestAsk.exchange}-${op.highestBid.exchange}`;
        return !excluded.includes(key); // 🔥 exclui
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
    return operationsWithFavoriteFirst.filter((operation) => {
      if (!symbolFilter) return true;
      return operation.ticker
        .toUpperCase()
        .includes(symbolFilter.toUpperCase());
    });
  }, [operationsWithFavoriteFirst, symbolFilter]);

  // Função para agrupar operações por símbolo
  const groupedOperations = React.useMemo(() => {
    if (!isGrouped) return filteredOperations;

    const groups: { [key: string]: typeof filteredOperations } = {};
    filteredOperations.forEach((op) => {
      if (!groups[op.ticker]) {
        groups[op.ticker] = [];
      }
      const group = groups[op.ticker];
      if (group) {
        group.push(op);
      }
    });

    // Retorna um array onde cada grupo é representado pela oportunidade com MAIOR SPREAD
    return Object.entries(groups)
      .map(([ticker, ops]) => {
        // Ordena as operações por spread (maior primeiro)
        const sortedOps = [...ops].sort((a, b) => {
          const spreadA = isOpen ? a.spread : a.spreadS;
          const spreadB = isOpen ? b.spread : b.spreadS;
          return spreadB - spreadA;
        });

        const bestOp = sortedOps[0];
        if (!bestOp) return null;

        return {
          ...bestOp,
          _isGroup: ops.length > 1,
          _groupedOps: sortedOps, // Já ordenado
          _groupCount: ops.length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [filteredOperations, isGrouped, isOpen]);

  const operationsToShow = isGrouped ? groupedOperations : filteredOperations;

  // Paginação
  const totalPages = Math.ceil(operationsToShow.length / itemsPerPage);
  const startIndex = currentPageIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOperations = operationsToShow.slice(startIndex, endIndex);

  // Reset pagination quando filtros mudam
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
        {
          id: String(user?.id),
          dolarValue: newDolar as number,
        },
        {
          onSettled: () => {
            setLoadingDolarChange(false);

            queryClient.invalidateQueries({
              queryKey: ["orderBook.getPaginated"],
            });
            window.location.reload();
            refetch();
          },
        }
      );
    }
  }, [dolarValue, user, dollarPrice, refetch, queryClient]);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  useEffect(() => {
    const handler = () => {
      const savedBuy = localStorage.getItem("buyExchanges");
      const savedSell = localStorage.getItem("sellExchanges");
      if (savedBuy) setBuyExchanges(JSON.parse(savedBuy));
      if (savedSell) setSellExchanges(JSON.parse(savedSell));
      // limpa as oportunidades atuais na tela
      setOpportunities([]);
    };
    window.addEventListener("exchangeUpdated", handler);
    return () => window.removeEventListener("exchangeUpdated", handler);
  }, [setOpportunities]);
  // Função para redirecionar para página de oportunidade individual
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

    // Centralizar na tela
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const features =
      `width=${width},height=${height},left=${left},top=${top},` +
      `toolbar=no,menubar=no,location=no,status=no,` +
      `scrollbars=yes,resizable=yes`;

    const newWindow = window.open(
      url,
      "calculatorWindow", // nome fixo → sempre reusa a mesma janela
      features
    );

    if (newWindow) {
      newWindow.focus();
    } else {
      alert("Popup bloqueado! Verifique as configurações do navegador.");
    }
  };

  return (
    <>
      <Head>
        <title>Monitor - NEXTGAIN</title>
        <meta name="description" content="Monitor - NEXTGAIN" />
      </Head>
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
              <p style={{ fontSize: "13px", marginBottom: "1rem" }}>
                Selecione quais informações deseja ver nos cards
              </p>

              <div className={styles.viewConfigGrid}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={viewConfig.showCoinImage}
                    onChange={(e) =>
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                      setViewConfig((prev) => ({
                        ...prev,
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
                    <li key={key} className={styles.excludedItem}>
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
        {modalState ? (
          <></>
        ) : (
          <>
            <Header
              supportNumber={supportNumber}
              isChecked={isChecked}
              invisibleBackground={true}
            />
            <CurrencyCarousel tickerData={tickerData} />
          </>
        )}

        <>
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
        </>
        <div
          className={`${styles.backgroundmMonitor} ${
            isCleaned
              ? styles.backgroundCleaned
              : isChecked
              ? styles.backgroundChecked
              : ""
          }`}
        >
          <div className={`${styles.content} container`}>
            {modalState ? (
              <></>
            ) : (
              <div className={styles.dolarBlock}>
                <span>Operações</span>
                {/* <div className={styles.dolarBlockContent}>
                  <span>cotação do dólar</span>
                  <div className={styles.dolarContainer}>
                    <p>
                      {dollarPrice ? (
                        <>
                          <span>$</span>{" "}
                          {numberFormatter.format(dollarPrice ?? -1)}
                        </>
                      ) : (
                        <BeatLoader color="#969696" size="0.5rem" />
                      )}
                    </p>

                    {dollarPrice ? (
                      <>
                        <div>
                          <span>$</span>
                          <input
                            className={styles.dolarLabel}
                            type="number"
                            value={dolarValue}
                            onChange={onChangeDolar}
                            style={{ textAlign: "center" }}
                            placeholder="Valor do Dólar"
                          />
                        </div>
                        <button
                          onClick={handleDollarChange}
                          className={styles.updateButton}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            viewBox="0 0 25 25"
                            fill="none"
                          >
                            <path
                              d="M21.5488 5.12544V9.62543C21.5488 9.82435 21.4698 10.0151 21.3292 10.1558C21.1885 10.2964 20.9977 10.3754 20.7988 10.3754H16.2988C16.0999 10.3754 15.9091 10.2964 15.7685 10.1558C15.6278 10.0151 15.5488 9.82435 15.5488 9.62543C15.5488 9.42652 15.6278 9.23576 15.7685 9.0951C15.9091 8.95445 16.0999 8.87543 16.2988 8.87543H18.9885L17.617 7.50387C16.223 6.10363 14.3305 5.31364 12.3548 5.30731H12.3126C10.3534 5.30272 8.47109 6.06957 7.07289 7.442C6.92966 7.5757 6.73979 7.64805 6.5439 7.64356C6.34801 7.63906 6.16166 7.55809 6.02471 7.41795C5.88776 7.27782 5.81109 7.08966 5.8111 6.89371C5.81111 6.69777 5.8878 6.50962 6.02477 6.3695C7.71932 4.71331 9.99866 3.7922 12.3681 3.80606C14.7376 3.81993 17.006 4.76765 18.681 6.44356L20.0488 7.81512V5.12544C20.0488 4.92652 20.1278 4.73576 20.2685 4.59511C20.4091 4.45445 20.5999 4.37544 20.7988 4.37544C20.9977 4.37544 21.1885 4.45445 21.3292 4.59511C21.4698 4.73576 21.5488 4.92652 21.5488 5.12544ZM18.0248 17.8089C16.6127 19.1882 14.7139 19.9552 12.74 19.9436C10.7662 19.932 8.87645 19.1428 7.4807 17.747L6.10914 16.3754H8.79883C8.99774 16.3754 9.18851 16.2964 9.32916 16.1558C9.46981 16.0151 9.54883 15.8243 9.54883 15.6254C9.54883 15.4265 9.46981 15.2358 9.32916 15.0951C9.18851 14.9545 8.99774 14.8754 8.79883 14.8754H4.29883C4.09992 14.8754 3.90915 14.9545 3.7685 15.0951C3.62785 15.2358 3.54883 15.4265 3.54883 15.6254V20.1254C3.54883 20.3243 3.62785 20.5151 3.7685 20.6558C3.90915 20.7964 4.09992 20.8754 4.29883 20.8754C4.49774 20.8754 4.68851 20.7964 4.82916 20.6558C4.96981 20.5151 5.04883 20.3243 5.04883 20.1254V17.4357L6.42039 18.8073C8.09309 20.4884 10.3648 21.4366 12.7363 21.4436H12.786C15.1373 21.4496 17.3964 20.5291 19.0738 18.8814C19.2108 18.7413 19.2875 18.5531 19.2875 18.3572C19.2875 18.1612 19.2108 17.9731 19.0739 17.8329C18.9369 17.6928 18.7506 17.6118 18.5547 17.6073C18.3588 17.6028 18.1689 17.6752 18.0257 17.8089H18.0248Z"
                              fill="white"
                            />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <BeatLoader color="#969696" size="0.5rem" />
                    )}
                  </div>
                </div> */}
              </div>
            )}
            <div
              className={styles.mobileFilter}
              onClick={(event) => clickOnSidebar(event)}
            >
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

            <div
              className={styles.mobileFilter}
              onClick={(event) => clickOnSidebar(event)}
            >
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
                width="24"
                height="24"
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
            {/* Sidebar com Toggle */}
            <div
              className={`${styles.sidebarWrapper} ${
                !isSidebarOpen ? styles.sidebarClosed : ""
              }`}
              onClick={(event) => clickOnSidebar(event)}
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

            {/* diminua esse svg de tamanho  */}

            <main
              className={`${styles.mainContent} ${
                !isSidebarOpen ? styles.mainExpanded : ""
              }`}
            >
              <div className={styles.topPart}>
                <h1>
                  {isFetching && <BeatLoader color="#969696" size="0.5rem" />}
                </h1>{" "}
                {!isAdmin && isSpecialUser && (
                  <div className={styles.progressBarContainer}>
                    <div className={styles.progressBarContent}>
                      <progress value={progressPercentage} max="100"></progress>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                  </div>
                )}
                <div className={styles.tickerInputBlock}>
                  <div className={styles.refreshRateBlock}>
                    <label htmlFor="refreshRate">
                      Velocidade de atualização:
                    </label>
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
                    style={{ gap: "20px", display: "flex" }}
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

                    {/* Botão de configuração de visualização */}
                    <button
                      className={styles.filterButton2}
                      onClick={() => setIsViewConfigOpen(true)}
                      title="Configurar Visualização"
                    >
                      ⚙️
                    </button>

                    {/* Botão para abrir calculadora */}
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
                            setSymbols((prev) =>
                              prev.filter((sym) => sym !== s)
                            );
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
                <>
                  <div className={styles.checkbox}>
                    <div className={styles.websocketControl}>
                      <button
                        onClick={() => setIsWebSocketPaused(!isWebSocketPaused)}
                        className={`${styles.websocketToggleButton} ${
                          isWebSocketPaused ? styles.paused : ""
                        }`}
                      >
                        <Pause
                          className={styles.pauseIcon}
                          style={{ color: "#fff" }}
                        />
                        <Play
                          className={styles.continueIcon}
                          style={{ color: "#fff" }}
                        />
                        <svg
                          viewBox="0 0 100 100"
                          className={styles.rotatingText}
                        >
                          <defs>
                            <path
                              id="circlePath"
                              d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
                            />
                          </defs>
                          <text>
                            <textPath
                              xlinkHref="#circlePath"
                              startOffset="0%"
                              style={{
                                fill: "white",
                                fontSize: "12px",
                                textTransform: "uppercase",
                              }}
                            >
                              {isWebSocketPaused
                                ? "Continuar Atualizações de Preço"
                                : "Pausar Atualizações de Preço"}
                            </textPath>
                          </text>
                        </svg>
                      </button>
                    </div>
                    {/* <div className={styles.checkText}>
                      <p>
                        <strong>Modo Clean?</strong>
                      </p>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={isCleaned}
                        onChange={handleCheckboxCleanChange}
                        className={isCleaned ? "is-checked" : ""}
                      />
                      <span
                        className={`${styles.slider} ${
                          isChecked ? "is-checked" : ""
                        }`}
                      ></span>
                    </label> */}
                  </div>
                </>
                {/* {isAdmin && (
                  <>
                    <div className={styles.checkbox}>
                      <div className={styles.checkText}>
                        <p>
                          <strong>Mostrar somente fantokens?</strong>
                        </p>
                        <Soccer color="#fff" />
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleCheckboxChange}
                          className={isChecked ? "is-checked" : ""}
                        />
                        <span
                          className={`${styles.slider} ${
                            isChecked ? "is-checked" : ""
                          }`}
                        ></span>
                      </label>
                    </div>
                  </>
                )} */}
              </div>
              {loadingDolarChange || sortedOperations?.length === 0 ? (
                isChecked ? (
                  <div className={styles.loading}>
                    <PacmanLoader
                      size="3rem"
                      className={styles.loader}
                      color="#007305"
                    />
                  </div>
                ) : (
                  <div className={styles.loading}>
                    <PacmanLoader
                      size="3rem"
                      className={styles.loader}
                      color="#957dff"
                    />
                  </div>
                )
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
                          onChange={(e) =>
                            setItemsPerPage(Number(e.target.value))
                          }
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
                  <div className={styles.operations}>
                    {paginatedOperations.map((operation: any) => {
                      const isGroup =
                        operation._isGroup && operation._groupCount > 1;
                      const isExpanded = expandedGroups.has(operation.ticker);
                      const opsToRender = isGroup
                        ? isExpanded
                          ? operation._groupedOps
                          : [operation._groupedOps[0]]
                        : [operation];

                      // Key única para o grupo ou operação individual
                      const groupKey = isGroup
                        ? `group-${operation.ticker}`
                        : `${operation.ticker}-${operation.lowestAsk.exchange}-${operation.highestBid.exchange}`;

                      return (
                        <div
                          key={groupKey}
                          className={`${styles.operationGroup} ${
                            isGroup ? styles.grouped : ""
                          } ${isExpanded ? styles.expanded : ""}`}
                        >
                          {opsToRender.map((op: any, idx: number) => {
                            const key = `${op.ticker}-${op.lowestAsk.exchange}-${op.highestBid.exchange}`;
                            return (
                              <div
                                key={key}
                                className={`${styles.cardWrapper} ${
                                  isGroup && idx === 0
                                    ? styles.hasExpandButton
                                    : ""
                                }`}
                                style={
                                  isExpanded && isGroup
                                    ? {
                                        animationDelay: `${idx * 0.05}s`,
                                      }
                                    : {}
                                }
                              >
                                {isGroup && idx === 0 && !isExpanded && (
                                  <button
                                    className={styles.expandButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newExpanded = new Set(
                                        expandedGroups
                                      );
                                      newExpanded.add(operation.ticker);
                                      setExpandedGroups(newExpanded);
                                    }}
                                    title={`Expandir ${operation._groupCount} oportunidades`}
                                  >
                                    <div className={styles.expandIcon}>
                                      <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path d="M9 18l6-6-6-6" />
                                      </svg>
                                    </div>
                                    <div className={styles.expandBadge}>
                                      {operation._groupCount}
                                    </div>
                                  </button>
                                )}
                                <FuturosOperationCard
                                  coin={{
                                    image: op.coinImage,
                                    name: op.coin,
                                    ask: op.lowestAsk,
                                    bid: op.highestBid,
                                    fee: op.fee,
                                    tax: op.tax,
                                    symbol: op.ticker,
                                    spread: op.spread,
                                    spreadS: op.spreadS,
                                    fundingRate: op.fundingRate,
                                    spotVolume24H: op.spotVolume24h,
                                    futVolume24H: op.futVolume24h,
                                    validSince: op.validSince ?? 0,
                                    fundingRateExpTs: op.fundingRateExpTs,
                                  }}
                                  dollarPrice={dollarPrice}
                                  isAdmin={isAdmin}
                                  isChecked={isChecked}
                                  isOpen={isOpen}
                                  viewConfig={viewConfig}
                                  onClick={() => setSelectedOperation(op)}
                                  onCalculatorClick={() =>
                                    handleCalculatorClick(op)
                                  }
                                  isFavorite={favorites.includes(key)}
                                  onToggleFavorite={() => toggleFavorite(key)}
                                  onDeleteClick={() =>
                                    setOperationToDelete(key)
                                  }
                                  onChartClick={(url) => {
                                    setTradingViewUrl(url);
                                    setIsTradingViewOpen(true);
                                  }}
                                />
                              </div>
                            );
                          })}

                          {isGroup && isExpanded && (
                            <button
                              className={styles.collapseButton}
                              onClick={() => {
                                const newExpanded = new Set(expandedGroups);
                                newExpanded.delete(operation.ticker);
                                setExpandedGroups(newExpanded);
                              }}
                            >
                              Recolher {operation.ticker}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i;
                            } else if (currentPageIndex < 3) {
                              pageNum = i;
                            } else if (currentPageIndex > totalPages - 4) {
                              pageNum = totalPages - 5 + i;
                            } else {
                              pageNum = currentPageIndex - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPageIndex(pageNum)}
                                className={`${styles.pageBtn} ${
                                  currentPageIndex === pageNum
                                    ? styles.active
                                    : ""
                                }`}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          }
                        )}
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
        </div>
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
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let hasIPChanged = false;
  let isNewUser = false;
  let isAdmin = session?.role === "admin" ? true : false;
  let supportNumber = null;
  let tickerData: Currency[] = [];

  try {
    const result = await updateIP(session.id as string, ip as string);
    hasIPChanged =
      session?.role === "admin" ? false : (result.hasIPChanged as boolean);
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
    props: {
      ip,
      hasIPChanged,
      isAdmin,
      isNewUser,
      supportNumber,
      tickerData,
    },
  };
};
