import { useState } from "react";
import type { Orderbook } from "../../../server/router/orderbook";
import { DataGridOrderbook } from "../../GridComponents/DataGridOrderbook";
import styles from "./styles.module.scss";
import { Coin } from "phosphor-react";
import { MdArrowForwardIos } from "react-icons/md";

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
}

export function ModalOrderBook({
  dollarPrice,
  orderbookBid,
  orderbookAsk,
  buyWhere,
  coinImage,
  sellWhere,
  buyEchangeName,
  sellEchangeName,
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

  const formatNumber = (value: number) => {
    return parseFloat(value.toFixed(2)); // Converte para número novamente
  };

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
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

          {/* <div className={styles.textModalBottom}>
            <span className={styles.textSpan}>Moeda</span>{" "}
            <div className={styles.coin}>
              <img
                src={
                  coinImage ??
                  `https://assets.coincap.io/assets/icons/${symbol?.toLowerCase()}@2x.png`
                }
                alt={coin}
              />
              <span>
                {coin} <b>({symbol})</b>
              </span>
            </div>
          </div> */}

          <div className={styles.contentTabs}>
            <DataGridOrderbook
              data={
                toggleState === "compra"
                  ? orderbookAsk.orderbook.asks
                  : orderbookBid.orderbook.bids
              }
              dollarPrice={formatNumber(dollarPrice)}
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
