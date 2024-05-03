import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { XCircle } from "phosphor-react";
import { useCallback, useEffect, useState } from "react";
import { BeatLoader, PacmanLoader } from "react-spinners";
import { toast } from "react-toastify";
import { Header } from "../components/Header";
import { BuyExchangeMobile } from "../components/Mobile/BuyExchangeMobile";
import { SellExchangeMobile } from "../components/Mobile/SellExchangeMobile";
import { ModalOrderBook } from "../components/Modals/ModalOrderBook";
import { OperationCard } from "../components/OperationCard";
import { Sidebar } from "../components/Sidebar";
import Soccer from "../icons/Soccer";
import { updateIP } from "../server/db/checkIP";
import { getSupportNumber } from "../server/db/getSuportNumber";
import { ArbitrageOpportunity } from "../server/router/orderbook";
import styles from "../styles/Monitor.module.scss";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

interface MonitoringProps {
  ip: string;
  supportNumber: string;
  hasIPChanged: boolean;
  isAdmin: boolean;
  isNewUser: boolean;
}

const Monitoring: NextPage<MonitoringProps> = ({
  ip,
  hasIPChanged,
  isAdmin,
  isNewUser,
  supportNumber,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (isChecked && router.pathname === "/monitor") {
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

  const clickOnSidebar = (event: any) => {
    event.stopPropagation();
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

  const fetchPaginatedOrderbook = async ({
    pageParam,
  }: {
    pageParam: number;
  }) => {
    const res = await fetch(
      `https://akatsukistore.com.br/orderbook/getPaginated?buyExchanges=${encodeURI(
        buyExchangesName?.join(",")
      )}&sellExchanges=${encodeURI(
        sellExchangesName?.join(",")
      )}&cursor=${pageParam}&limit=25&email=${userEmail}&isChecked=${isChecked}&dollarValue=${dollarValue}`
    );

    return res.json();
  };

  let queryResult: any;

  if (isAdmin || isNewUser) {
    queryResult = trpc.useInfiniteQuery(
      [
        "orderBook.getPaginated",
        {
          buyExchanges: buyExchangesName ?? undefined,
          sellExchanges: sellExchangesName ?? undefined,
          email: userEmail ?? undefined,
          isChecked: isChecked,
        },
      ],
      {
        getNextPageParam: (lastPage) => {
          const morePagesExist = lastPage.arbitrageOpportunities.length === 50;
          if (!morePagesExist) return undefined;
          return lastPage.nextCursor;
        },
        refetchInterval: 20 * 1000,
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
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryResult = useInfiniteQuery({
      queryKey: ["orderBook.getPaginated"],
      queryFn: fetchPaginatedOrderbook,
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const morePagesExist = lastPage.arbitrageOpportunities?.length === 25;
        if (!morePagesExist) return undefined;
        return lastPage.nextCursor;
      },
      refetchInterval: 20 * 1000,
      retry(failureCount, error) {
        if (failureCount > 3) {
          return false;
        }
        return true;
      },
    });
  }

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
      if (isSuccess) {
        if (data?.pages.flat().length === 0 && !isFetching) {
          refetch();
        }
      }
      if (isError) {
        if (!isFetching) {
          refetch();
        }
      }
    }
  }, [
    data,
    isFetching,
    isError,
    isSuccess,
    refetch,
    buyExchanges,
    sellExchanges,
    isAdmin,
  ]);

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

  let operationsMap = new Map();
  allArbitrageOpportunities.forEach((operation: any) => {
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

  useEffect(() => {
    if (hasIPChanged) {
      signOut({
        callbackUrl: "/",
      });
    }
  }, []);

  useEffect(() => {
    queryClient.removeQueries({
      queryKey: ["orderBook.getPaginated"],
    });
    refetch();
  }, [isChecked, queryClient, refetch]);
  const { data: dollarValue, isLoading: isLoadingDollarValue } = trpc.useQuery([
    "user.getUserDollarValueByEmail",
    { email: userEmail ?? "" },
  ]);

  return (
    <>
      <Head>
        <title>Monitor - NEXTGAIN</title>
        <meta name="description" content="Monitor - NEXTGAIN" />
      </Head>
      <div>
        {modalState ? (
          <></>
        ) : (
          <Header supportNumber={supportNumber} isChecked={isChecked} />
        )}

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
        <div
          className={`${styles.backgroundmMonitor} ${
            isChecked ? styles.backgroundChecked : ""
          }`}
        >
          <div className={`${styles.content} container`}>
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
                isAdmin={isAdmin}
              />
            </div>
            <div onClick={(event) => clickOnSidebar(event)}>
              <Sidebar
                isChecked={isChecked}
                dollarPrice={dollarPrice}
                defaultExchanges={ActiveExchanges || []}
                buyExchanges={buyExchanges || []}
                sellExchanges={sellExchanges || []}
                onChangeDolar={onChangeDolar}
                dolarValue={dolarValue as number}
                onModalChange={handleModalState}
                isAdmin={isAdmin}
              />
            </div>
            <main>
              <div className={styles.topPart}>
                <h1>
                  {isFetching && <BeatLoader color="#969696" size="0.5rem" />}
                </h1>
                {isAdmin && (
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
                )}
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
                          isChecked={isChecked}
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

  try {
    const result = await updateIP(session.id as string, ip as string);
    hasIPChanged =
      session?.role === "admin" ? false : (result.hasIPChanged as boolean);
    const userCreationDate = session.createdAt as Date;
    isNewUser =
      new Date(userCreationDate) >=
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    supportNumber = await getSupportNumber();
  } catch (error) {
    console.error("Erro ao criar ou atualizar registro IP:", error);
  }

  return {
    props: { ip, hasIPChanged, isAdmin, isNewUser, supportNumber },
  };
};
