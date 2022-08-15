import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SignOut } from 'phosphor-react'
import styles from './styles.module.scss'

export function Header() {
  const router = useRouter()
  const { data: auth } = useSession()

  const handleSignOut = () => {
    signOut({})
    router.push('/')
  }

  return (
    <header className={styles.header}>
      <div className="container">
        <Link href="/monitor">
          <img className={styles.logo} src="/images/NG1.png"></img>
        </Link>
        <nav aria-label="Principal" className={styles['navigation-links']}>
          <ul role="list">
            <li>
              <Link href="/monitor">
                <a className={router.pathname === '/monitor' ? 'active' : ''}>
                  Monitor
                </a>
              </Link>
            </li>
            <li>
              <a className={router.pathname === '/videos' ? 'active' : ''}>
                Vídeos
              </a>
            </li>
            <li>
              <a href="#">Sobre Nós</a>
            </li>
            <li>
              <a href="#">Contato</a>
            </li>
            {auth?.role === 'admin' && (
              <li>
                <Link href="/admin/users">
                  <a
                    className={
                      router.pathname === '/admin/users' ? 'active' : ''
                    }
                  >
                    Dashboard
                  </a>
                </Link>
              </li>
            )}
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
