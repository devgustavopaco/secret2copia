import { Exchange } from '@prisma/client'
import { BeatLoader } from 'react-spinners'
import styles from './styles.module.scss'

interface SidebarProps {
  dollarPrice?: number
  defaultExchanges: Exchange[]
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
          <>
            {defaultExchanges.length > 0 ? (
              defaultExchanges.map((exchange) => (
                <label key={exchange.name}>
                  <>
                    <input
                      type="checkbox"
                      checked={buyExchanges.includes(exchange.name)}
                      onChange={() => {
                        onSelectBuyExchange(exchange.name)
                      }}
                    />
                    {exchange.name}
                  </>
                </label>
              ))
            ) : (
              <BeatLoader color="#969696" size="0.5rem" />
            )}
          </>
        </div>
      </section>
      <section className={styles['filter-section']}>
        <legend>Exchanges Venda</legend>

        <div className={styles['filter-options']}>
          {defaultExchanges.length > 0 ? (
            defaultExchanges.map((exchange) => (
              <label key={exchange.name}>
                <>
                  <input
                    type="checkbox"
                    checked={sellExchanges.includes(exchange.name)}
                    onChange={() => {
                      onSelectSellExchange(exchange.name)
                    }}
                  />
                  {exchange.name}
                </>
              </label>
            ))
          ) : (
            <BeatLoader color="#969696" size="0.5rem" />
          )}
        </div>
      </section>
    </aside>
  )
}
