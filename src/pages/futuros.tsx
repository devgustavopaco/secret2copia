import React from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios, { CancelTokenSource } from "axios";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { XCircle, Pause, Play } from "phosphor-react";
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
import { useWebSocket } from "../hooks/useWebSocket";
import useSWR from "swr";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });

interface FuturosProps {
  ip: string;
  supportNumber: string;
  hasIPChanged: boolean;
  isAdmin: boolean;
  isNewUser: boolean;
  tickerData: Currency[];
}

const FUTURES_EXCHANGES = ["mexc", "bitget", "kucoin"];

interface WebSocketData {
  [key: string]: string | undefined;
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

  const [orphanCoins, setOrphanCoins] = useState<any[]>([]);
  const [isWebSocketPaused, setIsWebSocketPaused] = useState(false);
  const [webSocketError, setWebSocketError] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});

  const [gateioPrices, setGateioPrices] = useState<Record<string, number>>({});
  const [binancePrices, setBinancePrices] = useState<Record<string, number>>(
    {}
  );
  const [bybitPrices, setBybitPrices] = useState<Record<string, number>>({});
  const [bitgetPrices, setBitgetPrices] = useState<Record<string, number>>({});
  const [bitgetSpotPrices, setBitgetSpotPrices] = useState<
    Record<string, number>
  >({});
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

  const buyExchangesName = Array.isArray(buyExchanges)
    ? buyExchanges.map((e) => e.name)
    : [];

  const sellExchangesName = Array.isArray(sellExchanges)
    ? sellExchanges.map((e) => e.name)
    : [];

  const queryClient = useQueryClient();
  const [cancelToken, setCancelToken] = useState<CancelTokenSource | null>(
    null
  ); // Novo estado para o cancel token

  const fetchPaginatedOrderbook = async ({
    pageParam = 1,
  }: {
    pageParam?: number;
  }) => {
    // Cancelar a requisição anterior se existir
    if (cancelToken) {
      cancelToken.cancel("Canceling previous request.");
    }

    // Criar novo token para a requisição atual
    const newCancelToken = axios.CancelToken.source();
    setCancelToken(newCancelToken);
    const baseURL =
      "https://nestjs-nigre-production.up.railway.app/orderbook/getPaginated";
    const res = await axios.get(baseURL, {
      params: {
        buyExchanges: buyExchangesName?.join(","),
        sellExchanges: sellExchangesName?.join(","),
        email: userEmail,
        isChecked: isChecked,
        dollarValue: dollarValue,
        cursor: pageParam,
        limit: 25,
      },
      cancelToken: newCancelToken.token, // Passar o novo cancel token aqui
    });
    const {
      arbitrageOpportunities: newOpportunities,
      moedasBuscadas,
      orphanCoins,
    } = res.data;
    setOrphanCoins(orphanCoins);

    return res.data;
  };

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
  const [totalPages, setTotalPages] = useState(1);
  const progressPercentage = (currentPage / totalPages) * 100;

  useEffect(() => {
    if (data && data.pages.length > 0) {
      const totalPagesFromData = data.pages[0]?.totalPages ?? 1;
      setTotalPages(totalPagesFromData);

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
              sortedOperations = [];
              setLoadingDolarChange(false);
            },
          }
        );
      }
    },
    [user, dollarPrice]
  );

  let allArbitrageOpportunities =
    data?.pages.flatMap((page: any) => page.arbitrageOpportunities) ?? [];

  // Filtrar e ordenar todas as operações válidas
  let validOperations = allArbitrageOpportunities
    .filter((operation: ArbitrageOpportunity) => {
      // Verificar se a operação é válida e tem spread positivo
      if (!operation || operation.spread <= 0) return false;
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

  let sortedOperations = validOperations;

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

  //   if (!opportunity || !opportunity.lowestAsk || !opportunity.highestBid) {
  //     console.error("Dados de oportunidade faltando");
  //     return false;
  //   }

  //   const lowestAsk = opportunity.lowestAsk.orderbook.asks[0];
  //   const highestBid = opportunity.highestBid.orderbook.bids[0];

  //   if (!lowestAsk || !highestBid) {
  //     console.error("Dados de ask ou bid estão incompletos");
  //     return false;
  //   }

  //   const lowestAskTotalValue =
  //     lowestAsk.price *
  //     lowestAsk.amount *
  //     (opportunity.lowestAsk.isUSD ? dollarValue ?? 1 : 1);
  //   const highestBidTotalValue =
  //     highestBid.price *
  //     highestBid.amount *
  //     (opportunity.highestBid.isUSD ? dollarValue ?? 1 : 1);

  //   const isPriceCriteriaMet =
  //     lowestAskTotalValue >= 400 && highestBidTotalValue >= 400;

  //   return isPriceCriteriaMet;
  // };
  const [isUpdatingDollar, setIsUpdatingDollar] = useState(false);
  const handleDollarChange = useCallback(() => {
    if (dolarValue === undefined || dolarValue === 0) {
      toast.dark(`Dólar Editável Não Pode Ser Nulo!`, {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
      return;
    }
    setIsUpdatingDollar(true);

    setLoadingDolarChange(true);

    // Limpar as operações existentes
    sortedOperations = [];

    // Remover queries existentes para garantir que o próximo fetch seja limpo
    queryClient.removeQueries({
      queryKey: ["orderBook.getPaginated"],
      exact: true,
    });

    // Atualizar o valor do dólar no backend
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

            // Refazer a busca de oportunidades com o novo valor do dólar
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

  // Modify how we collect symbols and their exchanges
  const symbolsWithExchanges = (sortedOperations ?? []).reduce(
    (
      acc: Array<{
        symbol: string;
        buyExchange: string;
        sellExchange: string;
      }>,
      operation: ArbitrageOpportunity
    ) => {
      if (operation.ticker) {
        acc.push({
          symbol: operation.ticker,
          buyExchange: operation.highestBid?.exchange.toLowerCase(),
          sellExchange: operation.lowestAsk?.exchange.toLowerCase(),
        });
      }
      return acc;
    },
    []
  );

  // Fetch prices using WebSocket

  // Definir o fetcher para SWR
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  // Usar SWR para buscar preços da MEXC
  const { data: mexcData } = useSWR("/api/mexcFutures", fetcher, {
    refreshInterval: 500, // Atualiza a cada 500ms
    dedupingInterval: 0, // Não deduplicar requisições
    revalidateOnFocus: false, // Não revalidar ao focar na janela
  });
  // console.log(mexcData, "mexcData");

  // Usar SWR para buscar preços da Bybit
  const { data: bybitData } = useSWR("/api/bybitSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  // Usar SWR para buscar preços da Bitget Futures
  const { data: bitgetFuturesData } = useSWR("/api/bitgetFutures", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  // Usar SWR para buscar preços da Bitget Spot
  const { data: bitgetSpotData } = useSWR("/api/bitgetSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: mexcSpotData } = useSWR("/api/mexcSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });
  console.log(mexcSpotData, "mexcSpotData");
  // Usar SWR para buscar preços da Gateio
  const { data: gateioData } = useSWR("/api/gateioSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });
  console.log(gateioData, "gateioData");

  // Usar SWR para buscar preços da Binance
  const { data: binanceData } = useSWR("/api/binanceSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  // Atualizar o useMemo para reordenar por spread após atualizar os preços
  const updatedOperations = useMemo(() => {
    // Se o WebSocket estiver pausado, retornar as operações originais sem atualizar preços
    if (isWebSocketPaused) {
      return sortedOperations;
    }

    const uniqueOperations = new Set<string>();

    // Primeiro, atualize os preços
    const operationsWithUpdatedPrices = sortedOperations
      .map((operation: any) => {
        const ticker = `${operation.ticker}_USDT`;
        // Usar os dados do SWR diretamente
        const sellPrice = mexcData?.precosFuturos?.[ticker];
        const gateioPrice = gateioData?.precosSpot?.[ticker];
        const bitgetPrice = bitgetFuturesData?.precosFuturos?.[ticker];
        const bitgetSpotPrice = bitgetSpotData?.precosSpot?.[ticker];
        const binancePrice = binanceData?.precosSpot?.[ticker];
        const bybitPrice = bybitData?.precosSpot?.[ticker];

        // Caso especial para ALT_USDT
        const mexcSpotPrice =
          ticker === "ALT_USDT"
            ? mexcSpotData?.precosSpot?.["ALTLAYER_USDT"]
            : mexcSpotData?.precosSpot?.[ticker];

        // Criar uma chave única para cada operação
        const uniqueKey = `${operation.ticker}-${operation.lowestAsk.exchange}-${operation.highestBid.exchange}`;

        // Verificar se a operação já foi processada
        if (uniqueOperations.has(uniqueKey)) {
          return null; // Skip duplicate
        }
        uniqueOperations.add(uniqueKey);

        // Atualizar os preços
        const updatedOperation = {
          ...operation,
          highestBid: {
            ...operation.highestBid,
            price:
              operation.highestBid.exchange === "Mexc"
                ? sellPrice || operation.highestBid.price // Use sellPrice for Mexc
                : operation.highestBid.exchange === "Bitget"
                ? bitgetPrice || operation.highestBid.price // Use bitgetPrice for Bitget
                : operation.highestBid.price, // Default to existing price
          },
          lowestAsk: {
            ...operation.lowestAsk,
            price:
              operation.lowestAsk.exchange === "Gateio"
                ? gateioPrice || operation.lowestAsk.price
                : operation.lowestAsk.exchange === "Binance"
                ? binancePrice || operation.lowestAsk.price
                : operation.lowestAsk.exchange === "Bitget"
                ? bitgetSpotPrice || operation.lowestAsk.price
                : operation.lowestAsk.exchange === "Bybit"
                ? bybitPrice || operation.lowestAsk.price
                : operation.lowestAsk.exchange === "Mexc"
                ? mexcSpotPrice || operation.lowestAsk.price
                : operation.lowestAsk.price,
          },
        };

        // Recalcular o spread com os preços atualizados
        const highestBidPrice = updatedOperation.highestBid.price;
        const lowestAskPrice = updatedOperation.lowestAsk.price;

        if (!isOpen && highestBidPrice > lowestAskPrice) {
          return null;
        }
        // Calcular o novo spread
        const newSpread = isOpen
          ? (highestBidPrice / lowestAskPrice - 1) * 100
          : (lowestAskPrice / highestBidPrice - 1) * 100;

        // Retornar a operação com o spread atualizado
        return {
          ...updatedOperation,
          spread: newSpread,
        };
      })
      .filter((operation: any) => operation !== null); // Remove null entries

    // Agora, reordenar por spread (do maior para o menor)
    return operationsWithUpdatedPrices.sort(
      (a: any, b: any) => b.spread - a.spread
    );
  }, [
    sortedOperations,
    mexcData?.precosFuturos,
    gateioData?.precosSpot,
    bitgetFuturesData?.precosFuturos,
    bitgetSpotData?.precosSpot,
    binanceData?.precosSpot,
    bybitData?.precosSpot,
    mexcSpotData?.precosSpot,
    isWebSocketPaused, // Adicionar isWebSocketPaused como dependência
    isOpen,
  ]);

  // Estado para armazenar tickers assinados
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(
    new Set()
  );
  const [subscribedBitgetTickers, setSubscribedBitgetTickers] = useState<
    Set<string>
  >(new Set());
  const [subscribedBitgetSpotTickers, setSubscribedBitgetSpotTickers] =
    useState<Set<string>>(new Set());
  const [subscribedBybitSpotTickers, setSubscribedBybitSpotTickers] = useState<
    Set<string>
  >(new Set());
  const [subscribedGateIoTickers, setSubscribedGateioTickers] = useState<
    Set<string>
  >(new Set());
  const [subscribedBinanceTickers, setSubscribedBinanceTickers] = useState<
    Set<string>
  >(new Set());
  useEffect(() => {
    const opportunities = sortedOperations.filter(
      (op: any) => op.lowestAsk.exchange === "Gateio"
    );

    if (opportunities.length > 0) {
      const firstFiveOpportunities = opportunities;

      firstFiveOpportunities.forEach((opportunity: any) => {
        const ticker = opportunity.ticker.toUpperCase();

        if (!subscribedGateIoTickers.has(ticker)) {
          console.log(`Assinando ${ticker}`);
          fetch("/api/gateioSpot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "subscribe", symbol: ticker }),
          })
            .then((r) => r.json())
            .then((resp) => console.log("Subscribe:", ticker, resp))
            .catch(console.error);

          setSubscribedGateioTickers(
            new Set([...subscribedGateIoTickers, ticker])
          );
        }
      });
    }
  }, [sortedOperations, subscribedGateIoTickers]);
  useEffect(() => {
    const opportunities = sortedOperations.filter(
      (op: any) => op.lowestAsk.exchange === "Binance"
    );

    if (opportunities.length > 0) {
      const firstFiveOpportunities = opportunities;

      firstFiveOpportunities.forEach((opportunity: any) => {
        const ticker = opportunity.ticker.toUpperCase();

        if (!subscribedBinanceTickers.has(ticker)) {
          console.log(`Assinando ${ticker}`);
          fetch("/api/binanceSpot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "subscribe", symbol: ticker }),
          })
            .then((r) => r.json())
            .then((resp) => console.log("Subscribe:", ticker, resp))
            .catch(console.error);

          setSubscribedBinanceTickers(
            new Set([...subscribedBinanceTickers, ticker])
          );
        }
      });
    }
  }, [sortedOperations, subscribedBinanceTickers]);
  useEffect(() => {
    const opportunities = sortedOperations.filter(
      (op: any) => op.highestBid.exchange === "Mexc"
    );

    // Processa apenas a primeira oportunidade
    if (opportunities.length > 0) {
      const firstFiveOpportunities = opportunities;

      firstFiveOpportunities.forEach((opportunity: any) => {
        const ticker = opportunity.ticker.toUpperCase();

        if (!subscribedTickers.has(ticker)) {
          console.log(`Assinando ${ticker}`);

          fetch("/api/mexcFutures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "subscribe", symbol: ticker }),
          })
            .then((r) => r.json())
            .then((resp) => console.log("Subscribe:", ticker, resp))
            .catch(console.error);

          setSubscribedTickers(new Set([...subscribedTickers, ticker]));
        }
      });
    }
  }, [sortedOperations, subscribedTickers]);
  useEffect(() => {
    const opportunities = sortedOperations.filter(
      (op: any) => op.highestBid.exchange === "Bitget"
    );

    // Processa apenas a primeira oportunidade
    if (opportunities.length > 0) {
      const firstFiveOpportunities = opportunities;

      firstFiveOpportunities.forEach((opportunity: any) => {
        const ticker = opportunity.ticker.toUpperCase();

        if (!subscribedBitgetTickers.has(ticker)) {
          console.log(`Assinando ${ticker}`);

          fetch("/api/bitgetFutures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "subscribe", symbol: ticker }),
          })
            .then((r) => r.json())
            .then((resp) => console.log("Subscribe:", ticker, resp))
            .catch(console.error);

          setSubscribedBitgetTickers(
            new Set([...subscribedBitgetTickers, ticker])
          );
        }
      });
    }
  }, [sortedOperations, subscribedBitgetTickers]);
  useEffect(() => {
    const opportunities = sortedOperations.filter(
      (op: any) => op.lowestAsk.exchange === "Bitget"
    );

    // Processa apenas a primeira oportunidade
    if (opportunities.length > 0) {
      const firstFiveOpportunities = opportunities;

      firstFiveOpportunities.forEach((opportunity: any) => {
        const ticker = opportunity.ticker.toUpperCase();

        if (!subscribedBitgetSpotTickers.has(ticker)) {
          console.log(`Assinando ${ticker}`);

          fetch("/api/bitgetSpot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "subscribe", symbol: ticker }),
          })
            .then((r) => r.json())
            .then((resp) => console.log("Subscribe:", ticker, resp))
            .catch(console.error);

          setSubscribedBitgetSpotTickers(
            new Set([...subscribedBitgetSpotTickers, ticker])
          );
        }
      });
    }
  }, [sortedOperations, subscribedBitgetSpotTickers]);
  useEffect(() => {
    const opportunities = sortedOperations.filter(
      (op: any) => op.lowestAsk.exchange === "Bybit"
    );

    // Processa apenas a primeira oportunidade
    if (opportunities.length > 0) {
      const firstFiveOpportunities = opportunities;

      firstFiveOpportunities.forEach((opportunity: any) => {
        const ticker = opportunity.ticker.toUpperCase();

        if (!subscribedBybitSpotTickers.has(ticker)) {
          console.log(`Assinando ${ticker}`);

          fetch("/api/bybitSpot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "subscribe", symbol: ticker }),
          })
            .then((r) => r.json())
            .then((resp) => console.log("Subscribe:", ticker, resp))
            .catch(console.error);

          setSubscribedBybitSpotTickers(
            new Set([...subscribedBybitSpotTickers, ticker])
          );
        }
      });
    }
  }, [sortedOperations, subscribedBybitSpotTickers]);

  // Função para redirecionar para página de oportunidade individual
  const handleCalculatorClick = (operation: ArbitrageOpportunity) => {
    console.log("handleCalculatorClick chamada"); // Debug

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
    console.log("URL:", url); // Debug

    // Abrir janela maior e mais visível
    const windowFeatures = [
      "width=350",
      "height=300",
      "left=100", // Mais longe da borda
      "top=100", // Mais longe do topo
      "toolbar=no",
      "menubar=no",
      "location=no",
      "status=no",
      "scrollbars=yes",
      "resizable=yes",
    ].join(",");

    const newWindow = window.open(url, "_blank", windowFeatures);
    console.log("Window opened:", newWindow); // Debug

    if (!newWindow) {
      console.error("Popup foi bloqueado!");
      alert("Popup foi bloqueado! Verifique as configurações do navegador.");
    } else {
      // Focar na nova janela
      newWindow.focus();

      // Aguardar um momento e reposicionar para garantir visibilidade
      setTimeout(() => {
        try {
          // Posicionar no canto inferior esquerdo com mais espaço
          newWindow.moveTo(50, Math.max(50, screen.height - 400));
          newWindow.focus(); // Focar novamente
          console.log("Janela reposicionada e focada");
        } catch (error) {
          console.error("Erro ao reposicionar janela:", error);
        }
      }, 100);
    }
  };

  return (
    <>
      <Head>
        <title>Monitor - NEXTGAIN</title>
        <meta name="description" content="Monitor - NEXTGAIN" />
      </Head>
      <div>
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
            <div onClick={(event) => clickOnSidebar(event)}>
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
            <main>
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
                    <div className={styles.checkText}>
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
                    </label>
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
                <div className={styles.operations}>
                  {(updatedOperations ?? []).map(
                    (operation: ArbitrageOpportunity) => (
                      <FuturosOperationCard
                        key={`${operation.coin}-${operation.lowestAsk?.price}-${operation.highestBid?.price}-${operation.spread}`}
                        coin={{
                          image: operation.coinImage,
                          name: operation.coin,
                          ask: operation.lowestAsk,
                          bid: operation.highestBid,
                          fee: operation.fee,
                          tax: operation.tax,
                          symbol: operation.ticker,
                          spread: operation.spread,
                        }}
                        dollarPrice={dollarPrice}
                        isAdmin={isAdmin}
                        isChecked={isChecked}
                        onClick={() => {
                          setSelectedOperation(operation);
                        }}
                        onCalculatorClick={() => {
                          handleCalculatorClick(operation);
                        }}
                        isOpen={isOpen}
                      />
                    )
                  )}
                </div>
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
