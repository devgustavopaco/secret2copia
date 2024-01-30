import { X } from "phosphor-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { trpc } from "../../../utils/trpc";
import { useS3Upload } from "next-s3-upload";
import { ImageDropzone } from "../../ImageDropzone";
import styles from "./styles.module.scss";

interface ModalAddCryptoProps {
  setOpenModal: (open: boolean) => void;
  onSubmit: (
    ticker: string,
    name: string,
    isFanToken: boolean,
    exchangeId: string,
    tax: number,
    confirmations: number,
    imageUrl?: string
  ) => void;
}

export function ModalAddCrypto({
  setOpenModal,
  onSubmit,
}: ModalAddCryptoProps) {
  let { uploadToS3 } = useS3Upload();
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [isFanToken, setIsFanToken] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [tax, setTax] = useState(0);
  const [confirmations, setConfirmations] = useState(0);
  const [selectedExchange, setSelectedExchange] = useState("");

  const { data: exchanges, isLoading: isLoadingExchanges } = trpc.useQuery([
    "exchange.getActiveExchanges",
  ]);

  const handleImageDrop = (files: File[]) => {
    const selectedImage = files[0];

    if (selectedImage) {
      setImage(selectedImage);
    }
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleTickerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTicker(event.target.value.toUpperCase());
  };
  const handleTickerBlur = async (event: ChangeEvent<HTMLInputElement>) => {
    const image = new Image();
    image.src = `https://assets.coincap.io/assets/icons/${ticker.toLowerCase()}@2x.png`;
    image.onload = () => {
      setPreviewImageUrl(image.src);
    };
    image.onerror = () => {
      setPreviewImageUrl("");
    };
  };

  const handleIsFanTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsFanToken(event.target.checked);
  };

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();

    let imageUrl = previewImageUrl;

    if (image) {
      try {
        const { url } = await uploadToS3(image);
        imageUrl = url;
      } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
      }
    }
    onSubmit(
      ticker,
      name,
      isFanToken,
      selectedExchange,
      tax,
      confirmations,
      imageUrl
    );
    setOpenModal(false);
  };

  const handleCleanImage = () => {
    if (previewImageUrl) {
      setPreviewImageUrl("");
    }
  };

  return (
    <div className={styles.modalBackground}>
      <form
        className={styles.modalContainer}
        action="#"
        onSubmit={handleFormSubmit}
      >
        <header className={styles.modalHeader}>
          <h3>Adicionar Moeda</h3>
          <button
            onClick={() => {
              setOpenModal(false);
            }}
          >
            <X size={24} weight="bold" />
          </button>
        </header>
        <div className={styles.userDetails}>
          <div className={styles.inputBox}>
            <span className={styles.details}>Código</span>
            <input
              type="text"
              id="codigo"
              placeholder="Código"
              value={ticker}
              required
              onChange={handleTickerChange}
              onBlur={handleTickerBlur}
            />
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Nome</span>
            <input
              type="text"
              placeholder="Nome"
              value={name}
              required
              onChange={handleNameChange}
            />
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Corretoras</span>
            <select
              name="Corretoras"
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              required
            >
              {isLoadingExchanges ? (
                <option value="">Carregando...</option>
              ) : (
                exchanges?.map((exchange) => (
                  <option key={exchange.id} value={exchange.id}>
                    {exchange.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Taxa</span>
            <input
              type="number"
              placeholder="Taxa"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
              min="0"
              step="any"
              required
            />
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Confirmações</span>
            <input
              type="number"
              placeholder="Confirmações"
              value={confirmations}
              onChange={(e) => setConfirmations(Number(e.target.value))}
              min="0"
              required
            />
          </div>
          {previewImageUrl != "" ? (
            <>
              <div className={styles.inputImage}>
                <img src={previewImageUrl} alt={name} />
              </div>
              <div className={styles.cleanImageBlock}>
                <button
                  className={styles.cleanImage}
                  onClick={handleCleanImage}
                >
                  Limpar imagem
                </button>
              </div>
            </>
          ) : (
            <ImageDropzone onDrop={handleImageDrop} />
          )}
          <div className={styles.inputBoxInline}>
            <span className={styles.details}>Fan Token?</span>
            <input
              type="checkbox"
              checked={isFanToken}
              onChange={handleIsFanTokenChange}
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
  );
}
