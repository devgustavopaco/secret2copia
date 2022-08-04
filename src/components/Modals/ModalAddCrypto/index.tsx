import { X } from 'phosphor-react'
import { ImageDropzone } from '../../ImageDropzone'
import styles from './styles.module.scss'

export function ModalAddCrypto({ setOpenModal }: any) {
  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
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
        <form action="#">
          <div className={styles.userDetails}>
            <div className={styles.inputBox}>
              <span className={styles.details}>Código</span>
              <input type="text" id="codigo" placeholder="Código" required />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Nome</span>
              <input type="text" placeholder="Nome" required />
            </div>
            <div className={styles.inputBoxFile}>
              <span className={styles.details}>Foto</span>
              <ImageDropzone />
            </div>
          </div>
        </form>
        <footer className={styles.footer}>
          <button
            className={styles.voltarBtn}
            onClick={() => {
              setOpenModal(false)
            }}
          >
            Voltar
          </button>
          <button className={styles.addBtn}>Adicionar</button>
        </footer>
      </div>
    </div>
  )
}
