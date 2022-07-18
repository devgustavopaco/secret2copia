import type { NextPage } from 'next'
import Head from 'next/head'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import styles from '../styles/Monitor.module.scss'

const Monitoring: NextPage = () => {
  return (
    <>
      <Head>
        <title>Monitoramento de Operações</title>
        <meta name="description" content="Monitoramento de Operações" />
      </Head>
      <div>
        <Header />
        <main className={styles.content}>
          <Sidebar />
        </main>
      </div>
    </>
  )
}

export default Monitoring
