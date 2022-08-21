import { X } from 'phosphor-react'
import { ChangeEvent, FormEvent, useState } from 'react'

import { ImageDropzone } from '../../ImageDropzone'
import styles from './styles.module.scss'

interface ModalAddCryptoProps {
  setOpenModal: (open: boolean) => void
  onSubmit: (
    ticker: string,
    name: string,
    isFanToken: boolean,
    image?: File | null
  ) => void
}

export function ModalAddCrypto({
  setOpenModal,
  onSubmit,
}: ModalAddCryptoProps) {
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [isFanToken, setIsFanToken] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [image, setImage] = useState<File | null>(null)

  const handleImageDrop = (files: File[]) => {
    const selectedImage = files[0]

    if (selectedImage) {
      setImage(selectedImage)
    }
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleTickerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTicker(event.target.value.toUpperCase())
  }
  const handleTickerBlur = async (event: ChangeEvent<HTMLInputElement>) => {
    const image = new Image()
    image.src = `https://assets.coincap.io/assets/icons/${ticker.toLowerCase()}@2x.png`
    image.onload = () => {
      console.log('image loaded')
      setPreviewImageUrl(image.src)
    }
    image.onerror = () => {
      console.log('image not found')
      setPreviewImageUrl('')
    }
  }

  const handleIsFanTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsFanToken(event.target.checked)
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()

    onSubmit(ticker, name, isFanToken, image)
    setOpenModal(false)
  }

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
              setOpenModal(false)
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
          {previewImageUrl != '' ? (
            <div className={styles.inputImage}>
              <img src={previewImageUrl} alt={name} />
            </div>
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
              setOpenModal(false)
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
  )
}
