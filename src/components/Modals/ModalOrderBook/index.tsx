import { useSession } from "next-auth/react";
import { useState } from "react";
import { MdArrowForwardIos } from "react-icons/md";
import type { Orderbook } from "../../../server/router/orderbook";
import { trpc } from "../../../utils/trpc";
import { DataGridOrderbook } from "../../GridComponents/DataGridOrderbook";
import styles from "./styles.module.scss";
import { pro } from "ccxt";
import InputMask from "react-input-mask";
import { NumericFormat } from "react-number-format";
import { toast } from "react-toastify";

interface ModalOrderBookProps {
  coin: string | undefined;
  symbol: string | undefined;
  coinImage: string | undefined;
  buyWhere: string | undefined;
  buyEchangeName: string;
  sellEchangeName: string;
  sellWhere: string | undefined;
  dollarPrice: number;

  orderbookBid: {
    isUSD: boolean;
    orderbook: Orderbook;
  };
  orderbookAsk: {
    isUSD: boolean;
    orderbook: Orderbook;
  };
  setOpenModal: (open: boolean) => void;
  fee: number;
  tax: number;
}

export function ModalOrderBook({
  orderbookBid,
  orderbookAsk,
  buyWhere,
  coinImage,
  sellWhere,
  buyEchangeName,
  sellEchangeName,
  coin,
  symbol,
  tax,
  fee,
  setOpenModal,
}: ModalOrderBookProps) {
  const [totalBuy, setTotalBuy] = useState<number | null>(null);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [useCustomValues, setUseCustomValues] = useState(false);
  const [customBuyPrice, setCustomBuyPrice] = useState("");
  const [customVolume, setCustomVolume] = useState("");
  const [customSellPrice, setCustomSellPrice] = useState("");

  const [totalSell, setTotalSell] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);
  const [grossProfit, setGrossProfit] = useState<number | null>(null);
  const [totalFees, setTotalFees] = useState<number | null>(null);

  const [toggleState, setToggleState] = useState<"compra" | "venda">("compra");
  const [isPurchase, isPurchaseState] = useState<boolean>(false);

  const toggleTab = (tab: "compra" | "venda") => {
    setToggleState(tab);
    if (toggleState == "compra") {
      isPurchaseState(true);
    } else {
      isPurchaseState(false);
    }
  };

  const asksWithTicker = orderbookAsk.orderbook.asks.map((ask) => ({
    ...ask,
    ticker: symbol,
  }));

  const bidsWithTicker = orderbookBid.orderbook.bids.map((bid) => ({
    ...bid,
    ticker: symbol,
  }));

  const formatNumber = (value: number) => {
    return parseFloat(value.toFixed(2));
  };

  const { data: auth } = useSession();
  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const dolarValue = user?.dolarValue ?? 1;

  return (
    <div
      className={styles.modalBackground}
      onClick={() => {
        setOpenModal(false);
      }}
    >
      <div
        className={styles.modalContainer}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={styles.container}>
          <div className={styles.blocTabs}>
            <button
              className={`${styles.tabs} ${
                toggleState === "compra" ? "activeCompra" : ""
              }`}
              onClick={() => toggleTab("compra")}
            >
              Compra
            </button>
            <button
              className={`${styles.tabs} ${
                toggleState === "venda" ? "activeVenda" : ""
              }`}
              onClick={() => toggleTab("venda")}
            >
              Venda
            </button>
          </div>

          <div className={styles.textModal}>
            <span>Exchange</span>
          </div>
          <div className={styles.buyAndSell}>
            <img
              src={`${
                coinImage ??
                `https://assets.coincap.io/assets/icons/${symbol?.toLowerCase()}@2x.png`
              }`}
            />
            <p>{coin}</p>
            <MdArrowForwardIos size={32} className={styles.iconArrow} />
            <img src={`${toggleState === "compra" ? sellWhere : buyWhere}`} />
            <p>{toggleState === "compra" ? sellEchangeName : buyEchangeName}</p>
          </div>
          <button
            onClick={() => setIsCalculatorVisible((prev) => !prev)}
            className={styles.calculatorButton}
            aria-label="Toggle Calculator"
          >
            <img src="/icons/calculator.svg" alt="calculator" />
          </button>
          {isCalculatorVisible && (
            <div className={styles.calculatorHeader}>
              {!useCustomValues ? (
                <div
                  style={{ display: "flex", gap: "10px" }}
                  className={styles.selectContainer}
                >
                  <select name="buyPrice" id="buyPrice">
                    <option value="">Preço de compra</option>
                    {orderbookAsk.orderbook.asks
                      .slice(0, 10)
                      .map((ask, index) => (
                        <option key={index} value={ask.price}>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            minimumFractionDigits: 4,
                          }).format(
                            ask.price * (orderbookAsk.isUSD ? dolarValue : 1)
                          )}
                        </option>
                      ))}
                  </select>

                  <select name="volume" id="volume">
                    <option value="">Volume</option>
                    {[
                      ...orderbookAsk.orderbook.asks
                        .slice(0, 10)
                        .map((ask) => ({
                          volume: ask.sumVolume,
                          type: "Compra",
                        })),
                      ...orderbookBid.orderbook.bids
                        .slice(0, 10)
                        .map((bid) => ({
                          volume: bid.sumVolume,
                          type: "Venda",
                        })),
                    ].map((item, index) => (
                      <option key={index} value={item.volume}>
                        {new Intl.NumberFormat("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(item.volume)}{" "}
                      </option>
                    ))}
                  </select>

                  <select name="sellPrice" id="sellPrice">
                    <option value="">Preço de venda</option>
                    {orderbookBid.orderbook.bids
                      .slice(0, 10)
                      .map((bid, index) => (
                        <option key={index} value={bid.price}>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            minimumFractionDigits: 4,
                          }).format(
                            bid.price * (orderbookBid.isUSD ? dolarValue : 1)
                          )}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <>
                  <div
                    style={{ display: "flex", gap: "10px" }}
                    className={styles.selectContainer}
                  >
                    <NumericFormat
                      value={customBuyPrice}
                      onValueChange={(values) =>
                        setCustomBuyPrice(values.value)
                      }
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={4}
                      fixedDecimalScale={false}
                      prefix="$ "
                      allowNegative={false}
                      placeholder="Preço de compra"
                      className="my-input"
                    />
                    <NumericFormat
                      value={customVolume}
                      onValueChange={(values) => setCustomVolume(values.value)}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale={false}
                      allowNegative={false}
                      placeholder="Volume"
                      className="my-input"
                    />
                    <NumericFormat
                      value={customSellPrice}
                      onValueChange={(values) =>
                        setCustomSellPrice(values.value)
                      }
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={4}
                      fixedDecimalScale={false}
                      prefix="$ "
                      allowNegative={false}
                      placeholder="Preço de venda"
                      className="my-input"
                    />
                  </div>
                </>
              )}
              <div
                style={{ display: "flex", flexDirection: "row", gap: "10px" }}
              >
                <button
                  onClick={() => setUseCustomValues((prev) => !prev)}
                  style={{ background: "#fff", color: "#7b61ff" }}
                >
                  {useCustomValues
                    ? "Usar Valores do Mercado"
                    : "Usar Próprios Valores"}
                </button>
                <button
                  onClick={() => {
                    let buyPrice, volume, sellPrice;

                    if (useCustomValues) {
                      buyPrice = parseFloat(customBuyPrice) || 0;
                      volume = parseFloat(customVolume) || 0;
                      sellPrice = parseFloat(customSellPrice) || 0;
                    } else {
                      buyPrice =
                        parseFloat(
                          (
                            document.getElementById(
                              "buyPrice"
                            ) as HTMLSelectElement
                          ).value
                        ) * (orderbookAsk.isUSD ? dolarValue : 1);

                      volume = parseFloat(
                        (document.getElementById("volume") as HTMLSelectElement)
                          .value
                      );

                      sellPrice =
                        parseFloat(
                          (
                            document.getElementById(
                              "sellPrice"
                            ) as HTMLSelectElement
                          ).value
                        ) * (orderbookBid.isUSD ? dolarValue : 1);
                    }

                    if (
                      isNaN(buyPrice) ||
                      isNaN(volume) ||
                      isNaN(sellPrice) ||
                      buyPrice === 0 ||
                      volume === 0 ||
                      sellPrice === 0
                    ) {
                      toast.warning("Preencha todos os valores necessários!");
                      return;
                    }

                    const totalBuyValue = buyPrice * volume;
                    const totalSellValue = sellPrice * volume;

                    const totalFee = fee * (totalBuyValue + totalSellValue);
                    const adjustedTax =
                      tax * (orderbookAsk.isUSD ? dolarValue : 1);
                    const toFixedTax = parseFloat(adjustedTax.toFixed(2));

                    const totalProfit =
                      totalSellValue - totalBuyValue - totalFee - toFixedTax;
                    const grossProfitValue = totalSellValue - totalBuyValue;
                    const totalFeesValue = totalFee + adjustedTax;

                    setGrossProfit(grossProfitValue);
                    setTotalFees(totalFeesValue);
                    setTotalBuy(totalBuyValue);
                    setTotalSell(totalSellValue);
                    setProfit(totalProfit);
                  }}
                >
                  Calcular
                </button>
              </div>
              {totalBuy !== null &&
                totalSell !== null &&
                grossProfit !== null &&
                totalFees !== null &&
                profit !== null && (
                  <div
                    className={`${styles.result} ${
                      profit >= 0 ? styles.positive : styles.negative
                    }`}
                  >
                    <p>
                      <strong>Total de Compra:</strong> ${" "}
                      {totalBuy.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p>
                      <strong>Total de Venda:</strong> ${" "}
                      {totalSell.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p>
                      <strong>Lucro Bruto:</strong> ${" "}
                      {grossProfit.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p>
                      <strong>Taxas Totais:</strong> ${" "}
                      {totalFees.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="highlight">
                      <strong>
                        {profit >= 0 ? "Lucro Líquido:" : "Prejuízo:"}
                      </strong>{" "}
                      ${" "}
                      {Math.abs(profit).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
            </div>
          )}
          <div className={styles.contentTabs}>
            <DataGridOrderbook
              data={toggleState === "compra" ? asksWithTicker : bidsWithTicker}
              isUSD={
                toggleState === "compra"
                  ? orderbookAsk.isUSD
                  : orderbookBid.isUSD
              }
              isPurchase={isPurchase}
            />
          </div>
        </div>

        <footer className={styles.footer}>
          <button
            className={styles.voltarBtn}
            onClick={() => {
              setOpenModal(false);
            }}
            type="button"
          >
            Voltar
          </button>
        </footer>
      </div>
    </div>
  );
}
