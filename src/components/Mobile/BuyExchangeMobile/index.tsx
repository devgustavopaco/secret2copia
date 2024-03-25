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
  onModalChange,
  isAdmin,
}: SidebarProps) {
  const [isModalBuyOpen, setIsModalBuyOpen] = useState(false);

  const [currentOperation, setCurrentOperation] = useState("compra");

  const toggleModalBuy = (operation: string) => {
    setIsModalBuyOpen(!isModalBuyOpen);
    onModalChange(!isModalBuyOpen);
    setCurrentOperation(operation);
  };

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
          isAdmin={isAdmin}
        />
      ) : (
        <div className={styles.swipperBlock}>
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
        </div>
      )}
    </>
  );
}
