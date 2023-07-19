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
                  borderColor:
                    auth?.role === "gold"
                      ? "#D4AF37"
                      : auth?.role === "silver"
                      ? "#C0C0C0"
                      : auth?.role === "bronze"
                      ? "#cd7f32"
                      : auth?.role === "platinum"
                      ? "#03f1f5"
                      : auth?.role === "admin"
                      ? "#7b61ff"
                      : "#ffffff",
                }}
              />
            </div>
            <span className={styles.tooltiptext}>
              Atualmente sua conta esta level:
              <span
                style={{
                  color:
                    auth?.role === "gold"
                      ? "#D4AF37"
                      : auth?.role === "silve"
                      ? "#C0C0C0"
                      : auth?.role === "bronze"
                      ? "#cd7f32"
                      : auth?.role === "platinum"
                      ? "#E5E4E2"
                      : auth?.role === "admin"
                      ? "#000000"
                      : "#000000",
                }}
              >
                {auth?.role
                  ? {
                      gold: " Ouro",
                      silver: " Prata",
                      bronze: " Bronze",
                      platinum: " Platina",
                      admin: " Administrador",
                    }[auth.role]
                  : "Bronze"}
              </span>
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
