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
    fee: number
    tax: number
  }
  dollarPrice?: number
  onClick: () => void
}

const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'decimal',
  maximumFractionDigits: 2,
})

export function OperationCard({
  coin,
  dollarPrice = 1,
  onClick,
}: OperationCardProps) {
  const spread = coin.bid.price / coin.ask.price - 1

  return (
    <section className={styles.card}>
      <header className={styles['card-header']}>
        <img
          src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`}
          alt={coin.name}
        />

        <h2 className={''}>
          {coin.name} ({coin.symbol})
        </h2>
      </header>

      <hr />

      <div className={styles['card-content']}>
        <div>
          <h3>Compra</h3>
          <div>
            {/* <img src={coin.image} alt={coin.name} /> */}
            {coin.ask.exchange}
          </div>
          <p>
            <span>R$</span>
            &nbsp;
            {numberFormatter.format(coin.ask.price * dollarPrice)}
          </p>
        </div>

        <ArrowRight size={32} />

        <div>
          <h3>Venda</h3>
          <div>
            {/* <img src={coin.image} alt={coin.name} /> */}
            {coin.bid.exchange}
          </div>
          <p>
            <span>R$</span>
            &nbsp;
            {numberFormatter.format(coin.bid.price * dollarPrice)}
          </p>
        </div>
      </div>

      <hr />

      <div className={styles['card-footer']}>
        <p>
          <span>Spread</span>
          {percentageFormatter.format(spread)}
        </p>
        <p>
          <span>Taxas</span>
          {percentageFormatter.format(coin.fee)} + R$
          {numberFormatter.format(coin.tax * dollarPrice)}
        </p>
      </div>

      <button type="button" onClick={onClick}>
        Order Book
      </button>
    </section>
  )
}
