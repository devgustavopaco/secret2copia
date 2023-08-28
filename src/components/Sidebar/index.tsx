import { Exchange } from "@prisma/client";
import { useSession } from "next-auth/react";
import { XCircle } from "phosphor-react";
import { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { BeatLoader } from "react-spinners";
import { toast } from "react-toastify";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";

interface SidebarProps {
  dollarPrice?: number;
  defaultExchanges: Exchange[];
  buyExchanges: string[];
  sellExchanges: string[];
  onSelectBuyExchange: (exchange: string) => void;
  onSelectSellExchange: (exchange: string) => void;
  onChangeDolar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dolarValue: number;
}

export function Sidebar({
  dollarPrice,
  defaultExchanges,
  buyExchanges,
  sellExchanges,
  dolarValue,
  onSelectBuyExchange,
  onSelectSellExchange,
  onChangeDolar,
}: SidebarProps) {
  const [showBuyList, setShowBuyList] = useState(true);
  const [showSellList, setShowSellList] = useState(true);
  const { data: auth } = useSession();

  const email = auth?.user?.email || "";

  const user = trpc.useQuery(["user.getUserByEmail", { email }], {
    enabled: email !== "",
  });

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

  const handleSelectBuyExchange = (exchange: string) => {
    console.log(buyExchanges);
    if (buyExchanges.length < 2 || buyExchanges.includes(exchange)) {
      onSelectBuyExchange(exchange);
    } else {
      toast.dark("Você só pode selecionar 2 opções para compra.", {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
    }
  };

  const handleSelectSellExchange = (exchange: string) => {
    if (sellExchanges.length < 2 || sellExchanges.includes(exchange)) {
      onSelectSellExchange(exchange);
    } else {
      toast.dark("Você só pode selecionar 2 opções para venda.", {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
    }
  };

  const filterExchanges = (
    defaultExchanges: Exchange[],
    userData: any
  ): Exchange[] => {
    if (userData && userData.bronze) {
      return defaultExchanges.filter((exchange) => exchange.bronze === true);
    }

    if (userData && userData.silver) {
      return defaultExchanges.filter(
        (exchange) => exchange.silver === true && exchange.bronze === true
      );
    }

    if (userData && userData.gold) {
      return defaultExchanges.filter(
        (exchange) =>
          exchange.gold === true &&
          exchange.silver === true &&
          exchange.bronze === true
      );
    }

    if (userData && userData.platinum) {
      return defaultExchanges.filter(
        (exchange) =>
          exchange.platinum === true &&
          exchange.gold === true &&
          exchange.silver === true &&
          exchange.bronze === true
      );
    }

    if (auth?.role === "admin") {
      return defaultExchanges;
    }

    return [];
  };

  let accessibleExchanges = filterExchanges(defaultExchanges, user?.data);

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Operações</h2>

      <section className={styles["text-section"]}>
        <legend>Dólar Editável</legend>
        {dollarPrice ? (
          <input
            className={styles.dolarLabel}
            type="number"
            value={dolarValue}
            onChange={onChangeDolar}
            style={{ textAlign: "left" }}
            placeholder="Valor do Dólar"
          />
        ) : (
          <BeatLoader color="#969696" size="0.5rem" />
        )}
      </section>

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
          {accessibleExchanges.length > 0 ? (
            accessibleExchanges.map((exchange) => (
              <label key={exchange.name}>
                <>
                  <input
                    type="checkbox"
                    checked={buyExchanges.includes(exchange.name)}
                    onChange={() => {
                      handleSelectBuyExchange(exchange.name);
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
            <IoIosArrowUp size={30} onClick={handleShowSellList} />
          ) : (
            <IoIosArrowDown size={30} onClick={handleShowSellList} />
          )}
        </legend>
        {showSellList && (
          <div className={styles["filter-options"]}>
            {accessibleExchanges.length > 0 ? (
              accessibleExchanges.map((exchange) => (
                <label key={exchange.name}>
                  <>
                    <input
                      type="checkbox"
                      checked={sellExchanges.includes(exchange.name)}
                      onChange={() => {
                        handleSelectSellExchange(exchange.name);
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
