"use client";

import { useState, useCallback, useEffect } from "react";
import HamburgerIcon from "../Icons/HamburgerIcon";
import styles from "./sidebar.module.scss";
import ArrowIcon from "../Icons/ArrowIcon";

type Props = {
  onToggleChange?: (isOpen: boolean) => void;
  onAddExchange?: () => void;
  forceCollapsed?: boolean; // Permite controle externo do estado collapsed
  onCollapseChange?: (collapsed: boolean) => void; // Notifica mudanças no estado
};

export default function NewPageSidebar({
  onToggleChange,
  onAddExchange,
  forceCollapsed,
  onCollapseChange,
}: Props) {
  const sortExchangesByName = useCallback((list: any[]) => {
    return [...list].sort((a, b) =>
      String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "pt-BR", {
        sensitivity: "base",
      })
    );
  }, []);

  // Detecta se é mobile e inicia collapsed se for
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 768;
    }
    return false;
  });

  // Sincroniza com forceCollapsed quando fornecido
  useEffect(() => {
    if (forceCollapsed !== undefined) {
      setCollapsed(forceCollapsed);
    }
  }, [forceCollapsed]);
  const [spotExchanges, setSpotExchanges] = useState<any[]>([]);
  const [futuresExchanges, setFuturesExchanges] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"spot" | "futures">("spot");

  const loadExchanges = useCallback(() => {
    const spot = JSON.parse(localStorage.getItem("spotExchanges") || "[]");
    const fut = JSON.parse(localStorage.getItem("futuresExchanges") || "[]");
    setSpotExchanges(sortExchangesByName(spot));
    setFuturesExchanges(sortExchangesByName(fut));
  }, [sortExchangesByName]);

  useEffect(() => {
    loadExchanges();
    window.addEventListener("exchangeUpdated", loadExchanges);
    return () => window.removeEventListener("exchangeUpdated", loadExchanges);
  }, [loadExchanges]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const newValue = !prev;
      onToggleChange?.(!newValue ? true : false);
      onCollapseChange?.(newValue); // Notifica o pai sobre a mudança
      return newValue;
    });
  }, [onToggleChange, onCollapseChange]);

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

  // Fecha a sidebar automaticamente em mobile ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && !collapsed) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);

  // === remove handlers (atualizam LS + evento global) ===
  const removeFromSpot = (id: string) => {
    setSpotExchanges((prev) => {
      const updated = sortExchangesByName(prev.filter((e) => e.id !== id));
      localStorage.setItem("spotExchanges", JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdated"));
      return updated;
    });
  };
  const removeFromFutures = (id: string) => {
    setFuturesExchanges((prev) => {
      const updated = sortExchangesByName(prev.filter((e) => e.id !== id));
      localStorage.setItem("futuresExchanges", JSON.stringify(updated));
      window.dispatchEvent(new Event("exchangeUpdated"));
      return updated;
    });
  };

  return (
    <>
      <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
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
          <div className={styles.sidebarActionBar}>
            <button
              type="button"
              className={styles.primaryActionButton}
              aria-label="Selecionar corretoras"
              onClick={() => onAddExchange?.()}
            >
              Selecionar corretoras
            </button>
          </div>

          <div className={styles.segmentedWrap}>
            <div className={styles.segmentedTabs}>
              <button
                type="button"
                className={`${styles.segmentedTab} ${
                  activeTab === "spot" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("spot")}
              >
                SPOT ({spotExchanges.length})
              </button>
              <button
                type="button"
                className={`${styles.segmentedTab} ${
                  activeTab === "futures" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("futures")}
              >
                FUTUROS ({futuresExchanges.length})
              </button>
            </div>

            <div key={activeTab} className={styles.sidebarTopBody}>
              <div className={styles.exchangeList}>
                {activeTab === "spot" ? (
                  spotExchanges.length === 0 ? (
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
                  )
                ) : futuresExchanges.length === 0 ? (
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
