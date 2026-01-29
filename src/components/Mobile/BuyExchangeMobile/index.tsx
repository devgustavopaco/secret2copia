import { useState } from "react";
import { FullScreenModal } from "../../Modals/ModalSelectBuyExchange";
import { SidebarProps } from "../../Sidebar";
import styles from "./styles.module.scss";

export function BuyExchangeMobile({
  dollarPrice,
  dolarValue,
  onChangeDolar,
  buyExchanges,
  sellExchanges,
  isCleaned,
  onModalChange,
  isChecked,
  isAdmin,
}: SidebarProps) {
  const [isModalBuyOpen, setIsModalBuyOpen] = useState(false);

  const [currentOperation, setCurrentOperation] = useState("compra");

  const toggleModalBuy = (operation: string) => {
    setIsModalBuyOpen(!isModalBuyOpen);
    onModalChange(!isModalBuyOpen);
    setCurrentOperation(operation);
  };

  const handleDeleteExchange = (type: string, index: string) => {
    if (type === "compra") {
      const updatedBuyExchanges = buyExchanges.filter((_) => _.name !== index);
      localStorage.setItem("buyExchanges", JSON.stringify(updatedBuyExchanges));
    } else if (type === "venda") {
      const updatedSellExchanges = sellExchanges.filter(
        (_) => _.name !== index
      );
      localStorage.setItem(
        "sellExchanges",
        JSON.stringify(updatedSellExchanges)
      );
    }
    window.dispatchEvent(new Event("exchangeUpdated")); // 👈 dispara
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
          isCleaned={isCleaned}
        />
      ) : (
        <div className={styles.swipperBlock}>
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
          {buyExchanges
            .slice() // Cria uma cópia do array original
            .sort((a, b) => a.name.localeCompare(b.name)) // Ordena alfabeticamente por nome
            .map((exchange, index) => (
              <div key={exchange.name} className={styles.selectedExchanges}>
                <div className={styles.selectedExchangesBlock}>
                  <img src={exchange.image_url} alt={exchange.name} />
                  <p>{exchange.name}</p>
                </div>
                <img
                  src="images/X.svg"
                  alt="Remover"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleDeleteExchange("compra", exchange.name)}
                />
              </div>
            ))}
        </div>
      )}
    </>
  );
}
