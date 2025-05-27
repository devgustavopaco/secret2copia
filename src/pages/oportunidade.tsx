import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { ArrowLeft, ArrowsCounterClockwise } from "phosphor-react";
import { BeatLoader } from "react-spinners";
import useSWR from "swr";
import { Header } from "../components/Header";
import CurrencyCarousel from "../components/MarketCarousel";
import { trpc } from "../utils/trpc";
import styles from "../styles/oportunidade.module.scss";

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "decimal",
  maximumFractionDigits: 8,
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OportunidadePage() {
  const router = useRouter();
  const { data: auth } = useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [currentPrices, setCurrentPrices] = useState<{
    buyPrice?: number;
    sellPrice?: number;
  }>({});

  // Extrair dados da query
  const {
    ticker,
    coin,
    buyExchange,
    buyPrice,
    buyIsUSD,
    sellExchange,
    sellPrice,
    sellIsUSD,
    spread,
  } = router.query;

  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const { data: dollarPrice } = trpc.useQuery(["orderBook.getDollar"], {
    refetchInterval: 20 * 1000,
  });

  // Buscar preços em tempo real baseado nas exchanges
  const { data: mexcData } = useSWR("/api/mexcFutures", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: mexcSpotData } = useSWR("/api/mexcSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: bybitData } = useSWR("/api/bybitSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: bitgetFuturesData } = useSWR("/api/bitgetFutures", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: bitgetSpotData } = useSWR("/api/bitgetSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: gateioData } = useSWR("/api/gateioSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: binanceData } = useSWR("/api/binanceSpot", fetcher, {
    refreshInterval: 500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  // Atualizar preços em tempo real
  useEffect(() => {
    if (!ticker || !buyExchange || !sellExchange) return;

    const tickerSymbol = `${ticker}_USDT`;
    let newBuyPrice = parseFloat(buyPrice as string);
    let newSellPrice = parseFloat(sellPrice as string);

    // Atualizar preço de compra baseado na exchange
    if (buyExchange === "Mexc" && mexcData?.precosFuturos?.[tickerSymbol]) {
      newBuyPrice = mexcData.precosFuturos[tickerSymbol];
    } else if (
      buyExchange === "Bitget" &&
      bitgetFuturesData?.precosFuturos?.[tickerSymbol]
    ) {
      newBuyPrice = bitgetFuturesData.precosFuturos[tickerSymbol];
    }

    // Atualizar preço de venda baseado na exchange
    if (sellExchange === "Gateio" && gateioData?.precosSpot?.[tickerSymbol]) {
      newSellPrice = gateioData.precosSpot[tickerSymbol];
    } else if (
      sellExchange === "Binance" &&
      binanceData?.precosSpot?.[tickerSymbol]
    ) {
      newSellPrice = binanceData.precosSpot[tickerSymbol];
    } else if (
      sellExchange === "Bitget" &&
      bitgetSpotData?.precosSpot?.[tickerSymbol]
    ) {
      newSellPrice = bitgetSpotData.precosSpot[tickerSymbol];
    } else if (
      sellExchange === "Bybit" &&
      bybitData?.precosSpot?.[tickerSymbol]
    ) {
      newSellPrice = bybitData.precosSpot[tickerSymbol];
    } else if (sellExchange === "Mexc") {
      const mexcSpotPrice =
        tickerSymbol === "ALT_USDT"
          ? mexcSpotData?.precosSpot?.["ALTLAYER_USDT"]
          : mexcSpotData?.precosSpot?.[tickerSymbol];
      if (mexcSpotPrice) {
        newSellPrice = mexcSpotPrice;
      }
    }

    setCurrentPrices({
      buyPrice: newBuyPrice,
      sellPrice: newSellPrice,
    });
  }, [
    ticker,
    buyExchange,
    sellExchange,
    buyPrice,
    sellPrice,
    mexcData,
    mexcSpotData,
    bybitData,
    bitgetFuturesData,
    bitgetSpotData,
    gateioData,
    binanceData,
  ]);

  // Calcular spread atual
  const currentSpread = useMemo(() => {
    const buyP = currentPrices.buyPrice || parseFloat(buyPrice as string);
    const sellP = currentPrices.sellPrice || parseFloat(sellPrice as string);

    if (!buyP || !sellP) return parseFloat(spread as string);

    const dolarValue = user?.dolarValue ?? dollarPrice ?? 1;

    const calculatePrice = (price: number, isUSD: boolean) => {
      return isUSD ? price : price / dolarValue;
    };

    const buyPriceCalculated = calculatePrice(buyP, buyIsUSD === "true");
    const sellPriceCalculated = calculatePrice(sellP, sellIsUSD === "true");

    return isOpen
      ? ((buyPriceCalculated - sellPriceCalculated) / sellPriceCalculated) * 100
      : ((sellPriceCalculated - buyPriceCalculated) / buyPriceCalculated) * 100;
  }, [
    currentPrices,
    buyPrice,
    sellPrice,
    buyIsUSD,
    sellIsUSD,
    user?.dolarValue,
    dollarPrice,
    isOpen,
    spread,
  ]);

  const handleBack = () => {
    router.back();
  };

  const toggleOperation = () => {
    setIsOpen(!isOpen);
  };

  if (!ticker || !coin) {
    return (
      <div className={styles.loading}>
        <BeatLoader color="#957dff" size="1rem" />
      </div>
    );
  }

  const dolarValue = user?.dolarValue ?? dollarPrice ?? 1;
  const buyPriceDisplay =
    currentPrices.buyPrice || parseFloat(buyPrice as string);
  const sellPriceDisplay =
    currentPrices.sellPrice || parseFloat(sellPrice as string);

  const calculatePrice = (price: number, isUSD: boolean) => {
    return isUSD ? price : price / dolarValue;
  };

  const buyPriceCalculated = calculatePrice(
    buyPriceDisplay,
    buyIsUSD === "true"
  );
  const sellPriceCalculated = calculatePrice(
    sellPriceDisplay,
    sellIsUSD === "true"
  );

  // Determinar qual exchange compra/vende baseado na operação
  const firstExchange = isOpen ? buyExchange : sellExchange;
  const firstPrice = isOpen ? buyPriceCalculated : sellPriceCalculated;
  const firstType = isOpen ? "(S)" : "(F)"; // S para spot, F para futures

  const secondExchange = isOpen ? sellExchange : buyExchange;
  const secondPrice = isOpen ? sellPriceCalculated : buyPriceCalculated;
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
                  {currentSpread.toFixed(2)}
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
