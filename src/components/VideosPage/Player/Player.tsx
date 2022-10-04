import { Player, Video, DefaultUi, LoadingScreen, Vimeo } from '@vime/react'
import { Videos } from '@prisma/client'
import styles from './styles.module.scss'
// Default theme. ~960B
import '@vime/core/themes/default.css'

// Optional light theme (extends default). ~400B
import '@vime/core/themes/light.css'

import { useRouter } from 'next/router'

export interface PlayerProps {
  aula: Videos
}

export const PlayerComponent = ({ aula }: PlayerProps) => {
  let videoId = aula.idYoutube
  console.log('videoId', videoId)

  return (
    <div className={styles.videoStyle}>
      <Player theme="dark">
        <Vimeo videoId={videoId} />

        <DefaultUi />
      </Player>
    </div>
  )
}
