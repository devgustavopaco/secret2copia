import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { Header } from "../components/Header";
import { ModalOrderBook } from "../components/Modals/ModalOrderBook";
import { OperationCard } from "../components/OperationCard";
import { Sidebar } from "../components/Sidebar";
import { ArbitrageOpportunity } from "../server/router/orderbook";
import styles from "../styles/Monitor.module.scss";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

import { Exchange } from "@prisma/client";
import { XCircle } from "phosphor-react";
import { BeatLoader, PacmanLoader } from "react-spinners";
import { toast } from "react-toastify";
import { BuyExchangeMobile } from "../components/Mobile/BuyExchangeMobile";
import { SellExchangeMobile } from "../components/Mobile/SellExchangeMobile";

const Monitoring: NextPage = () => {
  const [modalOpenOrderBook, setModalOpenOrderBook] = useState(false);

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

  const clickOnSidebar = () => {
    setSidebarClickCount((prevCount) => prevCount + 1);
  };

  const updateMutation = trpc.useMutation("user.updateUserDollarValue");

  const { data: auth } = useSession();

  const userEmail = auth?.user?.email;

  const [selectedOperation, setSelectedOperation] =
    useState<ArbitrageOpportunity>({} as ArbitrageOpportunity);

  const [loadingDolarChange, setLoadingDolarChange] = useState(false);

  const [dolarValue, setDolarValue] = useState<number | undefined>(undefined);

  const queryInfo = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBuyExchanges = localStorage.getItem("buyExchanges");
      if (savedBuyExchanges) {
        setBuyExchanges(JSON.parse(savedBuyExchanges));
      }

      const savedSellExchanges = localStorage.getItem("sellExchanges");
      if (savedSellExchanges) {
        setSellExchanges(JSON.parse(savedSellExchanges));
      }
    }
  }, [sidebarClickCount]);

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

  const { refetch, data, isLoading, isFetching } = trpc.useQuery(
    [
      "orderBook.getAll",
      {
        buyExchanges: buyExchangesName ?? undefined,
        sellExchanges: sellExchangesName ?? undefined,
        email: userEmail ?? undefined,
      },
    ],
    {
      refetchInterval: 10 * 1000,
      retry(failureCount, error) {
        if (failureCount > 3) {
          return false;
        }
        return true;
      },
      keepPreviousData: true,
      onSuccess(data) {
        if (data?.length === 0 && !isFetching) {
          refetch();
        }
        setLoadingDolarChange(false);
      },
      onError(error) {
        if (!isFetching) {
          refetch();
        }
      },
    }
  );

  const { data: dollarPrice } = trpc.useQuery(["orderBook.getDollar"], {
    refetchInterval: 20 * 1000,
  });

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

  // Mobile
  const onSelectBuyExchangeMobile = useCallback(
    (selectedExchanges: readonly Exchange[]) => {
      if (selectedExchanges !== undefined) {
        const selectedExchangesNames = selectedExchanges.map((exchange) => ({
          name: exchange.name,
          image_url: exchange.image_url as string,
        }));
        setBuyExchanges(selectedExchangesNames);
      }
    },
    []
  );

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
      setLoadingDolarChange(true); // <-- Adicione isto
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
              sortedOperations = undefined;
            },
          }
        );
      }
    },
    [user, dollarPrice]
  );

  // Mobile
  const onSelectSellExchangeMobile = useCallback(
    (selectedExchanges: readonly Exchange[]) => {
      if (selectedExchanges !== undefined) {
        const selectedExchangesNames = selectedExchanges.map((exchange) => ({
          name: exchange.name,
          image_url: exchange.image_url as string,
        }));
        setSellExchanges(selectedExchangesNames);
      }
    },
    []
  );

  let sortedOperations = data
    ?.sort((a, b) => {
      if (a && b) {
        if (a?.spread < b?.spread) {
          return 1;
        }
        if (a?.spread > b?.spread) {
          return -1;
        }
        return 0;
      }
      return 0;
    })
    .filter((operation) => {
      if (operation) {
        return operation.spread > 0;
      }
      return false;
    });

  console.log(modalState);

  return (
    <>
      <Head>
        <title>Monitor - NEXTGAIN</title>
        <meta name="description" content="Monitor - NEXTGAIN" />
      </Head>
      <div>
        {modalState ? <></> : <Header />}
        <div className={styles.mobileFilter}>
          <span>Exchanges Compra</span>
          <BuyExchangeMobile
            defaultExchanges={ActiveExchanges || []}
            selectedExchanges={buyExchangesName || []}
            onSelectBuyExchangeMobile={onSelectBuyExchangeMobile}
            isLoading={isLoading}
          />
        </div>
        <div className={styles.mobileFilter}>
          <span>Exchanges Venda</span>
          <SellExchangeMobile
            defaultExchanges={ActiveExchanges || []}
            selectedExchanges={sellExchangesName || []}
            onSelectSellExchangeMobile={onSelectSellExchangeMobile}
            isLoading={isLoading}
          />
        </div>
        <>
          {modalOpenOrderBook && (
            <ModalOrderBook
              symbol={selectedOperation.ticker}
              orderbookBid={selectedOperation.highestBid}
              orderbookAsk={selectedOperation.lowestAsk}
              buyWhere={selectedOperation.highestBid.image_url}
              sellWhere={selectedOperation.lowestAsk.image_url}
              buyEchangeName={selectedOperation.highestBid.exchange}
              sellEchangeName={selectedOperation.lowestAsk.exchange}
              coin={selectedOperation.coin}
              coinImage={selectedOperation.coinImage}
              setOpenModal={setModalOpenOrderBook}
              dollarPrice={dollarPrice ?? 0}
            />
          )}
        </>
        <div className={styles.backgroundmMonitor}>
          <div
            className={`${styles.content} container`}
            onClick={clickOnSidebar}
          >
            <Sidebar
              dollarPrice={dollarPrice}
              defaultExchanges={ActiveExchanges || []}
              buyExchanges={buyExchanges || []}
              sellExchanges={sellExchanges || []}
              onChangeDolar={onChangeDolar}
              dolarValue={dolarValue as number}
              onModalChange={handleModalState}
            />
            <main>
              <h1>
                {isFetching && <BeatLoader color="#969696" size="0.5rem" />}
              </h1>

              {isLoading ||
              loadingDolarChange ||
              data?.length === 0 ||
              sortedOperations?.length === 0 ? (
                <div className={styles.loading}>
                  <PacmanLoader
                    size="3rem"
                    className={styles.loader}
                    color="#957dff"
                  />
                </div>
              ) : (
                <div className={styles.operations}>
                  {sortedOperations?.map(
                    (operation) =>
                      operation && (
                        <OperationCard
                          key={operation.coin}
                          coin={{
                            image: operation.coinImage,
                            name: operation.coin,
                            ask: {
                              exchange: operation.lowestAsk.exchange,
                              image_url: operation.lowestAsk.image_url,
                              price: operation.lowestAsk.price,
                              isUSD: operation.lowestAsk.isUSD,
                            },
                            bid: {
                              exchange: operation.highestBid.exchange,
                              image_url: operation.highestBid.image_url,
                              price: operation.highestBid.price,
                              isUSD: operation.highestBid.isUSD,
                            },
                            fee: operation.fee,
                            tax: operation.tax,
                            symbol: operation.ticker,
                            spread: operation.spread,
                          }}
                          dollarPrice={dollarPrice}
                          onClick={() => {
                            setSelectedOperation(operation);
                            setModalOpenOrderBook(true);
                          }}
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

export default Monitoring;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
    };
  }

  return {
    props: {},
  };
};
