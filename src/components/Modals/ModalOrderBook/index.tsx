import { useState } from "react";
import { MdArrowForwardIos } from "react-icons/md";
import { DataGridOrderbook } from "../../GridComponents/DataGridOrderbook";
import styles from "./styles.module.scss";

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
    orderbook: { price: number; amount: number }[] | undefined;
  };
  orderbookAsk: {
    isUSD: boolean;
    orderbook: { price: number; amount: number }[] | undefined;
  };
  setOpenModal: (open: boolean) => void;
}

export function ModalOrderBook({
  orderbookBid,
  orderbookAsk,
  buyWhere,
  coinImage,
  sellWhere,
  buyEchangeName,
  sellEchangeName,
  dollarPrice,
  coin,
  symbol,
  setOpenModal,
}: ModalOrderBookProps) {
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

  const asksWithTicker = orderbookAsk.orderbook?.map((ask) => ({
    ...ask,
    ticker: symbol,
  }));

  const bidsWithTicker = orderbookBid.orderbook?.map((bid) => ({
    ...bid,
    ticker: symbol,
  }));

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
              src={
                coinImage ??
                `https://assets.coincap.io/assets/icons/${coin?.toLowerCase()}@2x.png`
              }
              alt={coin}
            ></img>
            <p>{coin}</p>
            <MdArrowForwardIos size={32} className={styles.iconArrow} />
            <img src={`${toggleState === "compra" ? sellWhere : buyWhere}`} />
            <p>{toggleState === "compra" ? sellEchangeName : buyEchangeName}</p>
          </div>

          <div className={styles.contentTabs}>
            <DataGridOrderbook
              data={toggleState === "compra" ? asksWithTicker : bidsWithTicker}
              isUSD={
                toggleState === "compra"
                  ? orderbookAsk.isUSD
                  : orderbookBid.isUSD
              }
              isPurchase={isPurchase}
              dollarPrice={dollarPrice}
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
