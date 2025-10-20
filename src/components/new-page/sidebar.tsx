"use client";

import { useState, useCallback, useEffect } from "react";
import HamburgerIcon from "../Icons/HamburgerIcon";
import PlusIcon from "../Icons/PlusIcon";
import styles from "./sidebar.module.scss";
import ArrowIcon from "../Icons/ArrowIcon";

type Props = {
  onToggleChange?: (isOpen: boolean) => void;
  onAddExchange?: (type: "spot" | "futures") => void;
};

export default function NewPageSidebar({
  onToggleChange,
  onAddExchange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [spotExchanges, setSpotExchanges] = useState<any[]>([]);
  const [futuresExchanges, setFuturesExchanges] = useState<any[]>([]);

  const loadExchanges = useCallback(() => {
    const spot = JSON.parse(localStorage.getItem("spotExchanges") || "[]");
    const fut = JSON.parse(localStorage.getItem("futuresExchanges") || "[]");
    setSpotExchanges(spot);
    setFuturesExchanges(fut);
  }, []);

  useEffect(() => {
    loadExchanges();
    window.addEventListener("exchangeUpdated", loadExchanges);
    return () => window.removeEventListener("exchangeUpdated", loadExchanges);
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
  const removeFromSpot = (id: string) => {
    setSpotExchanges((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem("spotExchanges", JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdated"));
      return updated;
    });
  };
  const removeFromFutures = (id: string) => {
    setFuturesExchanges((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem("futuresExchanges", JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdated"));
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
          {/* SPOT */}
          <div className={styles.sidebarTopBody}>
            <button
              type="button"
              className={styles.spotButton}
              aria-label="Adicionar corretora spot"
              onClick={() => onAddExchange?.("spot")}
            >
              <span className={styles.label}>Exchanges SPOT</span>
              <PlusIcon className={styles.plusIcon} />
            </button>

            <div className={styles.exchangeList}>
              {spotExchanges.length === 0 ? (
                <p className={styles.emptyText}>Nenhuma exchange</p>
              ) : (
                spotExchanges.map((ex) => (
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

                    {/* X de remover — mesmo “vidro”/borda/glow */}
                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label={`Remover ${ex.name}`}
                      onClick={() => removeFromSpot(ex.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          removeFromSpot(ex.id);
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

          {/* FUTURES */}
          <div className={styles.sidebarTopBody}>
            <button
              type="button"
              className={styles.spotButton}
              aria-label="Adicionar corretora futures"
              onClick={() => onAddExchange?.("futures")}
            >
              <span className={styles.label}>Exchanges Futures</span>
              <PlusIcon className={styles.plusIcon} />
            </button>

            <div className={styles.exchangeList}>
              {futuresExchanges.length === 0 ? (
                <p className={styles.emptyText}>Nenhuma exchange</p>
              ) : (
                futuresExchanges.map((ex) => (
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
                      onClick={() => removeFromFutures(ex.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          removeFromFutures(ex.id);
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
