import styles from "./header.module.scss";
import Link from "next/link";
import LogoutIcon from "../../Icons/LogoutIcon";
export default function NewPageHeader() {
  return (
    <div className={styles.header}>
      <div className={styles.glowLine}></div>
      <div className={styles.headerContent}>
        <ul>
          <li>
            <a>Futuros</a>
          </li>
          <li>
            <a>Mentoria</a>
          </li>
          <li>
            <a>Privacidade</a>
          </li>
          <li>
            <a>Contato</a>
          </li>
        </ul>
        <div className={styles.headerRight}>
          <span className={styles.profileName}>Olá, Gustavo Nigre</span>
          <div className={styles.profileIcon}>
            <img src="/new-page/profile.png" alt="Profile" />
          </div>

          <div
            className={styles.hamburgerMenu}
            role="button"
            aria-label="Abrir menu"
            tabIndex={0}
          >
            <LogoutIcon className={styles.hamburgerIcon} />
          </div>
        </div>
      </div>
    </div>
  );
}
