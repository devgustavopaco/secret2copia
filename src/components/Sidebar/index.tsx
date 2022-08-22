import { BeatLoader } from 'react-spinners'
import styles from './styles.module.scss'

interface exchangesType {
  value: string
  label: string
}

interface SidebarProps {
  dollarPrice?: number
  defaultExchanges: exchangesType[]
  buyExchanges: string[]
  sellExchanges: string[]
  onSelectBuyExchange: (exchange: string) => void
  onSelectSellExchange: (exchange: string) => void
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'decimal',
  maximumFractionDigits: 3,
})

export function Sidebar({
  dollarPrice,
  defaultExchanges,
  buyExchanges,
  sellExchanges,
  onSelectBuyExchange,
  onSelectSellExchange,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <h2>Filtros</h2>

      <section className={styles['text-section']}>
        <legend>Cotação Dólar</legend>
        <p>
          {dollarPrice ? (
            <>
              <span>R$</span> {numberFormatter.format(dollarPrice ?? -1)}
            </>
          ) : (
            <BeatLoader color="#969696" size="0.5rem" />
          )}
        </p>
      </section>

      <section className={styles['filter-section']}>
        <legend>Exchanges Compra</legend>

        <div className={styles['filter-options']}>
          {defaultExchanges.map((exchange) => (
            <label key={exchange.value}>
              <>
                <input
                  type="checkbox"
                  checked={buyExchanges.includes(exchange.value)}
                  onChange={() => {
                    onSelectBuyExchange(exchange.value)
                  }}
                />
                {exchange.value}
              </>
            </label>
          ))}
        </div>
      </section>
      <section className={styles['filter-section']}>
        <legend>Exchanges Venda</legend>

        <div className={styles['filter-options']}>
          {defaultExchanges.map((exchange) => (
            <label key={exchange.value}>
              <>
                <input
                  type="checkbox"
                  checked={sellExchanges.includes(exchange.value)}
                  onChange={() => {
                    onSelectSellExchange(exchange.value)
                  }}
                />
                {exchange.value}
              </>
            </label>
          ))}
        </div>
      </section>
    </aside>
  )
}
