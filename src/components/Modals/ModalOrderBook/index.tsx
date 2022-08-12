import styles from './styles.module.scss'
import { X } from 'phosphor-react'
import { useState } from 'react'
import { DataGridBid } from '../../GridComponents/DataGridBid'
import { DataGridSell } from '../../GridComponents/DataGridSell'
import type { Orderbook } from '../../../server/router/orderbook'

interface ModalOrderBookProps {
  dollarPrice: number
  orderbookBid: Orderbook
  orderbookSell: Orderbook
  setOpenModal: (open: boolean) => void
}

export function ModalOrderBook({
  dollarPrice,
  orderbookBid,
  orderbookSell,
  setOpenModal,
}: ModalOrderBookProps) {
  const [toggleState, setToggleState] = useState(1)

  const toggleTab = (index: any) => {
    setToggleState(index)
  }

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        {/* Começar aqui */}

        <div className={styles.container}>
          <div className={styles.blocTabs}>
            <button
              className={
                toggleState === 1
                  ? styles.tabs + ' ' + styles.activeTabs
                  : styles.tabs
              }
              onClick={() => toggleTab(1)}
            >
              Compra
            </button>
            <button
              className={
                toggleState === 2
                  ? styles.tabs + ' ' + styles.activeTabs
                  : styles.tabs
              }
              onClick={() => toggleTab(2)}
            >
              Venda
            </button>
          </div>

          <div className={styles.contentTabs}>
            <DataGridBid
              data={toggleState === 1 ? orderbookSell.bids : orderbookBid.asks}
              dollarPrice={dollarPrice}
            />
          </div>
        </div>

        {/* Terminar Aqui */}

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
