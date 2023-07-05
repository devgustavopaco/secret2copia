import { Exchange } from "@prisma/client";
import { BeatLoader } from "react-spinners";
import styles from "./styles.module.scss";
import { useSession } from "next-auth/react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import { toast } from "react-toastify";
import { CheckCircle, XCircle } from "phosphor-react";

interface SidebarProps {
  dollarPrice?: number;
  defaultExchanges: Exchange[];
  buyExchanges: string[];
  sellExchanges: string[];
  onSelectBuyExchange: (exchange: string) => void;
  onSelectSellExchange: (exchange: string) => void;
}

const notify = (text: string, success: boolean) => {
  if (success) {
    toast.dark(text, {
      icon: <CheckCircle size={32} color="#07bc0c" weight="fill" />,
    });
  } else {
    toast.dark(text, {
      icon: <XCircle size={32} color="#ff3838" weight="fill" />,
    });
  }
};

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
  const [dolarValue, setDolarValue] = useState<number | undefined>(undefined);
  const { data: auth } = useSession();

  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const handleShowBuyList = () => {
    setShowBuyList(!showBuyList);
  };

  const handleShowSellList = () => {
    setShowSellList(!showSellList);
  };

  const handleDollarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numValue = parseFloat(rawValue) / 100;
    setDolarValue(numValue);
    updateMutation.mutate({
      id: String(user?.id),
      dolarValue: numValue,
    });
  };

  const numberFormatter = new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    maximumFractionDigits: 3,
  });

  const updateMutation = trpc.useMutation("user.updateUserDollarValue", {
    onSuccess() {
      notify("Dólar Atualizado!", true);
    },
    onError(error) {
      notify("Não foi possível realizar a alteração do Dólar", false);
    },
  });

  const roleAccessible = (exchange: Exchange): boolean => {
    switch (auth?.role) {
      case "bronze":
        return exchange.bronze === 1;
      case "silver":
        return exchange.bronze === 1 && exchange.silver === 1;
      case "gold":
        return (
          exchange.bronze === 1 && exchange.silver === 1 && exchange.gold === 1
        );
      case "platinum":
        return (
          exchange.bronze === 1 &&
          exchange.silver === 1 &&
          exchange.gold === 1 &&
          exchange.platinum === 1
        );
      case "admin":
        return true; // Admin pode ver todas as exchanges
      default:
        return false;
    }
  };

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Operações</h2>

      <section className={styles["text-section"]}>
        <legend>Dólar Editável</legend>
        <input
          className={styles.dolarLabel}
          type="text"
          value={`R$ ${
            dolarValue !== undefined ? numberFormatter.format(dolarValue) : ""
          }`}
          onChange={handleDollarChange}
          style={{ textAlign: "left" }}
        />
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
          {defaultExchanges.length > 0 ? (
            defaultExchanges.filter(roleAccessible).map((exchange) => (
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
            <IoIosArrowUp size={30} onClick={handleShowSellList} />
          ) : (
            <IoIosArrowDown size={30} onClick={handleShowSellList} />
          )}
        </legend>
        {showSellList && (
          <div className={styles["filter-options"]}>
            {defaultExchanges.length > 0 ? (
              defaultExchanges.filter(roleAccessible).map((exchange) => (
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
