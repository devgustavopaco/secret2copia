"use client";

import { useState, useCallback, useEffect } from "react";
import HamburgerIcon from "../Icons/HamburgerIcon";
import PlusIcon from "../Icons/PlusIcon";
import styles from "./sidebar.module.scss";
import ArrowIcon from "../Icons/ArrowIcon";

type Props = {
  onToggleChange?: (isOpen: boolean) => void;
  onAddExchange?: (type: "buy" | "sell") => void;
};

export default function FuturesFuturesSidebar({
  onToggleChange,
  onAddExchange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [buyFuturesExchanges, setBuyFuturesExchanges] = useState<any[]>([]);
  const [sellFuturesExchanges, setSellFuturesExchanges] = useState<any[]>([]);

  const loadExchanges = useCallback(() => {
    const buyFut = JSON.parse(
      localStorage.getItem("buyFuturesExchanges") || "[]"
    );
    const sellFut = JSON.parse(
      localStorage.getItem("sellFuturesExchanges") || "[]"
    );
    setBuyFuturesExchanges(buyFut);
    setSellFuturesExchanges(sellFut);
  }, []);

  useEffect(() => {
    loadExchanges();
    window.addEventListener("exchangeUpdatedFutFut", loadExchanges);
    return () =>
      window.removeEventListener("exchangeUpdatedFutFut", loadExchanges);
  }, [loadExchanges]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const newValue = !prev;
      onToggleChange?.(!newValue ? true : false);
      return newValue;
    });
  }, [onToggleChange]);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  useEffect(() => {
    onToggleChange?.(!collapsed);
  }, [collapsed, onToggleChange]);

  // === remove handlers (atualizam LS + evento global) ===
  const removeFromBuyFutures = (id: string) => {
    setBuyFuturesExchanges((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem("buyFuturesExchanges", JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdatedFutFut"));
      return updated;
    });
  };
  const removeFromSellFutures = (id: string) => {
    setSellFuturesExchanges((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem("sellFuturesExchanges", JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdatedFutFut"));
      return updated;
    });
  };

  return (
    <>
      <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        {/* fundos decorativos */}
        <img
          className={styles.sidebarBackground}
          src="/new-page/diamond-blur.svg"
          alt="Sidebar Background"
        />
        <img
          className={styles.sidebarBackgroundDown}
          src="/new-page/diamond-down-blur.svg"
          alt="Sidebar Background"
        />

        {/* header */}
        <div className={styles.sidebarHeader}>
          <img src="/new-page/logo.svg" alt="Logo" />
          <div
            className={styles.hamburgerMenu}
            role="button"
            aria-label={collapsed ? "Abrir sidebar" : "Fechar sidebar"}
            aria-expanded={!collapsed}
            tabIndex={0}
            onClick={toggle}
            onKeyDown={onKey}
            data-pressed={collapsed ? "true" : "false"}
          >
            <HamburgerIcon className={styles.hamburgerIcon} />
          </div>
        </div>

        {/* corpo */}
        <div className={styles.sidebarBody}>
          {/* FUTURES - COMPRA */}
          <div className={styles.sidebarTopBody}>
            <button
              type="button"
              className={styles.spotButton}
              aria-label="Adicionar corretora futures para compra"
              onClick={() => onAddExchange?.("buy")}
            >
              <span className={styles.label}>Futures - Compra</span>
              <PlusIcon className={styles.plusIcon} />
            </button>

            <div className={styles.exchangeList}>
              {buyFuturesExchanges.length === 0 ? (
                <p className={styles.emptyText}>Nenhuma exchange</p>
              ) : (
                buyFuturesExchanges.map((ex) => (
                  <div key={ex.id} className={styles.exchangeItem}>
                    <div className={styles.exchangeLeft}>
                      <img
                        src={ex.image_url ?? "/default-exchange.png"}
                        alt={ex.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/default-exchange.png";
                        }}
                      />
                      <span>{ex.name}</span>
                    </div>

                    {/* X de remover */}
                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label={`Remover ${ex.name}`}
                      onClick={() => removeFromBuyFutures(ex.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          removeFromBuyFutures(ex.id);
                      }}
                    >
                      <img src="/images/X.svg" alt="" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.divisor}></div>

          {/* FUTURES - VENDA */}
          <div className={styles.sidebarTopBody}>
            <button
              type="button"
              className={styles.spotButton}
              aria-label="Adicionar corretora futures para venda"
              onClick={() => onAddExchange?.("sell")}
            >
              <span className={styles.label}>Futures - Venda</span>
              <PlusIcon className={styles.plusIcon} />
            </button>

            <div className={styles.exchangeList}>
              {sellFuturesExchanges.length === 0 ? (
                <p className={styles.emptyText}>Nenhuma exchange</p>
              ) : (
                sellFuturesExchanges.map((ex) => (
                  <div key={ex.id} className={styles.exchangeItem}>
                    <div className={styles.exchangeLeft}>
                      <img
                        src={ex.image_url ?? "/default-exchange.png"}
                        alt={ex.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/default-exchange.png";
                        }}
                      />
                      <span>{ex.name}</span>
                    </div>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label={`Remover ${ex.name}`}
                      onClick={() => removeFromSellFutures(ex.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          removeFromSellFutures(ex.id);
                      }}
                    >
                      <img src="/images/X.svg" alt="" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* header colapsado */}
      <div className={styles.sidebarHidden}>
        <img
          className={styles.hiddenLogo}
          src="/new-page/logo.svg"
          alt="Logo"
        />
        <button
          type="button"
          className={`${styles.sidebarFab} ${collapsed ? styles.show : ""}`}
          aria-label="Abrir sidebar"
          onClick={toggle}
        >
          <ArrowIcon className={styles.arrowIcon} />
        </button>
      </div>
    </>
  );
}
