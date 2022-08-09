import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SignOut } from 'phosphor-react'
import styles from './styles.module.scss'

export function Header() {
  const router = useRouter()

  const handleSignOut = () => {
    signOut({
      redirect: false,
    })
    router.push('/')
  }

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
              <Link href="/admin/sales">
                <a>Dashboard</a>
              </Link>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className={styles['logout-button']}
          onClick={handleSignOut}
        >
          Sair
          <SignOut size={24} />
        </button>
      </div>
    </header>
  )
}
