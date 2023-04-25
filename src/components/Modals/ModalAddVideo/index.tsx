import styles from "./styles.module.scss";
import { ChangeEvent, FormEvent, useState } from "react";
import { X } from "phosphor-react";

interface ModalAddVideoProps {
  setOpenModal: (open: boolean) => void;
  onSubmit: (
    title: string,
    description: string,
    additionalMaterial: string | undefined,
    idYoutube: string,
    createdAt: Date
  ) => void;
}

export function ModalAddVideo({ setOpenModal, onSubmit }: ModalAddVideoProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [additionalMaterial, setAdditionalMaterial] = useState("");
  const [idYoutube, setIdYoutube] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date());

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  };

  const handleAdditionalMaterialChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setAdditionalMaterial(event.target.value);
  };

  const handleIdYoutubeChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setIdYoutube(event.target.value);
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();

    onSubmit(title, description, additionalMaterial, idYoutube, createdAt);
    setOpenModal(false);
  };

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        <header className={styles.modalHeader}>
          <h3>Adicionar Vídeo</h3>
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
              <span className={styles.details}>Título do vídeo</span>
              <input
                type="text"
                placeholder="Titulo do vídeo"
                onChange={handleTitleChange}
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Descrição do vídeo</span>
              <input
                type="text"
                placeholder="Descrição do vídeo"
                onChange={handleDescriptionChange}
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>
                Url do material complementar
              </span>
              <input
                type="text"
                onChange={handleAdditionalMaterialChange}
                placeholder="Url do material complementar"
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Id do Youtube</span>
              <input
                type="text"
                placeholder="Id do Youtube"
                onChange={handleIdYoutubeChange}
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
