import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { OperationCard } from '../components/OperationCard'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import styles from '../styles/Monitor.module.scss'
import { trpc } from '../utils/trpc'
import { useCallback, useEffect, useState } from 'react'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { ModalOrderBook } from '../components/Modals/ModalOrderBook'
import { ArbitrageOpportunity } from '../server/router/orderbook'

import { BeatLoader, PacmanLoader } from 'react-spinners'
import { BuyExchangeMobile } from '../components/Mobile/BuyExchangeMobile'
import { SellExchangeMobile } from '../components/Mobile/SellExchangeMobile'

interface exchangesType {
  value: string
  label: string
}

const defaultExchanges: exchangesType[] = [
  { value: 'Binance', label: 'Binance' },
  { value: 'Bitso', label: 'Bitso' },
  { value: 'BrasilBitcoin', label: 'BrasilBitcoin' },
  { value: 'BitcoinTrade', label: 'BitcoinTrade' },
  { value: 'Coinbase', label: 'Coinbase' },
  { value: 'Chiliz', label: 'Chiliz' },
  { value: 'Coinext', label: 'Coinext' },
  { value: 'Crypto.com', label: 'Crypto.com' },
  { value: 'FTX', label: 'FTX' },
  { value: 'Gemini', label: 'Gemini' },
  { value: 'Huobi', label: 'Huobi' },
  { value: 'Kraken', label: 'Kraken' },
  { value: 'KuCoin', label: 'KuCoin' },
  { value: 'NovaDAX', label: 'NovaDAX' },
  { value: 'Mercado Bitcoin', label: 'Mercado Bitcoin' },
  { value: 'HitBTC', label: 'HitBTC' },
  { value: 'Bitfinex', label: 'Bitfinex' },
  { value: 'HotBit', label: 'HotBit' },
]

const Monitoring: NextPage = () => {
  const [modalOpenOrderBook, setModalOpenOrderBook] = useState(false)

  const [buyExchanges, setBuyExchanges] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedExchanges = localStorage.getItem('buyExchanges')
      const initialValue = savedExchanges
        ? JSON.parse(savedExchanges)
        : defaultExchanges
      return initialValue
    }

    return defaultExchanges
  })

  const [sellExchanges, setSellExchanges] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedExchanges = localStorage.getItem('sellExchanges')
      const initialValue = savedExchanges
        ? JSON.parse(savedExchanges)
        : defaultExchanges
      return initialValue
    }

    return defaultExchanges
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
    }
  )

  const { data: dollarPrice } = trpc.useQuery(['orderBook.getDollar'])
  useEffect(() => {
    if (data?.length === 0) {
      refetch()
    }
  }, [data, refetch])

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
    (completeExchanges: readonly exchangesType[] | undefined) => {
      if (completeExchanges !== undefined) {
        let exchangeValue = completeExchanges.map((x) => x.value)
        exchangeValue.forEach((value) => {
          setBuyExchanges((exchanges) => {
            const newExchanges = [...exchanges]
            const i = newExchanges.indexOf(value)
            if (i === -1) {
              newExchanges.push(value)
            } else {
              newExchanges.splice(i, 1)
            }

            return newExchanges
          })
        })
      }
    },
    []
  )

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

  // Mobile
  const onSelectSellExchangeMobile = useCallback(
    (completeExchanges: readonly exchangesType[] | undefined) => {
      if (completeExchanges !== undefined) {
        let exchangeValue = completeExchanges.map((x) => x.value)
        exchangeValue.forEach((value) => {
          setSellExchanges((exchanges) => {
            const newExchanges = [...exchanges]
            const i = newExchanges.indexOf(value)
            if (i === -1) {
              newExchanges.push(value)
            } else {
              newExchanges.splice(i, 1)
            }

            return newExchanges
          })
        })
      }
    },
    []
  )

  const sortedOperations = data?.sort((a, b) => {
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

  return (
    <>
      <Head>
        <title>Monitoramento de Operações</title>
        <meta name="description" content="Monitoramento de Operações" />
      </Head>
      <div>
        <Header />
        <div className={styles.mobileFilter}>
          <span>Exchanges Compra</span>
          <BuyExchangeMobile
            defaultExchanges={defaultExchanges}
            onSelectBuyExchangeMobile={onSelectBuyExchangeMobile}
          />
        </div>
        <div className={styles.mobileFilter}>
          <span>Exchanges Venda</span>
          <SellExchangeMobile
            defaultExchanges={defaultExchanges}
            onSelectSellExchangeMobile={onSelectSellExchangeMobile}
          />
        </div>
        {modalOpenOrderBook && (
          <ModalOrderBook
            orderbookBid={selectedOperation.highestBid}
            orderbookAsk={selectedOperation.lowestAsk}
            setOpenModal={setModalOpenOrderBook}
            dollarPrice={dollarPrice ?? 0}
          />
        )}

        <div className={`${styles.content} container`}>
          <Sidebar
            dollarPrice={dollarPrice}
            defaultExchanges={defaultExchanges}
            buyExchanges={buyExchanges}
            sellExchanges={sellExchanges}
            onSelectBuyExchange={onSelectBuyExchange}
            onSelectSellExchange={onSelectSellExchange}
          />
          <main>
            <h1>
              Operações
              {isFetching && <BeatLoader color="#969696" size="0.5rem" />}
            </h1>

            {isLoading ? (
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
