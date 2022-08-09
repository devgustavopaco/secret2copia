import { X } from 'phosphor-react'
import { ChangeEvent, FormEvent, useState } from 'react'

import { ImageDropzone } from '../../ImageDropzone'
import styles from './styles.module.scss'

interface ModalAddCryptoProps {
  setOpenModal: (open: boolean) => void
  onSubmit: (ticker: string, name: string) => void
}

export function ModalAddCrypto({
  setOpenModal,
  onSubmit,
}: ModalAddCryptoProps) {
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleTickerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTicker(event.target.value)
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()

    onSubmit(ticker, name)
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
              required
              onChange={handleTickerChange}
            />
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Nome</span>
            <input
              type="text"
              placeholder="Nome"
              required
              onChange={handleNameChange}
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
