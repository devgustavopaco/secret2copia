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

import { XCircle } from "phosphor-react";
import { BeatLoader, PacmanLoader } from "react-spinners";
import { toast } from "react-toastify";
import { BuyExchangeMobile } from "../components/Mobile/BuyExchangeMobile";
import { SellExchangeMobile } from "../components/Mobile/SellExchangeMobile";

interface MonitoringProps {
  ip: string;
}

const Monitoring: NextPage<MonitoringProps> = ({ ip }) => {
  console.log(ip);
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

  const { refetch, data, isLoading, isFetching, hasNextPage, fetchNextPage } =
    trpc.useInfiniteQuery(
      [
        "orderBook.getPaginated",
        {
          buyExchanges: buyExchangesName ?? undefined,
          sellExchanges: sellExchangesName ?? undefined,
          email: userEmail ?? undefined,
        },
      ],
      {
        getNextPageParam: (lastPage, allPages) => {
          // You should return `undefined` if there are no more pages
          // You can calculate this from the lastPage's data, if it has a total count, for example
          const morePagesExist = lastPage.arbitrageOpportunities.length === 50; // Adjust accordingly
          if (!morePagesExist) return undefined;

          // Return the index of the next page
          return lastPage.nextCursor;
        },
        refetchInterval: 20 * 1000,
        retry(failureCount, error) {
          if (failureCount > 3) {
            return false;
          }
          return true;
        },
        keepPreviousData: false,
        onSuccess(data) {
          if (data?.pages.flat().length === 0 && !isFetching) {
            refetch();
          }
        },
        onError(error) {
          if (!isFetching) {
            refetch();
          }
        },
      }
    );

  if (hasNextPage && !isLoading && !isFetching) {
    fetchNextPage();
  }

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
    data?.pages.flatMap((page) => page.arbitrageOpportunities) ?? [];

  let operationsMap = new Map();
  allArbitrageOpportunities.forEach((operation) => {
    if (operation && operation.spread > 0) {
      operationsMap.set(operation.coin, operation);
    }
  });

  let sortedOperations = Array.from(operationsMap.values()).sort((a, b) => {
    if (a?.spread < b?.spread) {
      return 1;
    }
    if (a?.spread > b?.spread) {
      return -1;
    }
    return 0;
  });
  const numberFormatter = new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    maximumFractionDigits: 3,
  });

  return (
    <>
      <Head>
        <title>Monitor - NEXTGAIN</title>
        <meta name="description" content="Monitor - NEXTGAIN" />
      </Head>
      <div>
        {modalState ? <></> : <Header />}

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
            {modalState ? (
              <></>
            ) : (
              <div className={styles.dolarBlock}>
                <span>Operações</span>
                <div className={styles.dolarBlockContent}>
                  <span>cotação do dólar</span>
                  <div className={styles.dolarContainer}>
                    <p>
                      {dollarPrice ? (
                        <>
                          <span>R$</span>{" "}
                          {numberFormatter.format(dollarPrice ?? -1)}
                        </>
                      ) : (
                        <BeatLoader color="#969696" size="0.5rem" />
                      )}
                    </p>

                    {dollarPrice ? (
                      <div>
                        <span>R$</span>
                        <input
                          className={styles.dolarLabel}
                          type="number"
                          value={dolarValue}
                          onChange={onChangeDolar}
                          style={{ textAlign: "center" }}
                          placeholder="Valor do Dólar"
                        />
                      </div>
                    ) : (
                      <BeatLoader color="#969696" size="0.5rem" />
                    )}
                  </div>
                </div>
              </div>
            )}
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
              />
            </div>
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

              {loadingDolarChange || sortedOperations?.length === 0 ? (
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
                          key={`${operation.coin}-${operation.lowestAsk.price}-${operation.highestBid.price}-${operation.spread}`}
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
  const { req } = context;

  const forwarded = req.headers["x-forwarded-for"] as string;
  const ip = forwarded
    ? forwarded.split(/, /)[0]
    : req.connection.remoteAddress;

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
    props: { ip },
  };
};
