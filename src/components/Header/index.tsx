import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { List, SignOut, X } from "phosphor-react";
import { useState } from "react";
import styles from "./styles.module.scss";

export function Header() {
  const router = useRouter();
  const { data: auth } = useSession();

  const [toggle, settoggle] = useState(true);

  const handleSignOut = () => {
    signOut({
      callbackUrl: "/",
    });
    // router.push('/')
  };

  return (
    <header className={styles.header}>
      <div className="container">
        <Link href="/home">
          <img className={styles.logo} src="/images/Menu/logoMenu.svg"></img>
        </Link>
        <nav
          aria-label="Principal"
          className={`${styles["navigation-links"]} ${styles["desktop-navigation"]}`}
        >
          <ul
            role="list"
            className={`${styles["mobile-navigation"]} ${
              toggle ? "" : "active"
            }`}
          >
            <li>
              <Link href="/home">
                <a className={router.pathname === "/home" ? "active" : ""}>
                  Home
                </a>
              </Link>
            </li>
            <li>
              <Link href="/monitor">
                <a className={router.pathname === "/monitor" ? "active" : ""}>
                  Monitor
                </a>
              </Link>
            </li>
            <li>
              <Link href="/mentoria">
                <a className={router.pathname === "/mentoria" ? "active" : ""}>
                  Mentoria
                </a>
              </Link>
            </li>
            <li>
              <Link href="/privacidade">
                <a
                  className={router.pathname === "/privacidade" ? "active" : ""}
                >
                  Privacidade
                </a>
              </Link>
            </li>
            <li>
              <a
                target="_blank"
                href="https://api.whatsapp.com/send?phone=5511973592971&text=Fala%20Gu%2C%20preciso%20de%20suporte!%20"
                rel="noopener noreferrer"
              >
                Contato
              </a>
            </li>
            {auth?.role === "admin" && (
              <li>
                <Link href="/admin/users">
                  <a
                    className={
                      router.pathname === "/admin/users" ? "active" : ""
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
        <div className={styles.name}>
          <span className={styles.text}>Olá</span>
          <span>{auth && auth.user ? `, ${auth.user.name}` : ""}</span>
          <button
            type="button"
            className={styles["logout-button"]}
            onClick={handleSignOut}
          >
            Sair
            <SignOut size={24} />
          </button>
        </div>
      </div>
      <nav
        aria-label="Principal"
        className={`${styles["navigation-links"]} ${
          styles["mobile-navigation"]
        } ${toggle ? "" : "active"}`}
      >
        <ul role="list">
          <li>
            <Link href="/monitor">
              <a className={router.pathname === "/monitor" ? "active" : ""}>
                Monitor
              </a>
            </Link>
          </li>
          <li>
            <Link href="/videos">
              <a className={router.pathname === "/videos" ? "active" : ""}>
                Mentoria
              </a>
            </Link>
          </li>
          <li>
            <Link href="/privacidade">
              <a className={router.pathname === "/privacidade" ? "active" : ""}>
                Privacidade
              </a>
            </Link>
          </li>
          <li>
            <a
              target="_blank"
              href="https://api.whatsapp.com/send?phone=5511973592971&text=Fala%20Gu%2C%20preciso%20de%20suporte!%20"
              rel="noopener noreferrer"
            >
              Contato
            </a>
          </li>
          {auth?.role === "admin" && (
            <li>
              <Link href="/admin/users">
                <a
                  className={router.pathname === "/admin/users" ? "active" : ""}
                >
                  Dashboard
                </a>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
