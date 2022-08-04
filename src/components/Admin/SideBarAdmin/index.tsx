import styles from './styles.module.scss'
import {
  LineStyle,
  Timeline,
  PermIdentity,
  Storefront,
  AttachMoney,
} from '@material-ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/router'

export function SideBarAdmin() {
  const router = useRouter()

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarWrapper}>
        <div className={styles.sidebarMenu}>
          <h3 className={styles.sidebarTitle}>Painel</h3>
          <ul className={styles.sidebarList}>
            <Link href="/monitor/">
              <li className={styles.sidebarListItem}>
                <LineStyle className={styles.sidebarIcon} />
                <span className={styles.sidebarText}>Home</span>
              </li>
            </Link>
            <Link href="/adminSales/">
              <li
                className={
                  router.pathname === '/adminSales'
                    ? styles.sidebarListItem + ' ' + styles.active
                    : styles.sidebarListItem
                }
              >
                <Timeline className={styles.sidebarIcon} />
                <span className={styles.sidebarText}>Vendas</span>
              </li>
            </Link>
          </ul>
        </div>
        <div className={styles.sidebarMenu}>
          <h3 className={styles.sidebarTitle}>Menu Rápido</h3>
          <ul className={styles.sidebarList}>
            <Link href="/adminUsers/">
              <li
                className={
                  router.pathname == '/adminUsers'
                    ? styles.sidebarListItem + ' ' + styles.active
                    : styles.sidebarListItem
                }
              >
                <PermIdentity className={styles.sidebarIcon} />
                <span className={styles.sidebarText}>Usuários</span>
              </li>
            </Link>
            <Link href="/adminCryptos/">
              <li
                className={
                  router.pathname == '/adminCryptos'
                    ? styles.sidebarListItem + ' ' + styles.active
                    : styles.sidebarListItem
                }
              >
                <AttachMoney className={styles.sidebarIcon} />
                <span className={styles.sidebarText}>Cryptos</span>
              </li>
            </Link>
            <Link href="/adminExchanges/">
              <li
                className={
                  router.pathname == '/adminExchanges'
                    ? styles.sidebarListItem + ' ' + styles.active
                    : styles.sidebarListItem
                }
              >
                <Storefront className={styles.sidebarIcon} />
                <span className={styles.sidebarText}>Exchanges</span>
              </li>
            </Link>
          </ul>
        </div>
      </div>
    </div>
  )
}
