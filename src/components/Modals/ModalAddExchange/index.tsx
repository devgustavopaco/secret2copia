import { X } from "phosphor-react";
import { ChangeEvent, FormEvent, useState } from "react";
import styles from "./styles.module.scss";
import { trpc } from "../../../utils/trpc";
interface ModalAddExchangeProps {
  setOpenModal: (open: boolean) => void;
  coinId: string;
}
export function ModalAddExchange({
  setOpenModal,
  coinId,
}: ModalAddExchangeProps) {
  const [selectedExchange, setSelectedExchange] = useState("");
  const [tax, setTax] = useState(0);
  const [confirmations, setConfirmations] = useState(0);
  const addExchangeToCoinMutation = trpc.useMutation("coin.addExchangeToCoin");
  const { data: exchanges, isLoading: isLoadingExchanges } = trpc.useQuery([
    "exchange.getActiveExchanges",
  ]);

  const handleAddExchange = (event: FormEvent) => {
    console.log({ coinId, exchangeId: selectedExchange, tax, confirmations });

    event.preventDefault();

    if (!selectedExchange) {
      alert("Por favor, selecione uma corretora.");
      return;
    }

    addExchangeToCoinMutation.mutate(
      {
        coinId,
        exchangeId: selectedExchange,
        tax,
        confirmations,
      },
      {
        onSuccess: () => setOpenModal(false),
        onError: (error) => {
          alert("Ocorreu um erro ao adicionar a corretora.");
          console.error(error);
        },
      }
    );
  };

  const handleTaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTax(Number(event.target.value));
  };

  const handleConfirmationsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmations(Number(event.target.value));
  };

  return (
    <div className={styles.modalBackground}>
      <form className={styles.modalContainer} onSubmit={handleAddExchange}>
        <header className={styles.modalHeader}>
          <h3>Adicionar Corretora</h3>
          <button
            onClick={() => {
              setOpenModal(false);
            }}
          >
            <X size={24} weight="bold" />
          </button>
        </header>
        <div className={styles.userDetails}>
          <div className={styles.inputBox}>
            <span className={styles.details}>Corretoras</span>
            <select
              name="Corretoras"
              id=""
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
            >
              {isLoadingExchanges ? (
                <option>Carregando...</option>
              ) : (
                exchanges?.map((exchange) => (
                  <option key={exchange.id} value={exchange.id}>
                    {exchange.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Taxa</span>
            <input
              type="number"
              placeholder="Taxa"
              value={tax}
              onChange={handleTaxChange}
            />
          </div>

          <div className={styles.inputBox}>
            <span className={styles.details}>Confirmações</span>
            <input
              type="number"
              placeholder="Confirmações"
              value={confirmations}
              onChange={handleConfirmationsChange}
            />
          </div>
        </div>
        <footer className={styles.footer}>
          <button
            className={styles.voltarBtn}
            onClick={() => {
              setOpenModal(false);
            }}
            type="button"
          >
            Voltar
          </button>
          <button className={styles.addBtn} type="submit">
            Adicionar
          </button>
        </footer>
      </form>
    </div>
  );
}
