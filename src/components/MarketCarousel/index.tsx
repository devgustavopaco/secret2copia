import GraphNegative from "../../icons/GraphNegative";
import GraphPositive from "../../icons/GraphPositive";
import styles from "./styles.module.scss";

const CurrencyCarousel = ({ currencies }: any) => {
  const formatPrice = (price: any) => {
    return `R${price.replace(".", ",")}`;
  };

  return (
    <div className={styles.currencyContainer}>
      <div className={styles.currencyRow}>
        {currencies.map((currency: any, index: any) => (
          <div className={styles.currencyItem} key={index}>
            <div className={styles.LeftSideCurrencyItem}>
              <h3>{currency.name}</h3>
              <p>{formatPrice(currency.price)}</p>
            </div>
            <div className={styles.RightSideCurrencyItem}>
              {parseFloat(currency.percentage) >= 0 ? (
                <GraphPositive />
              ) : (
                <GraphNegative />
              )}
              <p
                className={
                  parseFloat(currency.percentage) >= 0
                    ? styles.positive
                    : styles.negative
                }
              >
                {currency.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyCarousel;
