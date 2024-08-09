import { Exchange } from "@prisma/client";
import { useState } from "react";
import { BeatLoader } from "react-spinners";
import { FullScreenModal } from "../Modals/ModalSelectBuyExchange";
import styles from "./styles.module.scss";

export interface SidebarProps {
  dollarPrice?: number;
  defaultExchanges: Exchange[];

  onModalChange: (state: boolean) => void;
  buyExchanges: { name: string; image_url: string }[];
  sellExchanges: { name: string; image_url: string }[];
  onChangeDolar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dolarValue: number;
  isAdmin: boolean;
  isChecked?: boolean;
  onDollarChange?: () => void;
}

export function Sidebar({
  dollarPrice,
  dolarValue,
  onChangeDolar,
  buyExchanges,
  sellExchanges,
  onModalChange,
  isChecked,
  isAdmin,
  onDollarChange,
}: SidebarProps) {
  const [isModalBuyOpen, setIsModalBuyOpen] = useState(false);

  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const toggleModalBuy = (operation: string) => {
    setIsModalBuyOpen(!isModalBuyOpen);
    onModalChange(!isModalBuyOpen);
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
          onClose={() => {
            setIsModalBuyOpen(false);
            onModalChange(false);
          }}
          isChecked={isChecked}
          isAdmin={isAdmin}
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
              <div className={styles.dollarPrice}>
                <span>R$</span>
                <input
                  className={styles.dolarLabel}
                  type="number"
                  value={dolarValue}
                  onChange={onChangeDolar}
                  style={{ textAlign: "center" }}
                  placeholder="Valor do Dólar"
                />

                <button
                  onClick={onDollarChange}
                  className={styles.updateButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                  >
                    <path
                      d="M21.5488 5.12544V9.62543C21.5488 9.82435 21.4698 10.0151 21.3292 10.1558C21.1885 10.2964 20.9977 10.3754 20.7988 10.3754H16.2988C16.0999 10.3754 15.9091 10.2964 15.7685 10.1558C15.6278 10.0151 15.5488 9.82435 15.5488 9.62543C15.5488 9.42652 15.6278 9.23576 15.7685 9.0951C15.9091 8.95445 16.0999 8.87543 16.2988 8.87543H18.9885L17.617 7.50387C16.223 6.10363 14.3305 5.31364 12.3548 5.30731H12.3126C10.3534 5.30272 8.47109 6.06957 7.07289 7.442C6.92966 7.5757 6.73979 7.64805 6.5439 7.64356C6.34801 7.63906 6.16166 7.55809 6.02471 7.41795C5.88776 7.27782 5.81109 7.08966 5.8111 6.89371C5.81111 6.69777 5.8878 6.50962 6.02477 6.3695C7.71932 4.71331 9.99866 3.7922 12.3681 3.80606C14.7376 3.81993 17.006 4.76765 18.681 6.44356L20.0488 7.81512V5.12544C20.0488 4.92652 20.1278 4.73576 20.2685 4.59511C20.4091 4.45445 20.5999 4.37544 20.7988 4.37544C20.9977 4.37544 21.1885 4.45445 21.3292 4.59511C21.4698 4.73576 21.5488 4.92652 21.5488 5.12544ZM18.0248 17.8089C16.6127 19.1882 14.7139 19.9552 12.74 19.9436C10.7662 19.932 8.87645 19.1428 7.4807 17.747L6.10914 16.3754H8.79883C8.99774 16.3754 9.18851 16.2964 9.32916 16.1558C9.46981 16.0151 9.54883 15.8243 9.54883 15.6254C9.54883 15.4265 9.46981 15.2358 9.32916 15.0951C9.18851 14.9545 8.99774 14.8754 8.79883 14.8754H4.29883C4.09992 14.8754 3.90915 14.9545 3.7685 15.0951C3.62785 15.2358 3.54883 15.4265 3.54883 15.6254V20.1254C3.54883 20.3243 3.62785 20.5151 3.7685 20.6558C3.90915 20.7964 4.09992 20.8754 4.29883 20.8754C4.49774 20.8754 4.68851 20.7964 4.82916 20.6558C4.96981 20.5151 5.04883 20.3243 5.04883 20.1254V17.4357L6.42039 18.8073C8.09309 20.4884 10.3648 21.4366 12.7363 21.4436H12.786C15.1373 21.4496 17.3964 20.5291 19.0738 18.8814C19.2108 18.7413 19.2875 18.5531 19.2875 18.3572C19.2875 18.1612 19.2108 17.9731 19.0739 17.8329C18.9369 17.6928 18.7506 17.6118 18.5547 17.6073C18.3588 17.6028 18.1689 17.6752 18.0257 17.8089H18.0248Z"
                      fill="white"
                    />
                  </svg>
                </button>
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
            className={`${styles.addExchange} ${
              isChecked ? styles.addChecked : ""
            }`}
            onClick={() => toggleModalBuy("compra")}
          >
            <p>ADICIONAR</p>
            <div
              className={`${styles.aroundImage} ${
                isChecked ? styles.aroundChecked : ""
              }`}
            >
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
            className={`${styles.addExchange} ${
              isChecked ? styles.addChecked : ""
            }`}
            onClick={() => toggleModalBuy("venda")}
          >
            <p>ADICIONAR</p>
            <div
              className={`${styles.aroundImage} ${
                isChecked ? styles.aroundChecked : ""
              }`}
            >
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
