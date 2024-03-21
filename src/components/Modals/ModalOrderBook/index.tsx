import { useSession } from "next-auth/react";
import { useState } from "react";
import { MdArrowForwardIos } from "react-icons/md";
import type { Orderbook } from "../../../server/router/orderbook";
import { trpc } from "../../../utils/trpc";
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
    orderbook: Orderbook | undefined;
  };
  orderbookAsk: {
    isUSD: boolean;
    orderbook: Orderbook | undefined;
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

  const asksWithTicker = orderbookAsk.orderbook?.asks.map((ask) => ({
    ...ask,
    ticker: symbol, // ou qualquer lógica que você utiliza para definir o ticker
  }));

  const bidsWithTicker = orderbookBid.orderbook?.bids.map((bid) => ({
    ...bid,
    ticker: symbol, // ou qualquer lógica que você utiliza para definir o ticker
  }));

  const formatNumber = (value: number) => {
    return parseFloat(value.toFixed(2)); // Converte para número novamente
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
