import { X } from "phosphor-react";
import { ChangeEvent, FormEvent, useState } from "react";
import styles from "./styles.module.scss";

interface ModalAddUserProps {
  setOpenModal: (open: boolean) => void;
  onSubmit: (whatsAppUrl: string) => void;
}

export function ModalEditSuportContent({
  setOpenModal,
  onSubmit,
}: ModalAddUserProps) {
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  const handleWhatsAppUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWhatsAppUrl(event.target.value);
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();

    onSubmit(whatsAppUrl);
    setOpenModal(false);
  };

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        <header className={styles.modalHeader}>
          <h3>Editar telefone de contato</h3>
          <button
            onClick={() => {
              setOpenModal(false);
            }}
          >
            <X size={24} weight="bold" />
          </button>
        </header>
        <form action="#" onSubmit={handleFormSubmit}>
          <div className={styles.userDetails}>
            <div className={styles.inputBox}>
              <span className={styles.details}>Insira a URL do Whatsapp</span>
              <input
                type="text"
                placeholder="Insira a URL de contato do Whatsapp"
                onChange={handleWhatsAppUrlChange}
                required
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
    </div>
  );
}
