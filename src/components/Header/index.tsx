import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SignOut } from "phosphor-react";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";

export function Header() {
  const { data: auth } = useSession();

  let userData = null;
  const email = auth?.user?.email || "";
  let user;

  user = trpc.useQuery(["user.getUserByEmail", { email }], {
    enabled: email !== "",
  });

  try {
    userData = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Failed to parse user data from localStorage", error);
  }

  if (user?.data && !userData && email) {
    localStorage.setItem("user", JSON.stringify(user.data));
    userData = user.data;
  }

  const router = useRouter();

  const [toggle, settoggle] = useState(true);

  const handleSignOut = () => {
    signOut({
      callbackUrl: "/",
    });
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  };

  let userId = null;

  if (auth && auth.user) {
    userId = auth.user?.id;
  }

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  let roleName = "Administrator";
  let roleColor = "#0e0345";

  if (user && user.data && user.data.bronze === true) {
    roleColor = "#cd7f32";
    roleName = "Bronze";
  }
  if (user && user.data && user.data.silver === true) {
    roleColor = "#e0e0e0";
    roleName = "Silver";
  }
  if (user && user.data && user.data.gold === true) {
    roleColor = "#D4AF37";
    roleName = "Gold";
  }
  if (user && user.data && user.data.platinum === true) {
    roleColor = "#E5E4E2";
    roleName = "Platinum";
  }

  console.log(user.data, roleName);

  return (
    <header className={styles.header}>
      <div className="container">
        <Link href="/home">
          <img className={styles.logo} src="/images/Menu/logoMenu.svg"></img>
        </Link>
        <img
          className={styles.hamburguer}
          src="/images/menuHamburguer.png"
          alt=""
          onClick={toggleMenu}
        />

        <div className={`${styles.menuContent} ${isOpen ? styles.open : ""}`}>
          <div className={styles.nameHamburguer}>
            <span className={styles.text}>Olá</span>
            <span>{auth && auth.user ? `, ${auth.user.name}` : ""}</span>
            <div className={styles.tooltip}>
              <div className={styles.profileImage}>
                <img
                  src={
                    user && user.data && user.data.image
                      ? user.data.image
                      : "images/user.png"
                  }
                  alt="foto de perfil"
                  style={{
                    borderColor: roleColor,
                  }}
                />
              </div>
              <span className={styles.tooltiptext}>
                Atualmente sua conta esta level:
                <p style={{ color: roleColor }}>{roleName}</p>
              </span>
            </div>
          </div>

          <Link href="/home">
            <a
              className={`${styles.menuItem} ${
                router.pathname === "/home" ? styles.active : ""
              }`}
            >
              Home
            </a>
          </Link>
          <Link href="/monitor">
            <a
              className={`${styles.menuItem} ${
                router.pathname === "/monitor" ? styles.active : ""
              }`}
            >
              Monitor
            </a>
          </Link>
          <Link href="/videos">
            <a
              className={`${styles.menuItem} ${
                router.pathname === "/videos" ? styles.active : ""
              }`}
            >
              Mentoria
            </a>
          </Link>
          <Link href="/privacidade">
            <a
              className={`${styles.menuItem} ${
                router.pathname === "/privacidade" ? styles.active : ""
              }`}
            >
              Privacidade
            </a>
          </Link>
          <a
            className={styles.menuItem}
            href="https://api.whatsapp.com/send?phone=5511973592971&text=Fala%20Gu%2C%20preciso%20de%20suporte!%20"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contato
          </a>
          {auth?.role === "admin" && (
            <Link href="/admin/users">
              <a
                className={`${styles.menuItem} ${
                  router.pathname === "/admin/users" ? styles.active : ""
                }`}
              >
                Dashboard
              </a>
            </Link>
          )}

          <button
            type="button"
            className={styles.logoutMobile}
            onClick={handleSignOut}
          >
            Sair
            <SignOut size={24} />
          </button>
        </div>

        <div
          className={`${styles.shadowMenu} ${isOpen ? styles.open : ""}`}
          onClick={toggleMenu}
        ></div>

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
              <Link href="/videos">
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
        <div className={styles.name}>
          <span className={styles.text}>Olá</span>
          <span>{auth && auth.user ? `, ${auth.user.name}` : ""}</span>
          <div className={styles.tooltip}>
            <div className={styles.profileImage}>
              <img
                src={
                  user && user.data && user.data.image
                    ? user.data.image
                    : "images/user.png"
                }
                alt="foto de perfil"
                style={{
                  borderColor: roleColor,
                }}
              />
            </div>
            <span className={styles.tooltiptext}>
              Atualmente sua conta esta level:
              <br></br>
              <span style={{ color: roleColor }}>{roleName}</span>
            </span>
          </div>

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
