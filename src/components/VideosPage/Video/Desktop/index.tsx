import { Videos } from "@prisma/client";
import dynamic from "next/dynamic";
import { CaretRight, FileArrowDown, WhatsappLogo } from "phosphor-react";
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
          <p>{aula ? aula.description : ""}</p>
        </div>
        <div className={styles.btnList}>
          <a
            target="_blank"
            href="https://api.whatsapp.com/send?phone=5511973592971&text=Fala%20Gu%2C%20preciso%20de%20suporte!%20"
            rel="noopener noreferrer"
          >
            <button className={styles.discordBtn}>
              <WhatsappLogo size={22} />
              FALE COM O SUPORTE
            </button>
          </a>
        </div>
      </div>
      <div className={styles.creatorDescription}>
        <img src="/images/Users/NigreCliente.jpg" className={styles.nigreImg} />
        <div className={styles.creatorName}>
          <h2>José Nigre</h2>
          <span>Fundador e CEO na NextGain</span>
        </div>
      </div>
      <div className={styles.additionalMaterial}>
        <div className={styles.material}>
          <div className={styles.iconBackground}>
            <FileArrowDown size={32} />
          </div>
          <a
            target="_blank"
            href={additionalMaterial}
            rel="noopener noreferrer"
          >
            <div className={styles.materialText}>
              <div className={styles.text}>
                <h2>Material complementar</h2>
                <span>
                  Acesse o material complementar para acelerar o seu
                  desenvolvimento
                </span>
              </div>
              <CaretRight size={32} />
            </div>
          </a>
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.divisor}></div>
        <span>NextGain - Todos os direitos reservados</span>
      </div>
    </div>
  );
}
