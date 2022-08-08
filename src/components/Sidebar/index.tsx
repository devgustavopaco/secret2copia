import styles from './styles.module.scss'

interface SidebarProps {
  dollarPrice?: number
  defaultExchanges: string[]
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
          <span>R$</span> {numberFormatter.format(dollarPrice ?? -1)}
        </p>
      </section>

      <section className={styles['filter-section']}>
        <legend>Exchanges Compra</legend>

        <div className={styles['filter-options']}>
          {defaultExchanges.map((exchange) => (
            <label key={exchange}>
              <input
                type="checkbox"
                checked={buyExchanges.includes(exchange)}
                onChange={() => {
                  onSelectBuyExchange(exchange)
                }}
              />
              {exchange}
            </label>
          ))}
        </div>
      </section>
      <section className={styles['filter-section']}>
        <legend>Exchanges Venda</legend>

        <div className={styles['filter-options']}>
          {defaultExchanges.map((exchange) => (
            <label key={exchange}>
              <input
                type="checkbox"
                checked={sellExchanges.includes(exchange)}
                onChange={() => {
                  onSelectSellExchange(exchange)
                }}
              />
              {exchange}
            </label>
          ))}
        </div>
      </section>
    </aside>
  )
}
