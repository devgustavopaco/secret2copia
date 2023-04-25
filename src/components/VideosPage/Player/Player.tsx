import { Videos } from "@prisma/client";
import { DefaultUi, Player, Youtube } from "@vime/react";
import styles from "./styles.module.scss";
// Default theme. ~960B
import "@vime/core/themes/default.css";

// Optional light theme (extends default). ~400B
import "@vime/core/themes/light.css";

export interface PlayerProps {
  aula: Videos;
}

export const PlayerComponent = ({ aula }: PlayerProps) => {
  let videoId = aula.idYoutube;

  return (
    <div className={styles.videoStyle}>
      <Player theme="dark" autoplay>
        <Youtube videoId={videoId} />

        <DefaultUi />
      </Player>
    </div>
  );
};
