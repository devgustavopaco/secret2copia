import type { NextPage } from 'next'
import Head from 'next/head'
import { OperationCard } from '../components/OperationCard'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import styles from '../styles/Monitor.module.scss'
import { trpc } from '../utils/trpc'
import { CoinNotFound } from '../components/CoinNotFound'
import { useCallback, useState } from 'react'

interface SelectedExchanges {
  name: string
  buy: boolean
  sell: boolean
}

const Monitoring: NextPage = () => {
  const [buyExchanges, setBuyExchanges] = useState<string[]>([])
  const [sellExchanges, setSellExchanges] = useState<string[]>([])

  const { data } = trpc.useQuery(
    [
      'orderBook.getAll',
      {
        buyExchanges,
        sellExchanges,
      },
    ],
    {
      refetchInterval: 30 * 1000,
    }
  )

  const operationsCount = data?.length || 0

  const onSelectBuyExchange = useCallback((exchange: string) => {
    setBuyExchanges((exchanges) => {
      const newExchanges = [...exchanges]
      const i = newExchanges.indexOf(exchange)
      if (i === -1) {
        newExchanges.push(exchange)
      } else {
        newExchanges.splice(i, 1)
      }

      return newExchanges
    })
  }, [])

  const onSelectSellExchange = useCallback((exchange: string) => {
    setSellExchanges((exchanges) => {
      const newExchanges = [...exchanges]
      const i = newExchanges.indexOf(exchange)
      if (i === -1) {
        newExchanges.push(exchange)
      } else {
        newExchanges.splice(i, 1)
      }

      return newExchanges
    })
  }, [])

  return (
    <>
      <Head>
        <title>Monitoramento de Operações</title>
        <meta name="description" content="Monitoramento de Operações" />
      </Head>
      <div>
        <Header />
        <div className={`${styles.content} container`}>
          <Sidebar
            onSelectBuyExchange={onSelectBuyExchange}
            onSelectSellExchange={onSelectSellExchange}
          />

          <main>
            <h1>Operações</h1>

            {operationsCount === 0 ? (
              <div className={styles.notFound}>
                <CoinNotFound />
                <div>
                  <h2>Nenhuma oportunidade de operação foi encontrada!</h2>
                  <p>
                    Altere seus filtros de busca para realizar uma nova pesquisa
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.operations}>
                {data?.map(
                  (operation) =>
                    operation && (
                      <OperationCard
                        coin={{
                          image: '/Ethereum.png',
                          name: operation.coin,
                          ask: {
                            exchange: operation.lowestAsk.exchange,
                            price: operation.lowestAsk.price,
                          },
                          bid: {
                            exchange: operation.highestBid.exchange,
                            price: operation.highestBid.price,
                          },
                          symbol: operation.ticker,
                        }}
                        onClick={() => {}}
                      />
                    )
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

export default Monitoring
