import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { OperationCard } from '../components/OperationCard'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import styles from '../styles/Monitor.module.scss'
import { trpc } from '../utils/trpc'
import { CoinNotFound } from '../components/CoinNotFound'
import { useCallback, useEffect, useState } from 'react'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { ModalOrderBook } from '../components/Modals/ModalOrderBook'
import { Orderbook } from '../server/router/orderbook'

const defaultExchanges = [
  'Binance',
  'Bitso',
  'BrasilBitcoin',
  'BitcoinTrade',
  'Coinbase',
  'Chiliz',
  'Coinext',
  'Crypto.com',
  'FTX',
  'Foxbit',
  'Gemini',
  'Huobi',
  'Kraken',
  'KuCoin',
  'NovaDAX',
  'Mercado Bitcoin',
  'HitBTC',
  'Bitfinex',
  'HotBit',
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

  const [selectedOrderbookBid, setSelectedOrderbookBid] = useState<Orderbook>(
    {} as Orderbook
  )
  const [selectedOrderbookSell, setSelectedOrderbookSell] = useState<Orderbook>(
    {} as Orderbook
  )

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

  const { data: dollarPrice } = trpc.useQuery(['orderBook.getDollar'])

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

  const operationsCount = data?.length || 0

  return (
    <>
      <Head>
        <title>Monitoramento de Operações</title>
        <meta name="description" content="Monitoramento de Operações" />
      </Head>
      <div>
        <Header />
        {modalOpenOrderBook && (
          <ModalOrderBook
            orderbookBid={selectedOrderbookBid}
            orderbookSell={selectedOrderbookSell}
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
                        key={operation.coin}
                        coin={{
                          image: '/Ethereum.png',
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
                        }}
                        dollarPrice={dollarPrice}
                        onClick={() => {
                          setSelectedOrderbookSell(
                            operation.lowestAsk.orderbook
                          )
                          setSelectedOrderbookBid(
                            operation.highestBid.orderbook
                          )
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
