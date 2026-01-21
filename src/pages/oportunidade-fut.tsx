import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { ArrowLeft, ArrowsCounterClockwise } from "phosphor-react";
import { BeatLoader } from "react-spinners";
import { trpc } from "../utils/trpc";
import styles from "../styles/oportunidade.module.scss";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://almeidashop.shop";
const SOCKET_PATH = "/futuros/socket.io";

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

export default function OportunidadeFutPage() {
  const router = useRouter();
  const { data: auth } = useSession();
  const [isOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"both" | "entry" | "exit">("both");
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

    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket"],
      path: SOCKET_PATH,
    });

    socket.on("connect", () => {
      console.log(
        "✅ Conectado ao socket",
        socket.id,
        buyExchange,
        sellExchange
      );

      socket.emit("subscribe", {
        symbols: [`${ticker}USDT`],
        buyExchanges: [buyExchange],
        sellExchanges: [sellExchange],
        refreshRate: 1000,
        lite: true,
      });
    });

    socket.on("arbitrageDelta", (data) => {
      if (!data?.upserts?.length) return;
      const next = data.upserts.find(
        (opp: ArbitrageOpportunity) =>
          opp.lowestAsk?.exchange === buyExchange &&
          opp.highestBid?.exchange === sellExchange
      );
      if (next) setOpportunity(next);
    });

    socket.on("arbitrageUpdate", (opp) => {
      if (
        opp.lowestAsk?.exchange === buyExchange &&
        opp.highestBid?.exchange === sellExchange
      ) {
        setOpportunity(opp);
      }
    });

    return () => {
      socket.emit("unsubscribe", { symbols: [`${ticker}USDT`] });
      socket.disconnect();
    };
  }, [ticker, buyExchange, sellExchange]);

  // === HELPERS ===
  const calcPrice = (price: number, isUSD: boolean, dolarValue: number) =>
    isUSD ? price : price / dolarValue;

  const formatPairForExchange = (exchange: string, coin: string) => {
    const pair = `${coin}USDT`;

    switch (exchange) {
      case "bybit":
      case "binance":
      case "gate":
      case "bitget":
      case "kucoin":
      case "mexc":
      case "bingx":
      case "okx":
        return pair;
      default:
        return pair;
    }
  };

  const futuresLinks = {
    bybit: (coin: string, pair: string) => {
      const special: Record<string, string> = {
        FIRE: "FIRE",
        VELO: "VELO",
        ZK: "ZK",
      };
      const sc = special[coin.toUpperCase()] || coin;
      return `https://www.bybit.com/trade/${sc}${pair}`;
    },
    binance: (coin: string, pair: string) => {
      const special: Record<string, string> = { TKO: "TKO", ZK: "ZK" };
      const sc = special[coin.toUpperCase()] || coin;
      return `https://www.binance.com/en/futures/${sc}${pair}_PERP`;
    },
    gate: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.gate.com/pt/futures/USDT/${base}_${quote}`;
    },
    bitget: (_: string, pair: string) =>
      `https://www.bitget.com/futures/usdt/${pair}`,
    kucoin: (_: string, pair: string) =>
      `https://futures.kucoin.com/trade/${pair.replace("-", "")}M`,
    mexc: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.mexc.com/futures/${base}_${quote}?type=linear_swap`;
    },
    bingx: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://bingx.com/en/perpetual/${base}-${quote}`;
    },
    huobi: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.htx.com/futures/linear_swap/exchange#contract_code=${base}-${quote}&contract_type=swap&type=cross`;
    },
    okx: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.okx.com/trade-swap/${base}-${quote}-SWAP`;
    },
  };

  const handleRedirect = (
    exchange: string,
    coin: string,
    isFuturesExchange = true
  ) => {
    let normalized = exchange.toLowerCase().replace(/ spot| futures/g, "");
    if (normalized.includes("gate")) normalized = "gate";

    const links = futuresLinks;
    const formattedPair = formatPairForExchange(normalized, coin);
    const builder = (links as any)[normalized];

    if (!builder) return;

    const url = builder(coin, formattedPair);
    const newTab = window.open(url, "_blank");

    if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
      window.location.href = url;
    }
  };

  const tickerValue = Array.isArray(ticker) ? ticker[0] : ticker;
  const coinValue = Array.isArray(coin) ? coin[0] : coin;

  const handleExchangeLink = (exchangeName: string) => {
    if (!tickerValue) return;
    handleRedirect(exchangeName, tickerValue, true);
  };

  // === SPREAD CALC ===
  const currentSpread = useMemo(() => {
    if (!opportunity) return parseFloat(spread as string);

    const dolarValue = user?.dolarValue ?? dollarPrice ?? 1;

    const buyAsk = calcPrice(
      opportunity.lowestAsk.orderbook?.asks?.[0]?.price ??
        opportunity.lowestAsk.price,
      opportunity.lowestAsk.isUSD,
      dolarValue
    );
    const buyBid = calcPrice(
      opportunity.lowestAsk.orderbook?.bids?.[0]?.price ??
        opportunity.lowestAsk.price,
      opportunity.lowestAsk.isUSD,
      dolarValue
    );

    const sellBid = calcPrice(
      opportunity.highestBid.orderbook?.bids?.[0]?.price ??
        opportunity.highestBid.price,
      opportunity.highestBid.isUSD,
      dolarValue
    );
    const sellAsk = calcPrice(
      opportunity.highestBid.orderbook?.asks?.[0]?.price ??
        opportunity.highestBid.price,
      opportunity.highestBid.isUSD,
      dolarValue
    );

    return isOpen
      ? (sellBid / buyAsk - 1) * 100 // Entrada
      : (buyBid / sellAsk - 1) * 100; // Saída
  }, [opportunity, user?.dolarValue, dollarPrice, isOpen, spread]);

  const handleBack = () => router.back();
  const toggleOperation = () => {
    if (viewMode === "entry") {
      setViewMode("exit");
    } else if (viewMode === "exit") {
      setViewMode("entry");
    }
  };

  const toggleViewMode = () => {
    if (viewMode === "both") {
      setViewMode("entry");
    } else if (viewMode === "entry") {
      setViewMode("exit");
    } else {
      setViewMode("both");
    }
  };

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

  const buyAsk = calcPrice(
    opportunity.lowestAsk.orderbook?.asks?.[0]?.price ??
      opportunity.lowestAsk.price,
    opportunity.lowestAsk.isUSD,
    dolarValue
  );
  const buyBid = calcPrice(
    opportunity.lowestAsk.orderbook?.bids?.[0]?.price ??
      opportunity.lowestAsk.price,
    opportunity.lowestAsk.isUSD,
    dolarValue
  );

  const sellBid = calcPrice(
    opportunity.highestBid.orderbook?.bids?.[0]?.price ??
      opportunity.highestBid.price,
    opportunity.highestBid.isUSD,
    dolarValue
  );
  const sellAsk = calcPrice(
    opportunity.highestBid.orderbook?.asks?.[0]?.price ??
      opportunity.highestBid.price,
    opportunity.highestBid.isUSD,
    dolarValue
  );

  return (
    <>
      <Head>
        <title>{tickerValue} - Oportunidade Fut x Fut | NEXTGAIN</title>
        <meta
          name="description"
          content={`Oportunidade fut x fut para ${coinValue} (${tickerValue})`}
        />
      </Head>

      <div className={styles.container}>
        <div className={styles.backgroundBlur}></div>
        <div className={styles.content}>
          <div className={styles.header}>
            <button onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={toggleViewMode}
              className={styles.menuButton}
              title={
                viewMode === "both"
                  ? "Mostrar apenas uma seção"
                  : viewMode === "entry"
                  ? "Mostrar apenas Fechamento"
                  : "Mostrar apenas Entrada"
              }
            >
              <div
                className={`${styles.hamburger} ${
                  viewMode !== "both" ? styles.active : ""
                }`}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            {viewMode !== "both" && (
              <button
                onClick={toggleOperation}
                className={styles.toggleButton}
                title={`Alternar para ${
                  viewMode === "entry" ? "Fechamento" : "Entrada"
                }`}
              >
                <ArrowsCounterClockwise size={24} />
              </button>
            )}
          </div>

          <div className={styles.opportunityCard}>
            <h1 className={styles.coinName}>{ticker}</h1>

            {/* ENTRADA */}
            {(viewMode === "both" || viewMode === "entry") && (
              <div className={styles.operationSection}>
                <h2 className={styles.sectionTitle}>ENTRADA</h2>
                <div className={styles.pricesContainer}>
                  <div className={styles.priceItem}>
                    <button
                      className={styles.exchangeLink}
                      onClick={() =>
                        handleExchangeLink(opportunity.lowestAsk.exchange)
                      }
                      type="button"
                    >
                      <span className={styles.exchangeName}>
                        {opportunity.lowestAsk.exchange}
                      </span>
                      <img
                        src="/new-page/link.svg"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </button>
                    <span className={styles.price}>
                      {numberFormatter.format(buyAsk)}
                    </span>
                  </div>

                  <div className={styles.profitItem}>
                    <span className={styles.profitLabel}>ENTRADA</span>
                    <span
                      className={`${styles.profit} ${
                        opportunity.spread >= 0
                          ? styles.positive
                          : styles.negative
                      }`}
                    >
                      {opportunity.spread >= 0 ? "+" : ""}
                      {opportunity.spread.toFixed(2)}%
                    </span>
                  </div>

                  <div className={styles.priceItem}>
                    <button
                      className={styles.exchangeLink}
                      onClick={() =>
                        handleExchangeLink(opportunity.highestBid.exchange)
                      }
                      type="button"
                    >
                      <span className={styles.exchangeName}>
                        {opportunity.highestBid.exchange}
                      </span>
                      <img
                        src="/new-page/link.svg"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </button>
                    <span className={styles.price}>
                      {numberFormatter.format(sellBid)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* FECHAMENTO */}
            {(viewMode === "both" || viewMode === "exit") && (
              <div className={styles.operationSection}>
                <h2 className={styles.sectionTitle}>FECHAMENTO</h2>
                <div className={styles.pricesContainer}>
                  <div className={styles.priceItem}>
                    <button
                      className={styles.exchangeLink}
                      onClick={() =>
                        handleExchangeLink(opportunity.lowestAsk.exchange)
                      }
                      type="button"
                    >
                      <span className={styles.exchangeName}>
                        {opportunity.lowestAsk.exchange}
                      </span>
                      <img
                        src="/new-page/link.svg"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </button>
                    <span className={styles.price}>
                      {numberFormatter.format(buyBid)}
                    </span>
                  </div>

                  <div className={styles.profitItem}>
                    <span className={styles.profitLabel}>FECHAMENTO</span>
                    <span
                      className={`${styles.profit} ${
                        opportunity.spreadS >= 0
                          ? styles.positive
                          : styles.negative
                      }`}
                    >
                      {opportunity.spreadS >= 0 ? "+" : ""}
                      {opportunity.spreadS.toFixed(2)}%
                    </span>
                  </div>

                  <div className={styles.priceItem}>
                    <button
                      className={styles.exchangeLink}
                      onClick={() =>
                        handleExchangeLink(opportunity.highestBid.exchange)
                      }
                      type="button"
                    >
                      <span className={styles.exchangeName}>
                        {opportunity.highestBid.exchange}
                      </span>
                      <img
                        src="/new-page/link.svg"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </button>
                    <span className={styles.price}>
                      {numberFormatter.format(sellAsk)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
