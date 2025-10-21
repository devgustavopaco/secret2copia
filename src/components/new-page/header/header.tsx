import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import LogoutIcon from "../../Icons/LogoutIcon";
import { trpc } from "../../../utils/trpc";
import styles from "./header.module.scss";

interface NewPageHeaderProps {
  supportNumber?: string;
}

export default function NewPageHeader({
  supportNumber = "https://wa.me/5511999999999",
}: NewPageHeaderProps) {
  const { data: auth } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Buscar dados do usuário
  const email = auth?.user?.email || "";
  const user = trpc.useQuery(["user.getUserByEmail", { email }], {
    enabled: email !== "",
  });

  // Gerenciar dados do usuário no localStorage
  let userData = null;
  try {
    userData = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Failed to parse user data from localStorage", error);
  }

  if (user?.data && !userData && email) {
    localStorage.setItem("user", JSON.stringify(user.data));
    userData = user.data;
  }

  // Determinar role e cor
  let roleName = "Administrator";
  let roleColor = "#7b61ff";

  if (user?.data && !!user.data.bronze) {
    roleColor = "#cd7f32";
    roleName = "Bronze";
  }
  if (user?.data && !!user.data.silver) {
    roleColor = "#e0e0e0";
    roleName = "Silver";
  }
  if (user?.data && !!user.data.gold) {
    roleColor = "#D4AF37";
    roleName = "Gold";
  }
  if (user?.data && !!user.data.platinum) {
    roleColor = "#E5E4E2";
    roleName = "Platinum";
  }

  // Função de logout
  const handleSignOut = () => {
    signOut({
      callbackUrl: "/",
    });
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(`.${styles.hamburgerMenu}`) &&
        !target.closest(`.${styles.mobileMenu}`)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className={styles.header}>
      <div className={styles.glowLine}></div>
      <div className={styles.headerContent}>
        <ul>
          <li>
            <Link href="/home">
              <a className={router.pathname === "/home" ? styles.active : ""}>
                Home
              </a>
            </Link>
          </li>
          <li>
            <Link href="/futuros">
              <a
                className={router.pathname === "/futuros" ? styles.active : ""}
              >
                Futuros
              </a>
            </Link>
          </li>
          <li>
            <Link href="/videos">
              <a className={router.pathname === "/videos" ? styles.active : ""}>
                Mentoria
              </a>
            </Link>
          </li>
          <li>
            <Link href="/privacidade">
              <a
                className={
                  router.pathname === "/privacidade" ? styles.active : ""
                }
              >
                Privacidade
              </a>
            </Link>
          </li>
          <li>
            <a href={supportNumber} target="_blank" rel="noopener noreferrer">
              Contato
            </a>
          </li>
          {auth?.role === "admin" && (
            <li>
              <Link href="https://painel.nextgain.com.br/">
                <a
                  className={
                    router.pathname === "https://painel.nextgain.com.br/"
                      ? styles.active
                      : ""
                  }
                >
                  Dashboard
                </a>
              </Link>
            </li>
          )}
        </ul>
        <div className={styles.headerRight}>
          <span className={styles.profileName}>
            Olá{auth && auth.user ? `, ${auth.user.name}` : ""}
          </span>
          <div className={styles.profileIcon}>
            <Image
              src="/images/user1.jpeg"
              alt="Profile"
              width={40}
              height={40}
              style={{
                borderColor: roleColor,
              }}
            />
          </div>

          <div
            className={styles.hamburgerMenu}
            role="button"
            aria-label="Menu de logout"
            tabIndex={0}
            onClick={handleSignOut}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleSignOut();
              }
            }}
          >
            <LogoutIcon className={styles.hamburgerIcon} />
          </div>
        </div>
      </div>
    </div>
  );
}
