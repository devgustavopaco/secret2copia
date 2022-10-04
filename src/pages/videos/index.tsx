import type { NextPage } from 'next'
import Head from 'next/head'
import { Header } from '../../components/Header'
import styles from '../../styles/Videos.module.scss'
import { VideoComponent } from '../../components/VideosPage/Video'
import { ClassScheduleComponent } from '../../components/VideosPage/ClassSchedule'
import { trpc } from '../../utils/trpc'
import { Videos } from '@prisma/client'

const Videos: NextPage = () => {
  const { data: videos } = trpc.useQuery(['videos.getVideos'])

  const firstClass = videos ? videos[0] : ({} as Videos)

  return (
    <>
      <Head>
        <title>Curso de arbitragem</title>
        <meta name="description" content="Curso de arbitragem" />
      </Head>
      <Header />
      <section className={styles.container}>
        <VideoComponent aula={firstClass} />
        <ClassScheduleComponent data={videos || []} />
      </section>
    </>
  )
}

export default Videos
