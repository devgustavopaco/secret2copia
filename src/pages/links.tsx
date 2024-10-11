import { useRouter } from "next/router";
import TikTok from "../components/Insta";
import Course from "../components/NextGain";
import styles from "../styles/links.module.scss";

export default function Home() {
  const router = useRouter();
  const queryParams = "curso";
  return (
    <>
      <section className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logoSection}>
            <img src="/VectorNG.svg" />
          </div>

          <div className={styles.right}>
            <Course urlParams={queryParams} />
            <TikTok />
          </div>

          <div className={styles.footer}>
            <img src="/VectorNG.svg" />
          </div>
        </div>
      </section>
    </>
  );
}
