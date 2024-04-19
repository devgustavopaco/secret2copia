import Link from "next/link";
import { useRouter } from "next/router";
import {
  Bank,
  ChartLineUp,
  CurrencyBtc,
  Monitor,
  Percent,
  Users,
  YoutubeLogo,
} from "phosphor-react";
import styles from "./styles.module.scss";

export function SidebarAdmin() {
  const router = useRouter();

  return (
    <aside className={styles.sidebar}>
      <section>
        <h2>Painel</h2>

        <nav className={styles.sidebarList}>
          <Link href="/monitor/">
            <a className={styles.sidebarListItem}>
              <Monitor className={styles.sidebarIcon} weight="bold" />
              <span className={styles.sidebarText}>Monitor</span>
            </a>
          </Link>

          <Link href="/admin/sales/">
            <a className={router.pathname === "/admin/sales" ? "active" : ""}>
              <ChartLineUp className={styles.sidebarIcon} weight="bold" />
              <span className={styles.sidebarText}>Visão Geral</span>
            </a>
          </Link>
        </nav>
      </section>

      <section>
        <h2>Dashboard</h2>

        <nav className={styles.sidebarList}>
          <Link href="/admin/users/">
            <a className={router.pathname == "/admin/users" ? "active" : ""}>
              <Users className={styles.sidebarIcon} weight="bold" />
              <span className={styles.sidebarText}>Usuários</span>
            </a>
          </Link>
          <Link href="/admin/cryptos/">
            <a className={router.pathname == "/admin/cryptos" ? "active" : ""}>
              <CurrencyBtc className={styles.sidebarIcon} weight="bold" />
              <span className={styles.sidebarText}>Cryptos</span>
            </a>
          </Link>
          <Link href="/admin/exchanges/">
            <a
              className={router.pathname == "/admin/exchanges" ? "active" : ""}
            >
              <Bank className={styles.sidebarIcon} weight="bold" />
              <span className={styles.sidebarText}>Exchanges</span>
            </a>
          </Link>
          <Link href="/admin/tax/">
            <a className={router.pathname == "/admin/tax" ? "active" : ""}>
              <Percent className={styles.sidebarIcon} weight="bold" />
              <span className={styles.sidebarText}>Taxas</span>
            </a>
          </Link>
          <Link href="/admin/videos/">
            <a className={router.pathname == "/admin/videos" ? "active" : ""}>
              <YoutubeLogo className={styles.sidebarIcon} weight="bold" />
              <span className={styles.sidebarText}>Videos</span>
            </a>
          </Link>
        </nav>
      </section>
    </aside>
  );
}
