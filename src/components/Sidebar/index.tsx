import { Exchange } from "@prisma/client";
import { useState } from "react";
import { BeatLoader } from "react-spinners";
import { FullScreenModal } from "../Modals/ModalSelectBuyExchange";
import styles from "./styles.module.scss";

interface SidebarProps {
  dollarPrice?: number;
  defaultExchanges: Exchange[];
  buyExchanges: { name: string; image_url: string }[];
  sellExchanges: { name: string; image_url: string }[];
  onChangeDolar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dolarValue: number;
}

export function Sidebar({
  dollarPrice,
  dolarValue,
  onChangeDolar,
  buyExchanges,
  sellExchanges,
}: SidebarProps) {
  const [isModalBuyOpen, setIsModalBuyOpen] = useState(false);

  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const toggleModalBuy = (operation: string) => {
    setIsModalBuyOpen(!isModalBuyOpen);
    setCurrentOperation(operation);
  };

  const numberFormatter = new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    maximumFractionDigits: 3,
  });

  const handleDeleteExchange = (type: string, index: number) => {
    if (type === "compra") {
      const updatedBuyExchanges = buyExchanges.filter(
        (_, idx) => idx !== index
      );

      localStorage.setItem("buyExchanges", JSON.stringify(updatedBuyExchanges));
    } else if (type === "venda") {
      const updatedSellExchanges = sellExchanges.filter(
        (_, idx) => idx !== index
      );

      localStorage.setItem(
        "sellExchanges",
        JSON.stringify(updatedSellExchanges)
      );
    }
  };

  return (
    <>
      {isModalBuyOpen ? (
        <FullScreenModal
          operation={currentOperation}
          onClose={() => setIsModalBuyOpen(false)}
        />
      ) : (
        <></>
      )}

      <aside className={styles.sidebar}>
        <h2 className={styles.title}>Operações</h2>

        <section className={styles["text-section"]}>
          <legend>Cotação do Dólar</legend>
          <div className={styles.dolarContainer}>
            <p>
              {dollarPrice ? (
                <>
                  <span>R$</span> {numberFormatter.format(dollarPrice ?? -1)}
                </>
              ) : (
                <BeatLoader color="#969696" size="0.5rem" />
              )}
            </p>

            {dollarPrice ? (
              <div>
                <span>R$</span>
                <input
                  className={styles.dolarLabel}
                  type="number"
                  value={dolarValue}
                  onChange={onChangeDolar}
                  style={{ textAlign: "center" }}
                  placeholder="Valor do Dólar"
                />
              </div>
            ) : (
              <BeatLoader color="#969696" size="0.5rem" />
            )}
          </div>
        </section>

        <section className={styles.ExchangesSection}>
          <div className={styles.labelExchangeSection}>
            <p>Exchanges de Compra</p>
          </div>
          <div
            className={styles.addExchange}
            onClick={() => toggleModalBuy("compra")}
          >
            <p>ADICIONAR</p>
            <div className={styles.aroundImage}>
              <img src="images/addEXCHANGE.svg" />
            </div>
          </div>
          {buyExchanges.map((exchange, index) => (
            <div key={index} className={styles.selectedExchanges}>
              <div className={styles.selectedExchangesBlock}>
                <img src={exchange.image_url} />
                <p>{exchange.name}</p>
              </div>
              <img
                src="images/X.svg"
                style={{ cursor: "pointer" }}
                onClick={() => handleDeleteExchange("compra", index)}
              />
            </div>
          ))}
        </section>
        <section className={styles.ExchangesSection}>
          <div className={styles.labelExchangeSection}>
            <p>Exchanges de Venda</p>
          </div>
          <div
            className={styles.addExchange}
            onClick={() => toggleModalBuy("venda")}
          >
            <p>ADICIONAR</p>
            <div className={styles.aroundImage}>
              <img src="images/addEXCHANGE.svg" />
            </div>
          </div>
          {sellExchanges.map((exchange, index) => (
            <div key={index} className={styles.selectedExchanges}>
              <div className={styles.selectedExchangesBlock}>
                <img src={exchange.image_url} />
                <p>{exchange.name}</p>
              </div>
              <img
                src="images/X.svg"
                style={{ cursor: "pointer" }}
                onClick={() => handleDeleteExchange("venda", index)}
              />
            </div>
          ))}
        </section>
      </aside>
    </>
  );
}
