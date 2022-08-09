import { X } from 'phosphor-react'
import { ChangeEvent, FormEvent, useState } from 'react'

import styles from './styles.module.scss'

interface ModalAddExchangeProps {
  onClose: () => void
  onSubmit: (fee: number, tag: string, name: string, convert: boolean) => void
}

export function ModalAddExchange({ onClose, onSubmit }: ModalAddExchangeProps) {
  const [tag, setTag] = useState('')
  const [name, setName] = useState('')
  const [fee, setFee] = useState(0)
  const [convert, setConvert] = useState(false)

  const handleFeeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFee(Number(event.target.value))
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleTagChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTag(event.target.value.toUpperCase())
  }

  const handleConvertChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConvert(event.target.checked)
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()

    onSubmit(fee, tag, name, convert)
    onClose()
  }

  return (
    <div className={styles.modalBackground}>
      <form
        className={styles.modalContainer}
        action="#"
        onSubmit={handleFormSubmit}
      >
        <header className={styles.modalHeader}>
          <h3>Adicionar Exchange</h3>
          <button onClick={onClose}>
            <X size={24} weight="bold" />
          </button>
        </header>
        <div className={styles.inputsContainer}>
          <div className={styles.inputBox}>
            <span className={styles.details}>Nome</span>
            <input
              type="text"
              placeholder="Nome"
              required
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Tag</span>
            <input
              type="text"
              placeholder="Tag"
              required
              value={tag}
              onChange={handleTagChange}
            />
          </div>
          <div className={styles.inputBox}>
            <span className={styles.details}>Taxa</span>
            <input
              type="number"
              placeholder="Taxa"
              step="any"
              required
              value={fee}
              onChange={handleFeeChange}
            />
          </div>
          <div className={styles.inputBoxInline}>
            <span className={styles.details}>Converte?</span>
            <input
              type="checkbox"
              checked={convert}
              required
              onChange={handleConvertChange}
            />
          </div>
        </div>
        <footer className={styles.footer}>
          <button className={styles.voltarBtn} onClick={onClose} type="button">
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
