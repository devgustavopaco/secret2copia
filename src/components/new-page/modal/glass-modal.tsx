"use client";

import React, { useEffect, useCallback, useRef } from "react";
import styles from "./glass-modal.module.scss";

type Props = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function GlassModal({
  isOpen,
  title,
  onClose,
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // lock scroll do body
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // fechar com ESC
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", onKeyDown);
    // foco inicial
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onKeyDown]);

  if (!isOpen) return null;

  const backdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={backdropClick} aria-hidden={false}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-title"
        tabIndex={-1}
        ref={panelRef}
      >
        <header className={styles.header}>
          <h2 id="gm-title" className={styles.title}>
            {title ?? "Adicionar exchange"}
          </h2>
          <button
            className={styles.close}
            aria-label="Fechar"
            onClick={onClose}
          >
            {/* usa o X tipográfico pra manter leveza */}
            <span className={styles.closeGlyph}>×</span>
          </button>
        </header>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
