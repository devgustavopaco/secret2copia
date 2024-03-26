import type { GetServerSideProps, NextPage } from "next";
import { signOut } from "next-auth/react";
import Head from "next/head";
import { ChangeEvent, useEffect, useState } from "react";
import { Header } from "../components/Header";
import { ModalOrderBook } from "../components/Modals/ModalOrderBook";
import { OperationCard } from "../components/OperationCard";
import { Sidebar } from "../components/Sidebar";

import styles from "../styles/Monitor.module.scss";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

import { getServerSession } from "next-auth";
import { BeatLoader, PacmanLoader } from "react-spinners";
import { BuyExchangeMobile } from "../components/Mobile/BuyExchangeMobile";
import { SellExchangeMobile } from "../components/Mobile/SellExchangeMobile";
import { updateIP } from "../server/db/checkIP";
import { getActiveExchanges } from "../server/db/getActiveExchanges";
import { getDollar } from "../server/db/getDollar";
import { Exchange } from "../server/modules/exchanges/ExchangeStrategy";
import { Orderbook } from "../server/router/orderbook";

interface OrderBookGroup {
  [ticker: string]: Exchange[];
}

interface ExchangeOperation {
  price: number;
  amount: number;
  exchange: string;
  exchangeUrl: string;
  exchangeFee: number;
  isUSD: boolean;
  orderbook: Orderbook | undefined;
}

interface ArbitrageOpportunity {
  coin: string;
  coinName: string;
  coinImage: string;
  highestBid: ExchangeOperation;
  lowestAsk: ExchangeOperation;
  spread: number;
  exchangeFee: number;
  coinTax: number;
}

interface MonitoringProps {
  ip: string;
  hasIPChanged: boolean;
  isAdmin: boolean;
  dollarPrice: number;

  ActiveExchanges: {
    id: string;
    tag: string;
    name: string;
    fee: number;
    active: boolean;
    image_url: string | null;
    convert: boolean;
    bronze: boolean;
    silver: boolean;
    gold: boolean;
    platinum: boolean;
  }[];
}

