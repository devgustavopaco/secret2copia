import { ArrowRight } from 'phosphor-react'
import styles from './styles.module.scss'

interface OperationCardProps {
  coin: {
    image: string
    name: string
    ask: {
      exchange: string
      price: number
    }
    bid: {
      exchange: string
      price: number
    }
    symbol: string
  }
  onClick: () => void
}

const percentageFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
})

export function OperationCard({ coin, onClick }: OperationCardProps) {
  return (
    <section className={styles.card}>
      <header className={styles['card-header']}>
        <img src={coin.image} alt={coin.name} />

        <h2 className={''}>
          {coin.name} ({coin.symbol})
        </h2>
      </header>

      <hr />

      <div className={styles['card-content']}>
        <div>
          <h3>Compra</h3>
          <div>
            <img src={coin.image} alt={coin.name} />
            {coin.ask.exchange}
          </div>
          <p>
            <span>R$</span>
            &nbsp;
            {coin.ask.price}
          </p>
        </div>

        <ArrowRight size={32} />

        <div>
          <h3>Venda</h3>
          <div>
            <img src={coin.image} alt={coin.name} />
            {coin.bid.exchange}
          </div>
          <p>
            <span>R$</span>
            &nbsp;
            {coin.bid.price}
          </p>
        </div>
      </div>

      <hr />

      <div className={styles['card-footer']}>
        <p>
          <span>Spread</span>
          {percentageFormatter.format(0.04 / 100)}
        </p>
        <p>
          <span>Taxas</span>
          0.80% + R$19.88
        </p>
      </div>

      <button type="button" onClick={onClick}>
        Order Book
      </button>
    </section>
  )
}
