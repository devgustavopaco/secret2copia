import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SignOut } from "phosphor-react";
import { useState } from "react";
import Logo from "../../icons/Logo";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";

interface HeaderProps {
  supportNumber: string;
  isChecked?: boolean;
}

export function Header({ supportNumber, isChecked = false }: HeaderProps) {
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
  let roleColor = "#7b61ff";

  if (user && user.data && !!user.data.bronze) {
    roleColor = "#cd7f32";
    roleName = "Bronze";
  }
  if (user && user.data && !!user.data.silver) {
    roleColor = "#e0e0e0";
    roleName = "Silver";
  }
  if (user && user.data && !!user.data.gold) {
    roleColor = "#D4AF37";
    roleName = "Gold";
  }
  if (user && user.data && !!user.data.platinum) {
    roleColor = "#E5E4E2";
    roleName = "Platinum";
  }

  return (
    <header className={styles.header}>
      <div className="container">
        <img
          className={styles.hamburguer}
          src="/images/menuHamburguer.png"
          alt=""
          onClick={toggleMenu}
        />
        <Link href="/home">
          {/* <img className={styles.logo} src="/images/Menu/logoMenu.svg"></img> */}
          <Logo color={isChecked ? "#1daf23" : "#7B61FF"} />
        </Link>
        <div className={`${styles.tooltip} ${styles.mobileToolTip}`}>
          <div className={styles.profileImage}>
            <img
              src={
                user && user.data && user.data.image
                  ? user.data.image
                  : "images/user.png"
              }
              alt="foto de perfil"
              style={{
                borderColor: isChecked ? "#1daf23" : roleColor,
              }}
            />
          </div>
        </div>

        <div className={`${styles.menuContent} ${isOpen ? styles.open : ""}`}>
          <div
            className={`${styles.nameHamburguer} ${
              isChecked ? styles.nameChecked : ""
            }`}
          >
            <span className={styles.text}>Olá</span>
            <span>{auth && auth.user ? `, ${auth.user.name}` : ""}</span>
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
          <Link href="https://docs.google.com/spreadsheets/d/1F2GnfblewJ5nNQeCumPk5tAEsGZCp40ZzyJ7PTUwKgM/edit?gid=1671346053#gid=1671346053">
            <a
              className={`${styles.menuItem} ${
                router.pathname === "/planilha" ? styles.active : ""
              }`}
            >
              Planilha
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
            href={supportNumber}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contato
          </a>
          {auth?.role === "admin" && (
            <Link href="https://painel.nextgain.com.br/">
              <a
                className={`${styles.menuItem} ${
                  router.pathname === "https://painel.nextgain.com.br/"
                    ? styles.active
                    : ""
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
              <Link href="https://docs.google.com/spreadsheets/d/1F2GnfblewJ5nNQeCumPk5tAEsGZCp40ZzyJ7PTUwKgM/edit?gid=1671346053#gid=1671346053">
                <a className={router.pathname === "/planilha" ? "active" : ""}>
                  Planilha
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
              <a target="_blank" href={supportNumber} rel="noopener noreferrer">
                Contato
              </a>
            </li>
            {auth?.role === "admin" && (
              <li>
                <Link href="https://painel.nextgain.com.br/">
                  <a
                    className={
                      router.pathname === "https://painel.nextgain.com.br/"
                        ? "active"
                        : ""
                    }
                  >
                    Dashboard
                  </a>
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div
          className={`${styles.name} ${isChecked ? styles.nameChecked : ""}`}
        >
          <span className={styles.text}>Olá</span>
          <span>{auth && auth.user ? `, ${auth.user.name}` : ""}</span>
          <div className={styles.tooltip}>
            <div className={styles.profileImage}>
              <img
                src={"images/user.png"}
                alt="foto de perfil"
                style={{
                  borderColor: isChecked ? "#1daf23" : roleColor,
                }}
              />
            </div>
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
            <a target="_blank" href={supportNumber} rel="noopener noreferrer">
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
