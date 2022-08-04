import styles from './styles.module.scss'

export function ModalAtivarExchange({ setOpenModal }: any) {
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
        <div className={styles.title}>
          <h1>Tem certeza que deseja ativar a corretora ?</h1>
        </div>
        <div className={styles.body}>
          <p>Esses dados serão salvos no banco de dados!</p>
        </div>
        <div className={styles.footer}>
          <button
            className={styles.voltarBtn}
            onClick={() => {
              setOpenModal(false)
            }}
          >
            Voltar
          </button>
          <button className={styles.excluirBtn}>Ativar</button>
        </div>
      </div>
    </div>
  )
}
