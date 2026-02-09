"use client";

import React, { useEffect, useCallback, useRef } from "react";
import styles from "./glass-modal.module.scss";
import { trpc } from "../../../utils/trpc";

type Props = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
  compactHeader?: boolean;
  shellless?: boolean;
  panelClassName?: string;
  bodyClassName?: string;
};

export default function GlassModal({
  isOpen,
  title,
  onClose,
  children,
  compactHeader = false,
  shellless = false,
  panelClassName,
  bodyClassName,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // guarda a versão mais recente de onClose sem quebrar as deps
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // lock scroll do body
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    // só foca o painel se nada dentro dele já estiver focado
    const panel = panelRef.current;
    const active = document.activeElement;
    if (panel && (!active || !panel.contains(active))) {
      panel.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]); // <-- apenas isOpen

  if (!isOpen) return null;

  const backdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onCloseRef.current();
  };

  return (
    <div className={styles.overlay} onClick={backdropClick}>
      <div
        className={`${styles.panel} ${shellless ? styles.shelllessPanel : ""} ${
          panelClassName ?? ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-title"
        tabIndex={-1}
        ref={panelRef}
      >
        {!shellless && (
          <header
            className={`${styles.header} ${
              compactHeader ? styles.compactHeader : ""
            }`}
          >
            <h2 id="gm-title" className={styles.title}>
              {title ?? "Adicionar exchange"}
            </h2>
            <button
              className={styles.close}
              aria-label="Fechar"
              onClick={() => onCloseRef.current()}
            >
              <span className={styles.closeGlyph}>×</span>
            </button>
          </header>
        )}
        <div
          className={`${styles.body} ${shellless ? styles.shelllessBody : ""} ${
            bodyClassName ?? ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
