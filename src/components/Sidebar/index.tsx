import { Exchange } from "@prisma/client";
import { BeatLoader } from "react-spinners";
import styles from "./styles.module.scss";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useState } from "react";

interface SidebarProps {
  dollarPrice?: number;
  defaultExchanges: Exchange[];
  buyExchanges: string[];
  sellExchanges: string[];
  onSelectBuyExchange: (exchange: string) => void;
  onSelectSellExchange: (exchange: string) => void;
}

export function Sidebar({
  dollarPrice,
  defaultExchanges,
  buyExchanges,
  sellExchanges,
  onSelectBuyExchange,
  onSelectSellExchange,
}: SidebarProps) {
  const [showBuyList, setShowBuyList] = useState(true);
  const [showSellList, setShowSellList] = useState(true);

  const handleShowBuyList = () => {
    setShowBuyList(!showBuyList);
  };

  const handleShowSellList = () => {
    setShowSellList(!showSellList);
  };

  const numberFormatter = new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    maximumFractionDigits: 3,
  });

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Operações</h2>

      <section className={styles["text-section"]}>
        <legend>Cotação do Dólar</legend>
        <p>
          {dollarPrice ? (
            <>
              <span>R$</span> {numberFormatter.format(dollarPrice ?? -1)}
            </>
          ) : (
            <BeatLoader color="#969696" size="0.5rem" />
          )}
        </p>
      </section>

      <section className={styles["filter-section"]}>
        <legend>
          Exchanges <br /> de Compra
          {showBuyList ? (
            <IoIosArrowUp size={30} onClick={handleShowBuyList} />
          ) : (
            <IoIosArrowDown size={30} onClick={handleShowBuyList} />
          )}
        </legend>
        <div className={styles["filter-options"]}>
          {defaultExchanges.length > 0 ? (
            defaultExchanges.map((exchange) => (
              <label key={exchange.name}>
                <>
                  <input
                    type="checkbox"
                    checked={buyExchanges.includes(exchange.name)}
                    onChange={() => {
                      onSelectBuyExchange(exchange.name);
                    }}
                  />
                  {exchange.name}
                </>
              </label>
            ))
          ) : (
            <BeatLoader color="#969696" size="0.5rem" />
          )}
        </div>
      </section>

      <section className={styles["filter-section"]}>
        <legend>
          Exchanges <br /> de Venda
          {showSellList ? (
            <IoIosArrowUp size="30" onClick={handleShowSellList} />
          ) : (
            <IoIosArrowDown size="30" onClick={handleShowSellList} />
          )}
        </legend>
        {showSellList && (
          <div className={styles["filter-options"]}>
            {defaultExchanges.length > 0 ? (
              defaultExchanges.map((exchange) => (
                <label key={exchange.name}>
                  <>
                    <input
                      type="checkbox"
                      checked={sellExchanges.includes(exchange.name)}
                      onChange={() => {
                        onSelectSellExchange(exchange.name);
                      }}
                    />
                    {exchange.name}
                  </>
                </label>
              ))
            ) : (
              <BeatLoader color="#969696" size="0.5rem" />
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
