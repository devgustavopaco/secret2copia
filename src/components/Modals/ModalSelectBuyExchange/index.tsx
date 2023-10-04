import { useEffect, useState } from "react";
import { trpc } from "../../../utils/trpc";
import styles from "./styles.module.scss";

interface ModalExchange {
  isOpen?: boolean;
  onClose: () => void;
  setOpenModal?: (open: boolean) => void;
  operation?: string | null;
}

export function FullScreenModal({ onClose, operation }: ModalExchange) {
  const { data: activeExchanges } = trpc.useQuery(
    ["exchange.getActiveExchanges"],
    {
      ssr: true,
    }
  );

  const [user, setUser] = useState<any>(null);
  const [groupedExchanges, setGroupedExchanges] = useState<Record<string, any>>(
    {}
  );
  const [selectedExchanges, setSelectedExchanges] = useState<any[]>(() => {
    const storedData = localStorage.getItem(
      operation === "compra" ? "buyExchanges" : "sellExchanges"
    );
    return storedData ? JSON.parse(storedData) : [];
  });

  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const storedUserData = localStorage.getItem("user");
    setUser(storedUserData ? JSON.parse(storedUserData) : null);
  }, []);

  const filterByLevel = (exchange: any) => {
    if (!user) return false;
    if (user.roleId === "cl9lzkps90007j8u606em93nk") return true;
    if (user.platinum && exchange.platinum) return true;
    if (user.gold && exchange.gold) return true;
    if (user.silver && exchange.silver) return true;
    if (user.bronze && exchange.bronze) return true;
    return false;
  };

  useEffect(() => {
    if (!activeExchanges || !user) return;

    const filteredExchanges = activeExchanges.filter(filterByLevel);

    const groups = filteredExchanges.reduce<Record<string, any[]>>(
      (acc, exchange) => {
        const firstLetter = exchange.name[0]!.toUpperCase();
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter]!.push(exchange);
        return acc;
      },
      {}
    );
    setGroupedExchanges(groups);
  }, [activeExchanges, user]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);

    const filterByLevelAndSearchTerm = (exchange: any) => {
      if (!filterByLevel(exchange)) return false;
      return exchange.name.toLowerCase().includes(e.target.value.toLowerCase());
    };

    const filteredExchanges =
      activeExchanges?.filter(filterByLevelAndSearchTerm) || [];

    const groups: Record<string, any[]> = filteredExchanges.reduce<
      Record<string, any[]>
    >((acc, exchange) => {
      const firstLetter = exchange.name[0]!.toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter]!.push(exchange);
      return acc;
    }, {});
    setGroupedExchanges(groups);
  };

  const handleAddExchangeClick = (exchange: any) => {
    setSelectedExchanges((prev) => {
      if (prev.find((e) => e.id === exchange.id)) return prev;
      if (prev.length >= 4) {
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
      return newSelection;
    });
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.contentModal} container`}>
        <div className={styles.headerModal}>
          <div className={styles.contentHeaderModal}>
            <p>
              SELECIONE CORRETORAS PARA A {operation?.toUpperCase() || "COMPRA"}
            </p>
            <img src="images/X.svg" alt="Close modal" onClick={onClose} />
          </div>
        </div>
        <div className={styles.searchExchangeModal}>
          <input
            placeholder="pesquisar"
            type="text"
            value={searchTerm}
            onChange={handleSearch}
          />
          <img src="images/Search.svg" alt="Search icon" />
        </div>
        <div className={styles.selectedExchangesContainer}>
          {Array.isArray(selectedExchanges) &&
            selectedExchanges.map((exchange) => (
              <div key={exchange.id} className={styles.selectedExchanges}>
                <div className={styles.selectedExchangesBlock}>
                  <img
                    src={
                      exchange.image_url
                        ? exchange.image_url
                        : exchange.imageUrl
                    }
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
          {Object.entries(groupedExchanges).map(([letter, exchanges]) => (
            <div key={letter}>
              <p>{letter}</p>
              <div className={styles.orderExchangesBlock}>
                {exchanges.map((exchange: any) => {
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
                        src={exchange.image_url}
                        alt={`${exchange.name} Logo`}
                      />
                      <p>{exchange.name}</p>

                      {isSelected ? (
                        <img
                          src="images/checkedIcon.svg"
                          className={styles.selectedIcon}
                          onClick={(e) => {
                            e.stopPropagation(); // Previne a propagação do evento para o div pai
                            handleRemoveExchangeClick(exchange);
                          }}
                        ></img>
                      ) : (
                        <></>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
