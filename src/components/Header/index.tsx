import styles from './styles.module.scss'

export function Header() {
  return (
    <header className={styles.header}>
      <h1>Logo</h1>
      <nav aria-label="Principal" className={styles['navigation-links']}>
        <ul role="list">
          <li>
            <a href="#" data-active>
              Monitor
            </a>
          </li>
          <li>
            <a href="#">Vídeos</a>
          </li>
          <li>
            <a href="#">Sobre Nós</a>
          </li>
          <li>
            <a href="#">Contato</a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
