import styles from "./styles.module.scss";

interface ChartData {
  name: string;
  vendas: number;
  totalPrice: number;
}

interface FeaturedInfoData {
  data: ChartData[];
}

export function FeaturedInfo({ data }: FeaturedInfoData) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const lastThreeMonthsData = data.slice(-3);

  return (
    <div className={styles.featured}>
      {lastThreeMonthsData.map((item, index) => (
        <div key={index} className={styles.featuredItem}>
          <span className={styles.featuredTitle}>
            {item.name.toUpperCase()}
          </span>
          <div className={styles.featuredMoneyContainer}>
            <span className={styles.featuredMoney}>
              {formatCurrency(item.totalPrice)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
