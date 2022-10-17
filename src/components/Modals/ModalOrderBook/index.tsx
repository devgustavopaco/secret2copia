import { useState } from 'react'
import type { Orderbook } from '../../../server/router/orderbook'
import { DataGridOrderbook } from '../../GridComponents/DataGridOrderbook'
import styles from './styles.module.scss'

interface ModalOrderBookProps {
  coin: string | undefined

  coinImage: string | undefined
  buyWhere: string | undefined
  buyEchangeName: string
  sellEchangeName: string
  sellWhere: string | undefined
  dollarPrice: number
  orderbookBid: {
    isUSD: boolean
    orderbook: Orderbook
  }
  orderbookAsk: {
    isUSD: boolean
    orderbook: Orderbook
  }
  setOpenModal: (open: boolean) => void
}

export function ModalOrderBook({
  dollarPrice,
  orderbookBid,
  orderbookAsk,
  buyWhere,
  coinImage,
  sellWhere,
  buyEchangeName,
  sellEchangeName,
  coin,
  setOpenModal,
}: ModalOrderBookProps) {
  const [toggleState, setToggleState] = useState<'compra' | 'venda'>('compra')
  const [isPurchase, isPurchaseState] = useState<boolean>(false)

  const toggleTab = (tab: 'compra' | 'venda') => {
    setToggleState(tab)
    if (toggleState == 'compra') {
      isPurchaseState(true)
    } else {
      isPurchaseState(false)
    }
  }

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        <div className={styles.container}>
          <div className={styles.blocTabs}>
            <button
              className={`${styles.tabs} ${
                toggleState === 'compra' ? 'activeCompra' : ''
              }`}
              onClick={() => toggleTab('compra')}
            >
              Compra
            </button>
            <button
              className={`${styles.tabs} ${
                toggleState === 'venda' ? 'activeVenda' : ''
              }`}
              onClick={() => toggleTab('venda')}
            >
              Venda
            </button>
          </div>
          <div className={styles.buyAndSell}>
            <img src={`${coinImage}`} />
            <p>{coin}</p>
            <span>|</span>
            <p>{toggleState === 'compra' ? sellEchangeName : buyEchangeName}</p>
            <img src={`${toggleState === 'compra' ? sellWhere : buyWhere}`} />
          </div>

          <div className={styles.contentTabs}>
            <DataGridOrderbook
              data={
                toggleState === 'compra'
                  ? orderbookAsk.orderbook.asks
                  : orderbookBid.orderbook.bids
              }
              dollarPrice={dollarPrice}
              isUSD={
                toggleState === 'compra'
                  ? orderbookAsk.isUSD
                  : orderbookBid.isUSD
              }
              isPurchase={isPurchase}
            />
          </div>
        </div>

        <footer className={styles.footer}>
          <button
            className={styles.voltarBtn}
            onClick={() => {
              setOpenModal(false)
            }}
            type="button"
          >
            OK
          </button>
        </footer>
      </div>
    </div>
  )
}
