import styles from './styles.module.scss'

interface ModalActivateTaxesProps {
  onToggle: (open: boolean) => void
}

export function ModalActivateTaxes({ onToggle }: ModalActivateTaxesProps) {
  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        <div className={styles.titleCloseBtn}>
          <button
            onClick={() => {
              onToggle(false)
            }}
            className={styles.xBtn}
          >
            X
          </button>
        </div>
        <div className={styles.title}>
          <h1>Tem certeza que deseja ativar a taxa?</h1>
        </div>
        <div className={styles.body}>
          <p>Esses dados serão salvos no banco de dados!</p>
        </div>
        <div className={styles.footer}>
          <button
            className={styles.voltarBtn}
            onClick={() => {
              onToggle(false)
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
