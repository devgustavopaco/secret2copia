import styles from './styles.module.scss'

export function ModalDeleteUser({ setOpenModal }: any) {
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
          <h1>Tem certeza que deseja excluir o usuário ?</h1>
        </div>
        <div className={styles.body}>
          <p>O usuário para sempre será removido do sistema!</p>
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
          <button className={styles.excluirBtn}>Excluir</button>
        </div>
      </div>
    </div>
  )
}