const Monitoring: NextPage<MonitoringProps> = ({
  ip,
  hasIPChanged,
  isAdmin,
  dollarPrice,
  ActiveExchanges,
}) => {
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

  const [buyExchanges, setBuyExchanges] = useState<
    Array<{ name: string; image_url: string; id: string }>
  >(() => {
    if (typeof window !== "undefined") {
      const savedExchanges = localStorage.getItem("buyExchanges");
      return savedExchanges ? JSON.parse(savedExchanges) : [];
    }

    return ActiveExchanges ? ActiveExchanges : [];
  });

  const [sellExchanges, setSellExchanges] = useState<
    Array<{ name: string; image_url: string; id: string }>
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

  const [selectedOperation, setSelectedOperation] =
    useState<ArbitrageOpportunity>({} as ArbitrageOpportunity);

  const [loadingDolarChange, setLoadingDolarChange] = useState(false);

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

  const buyExchangesInfo = Array.isArray(buyExchanges)
    ? buyExchanges.map((e) => ({ name: e.name, id: e.id }))
    : [];

  const sellExchangesInfo = Array.isArray(sellExchanges)
    ? sellExchanges.map((e) => ({ name: e.name, id: e.id }))
    : [];

  const { refetch, data, isLoading, isFetching } = trpc.useQuery(
    [
      "orderBook.getOrderbook",
      {
        buyExchanges: buyExchangesInfo ?? undefined,
        sellExchanges: sellExchangesInfo ?? undefined,
      },
    ],
    {
      refetchInterval: 20 * 1000,
      retry(failureCount, error) {
        if (failureCount > 3) {
          return false;
        }
        return true;
      },
      keepPreviousData: true,
      onSuccess(data) {
        if (!data && !isFetching) {
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

  console.log(data?.orderbook);

  data?.orderbook.forEach((item) => {
    console.log(item.exchangeFee);
  });

  const groupedByTicker = data?.orderbook.reduce(
    (acc: OrderBookGroup, order) => {
      if (order && !acc[order.ticker!]) {
        acc[order.ticker!] = [];
      }
      if (order) acc[order.ticker!]?.push(order);
      return acc;
    },
    {} as OrderBookGroup
  );

  const filteredGroupedByTicker = Object.entries(groupedByTicker || {}).reduce(
    (acc, [ticker, orders]) => {
      if (orders.length > 1) {
        acc[ticker] = orders;
      }
      return acc;
    },
    {} as OrderBookGroup
  );

  const arbitrageOpportunities = Object.keys(filteredGroupedByTicker || {})
    .map((ticker) => {
      const orders = filteredGroupedByTicker[ticker];

      const buyOrders = orders?.filter((order) => order.exchangeType === "buy");

      const sellOrders = orders?.filter(
        (order) => order.exchangeType === "sell"
      );

      let lowestAsk = {
        price: Infinity,
        exchange: "",
        isUSD: true,
        exchangeUrl: "",
        exchangeFee: 0,
        orderbook: Array<
          | {
              price: number;
              amount: number;
              exchangeUrl?: string;
              exchangeFee: number;
            }
          | undefined
        >,
      };

      let highestBid = {
        price: 0,
        exchange: "",
        isUSD: true,
        exchangeUrl: "",
        exchangeFee: 0,
        orderbook: Array<
          | {
              price: number;
              amount: number;
              exchangeUrl?: string;
              exchangeFee: number;
            }
          | undefined
        >,
      };

      buyOrders?.forEach((order, index) => {
        const convertedPrice = order.isUSD
          ? order.asks && order.asks[0]?.price
          : order.asks && Number(order.asks[0]?.price ?? 0) / dollarPrice;
        if (convertedPrice && convertedPrice < lowestAsk.price) {
          lowestAsk = {
            orderbook: order.asks,
            price: convertedPrice,
            exchange: order.name,
            exchangeFee: order.exchangeFee,
            exchangeUrl: order.exchangeUrl ?? "",
            isUSD: order.isUSD ?? false,
          };
        }
      });

      sellOrders?.forEach((order) => {
        const convertedPrice = order.isUSD
          ? order.bids && order.bids[0]?.price
          : order.bids && Number(order.bids[0]?.price ?? 0) / dollarPrice;
        if (convertedPrice && convertedPrice > highestBid.price) {
          highestBid = {
            orderbook: order.bids,
            price: convertedPrice,
            exchange: order.name,
            exchangeFee: order.exchangeFee,
            exchangeUrl: order.exchangeUrl ?? "",
            isUSD: order.isUSD ?? false,
          };
        }
      });
      let totalFee = lowestAsk.exchangeFee + highestBid.exchangeFee;
      let spread = 0;
      console.log(lowestAsk.price);
      if (lowestAsk.price !== Infinity && highestBid.price !== 0) {
        spread = ((highestBid.price - lowestAsk.price) / lowestAsk.price) * 100;
      }

      return {
        coin: ticker,
        lowestAsk,
        highestBid,
        coinImage: orders![0]?.coinImage || null,
        coinName: orders![0]?.coinName || "",
        spread: Number(spread.toFixed(2)),
        exchangeFee: totalFee,
        coinTax: orders![0]?.coinTax || 0,
      };
    })
    .filter((opportunity) => {
      if (opportunity.spread > 0) return true;
      else return false;
    });

  let operationsMap = new Map();
  arbitrageOpportunities.forEach((operation) => {
    if (operation && operation.spread > 0) {
      operationsMap.set(operation.coin, operation);
    }
  });

  let sortedOperations: ArbitrageOpportunity[] = Array.from(
    operationsMap.values()
  ).sort((a, b) => {
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
  }, [hasIPChanged]);

  function onChangeDolar(event: ChangeEvent<HTMLInputElement>): void {
    throw new Error("Function not implemented.");
  }

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
              symbol={selectedOperation.coin}
              orderbookBid={selectedOperation.highestBid}
              orderbookAsk={selectedOperation.lowestAsk}
              buyWhere={selectedOperation.highestBid.exchangeUrl}
              sellWhere={selectedOperation.lowestAsk.exchangeUrl}
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
                          value={dollarPrice}
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
                dolarValue={dollarPrice as number}
                onModalChange={handleModalState}
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
                dolarValue={dollarPrice as number}
                onModalChange={handleModalState}
                isAdmin={isAdmin}
              />
            </div>
            <Sidebar
              dollarPrice={dollarPrice}
              defaultExchanges={ActiveExchanges || []}
              buyExchanges={buyExchanges || []}
              sellExchanges={sellExchanges || []}
              onChangeDolar={onChangeDolar}
              dolarValue={dollarPrice as number}
              onModalChange={handleModalState}
              isAdmin={isAdmin}
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
                            name: operation.coinName,
                            ask: {
                              exchange: operation.lowestAsk.exchange,
                              image_url: operation.lowestAsk.exchangeUrl,
                              price: operation.lowestAsk.price,
                              isUSD: operation.lowestAsk.isUSD,
                            },
                            bid: {
                              exchange: operation.highestBid.exchange,
                              image_url: operation.highestBid.exchangeUrl,
                              price: operation.highestBid.price,
                              isUSD: operation.highestBid.isUSD,
                            },
                            fee: operation.exchangeFee,
                            tax: operation.coinTax * operation.lowestAsk.price,
                            symbol: operation.coin,
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
  const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let hasIPChanged = false;

  let isAdmin = session?.role === "admin" ? true : false;

  const dollarPrice = await getDollar();

  const ActiveExchanges = await getActiveExchanges(
    session.user?.email as string
  );

  try {
    const result = await updateIP(session.id as string, ip as string);
    hasIPChanged =
      session?.role === "admin" ? false : (result.hasIPChanged as boolean);
  } catch (error) {
    console.error("Erro ao criar ou atualizar registro IP:", error);
  }

  return {
    props: { ip, hasIPChanged, isAdmin, dollarPrice, ActiveExchanges },
  };
};
