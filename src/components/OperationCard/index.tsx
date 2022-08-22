import { ArrowRight } from 'phosphor-react'
import styles from './styles.module.scss'

interface OperationCardProps {
  coin: {
    image?: string
    name: string
    ask: {
      exchange: string
      price: number
      image_url?: string
      isUSD: boolean
    }
    bid: {
      exchange: string
      price: number
      image_url?: string
      isUSD: boolean
    }
    symbol: string
    fee: number
    tax: number
    spread: number
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
  maximumFractionDigits: 4,
})

export function OperationCard({
  coin,
  dollarPrice = 1,
  onClick,
}: OperationCardProps) {
  const bidPrice = coin.bid.isUSD
    ? coin.bid.price * dollarPrice
    : coin.bid.price
  const askPrice = coin.ask.isUSD
    ? coin.ask.price * dollarPrice
    : coin.ask.price

  return (
    <section className={styles.card}>
      <header className={styles['card-header']}>
        <img
          src={
            coin.image ??
            `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
          }
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
            {coin.ask.image_url && (
              <img src={coin.ask.image_url} alt={coin.ask.exchange} />
            )}
            {coin.ask.exchange}
          </div>
          <p>
            <span>R$</span>
            &nbsp;
            {numberFormatter.format(askPrice)}
          </p>
        </div>

        <ArrowRight size={32} />

        <div>
          <h3>Venda</h3>
          <div>
            {coin.bid.image_url && (
              <img src={coin.bid.image_url} alt={coin.bid.exchange} />
            )}
            {coin.bid.exchange}
          </div>
          <p>
            <span>R$</span>
            &nbsp;
            {numberFormatter.format(bidPrice)}
          </p>
        </div>
      </div>

      <hr />

      <div className={styles['card-footer']}>
        <p>
          <span>Spread</span>
          {percentageFormatter.format(coin.spread)}
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
