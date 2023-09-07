import { X } from "phosphor-react";
import { ChangeEvent, FormEvent, useState } from "react";
import Select from "react-select";
import { trpc } from "../../../../utils/trpc";

import styles from "./styles.module.scss";

interface StyledSelectProps {
  options: any[];
  isLoading?: boolean;
  onChange: (value: any) => void;
}

const StyledSelect = ({
  options,
  isLoading = false,
  onChange,
}: StyledSelectProps) => (
  <Select
    options={options}
    onChange={onChange}
    className={styles.select}
    isLoading={isLoading}
    styles={{
      valueContainer: (provided: any, state: any) => ({
        ...provided,
        color: "#fff",
      }),
      singleValue: (provided, state) => ({
        ...provided,
        color: "#fff",
      }),
      control: (provided, state) => ({
        ...provided,
        border: "none",
        boxShadow: "none",
        outline: state.isFocused ? "var(--purple-500) solid 2px" : "none",
        outlineOffset: "1px",
        color: "var(--white) !important",
      }),
      option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? "var(--white)" : "var(--white)",
        backgroundColor: state.isSelected
          ? "var(--purple-500)"
          : state.isFocused
          ? "var(--purple-500)"
          : "transparent",
        ":active": {
          filter: "brightness(0.8)",
        },
        cursor: "pointer",
      }),
    }}
  />
);

interface ModalAddTaxProps {
  onClose: () => void;
  onSubmit: (
    exchangeId: string,
    coinId: string,
    tax: number,
    confirmations: number
  ) => void;
}

export function ModalAddTax({ onClose, onSubmit }: ModalAddTaxProps) {
  const [selectedExchange, setSelectedExchange] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("");
  const [tax, setTax] = useState(0);
  const [confirmations, setConfirmations] = useState(0);

  const { data: coins, isLoading: isLoadingCoins } = trpc.useQuery([
    "coin.getActiveCoins",
  ]);
  const { data: exchanges, isLoading: isLoadingExchanges } = trpc.useQuery([
    "exchange.getActiveExchanges",
  ]);

  const availableCoins =
    coins?.map((coin) => ({
      label: coin.name,
      value: coin.id,
    })) || [];

  const availableExchanges =
    exchanges?.map((exchange) => ({
      label: exchange.name,
      value: exchange.id,
    })) || [];

  const handleExchangeChange = (newValue: { label: string; value: string }) => {
    setSelectedExchange(newValue.value);
  };

  const handleCoinChange = (newValue: { label: string; value: string }) => {
    setSelectedCoin(newValue.value);
  };

  const handleTaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTax(Number(event.target.value));
  };

  const handleConfirmationsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmations(Number(event.target.value));
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();

    onSubmit(selectedExchange, selectedCoin, tax, confirmations);
    onClose();
  };

  return (
    <div className={styles.modalBackground}>
      <form
        className={styles.modalContainer}
        action="#"
        onSubmit={handleFormSubmit}
      >
        <header className={styles.modalHeader}>
          <h3>Adicionar Taxa</h3>
          <button onClick={onClose}>
            <X size={24} weight="bold" />
          </button>
        </header>
        <div className={styles.inputsContainer}>
          <div className={styles.inputsRow}>
            <div className={styles.inputBox}>
              <span className={styles.details}>Exchange</span>
              <StyledSelect
                options={availableExchanges}
                isLoading={isLoadingExchanges}
                onChange={handleExchangeChange}
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Crypto</span>
              <StyledSelect
                options={availableCoins}
                isLoading={isLoadingCoins}
                onChange={handleCoinChange}
              />
            </div>
          </div>
          <div className={styles.inputsRow}>
            <div className={styles.inputBox}>
              <span className={styles.details}>Taxa</span>
              <input
                type="number"
                placeholder="Taxa"
                step="any"
                required
                value={tax}
                onChange={handleTaxChange}
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Confirmações</span>
              <input
                type="number"
                placeholder="Confirmações"
                required
                value={confirmations}
                onChange={handleConfirmationsChange}
              />
            </div>
          </div>
        </div>
        <footer className={styles.footer}>
          <button className={styles.voltarBtn} onClick={onClose} type="button">
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
