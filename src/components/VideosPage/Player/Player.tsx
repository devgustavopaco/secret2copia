import { Player, Video, DefaultUi, LoadingScreen, Vimeo } from '@vime/react'
import { Videos } from '@prisma/client'
import styles from './styles.module.scss'
// Default theme. ~960B
import '@vime/core/themes/default.css'

// Optional light theme (extends default). ~400B
import '@vime/core/themes/light.css'

import { useRouter } from 'next/router'

export interface PlayerProps {
  aula: Partial<Videos>[]
}

export const PlayerComponent = ({ aula }: PlayerProps) => {
  let idYoutube = aula[0]?.idYoutube

  if (idYoutube === undefined) {
    console.log('de cima')
    return (
      <div className={styles.videoStyle}>
        <Player theme="dark" autoplay={true}>
          <LoadingScreen>
            {/* Pass in content here such as a logo (optional). */}
          </LoadingScreen>

          <DefaultUi />
        </Player>
      </div>
    )
  } else {
    console.log('de baixo')
    return (
      <div className={styles.videoStyle}>
        <Player theme="dark">
          <Vimeo videoId={idYoutube} />

          <DefaultUi />
        </Player>
      </div>
    )
  }
}
