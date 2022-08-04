import styles from './styles.module.scss'

export function ModalAddCrypto({ setOpenModal }: any) {
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
              <span className={styles.details}>Código</span>
              <input type="text" id="codigo" placeholder="Código" required />
            </div>
            <div className={styles.inputBox}>
              <span className={styles.details}>Nome</span>
              <input type="text" placeholder="Nome" required />
            </div>
            <div className={styles.inputBoxFile}>
              <span className={styles.details}>Foto</span>
              <input type="file" id="img" name="img" accept="image/*" />
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
