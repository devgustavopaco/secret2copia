import Link from 'next/link'
import { SignOut } from 'phosphor-react'
import styles from './styles.module.scss'

export function Header() {
  return (
    <header className={styles.header}>
      <div className="container">
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
            <li>
              <Link href="/adminSales">
                <a>Dashboard</a>
              </Link>
            </li>
          </ul>
        </nav>

        <button type="button" className={styles['logout-button']}>
          Sair
          <SignOut size={24} />
        </button>
      </div>
    </header>
  )
}
