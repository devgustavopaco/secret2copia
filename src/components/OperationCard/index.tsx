import { useSession } from "next-auth/react";
import { MdArrowForwardIos } from "react-icons/md";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";

interface OperationCardProps {
  coin: {
    image?: string;
    name: string;
    ask: {
      exchange: string;
      price: number;
      image_url?: string;
      isUSD: boolean;
    };
    bid: {
      exchange: string;
      price: number;
      image_url?: string;
      isUSD: boolean;
    };
    symbol: string;
    fee: number;
    tax: number;
    spread: number;
  };
  dollarPrice?: number;
  onClick: () => void;
}

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "decimal",
  maximumFractionDigits: 4,
});

const dynamicDecimalFormatter = (value: number, ticker: string): string => {
  const currencyDecimalMapping: { [key: string]: number } = {
    SHIB: 8,
    ELON: 10,
    FLOKI: 7,
    NFT: 9,
    PEPE: 9,
    EPX: 6,
    BONK: 8,
    WIN: 7,
    RACA: 7,
    CAPO: 6,
    SATS: 9,
  };

  const fractionDigits = currencyDecimalMapping[ticker] || 4;

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return formatter.format(value);
};

export function OperationCard({
  coin,
  dollarPrice = 1,
  onClick,
}: OperationCardProps) {
  const { data: auth } = useSession();
  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const dolarValue = user?.dolarValue ?? 1;

  const bidPrice = coin.bid.isUSD
    ? parseFloat(
        (coin.bid.price * dolarValue).toFixed(coin.symbol === "SHIB" ? 8 : 4)
      )
    : coin.bid.price;
  const askPrice = coin.ask.isUSD
    ? parseFloat(
        (coin.ask.price * dolarValue).toFixed(coin.symbol === "SHIB" ? 8 : 4)
      )
    : coin.ask.price;

  return (
    <section className={styles.card}>
      <header className={styles["card-header"]}>
        <img
          src={
            coin.image ??
            `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
          }
          alt={coin.name}
        />

        <h2 className={""}>
          {coin.name} <b>({coin.symbol})</b>
        </h2>
      </header>

      <hr />

      <div className={styles["card-content"]}>
        <div>
          <h3>Compra</h3>
          <div>
            {coin.ask.image_url && (
              <img src={coin.ask.image_url} alt={coin.ask.exchange} />
            )}
            {coin.ask.exchange}
          </div>
          <p>
            &nbsp;
            {dynamicDecimalFormatter(askPrice, coin.symbol)}
          </p>
        </div>

        <MdArrowForwardIos
          className={styles.arrowIcon}
          size={32}
          opacity={0.3}
        />

        <div>
          <h3>Venda</h3>
          <div className={styles.textEnd}>
            {coin.bid.image_url && (
              <img src={coin.bid.image_url} alt={coin.bid.exchange} />
            )}
            {coin.bid.exchange}
          </div>
          <p>
            &nbsp;
            {dynamicDecimalFormatter(bidPrice, coin.symbol)}
          </p>
        </div>
      </div>

      <hr />

      <div className={styles["card-footer"]}>
        <p>
          <span>Spread</span>
          {percentageFormatter.format(coin.spread)}
        </p>
        <p>
          <span>Taxas</span>
          {percentageFormatter.format(coin.fee)} + R$
          {(coin.ask.isUSD ? coin.tax * dolarValue : coin.tax).toFixed(2)}
        </p>
      </div>

      <button type="button" onClick={onClick}>
        Order Book
      </button>
    </section>
  );
}
