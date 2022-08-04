import styles from './styles.module.scss'

const exchanges = [
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

interface SidebarProps {
  onSelectBuyExchange: (exchange: string) => void
  onSelectSellExchange: (exchange: string) => void
}

export function Sidebar({
  onSelectBuyExchange,
  onSelectSellExchange,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <h2>Filtros</h2>

      <section className={styles['text-section']}>
        <legend>Cotação Dólar</legend>
        <p>
          <span>R$</span> 5,42
        </p>
      </section>

      <section className={styles['filter-section']}>
        <legend>Exchanges Compra</legend>

        <div className={styles['filter-options']}>
          {exchanges.map((exchange) => (
            <label key={exchange}>
              <input
                type="checkbox"
                onChange={() => {
                  onSelectBuyExchange(exchange.toLowerCase())
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
          {exchanges.map((exchange) => (
            <label key={exchange}>
              <input
                type="checkbox"
                onChange={() => {
                  onSelectSellExchange(exchange.toLowerCase())
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
