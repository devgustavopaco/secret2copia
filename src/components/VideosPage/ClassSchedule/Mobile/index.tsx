import { Videos } from "@prisma/client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle } from "phosphor-react";
import styles from "./styles.module.scss";
import { modules } from "../../../../utils/videos";
import { MdKeyboardArrowUp } from "react-icons/md";
import { BsArrowLeft } from "react-icons/bs";

interface videoProps {
  data: Videos[];
}

export function MobileClassScheduleComponent({ data }: videoProps) {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [videoStates, setVideoStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const savedStates = localStorage.getItem("videoStates");
    if (savedStates) {
      setVideoStates(JSON.parse(savedStates));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("videoStates", JSON.stringify(videoStates));
  }, [videoStates]);

  const toggleModule = (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null); // Fecha o módulo se já estiver aberto
    } else {
      setExpandedModule(moduleId); // Abre o módulo se estiver fechado
    }
  };

  const toggleVideoState = (videoId: number) => {
    const videoIdStr = videoId.toString(); // Converte para string
    setVideoStates((prevStates) => ({
      ...prevStates,
      [videoIdStr]: !prevStates[videoIdStr],
    }));
  };

  return (
    <div className={styles.cronogramaSection}>
      <Link href="/mentoria">
        <div className={styles.modules}>
          <BsArrowLeft size={30} />
          <p>Ver todos os módulos</p>
        </div>
      </Link>
      <div className={styles.content}>
        {modules.map((module) => (
          <div key={module.moduleTitle}>
            <div
              className={styles.videoModules}
              onClick={() => toggleModule(module.moduleTitle)}
            >
              <span>{module.moduleTitle}</span>
              <MdKeyboardArrowUp
                size={30}
                className={
                  expandedModule === module.moduleTitle
                    ? styles.iconExpanded
                    : undefined
                }
              />
            </div>
            {expandedModule === module.moduleTitle && (
              <div>
                {module.videos.map((video) => (
                  <Link href={`${video.url}`} key={video.id}>
                    <div className={styles.class}>
                      <label>
                        <input
                          type="checkbox"
                          checked={videoStates[video.id.toString()] || false}
                          onChange={() => toggleVideoState(video.id)}
                        />
                        <img src={video.thumbnail} alt={video.title} />
                        <span>{video.title}</span>
                      </label>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
