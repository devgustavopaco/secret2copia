import { useSession } from "next-auth/react";
import { MdArrowForwardIos } from "react-icons/md";
import { trpc } from "../../utils/trpc";
import styles from "./styles.module.scss";
//
type Ticker =
  | "SHIB"
  | "ELON"
  | "FLOKI"
  | "NFT"
  | "PEPE"
  | "EPX"
  | "BONK"
  | "WIN"
  | "RACA"
  | "CAPO"
  | "SATS";

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
    BTT: 9,
    REEF: 6,
  };

  let fractionDigits = currencyDecimalMapping[ticker] || 4;

  if (value !== 0 && value < Math.pow(10, -fractionDigits)) {
    fractionDigits = Math.max(Math.ceil(-Math.log10(value)), fractionDigits);
  }

  const formatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return formatter.format(value);
};

const formatterSpread = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const calculatePrice = (
  price: number,
  isUSD: boolean,
  dolarValue: number,
  symbol: string
) => {
  let calculatedPrice = /*isUSD ?*/ price * dolarValue; /*: price*/

  return calculatedPrice;
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

  const bidPrice = calculatePrice(
    coin.bid.price,
    coin.bid.isUSD,
    dollarPrice,
    coin.symbol
  );
  const askPrice = calculatePrice(
    coin.ask.price,
    coin.ask.isUSD,
    dollarPrice,
    coin.symbol
  );

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
            R$ &nbsp;
            {dynamicDecimalFormatter(askPrice, coin.symbol as Ticker)}
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
            R$ &nbsp;
            {dynamicDecimalFormatter(bidPrice, coin.symbol as Ticker)}
          </p>
        </div>
      </div>

      <hr />

      <div className={styles["card-footer"]}>
        <p>
          <span>Spread</span>
          {formatterSpread.format(coin.spread / 100)}
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
