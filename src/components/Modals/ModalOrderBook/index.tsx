import styles from './styles.module.scss'
import { useState } from 'react'
import { DataGridOrderbook } from '../../GridComponents/DataGridOrderbook'
import type { Orderbook } from '../../../server/router/orderbook'

interface ModalOrderBookProps {
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
