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

    const buy =
      (Array.isArray(buyExchange) ? buyExchange[0] : buyExchange) ?? "";
    const sell =
      (Array.isArray(sellExchange) ? sellExchange[0] : sellExchange) ?? "";
    const buyLower = buy.toLowerCase();
    const sellLower = sell.toLowerCase();
    const buyIsSpot = buyLower.includes("spot");
    const buyIsFut = buyLower.includes("futures");
    const sellIsSpot = sellLower.includes("spot");
    const sellIsFut = sellLower.includes("futures");

    const spotExchange = buyIsSpot
      ? buy
      : sellIsSpot
      ? sell
      : sellIsFut && !buyIsFut
      ? buy
      : buy;
    const futuresExchange = buyIsFut
      ? buy
      : sellIsFut
      ? sell
      : buyIsSpot && !sellIsSpot
      ? sell
      : sell;

    const socket: Socket = io("https://almeidashop.shop/", {
      transports: ["websocket"],
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
        buyExchanges: [spotExchange],
        sellExchanges: [futuresExchange],
        refreshRate: 1000,
        lite: true,
      });
    });

    socket.on("arbitrageDelta", (data) => {
      if (!data?.upserts?.length) return;
      const next = data.upserts.find(
        (opp: ArbitrageOpportunity) =>
          opp.lowestAsk?.exchange === spotExchange &&
          opp.highestBid?.exchange === futuresExchange
      );
      if (next) setOpportunity(next);
    });

    socket.on("arbitrageUpdate", (opp) => {
      if (
        opp.lowestAsk?.exchange === spotExchange &&
        opp.highestBid?.exchange === futuresExchange
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

  const isSpot = (exchange: string) => exchange.toLowerCase().includes("spot");

  const isFutures = (exchange: string) =>
    exchange.toLowerCase().includes("futures");

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

  const spotLinks = {
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
      return `https://www.binance.com/en/trade/${sc}${pair}`;
    },
    gate: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(base, "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.gate.io/trade/${base}_${quote}`;
    },
    bitget: (_: string, pair: string) =>
      `https://www.bitget.com/pt/spot/${pair}`,
    kucoin: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(base, "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://trade.kucoin.com/${base}-${quote}`;
    },
    mexc: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(base, "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.mexc.com/exchange/${base}_${quote}`;
    },
    bingx: (_: string, pair: string) => `https://bingx.com/en-us/spot/${pair}`,
    huobi: (coin: string, pair: string) => {
      const base = coin.toLowerCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toLowerCase() || "usdt";
      return `https://www.htx.com/trade/${base}_${quote}?type=spot`;
    },
    okx: (coin: string, pair: string) => {
      const base = coin.toUpperCase();
      const quote =
        pair
          .replace(new RegExp(base, "i"), "")
          .replace("-", "")
          .replace("_", "")
          .toUpperCase() || "USDT";
      return `https://www.okx.com/trade-spot/${base}-${quote}`;
    },
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
    isFuturesExchange = false
  ) => {
    let normalized = exchange.toLowerCase().replace(/ spot| futures/g, "");
    if (normalized.includes("gate")) normalized = "gate";

    const links = isFuturesExchange ? futuresLinks : spotLinks;
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
    handleRedirect(exchangeName, tickerValue, isFutures(exchangeName));
  };

  // === SPREAD CALC ===
  const currentSpread = useMemo(() => {
    if (!opportunity) return parseFloat(spread as string);

    const dolarValue = user?.dolarValue ?? dollarPrice ?? 1;

    // preços corretos do book
    const spotAsk = calcPrice(
      opportunity.lowestAsk.orderbook?.asks?.[0]?.price ??
        opportunity.lowestAsk.price,
      opportunity.lowestAsk.isUSD,
      dolarValue
    );
    const spotBid = calcPrice(
      opportunity.lowestAsk.orderbook?.bids?.[0]?.price ??
        opportunity.lowestAsk.price,
      opportunity.lowestAsk.isUSD,
      dolarValue
    );

    const futBid = calcPrice(
      opportunity.highestBid.orderbook?.bids?.[0]?.price ??
        opportunity.highestBid.price,
      opportunity.highestBid.isUSD,
      dolarValue
    );
    const futAsk = calcPrice(
      opportunity.highestBid.orderbook?.asks?.[0]?.price ??
        opportunity.highestBid.price,
      opportunity.highestBid.isUSD,
      dolarValue
    );

    return isOpen
      ? (futBid / spotAsk - 1) * 100 // Entrada
      : (spotBid / futAsk - 1) * 100; // Saída
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

  const spotSide = isSpot(opportunity.lowestAsk.exchange)
    ? opportunity.lowestAsk
    : opportunity.highestBid;

  const futuresSide = isFutures(opportunity.highestBid.exchange)
    ? opportunity.highestBid
    : opportunity.lowestAsk;

  // preços corretos
  const spotAsk = calcPrice(
    opportunity.lowestAsk.orderbook?.asks?.[0]?.price ??
      opportunity.lowestAsk.price,
    opportunity.lowestAsk.isUSD,
    dolarValue
  );
  const spotBid = calcPrice(
    opportunity.lowestAsk.orderbook?.bids?.[0]?.price ??
      opportunity.lowestAsk.price,
    opportunity.lowestAsk.isUSD,
    dolarValue
  );

  const futBid = calcPrice(
    opportunity.highestBid.orderbook?.bids?.[0]?.price ??
      opportunity.highestBid.price,
    opportunity.highestBid.isUSD,
    dolarValue
  );
  const futAsk = calcPrice(
    opportunity.highestBid.orderbook?.asks?.[0]?.price ??
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
        <title>{tickerValue} - Oportunidade | NEXTGAIN</title>
        <meta
          name="description"
          content={`Oportunidade de arbitragem para ${coinValue} (${tickerValue})`}
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
                      {numberFormatter.format(spotAsk)}
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
                      {numberFormatter.format(futBid)}
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
                      {numberFormatter.format(spotBid)}
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
                      {numberFormatter.format(futAsk)}
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
