import { Videos } from "@prisma/client";
import dynamic from "next/dynamic";
import { BsDownload } from "react-icons/bs";
import { PlayerProps } from "../../Player/Player";
import styles from "./styles.module.scss";

const PlayerComponent = dynamic<PlayerProps>(
  () => import("../../Player/Player").then((module) => module.PlayerComponent),
  {
    ssr: false,
  }
);

interface videoProps {
  aula: Videos;

  data: Videos[];
}

export function DesktopVideoComponent({ aula, data }: videoProps) {
  const additionalMaterial =
    aula.additionalMaterial !== null ? aula.additionalMaterial : "";

  return (
    <div className={styles.videoSection}>
      <PlayerComponent aula={aula} />
      <div className={styles.classDescription}>
        <div className={styles.classText}>
          <h2>{aula ? aula.title : ""}</h2>
          <p>
            {aula &&
              aula.description.split("/n").map((line, index) => (
                <>
                  {line}
                  {index !== aula.description.split("/n").length - 1 && (
                    <>
                      <br />
                      <br />
                    </>
                  )}
                </>
              ))}
          </p>
        </div>
      </div>
      <div className={styles.additionalMaterial}>
        <div className={styles.material}>
          <div className={styles.iconBackground}>
            <BsDownload size={32} />
          </div>
          <a
            target="_blank"
            href={additionalMaterial}
            rel="noopener noreferrer"
          >
            <div className={styles.materialText}>
              <div className={styles.text}>
                <h2>Material complementar</h2>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
