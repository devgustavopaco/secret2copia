import type { NextPage } from 'next'
import Head from 'next/head'
import { OperationCard } from '../components/OperationCard'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import styles from '../styles/Monitor.module.scss'
import { trpc } from '../utils/trpc'

const Monitoring: NextPage = () => {
  const { data } = trpc.useQuery(['orderBook.getAll'], {
    refetchInterval: 30 * 1000,
  })

  return (
    <>
      <Head>
        <title>Monitoramento de Operações</title>
        <meta name="description" content="Monitoramento de Operações" />
      </Head>
      <div>
        <Header />
        <div className={`${styles.content} container`}>
          <Sidebar />

          <main>
            <h1>Operações</h1>

            <div className={styles.operations}>
              {data && (
                <OperationCard
                  coin={{
                    image: '/Ethereum.png',
                    name: data.coin,
                    ask: {
                      exchange: data.lowestAsk.exchange,
                      price: data.lowestAsk.price,
                    },
                    bid: {
                      exchange: data.highestBid.exchange,
                      price: data.highestBid.price,
                    },
                    symbol: 'ETH',
                  }}
                  onClick={() => {}}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Monitoring
