"use client";

import { useState, useCallback, useEffect } from "react";
import HamburgerIcon from "../Icons/HamburgerIcon";
import PlusIcon from "../Icons/PlusIcon";
import styles from "./sidebar.module.scss";
import ArrowIcon from "../Icons/ArrowIcon";

type Props = {
  onToggleChange?: (isOpen: boolean) => void; // <- callback opcional
  onAddExchange?: (type: "spot" | "futures") => void;
};
// retorne uma variavel para saber se o sidebar esta aberto ou fechado
export default function NewPageSidebar({
  onToggleChange,
  onAddExchange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const newValue = !prev;
      // notifica o pai sempre que muda
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

        {/* header do sidebar */}
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

        {/* corpo do sidebar */}
        <div className={styles.sidebarBody}>
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
          </div>
          <div className={styles.divisor}></div>
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
          </div>
        </div>
      </div>

      {/* HEADER COLAPSADO — igual ao sidebarHeader */}
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
