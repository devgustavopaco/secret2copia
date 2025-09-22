import { useEffect, useState } from "react";
import { trpc } from "../../../utils/trpc";
import styles from "./styles.module.scss";

interface ModalExchange {
  isOpen?: boolean;
  onClose: () => void;
  operation?: string | null;
  isAdmin: boolean;
  isChecked?: boolean;
  isCleaned?: boolean;
}

const ALLOWED_BUY_EXCHANGES = [
  // "Binance",
  // "Bybit",
  "Gateio",
  "Bitget",
  "Mexc",
  "Bingx",
  "Kucoin",
  "Huobi",
];
const ALLOWED_SELL_EXCHANGES = [
  "Gateio",
  "Bitget",
  "Mexc",
  // "Bingx",
  "Kucoin",
  "Huobi",
];

export function FullScreenModal({
  onClose,
  operation,
  isAdmin,
  isChecked,
  isCleaned,
}: ModalExchange) {
  const { data: activeExchanges } = trpc.useQuery(
    ["exchange.getActiveExchanges"],
    {
      ssr: true,
    }
  );

  console.log(activeExchanges, "AE");

  const [selectedExchanges, setSelectedExchanges] = useState<any[]>(() => {
    const storedData = localStorage.getItem(
      operation === "compra" ? "buyExchanges" : "sellExchanges"
    );
    return storedData ? JSON.parse(storedData) : [];
  });

  const filteredExchanges =
    activeExchanges?.filter((exchange) =>
      operation === "compra"
        ? ALLOWED_BUY_EXCHANGES.includes(exchange.name)
        : ALLOWED_SELL_EXCHANGES.includes(exchange.name)
    ) || [];

  const handleAddExchangeClick = (exchange: any) => {
    setSelectedExchanges((prev) => {
      if (prev.find((e) => e.id === exchange.id)) return prev;

      if (!isAdmin && prev.length >= 4) {
        alert(
          `Você só pode selecionar 4 opções para ${
            operation === "compra" ? "compra" : "venda"
          }.`
        );
        return prev;
      }

      const newSelection = [...prev, exchange];
      localStorage.setItem(
        operation === "compra" ? "buyExchanges" : "sellExchanges",
        JSON.stringify(newSelection)
      );
      window.dispatchEvent(new Event("exchangeUpdated"));
      return newSelection;
    });
  };

  const handleRemoveExchangeClick = (exchange: any) => {
    setSelectedExchanges((prev) => {
      const newSelection = prev.filter((e) => e.id !== exchange.id);
      localStorage.setItem(
        operation === "compra" ? "buyExchanges" : "sellExchanges",
        JSON.stringify(newSelection)
      );
      window.dispatchEvent(new Event("exchangeUpdated")); // 👈 dispare também no remove
      return newSelection;
    });
  };

  return (
    <div
      className={`${styles.container} ${
        isCleaned
          ? styles.containerCleaned
          : isChecked
          ? styles.containerChecked
          : ""
      }`}
    >
      <div className={`${styles.contentModal} container`}>
        <div className={styles.headerModal}>
          <div className={styles.contentHeaderModal}>
            <p>
              SELECIONE CORRETORAS PARA A {operation?.toUpperCase() || "COMPRA"}
            </p>
            <img src="images/X.svg" alt="Close modal" onClick={onClose} />
          </div>
        </div>

        <div className={styles.selectedExchangesContainer}>
          {Array.isArray(selectedExchanges) &&
            selectedExchanges.map((exchange) => (
              <div key={exchange.id} className={styles.selectedExchanges}>
                <div className={styles.selectedExchangesBlock}>
                  <img
                    src={exchange.image_url || ""}
                    alt={`${exchange.name} Logo`}
                  />
                  <p>{exchange.name}</p>
                </div>
                <img
                  src="images/X.svg"
                  alt="Remove exchange"
                  onClick={() => handleRemoveExchangeClick(exchange)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            ))}
        </div>

        <div className={styles.orderExchanges}>
          <div className={styles.orderExchangesBlock}>
            {filteredExchanges.map((exchange) => {
              const isSelected = selectedExchanges.find(
                (e) => e.id === exchange.id
              );
              return (
                <div
                  key={exchange.id}
                  className={`${styles.exchangeCard} ${
                    isSelected ? styles.selected : ""
                  }`}
                  onClick={() => handleAddExchangeClick(exchange)}
                >
                  <img
                    src={exchange.image_url || ""}
                    alt={`${exchange.name} Logo`}
                  />
                  <p>{exchange.name}</p>

                  {isSelected ? (
                    <img
                      src="images/checkedIcon.svg"
                      className={styles.selectedIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveExchangeClick(exchange);
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
