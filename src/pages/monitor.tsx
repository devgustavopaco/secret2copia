import type { NextPage } from 'next'
import Head from 'next/head'
import { OperationCard } from '../components/OperationCard'
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
        <div className={`${styles.content} container`}>
          <Sidebar />

          <main>
            <h1>Operações</h1>

            <div className={styles.operations}>
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
              <OperationCard
                coin={{
                  image: '/Ethereum.png',
                  name: 'Ethereum',
                  price: 6627.37,
                  symbol: 'ETH',
                }}
                onClick={() => {}}
              />
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Monitoring
