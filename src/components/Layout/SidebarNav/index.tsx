import ExchangesIcon from "../../../icons/ExchangesIcon";
import HomeIcon from "../../../icons/HomeIcon";
import MoneyIcon from "../../../icons/MoneyIcon";
import MonitorIcon from "../../../icons/MonitorIcon";
import PeopleIcon from "../../../icons/PeopleIcon";
import PersonIcon from "../../../icons/PersonIcon";
import TaxIcon from "../../../icons/TaxIcon";
import VideoIcon from "../../../icons/VideoIcon";
import LogoutIcon from "../../../icons/LogoutIcon";
import NextGainIcon from "../../../icons/NextGainIcon";
import Link from "next/link";
import styles from "./styles.module.scss";
import { useRouter } from "next/router";
import CryptoIcon from "../../../icons/CryptoIcon";

const buttons = [
  {
    icon: <NextGainIcon />,
    isLogo: true,
  },
  {
    icon: <HomeIcon />,
    label: "Vendas",
    href: "/admin/Newdashboard/dashboard",
    isActive: true,
  },

  {
    icon: <PeopleIcon />,
    label: "Usuários",
    href: "/admin/Newdashboard/users",
    isActive: true,
  },
  {
    icon: <ExchangesIcon />,
    label: "Exchanges",
    href: "/admin/Newdashboard/exchanges",
    isActive: true,
  },
  {
    icon: <TaxIcon />,
    label: "Taxas",
    href: "/admin/Newdashboard/tax",
    isActive: true,
  },
  {
    icon: <CryptoIcon />,
    label: "Cryptos",
    href: "/admin/Newdashboard/crypto",
    isActive: true,
  },
  {
    icon: <VideoIcon />,
    label: "Vídeos",
    href: "/admin/Newdashboard/videos",
    isActive: true,
  },

  {
    icon: <LogoutIcon />,
    label: "Voltar para home",
    href: "/",
    flipped: true,
  },
];

const SidebarNav = () => {
  const router = useRouter();

  return (
    <nav className={styles.sidebarNav} role="navigation" aria-label="Primary">
      <ul className={styles["navbar-nav"]}>
        {buttons.map((button, index) => {
          const destination = button.href ?? "#";
          const isActive = router.pathname === button.href;
          const isLogoutButton = button.label === "Encerrar sessão";

          return (
            <li
              key={index}
              className={`${button.isLogo ? styles.logo : styles["nav-item"]} ${
                isActive ? styles.active : ""
              }`}
            >
              {isLogoutButton ? (
                <a className={styles["nav-link"]}>
                  <div className={styles["icon-wrapper"]}>{button.icon}</div>
                  <span className={styles["link-text"]}>{button.label}</span>
                </a>
              ) : (
                // Encapsule os elementos filhos dentro de uma única tag <a>
                <Link href={destination}>
                  <a className={styles["nav-link"]}>
                    <div className={styles["icon-wrapper"]}>{button.icon}</div>
                    <span className={styles["link-text"]}>{button.label}</span>
                  </a>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SidebarNav;
