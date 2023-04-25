import styles from "./styles.module.scss";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";

export function FeaturedInfo() {
  return (
    <div className={styles.featured}>
      <div className={styles.featuredItem}>
        <span className={styles.featuredTitle}>Vendas</span>
        <div className={styles.featuredMoneyContainer}>
          <span className={styles.featuredMoney}>R$2,415</span>
          <span className={styles.featuredMoneyRate}>
            -11.4{" "}
            <ArrowDownward
              className={styles.featuredIcon + " " + styles.negative}
            />
          </span>
        </div>
        <span className={styles.featuredSub}>Comparado com o mês passado</span>
      </div>
      <div className={styles.featuredItem}>
        <span className={styles.featuredTitle}>Usuários ativos</span>
        <div className={styles.featuredMoneyContainer}>
          <span className={styles.featuredMoney}>16,8</span>
          <span className={styles.featuredMoneyRate}>
            -22,4{" "}
            <ArrowDownward
              className={styles.featuredIcon + " " + styles.negative}
            />
          </span>
        </div>

        <span className={styles.featuredSub}>Comparado com o mês passado</span>
      </div>
      <div className={styles.featuredItem}>
        <span className={styles.featuredTitle}>Dinheiro recebido</span>
        <div className={styles.featuredMoneyContainer}>
          <span className={styles.featuredMoney}>R$20.415,50</span>
          <span className={styles.featuredMoneyRate}>
            <ArrowUpward className={styles.featuredIcon} />
          </span>
        </div>

        <span className={styles.featuredSub}>
          Total arrecadado desde o início
        </span>
      </div>
    </div>
  );
}
