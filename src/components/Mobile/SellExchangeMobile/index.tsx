import { useState } from "react";
import { FullScreenModal } from "../../Modals/ModalSelectBuyExchange";
import { SidebarProps } from "../../Sidebar";
import styles from "./styles.module.scss";

export function SellExchangeMobile({
  dollarPrice,
  dolarValue,
  onChangeDolar,
  buyExchanges,
  sellExchanges,
  onModalChange,
  isChecked,
  isCleaned,
  isAdmin,
}: SidebarProps) {
  const [isModalBuyOpen, setIsModalBuyOpen] = useState(false);

  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const toggleModalBuy = (operation: string) => {
    setIsModalBuyOpen(!isModalBuyOpen);
    onModalChange(!isModalBuyOpen);
    console.log(operation);
    setCurrentOperation(operation);
  };

  const numberFormatter = new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    maximumFractionDigits: 3,
  });

  const handleDeleteExchange = (type: string, index: string) => {
    if (type === "compra") {
      const updatedBuyExchanges = buyExchanges.filter(
        (_, idx) => _.name !== index
      );

      localStorage.setItem("buyExchanges", JSON.stringify(updatedBuyExchanges));
    } else if (type === "venda") {
      const updatedSellExchanges = sellExchanges.filter(
        (_, idx) => _.name !== index
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
          isCleaned={isCleaned}
        />
      ) : (
        <></>
      )}
      <div className={styles.swipperBlock}>
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
        {sellExchanges
          .slice() // Cria uma cópia do array original
          .sort((a, b) => a.name.localeCompare(b.name)) // Ordena alfabeticamente por nome
          .map((exchange, index) => (
            <div key={exchange.name} className={styles.selectedExchanges}>
              <div className={styles.selectedExchangesBlock}>
                <img src={exchange.image_url} />
                <p>{exchange.name}</p>
              </div>
              <img
                src="images/X.svg"
                style={{ cursor: "pointer" }}
                onClick={() => handleDeleteExchange("venda", exchange.name)}
              />
            </div>
          ))}
      </div>
    </>
  );
}
