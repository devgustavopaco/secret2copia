import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { Header } from '../../components/Header'
import { ClassScheduleComponent } from '../../components/VideosPage/ClassSchedule'
import { VideoComponent } from '../../components/VideosPage/Video'
import styles from '../../styles/SingleVideo.module.scss'
import { trpc } from '../../utils/trpc'

const Videos: NextPage = () => {
  const router = useRouter()
  //pegando o id do youtube

  let { id } = router.query

  console.log('ROUTER', id)

  if (id === undefined) id = ''

  const {
    data: singleVideo,
    refetch,
    isFetching,
  } = trpc.useQuery(['videos.getVideoById', { id: id.toString() }])

  const aula = singleVideo?.filter((aula) => aula.id === id)

  const { data: aulas } = trpc.useQuery(['videos.getVideos'], {
    refetchInterval: 10 * 1000,
  })

  return (
    <>
      <Head>
        <title>Curso de arbitragem</title>
        <meta name="description" content="Curso de arbitragem" />
      </Head>
      <Header />
      <section className={styles.container}>
        <VideoComponent aula={aula || []} />
        <ClassScheduleComponent data={aulas || []} />
      </section>
    </>
  )
}

export default Videos
