import type { NextPage } from 'next'
import Head from 'next/head'
import { Header } from '../../components/Header'
import styles from '../../styles/Videos.module.scss'
import { VideoComponent } from '../../components/VideosPage/Video'
import { ClassScheduleComponent } from '../../components/VideosPage/ClassSchedule'
import { trpc } from '../../utils/trpc'

const Videos: NextPage = () => {
  const { data: videos } = trpc.useQuery(['videos.getVideos'])

  return (
    <>
      <Head>
        <title>Curso de arbitragem</title>
        <meta name="description" content="Curso de arbitragem" />
      </Head>
      <Header />
      <section className={styles.container}>
        <VideoComponent aula={videos || []} />
        <ClassScheduleComponent data={videos || []} />
      </section>
    </>
  )
}

export default Videos
