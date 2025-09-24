import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { ArrowLeft, ArrowsCounterClockwise } from "phosphor-react";
import { BeatLoader } from "react-spinners";
import { trpc } from "../utils/trpc";
import styles from "../styles/oportunidade.module.scss";
import { io, Socket } from "socket.io-client";

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "decimal",
  maximumFractionDigits: 8,
});

interface OrderbookOperation {
  price: number;
  amount: number;
  sumVolume: number;
}

interface SideInfo {
  exchange: string;
  price: number;
  amount: number;
  isUSD: boolean;
  orderbook: {
    asks: OrderbookOperation[];
    bids: OrderbookOperation[];
  };
}

interface ArbitrageOpportunity {
  coin: string;
  ticker: string;
  lowestAsk: SideInfo;
  highestBid: SideInfo;
  spread: number;
  spreadS: number;
  tax?: number;
  fee?: number;
}

export default function OportunidadePage() {
  const router = useRouter();
  const { data: auth } = useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [opportunity, setOpportunity] = useState<ArbitrageOpportunity | null>(
    null
  );

  // Query params
  const { ticker, coin, buyExchange, sellExchange, spread } = router.query;

  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const { data: dollarPrice } = trpc.useQuery(["orderBook.getDollar"], {
    refetchInterval: 20 * 1000,
  });

  // === SOCKET SETUP ===
  useEffect(() => {
    if (!ticker || !buyExchange || !sellExchange) return;

    const socket: Socket = io(
      "https://futures-socket-copy-production.up.railway.app/",
      {
        transports: ["websocket"],
      }
    );

    socket.on("connect", () => {
      console.log(
        "✅ Conectado ao socket",
        socket.id,
        buyExchange,
        sellExchange
      );

      socket.emit("subscribe", {
        symbols: [`${ticker}USDT`],
        buyExchanges: [sellExchange],
        sellExchanges: [buyExchange],
        refreshRate: 1000,
      });
    });

    socket.on("arbitrageDelta", (data) => {
      console.log(data, "DT");
      if (data.upserts?.length > 0) {
        setOpportunity(data.upserts[0]);
      }
    });

    socket.on("arbitrageUpdate", (opp) => {
      setOpportunity(opp);
    });

    return () => {
      socket.emit("unsubscribe", { symbols: [`${ticker}USDT`] });
      socket.disconnect();
    };
  }, [ticker, buyExchange, sellExchange]);

  // === HELPERS ===
  const calcPrice = (price: number, isUSD: boolean, dolarValue: number) =>
    isUSD ? price : price / dolarValue;

  const isSpot = (exchange: string) => exchange.toLowerCase().includes("spot");

  const isFutures = (exchange: string) =>
    exchange.toLowerCase().includes("futures");

  // === SPREAD CALC ===
  const currentSpread = useMemo(() => {
    if (!opportunity) return parseFloat(spread as string);

    const dolarValue = user?.dolarValue ?? dollarPrice ?? 1;

    // preços corretos do book
    const spotAsk = calcPrice(
      opportunity.lowestAsk.orderbook.asks[0]?.price ??
        opportunity.lowestAsk.price,
      opportunity.lowestAsk.isUSD,
      dolarValue
    );
    const spotBid = calcPrice(
      opportunity.lowestAsk.orderbook.bids[0]?.price ??
        opportunity.lowestAsk.price,
      opportunity.lowestAsk.isUSD,
      dolarValue
    );

    const futBid = calcPrice(
      opportunity.highestBid.orderbook.bids[0]?.price ??
        opportunity.highestBid.price,
      opportunity.highestBid.isUSD,
      dolarValue
    );
    const futAsk = calcPrice(
      opportunity.highestBid.orderbook.asks[0]?.price ??
        opportunity.highestBid.price,
      opportunity.highestBid.isUSD,
      dolarValue
    );

    return isOpen
      ? (futBid / spotAsk - 1) * 100 // Entrada
      : (spotBid / futAsk - 1) * 100; // Saída
  }, [opportunity, user?.dolarValue, dollarPrice, isOpen, spread]);

  const handleBack = () => router.back();
  const toggleOperation = () => setIsOpen(!isOpen);

  if (!ticker || !coin) {
    return (
      <div className={styles.loading}>
        <BeatLoader color="#957dff" size="1rem" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className={styles.loading}>
        <BeatLoader color="#957dff" size="1rem" />
        <p>Aguardando dados do socket...</p>
      </div>
    );
  }

  // === PREÇOS E EXCHANGES FILTRADOS ===
  const dolarValue = user?.dolarValue ?? dollarPrice ?? 1;

  const spotSide = isSpot(opportunity.lowestAsk.exchange)
    ? opportunity.lowestAsk
    : opportunity.highestBid;

  const futuresSide = isFutures(opportunity.highestBid.exchange)
    ? opportunity.highestBid
    : opportunity.lowestAsk;

  // preços corretos
  const spotAsk = calcPrice(
    opportunity.lowestAsk.orderbook.asks[0]?.price ??
      opportunity.lowestAsk.price,
    opportunity.lowestAsk.isUSD,
    dolarValue
  );
  const spotBid = calcPrice(
    opportunity.lowestAsk.orderbook.bids[0]?.price ??
      opportunity.lowestAsk.price,
    opportunity.lowestAsk.isUSD,
    dolarValue
  );

  const futBid = calcPrice(
    opportunity.highestBid.orderbook.bids[0]?.price ??
      opportunity.highestBid.price,
    opportunity.highestBid.isUSD,
    dolarValue
  );
  const futAsk = calcPrice(
    opportunity.highestBid.orderbook.asks[0]?.price ??
      opportunity.highestBid.price,
    opportunity.highestBid.isUSD,
    dolarValue
  );

  // Decide preços mostrados na tela de acordo com a direção
  const firstExchange = isOpen
    ? opportunity.lowestAsk.exchange
    : opportunity.highestBid.exchange;
  const firstPrice = isOpen ? spotAsk : futAsk;
  const firstType = isOpen ? "(S)" : "(F)";

  const secondExchange = isOpen
    ? opportunity.highestBid.exchange
    : opportunity.lowestAsk.exchange;
  const secondPrice = isOpen ? futBid : spotBid;
  const secondType = isOpen ? "(F)" : "(S)";

  return (
    <>
      <Head>
        <title>{ticker} - Oportunidade | NEXTGAIN</title>
        <meta
          name="description"
          content={`Oportunidade de arbitragem para ${coin} (${ticker})`}
        />
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <button onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={24} />
            </button>
            <button onClick={toggleOperation} className={styles.toggleButton}>
              <ArrowsCounterClockwise size={24} />
            </button>
          </div>

          <div className={styles.opportunityCard}>
            <h1 className={styles.coinName}>{ticker}</h1>
            <p className={styles.operationType}>
              {isOpen ? "Entrada" : "Saída"}
            </p>

            <div className={styles.pricesContainer}>
              <div className={styles.priceItem}>
                <span className={styles.exchangeName}>
                  {firstExchange} {firstType}
                </span>
                <span className={styles.price}>
                  {numberFormatter.format(firstPrice)}
                </span>
              </div>

              <div className={styles.profitItem}>
                <span className={styles.profitLabel}>Lucro</span>
                <span
                  className={`${styles.profit} ${
                    currentSpread >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {currentSpread >= 0 ? "+" : ""}
                  {currentSpread.toFixed(2)}%
                </span>
              </div>

              <div className={styles.priceItem}>
                <span className={styles.exchangeName}>
                  {secondExchange} {secondType}
                </span>
                <span className={styles.price}>
                  {numberFormatter.format(secondPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
