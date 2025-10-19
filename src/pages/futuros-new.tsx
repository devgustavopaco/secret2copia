"use client";
import { useState } from "react";
import styles from "../styles/futures-new.module.scss";
import NewPageSidebar from "../components/new-page/sidebar";
import NewPageHeader from "../components/new-page/header/header";
import { DemoGlassTable } from "../components/new-page/glass-table/glass-table";
import GlassModal from "../components/new-page/modal/glass-modal";

export default function FuturosNewPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"spot" | "futures">("spot");

  return (
    <div className={styles.container}>
      <div className={styles.backgroundBlur}></div>

      <NewPageSidebar
        onToggleChange={setIsSidebarOpen}
        onAddExchange={(type) => {
          setModalType(type);
          setModalOpen(true);
        }}
      />
      <NewPageHeader />

      <main className={styles.main}>
        <DemoGlassTable isSidebarOpen={isSidebarOpen} />
      </main>

      {/* MODAL */}
      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Adicionar exchange ${
          modalType === "spot" ? "SPOT" : "Futures"
        }`}
      >
        {/* conteúdo de exemplo — cards de seleção */}
        <div className="__modal-grid">
          {/* use a classe do módulo via wrapper div */}
        </div>
      </GlassModal>
    </div>
  );
}
