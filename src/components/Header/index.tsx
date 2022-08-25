import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { List, SignOut, X } from 'phosphor-react'
import { useState } from 'react'
import styles from './styles.module.scss'

export function Header() {
  const router = useRouter()
  const { data: auth } = useSession()

  const [toggle, settoggle] = useState(true)

  const handleSignOut = () => {
    signOut({
      callbackUrl: '/',
    })
    // router.push('/')
  }

  return (
    <header className={styles.header}>
      <div className="container">
        <Link href="/monitor">
          <img className={styles.logo} src="/images/NG1.png"></img>
        </Link>
        <nav
          aria-label="Principal"
          className={`${styles['navigation-links']} ${styles['desktop-navigation']}`}
        >
          <ul
            role="list"
            className={`${styles['mobile-navigation']} ${
              toggle ? '' : 'active'
            }`}
          >
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
        <div className={styles.nav_toggle}>
          {toggle ? (
            <List
              size={35}
              color="#969696"
              weight="bold"
              onClick={() => settoggle(false)}
            />
          ) : (
            <X
              size={35}
              color="#957dff"
              weight="bold"
              onClick={() => settoggle(true)}
            />
          )}
        </div>
        <button
          type="button"
          className={styles['logout-button']}
          onClick={handleSignOut}
        >
          Sair
          <SignOut size={24} />
        </button>
      </div>
      <nav
        aria-label="Principal"
        className={`${styles['navigation-links']} ${
          styles['mobile-navigation']
        } ${toggle ? '' : 'active'}`}
      >
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
                  className={router.pathname === '/admin/users' ? 'active' : ''}
                >
                  Dashboard
                </a>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
