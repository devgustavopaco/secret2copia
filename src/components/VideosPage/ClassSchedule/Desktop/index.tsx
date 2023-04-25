import { Videos } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle } from "phosphor-react";
import styles from "./styles.module.scss";

interface videoProps {
  data: Videos[];
}

export function DesktopClassScheduleComponent({ data }: videoProps) {
  const router = useRouter();

  const { id } = router.query as { id: string };

  return (
    <div className={styles.cronogramaSection}>
      <h2>Cronograma de Aulas</h2>
      <div className={styles.divisor}></div>
      <div className={styles.content}>
        {data.map((item, index) => (
          <Link href={`/videos/${encodeURIComponent(item.id)}`} key={item.id}>
            <a>
              <div className={styles.classContainer}>
                {/* <span className={styles.date}>
                  {item.createdAt?.toString()}
                </span>
                + */}
                <div
                  className={
                    id == item.id
                      ? `${styles.classRoomSection} active`
                      : styles.classRoomSection
                  }
                >
                  <div className={styles.classRoom}>
                    <div className={styles.classRoomContent}>
                      <div className={styles.content}>
                        <CheckCircle size={18} />
                        <span>Conteúdo liberado</span>
                      </div>
                      <h6 className={styles.liveText}>AULA PRÁTICA</h6>
                    </div>
                  </div>
                  <span className={styles.className}>
                    <strong>Aula 0{index + 1}</strong> - {item.title}
                  </span>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
