import Header from "../../components/Layout/Header";
import SidebarNav from "../../components/Layout/SidebarNav";
import { ReactNode } from "react";
import styles from "./styles.module.scss";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.container}>
      <Header />
      <SidebarNav />
      {children}
    </div>
  );
}
