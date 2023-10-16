import { Exchange } from "@prisma/client";
import { useEffect, useId, useState } from "react";
import Select, { OnChangeValue } from "react-select";
import styles from "./styles.module.scss";

interface SelectProps {
  defaultExchanges: Exchange[];
  selectedExchanges: string[];
  onSelectBuyExchangeMobile: (exchange: readonly Exchange[]) => void;
  isLoading: boolean;
}

const multiValueContainer: any = ({ selectProps, data }: any) => {
  const exchangeName = data.name;
  const allSelected = selectProps.value;
  const index = allSelected.findIndex(
    (selected: any) => selected.name === exchangeName
  );
  const isLastSelected = index === allSelected.length - 1;
  const labelSuffix = isLastSelected ? ` (${allSelected.length})` : ", ";
  const val = `${exchangeName}${labelSuffix}`;
  return val;
};

const getOptionLabel = (option: Exchange) => `${option.name}`;

const customStyles = {
  valueContainer: (provided: any, state: any) => ({
    ...provided,
    textOverflow: "ellipsis",
    border: "none",
    boxShadow: "none",
    outline: state.isFocused ? "var(--purple-500) solid 2px" : "none",
    outlineOffset: "1px",
    maxWidth: "90%",
    height: "40px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    display: "initial",
  }),
  control: (provided: any, state: any) => ({
    ...provided,
    border: "none",
    boxShadow: "none",
    outline: state.isFocused ? "var(--purple-500) solid 2px" : "none",
    outlineOffset: "1px",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    color: state.isSelected ? "var(--gray-100)" : "var(--gray-100)",
    backgroundColor: state.isSelected
      ? "var(--purple-500)"
      : state.isFocused
      ? "var(--purple-500)"
      : "transparent",
    ":active": {
      filter: "brightness(0.8)",
    },
  }),
  loadingIndicator: (provided: any, state: any) => ({
    ...provided,
    "& > *": {
      fontSize: "8px !important",
    },
  }),
};

export function BuyExchangeMobile({
  defaultExchanges,
  selectedExchanges,
  onSelectBuyExchangeMobile,
  isLoading,
}: SelectProps) {
  const handleExchangeBuyChange = (newValue: OnChangeValue<Exchange, true>) => {
    onSelectBuyExchangeMobile(newValue);
  };

  const exchangesSelectedBySelect = defaultExchanges.filter((exchange) => {
    return selectedExchanges.includes(exchange.name);
  });

  const handleSelectedOption = (
    selectedOption: Exchange,
    selectValue: readonly Exchange[]
  ) => {
    return selectValue.includes(selectedOption);
  };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem("user");
    if (storedUserData) {
      try {
        setUser(JSON.parse(storedUserData));
      } catch (e) {
        console.error("Invalid user data in local storage", e);
      }
    }
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

  const filteredDefaultExchanges = defaultExchanges.filter(filterByLevel);

  return (
    <>
      <Select
        value={exchangesSelectedBySelect}
        options={filteredDefaultExchanges}
        instanceId={useId()}
        className={styles.select}
        isMulti
        components={{
          MultiValueContainer: multiValueContainer,
        }}
        placeholder={<div>Selecione uma Exchange</div>}
        getOptionLabel={getOptionLabel}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        styles={customStyles}
        isSearchable={false}
        isOptionSelected={handleSelectedOption}
        onChange={handleExchangeBuyChange}
        isLoading={isLoading}
      />
    </>
  );
}
