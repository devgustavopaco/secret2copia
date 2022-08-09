import styles from './styles.module.scss'
import { ChangeEvent, FormEvent, useState } from 'react'
import { X } from 'phosphor-react'
import { MaskedInput, createDefaultMaskGenerator } from 'react-hook-mask'

const phoneMask = createDefaultMaskGenerator('(99) 99999-9999')

interface ModalAddUserProps {
  setOpenModal: (open: boolean) => void
  onSubmit: (
    name: string,
    email: string,
    phone: string,
    pricePaid: number,
    password: string
  ) => void
}

export function ModalAddUser({ setOpenModal, onSubmit }: ModalAddUserProps) {
  const [value, setValue] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pricePaid, setPricePaid] = useState(0)
  const [password, setPassword] = useState('')

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPricePaid(parseFloat(event.target.value))
  }

  const handlePasswordChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()

    onSubmit(name, email, value, pricePaid, password)
    setOpenModal(false)
  }

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        <header className={styles.modalHeader}>
          <h3>Adicionar Usuário</h3>
          <button
            onClick={() => {
              setOpenModal(false)
            }}
          >
            <X size={24} weight="bold" />
          </button>
        </header>
        <form action="#" onSubmit={handleFormSubmit}>
          <div className={styles.userDetails}>
            <div className={styles.inputBox}>
              <span className={styles.details}>Nome Completo</span>
              <input
                type="text"
                placeholder="Nome Completo"
                onChange={handleNameChange}
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Email</span>
              <input
                type="text"
                placeholder="Email"
                onChange={handleEmailChange}
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Telefone</span>
              <MaskedInput
                maskGenerator={phoneMask}
                value={value}
                onChange={setValue}
                placeholder="Telefone"
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Valor Pago</span>
              <input
                type="text"
                placeholder="Valor Pago"
                onChange={handlePriceChange}
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Senha</span>
              <input
                type="password"
                placeholder="Senha"
                onChange={handlePasswordChange}
                required
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
    </div>
  )
}
