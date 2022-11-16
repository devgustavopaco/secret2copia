import { Videos } from '@prisma/client'
import type { NextPage } from 'next'
import Head from 'next/head'
import { BeatLoader } from 'react-spinners'
import { Header } from '../../components/Header'
import { DesktopClassScheduleComponent } from '../../components/VideosPage/ClassSchedule/Desktop'
import { VideoComponent } from '../../components/VideosPage/Video'
import styles from '../../styles/Videos.module.scss'
import { trpc } from '../../utils/trpc'

const Videos: NextPage = () => {
  const { data: videos } = trpc.useQuery(['videos.getVideos'], {
    ssr: true,
    context: {
      skipBatch: true,
    },
  })

  const firstClass = videos ? videos[0] : ({} as Videos)

  return (
    <>
      <Head>
        <title>Treinamento - NEXTGAIN</title>
        <meta name="description" content="Treinamento - NEXTGAIN" />
      </Head>
      <Header />
      <section className={styles.container}>
        {firstClass ? (
          <VideoComponent aula={firstClass} data={videos || []} />
        ) : (
          <BeatLoader color="#969696" size="0.5rem" />
        )}
        <DesktopClassScheduleComponent data={videos || []} />
      </section>
    </>
  )
}

export default Videos
