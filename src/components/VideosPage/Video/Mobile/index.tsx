import { Videos } from "@prisma/client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { BsDownload } from "react-icons/bs";
import { MobileClassScheduleComponent } from "../../ClassSchedule/Mobile";
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

export function MobileVideoComponent({ aula, data }: videoProps) {
  const additionalMaterial =
    aula.additionalMaterial !== null ? aula.additionalMaterial : "";

  const [toggleState, setToggleState] = useState<"conteudo" | "aulas">(
    "conteudo"
  );
  const [isConteudo, isConteudoState] = useState<boolean>(false);

  const toggleTab = (tab: "conteudo" | "aulas") => {
    setToggleState(tab);
    if (toggleState == "conteudo") {
      isConteudoState(true);
    } else {
      isConteudoState(false);
    }
  };

  return (
    <div className={styles.videoSection}>
      <PlayerComponent aula={aula} />
      <div className={styles.blocTabs}>
        <button
          className={`${styles.tabs} ${
            toggleState === "conteudo" ? "activeConteudo" : ""
          }`}
          onClick={() => toggleTab("conteudo")}
        >
          Visão geral
        </button>
        <button
          className={`${styles.tabs} ${
            toggleState === "aulas" ? "activeAulas" : ""
          }`}
          onClick={() => toggleTab("aulas")}
        >
          Conteúdo do curso
        </button>
      </div>
      {toggleState === "conteudo" ? (
        <>
          <div className={styles.classDescription}>
            <div className={styles.classText}>
              <h2>{aula ? aula.title : ""}</h2>
              <p>
                {aula?.description
                  ? aula.description.split("/n").map((line, index) => (
                      <div key={index}>
                        {line}
                        {index !== aula.description.split("/n").length - 1 && (
                          <>
                            {" "}
                            <br />
                            <br />
                          </>
                        )}
                      </div>
                    ))
                  : ""}
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
        </>
      ) : (
        <MobileClassScheduleComponent data={data} />
      )}
      <div className={styles.footer}>
        <div className={styles.divisor}></div>
        <span>NextGain - Todos os direitos reservados</span>
      </div>
    </div>
  );
}
