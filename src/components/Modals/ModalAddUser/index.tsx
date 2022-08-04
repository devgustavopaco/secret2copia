import styles from './styles.module.scss'
import { MaskedInput, createDefaultMaskGenerator } from 'react-hook-mask'
import { useState } from 'react'

const maskGenerator = createDefaultMaskGenerator('(11) 99999-9999')

export function ModalAddUser({ setOpenModal }: any) {
  const [value, setValue] = useState('')

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        <div className={styles.titleCloseBtn}>
          <button
            onClick={() => {
              setOpenModal(false)
            }}
            className={styles.xBtn}
          >
            X
          </button>
        </div>
        <form action="#">
          <div className={styles.userDetails}>
            <div className={styles.inputBox}>
              <span className={styles.details}>Primeiro Nome</span>
              <input
                type="text"
                id="codigo"
                placeholder="Primeiro Nome"
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Último Nome</span>
              <input type="text" placeholder="Último Nome" required />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Nome de Usuário</span>
              <input type="text" placeholder="Nome de Usuário" required />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Telefone</span>
              <MaskedInput
                maskGenerator={maskGenerator}
                value={value}
                onChange={setValue}
                placeholder="Telefone"
                required
              />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Nome Completo</span>
              <input type="text" placeholder="Nome Completo" required />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Valor Pago</span>
              <input type="text" placeholder="Valor Pago" required />
            </div>
          </div>
        </form>
        <div className={styles.footer}>
          <button
            className={styles.voltarBtn}
            onClick={() => {
              setOpenModal(false)
            }}
          >
            Voltar
          </button>
          <button className={styles.addBtn}>Adicionar</button>
        </div>
      </div>
    </div>
  )
}
