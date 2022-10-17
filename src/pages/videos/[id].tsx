import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { Header } from '../../components/Header'
import { ClassScheduleComponent } from '../../components/VideosPage/ClassSchedule'
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
        <VideoComponent aula={singleVideo ? singleVideo : undefined} />
        <ClassScheduleComponent data={aulas || []} />
      </section>
    </>
  )
}

export default VideoPage
