import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { BeatLoader } from 'react-spinners'

import { Header } from '../../components/Header'
import { DesktopClassScheduleComponent } from '../../components/VideosPage/ClassSchedule/Desktop'
import { VideoComponent } from '../../components/VideosPage/Video'
import styles from '../../styles/SingleVideo.module.scss'
import { trpc } from '../../utils/trpc'

const VideoPage: NextPage = () => {
  const router = useRouter()
  //pegando o id do youtube

  let { id } = router.query as { id: string }

  const { data: singleVideo } = trpc.useQuery(['videos.getVideoById', { id }])

  const { data: aulas } = trpc.useQuery(['videos.getVideos'])

  return (
    <>
      <Head>
        <title>Curso de arbitragem</title>
        <meta name="description" content="Curso de arbitragem" />
      </Head>
      <Header />
      <section className={styles.container}>
        {singleVideo ? (
          <VideoComponent aula={singleVideo} data={aulas || []} />
        ) : (
          <BeatLoader color="#969696" size="0.5rem" />
        )}
        <DesktopClassScheduleComponent data={aulas || []} />
      </section>
    </>
  )
}

export default VideoPage
