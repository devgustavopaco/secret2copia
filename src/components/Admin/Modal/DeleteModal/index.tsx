import styles from './styles.module.scss'

export function DeleteModal({ closeModal }: any) {
  return (
    <div className={styles.modalBackGround}>
      <div className={styles.modalContainer}>
        <div className={styles.titleCloseBtn}>
          <button onClick={() => closeModal(false)}>X</button>
        </div>
        <div className={styles.title}>
          <h1>Are you Sute You Want To Continue?</h1>
        </div>
        <div className={styles.body}>
          <p>
            The next page is awesome! You should move forward, you will enjoy
          </p>
        </div>
        <div className={styles.footer}>
          <button onClick={() => closeModal(false)}>Cancel</button>
          <button>Continue</button>
        </div>
      </div>
    </div>
  )
}
