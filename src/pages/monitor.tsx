import type { GetServerSideProps, NextPage } from 'next'
import { unstable_getServerSession } from 'next-auth'
import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { ModalOrderBook } from '../components/Modals/ModalOrderBook'
import { OperationCard } from '../components/OperationCard'
import { Sidebar } from '../components/Sidebar'
import { ArbitrageOpportunity } from '../server/router/orderbook'
import styles from '../styles/Monitor.module.scss'
import { trpc } from '../utils/trpc'
import { authOptions } from './api/auth/[...nextauth]'

import { Exchange } from '@prisma/client'
import { BeatLoader, PacmanLoader } from 'react-spinners'
import { BuyExchangeMobile } from '../components/Mobile/BuyExchangeMobile'
import { SellExchangeMobile } from '../components/Mobile/SellExchangeMobile'

const Monitoring: NextPage = () => {
  const [modalOpenOrderBook, setModalOpenOrderBook] = useState(false)

  const { data: ActiveExchanges, isLoading: isLoadingExchanges } =
    trpc.useQuery(['exchange.getActiveExchanges'], { ssr: true })

  const [buyExchanges, setBuyExchanges] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      console.log(localStorage.getItem('buyExchanges'))
      const savedExchanges = localStorage.getItem('buyExchanges')
      const initialValue = savedExchanges
        ? JSON.parse(savedExchanges ? savedExchanges : '')
        : ''
      return initialValue
    }

    return ActiveExchanges
  })

  const [sellExchanges, setSellExchanges] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedExchanges = localStorage.getItem('sellExchanges')
      const initialValue = savedExchanges
        ? JSON.parse(savedExchanges ? savedExchanges : '')
        : ''
      return initialValue
    }

    return ActiveExchanges
  })

  const [selectedOperation, setSelectedOperation] =
    useState<ArbitrageOpportunity>({} as ArbitrageOpportunity)

  const { refetch, data, isLoading, isFetching } = trpc.useQuery(
    [
      'orderBook.getAll',
      {
        buyExchanges,
        sellExchanges,
      },
    ],
    {
      refetchInterval: 30 * 1000,
      retry(failureCount, error) {
        if (failureCount > 3) {
          return false
        }
        return true
      },
      keepPreviousData: true,
      onSuccess(data) {
        if (data?.length === 0 && !isFetching) {
          refetch()
        }
      },
      onError(error) {
        if (!isFetching) {
          refetch()
        }
      },
    }
  )

  const { data: dollarPrice } = trpc.useQuery(['orderBook.getDollar'], {
    refetchInterval: 19 * 1000,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('buyExchanges', JSON.stringify(buyExchanges))
    }
  }, [buyExchanges])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sellExchanges', JSON.stringify(sellExchanges))
    }
  }, [sellExchanges])

  const onSelectBuyExchange = useCallback((exchange: string) => {
    setBuyExchanges((exchanges) => {
      if (exchanges === undefined) exchanges = []
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

  // Mobile
  const onSelectBuyExchangeMobile = useCallback(
    (selectedExchanges: readonly Exchange[]) => {
      if (selectedExchanges !== undefined) {
        const selectedExchangesNames = selectedExchanges.map(
          (exchange) => exchange.name
        )
        setBuyExchanges(selectedExchangesNames)
      }
    },
    []
  )

  const onSelectSellExchange = useCallback((exchange: string) => {
    setSellExchanges((exchanges) => {
      if (exchanges === undefined) exchanges = []
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

  // Mobile
  const onSelectSellExchangeMobile = useCallback(
    (selectedExchanges: readonly Exchange[]) => {
      if (selectedExchanges !== undefined) {
        const selectedExchangesNames = selectedExchanges.map(
          (exchange) => exchange.name
        )
        setSellExchanges(selectedExchangesNames)
      }
    },
    []
  )

  const sortedOperations = data
    ?.sort((a, b) => {
      if (a && b) {
        if (a?.spread < b?.spread) {
          return 1
        }
        if (a?.spread > b?.spread) {
          return -1
        }
        return 0
      }
      return 0
    })
    .filter((operation) => {
      if (operation) {
        return operation.spread > 0
      }
      return false
    })

  return (
    <>
      <Head>
        <title>Monitor - NEXTGAIN</title>
        <meta name="description" content="Monitor - NEXTGAIN" />
      </Head>
      <div>
        <Header />
        <div className={styles.mobileFilter}>
          <span>Exchanges Compra</span>
          <BuyExchangeMobile
            defaultExchanges={ActiveExchanges || []}
            selectedExchanges={buyExchanges || []}
            onSelectBuyExchangeMobile={onSelectBuyExchangeMobile}
            isLoading={isLoading}
          />
        </div>
        <div className={styles.mobileFilter}>
          <span>Exchanges Venda</span>
          <SellExchangeMobile
            defaultExchanges={ActiveExchanges || []}
            selectedExchanges={sellExchanges || []}
            onSelectSellExchangeMobile={onSelectSellExchangeMobile}
            isLoading={isLoading}
          />
        </div>
        <>
          {modalOpenOrderBook && (
            <ModalOrderBook
              symbol={selectedOperation.ticker}
              orderbookBid={selectedOperation.highestBid}
              orderbookAsk={selectedOperation.lowestAsk}
              buyWhere={selectedOperation.highestBid.image_url}
              sellWhere={selectedOperation.lowestAsk.image_url}
              buyEchangeName={selectedOperation.highestBid.exchange}
              sellEchangeName={selectedOperation.lowestAsk.exchange}
              coin={selectedOperation.coin}
              coinImage={selectedOperation.coinImage}
              setOpenModal={setModalOpenOrderBook}
              dollarPrice={dollarPrice ?? 0}
            />
          )}
        </>

        <div className={`${styles.content} container`}>
          <Sidebar
            dollarPrice={dollarPrice}
            defaultExchanges={ActiveExchanges || []}
            buyExchanges={buyExchanges || []}
            sellExchanges={sellExchanges || []}
            onSelectBuyExchange={onSelectBuyExchange}
            onSelectSellExchange={onSelectSellExchange}
          />
          <main>
            <h1>
              Operações
              {isFetching && <BeatLoader color="#969696" size="0.5rem" />}
            </h1>

            {isLoading || data?.length === 0 ? (
              <div className={styles.loading}>
                <PacmanLoader color="#957dff" size="4rem" />
              </div>
            ) : (
              <div className={styles.operations}>
                {sortedOperations?.map(
                  (operation) =>
                    operation && (
                      <OperationCard
                        key={operation.coin}
                        coin={{
                          image: operation.coinImage,
                          name: operation.coin,
                          ask: {
                            exchange: operation.lowestAsk.exchange,
                            image_url: operation.lowestAsk.image_url,
                            price: operation.lowestAsk.price,
                            isUSD: operation.lowestAsk.isUSD,
                          },
                          bid: {
                            exchange: operation.highestBid.exchange,
                            image_url: operation.highestBid.image_url,
                            price: operation.highestBid.price,
                            isUSD: operation.highestBid.isUSD,
                          },
                          fee: operation.fee,
                          tax: operation.tax,
                          symbol: operation.ticker,
                          spread: operation.spread,
                        }}
                        dollarPrice={dollarPrice}
                        onClick={() => {
                          setSelectedOperation(operation)
                          // console.log(sortedOperations)
                          setModalOpenOrderBook(true)
                        }}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: true,
      },
    }
  }

  return {
    props: {},
  }
}
