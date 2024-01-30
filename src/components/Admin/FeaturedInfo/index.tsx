import styles from "./styles.module.scss";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import { trpc } from "../../../utils/trpc";
import { useEffect, useState } from "react";

const getMonthDateRange = (year: number, month: number) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  return { startDate, endDate };
};

const getLastThreeMonths = () => {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();

  const months = Array.from({ length: 3 }, () => {
    month = month - 0;
    if (month < 0) {
      month = 12;
      year -= 1;
    }
    const { startDate, endDate } = getMonthDateRange(year, month);
    return { startDate, endDate };
  });

  return months.reverse();
};

type UserCounts = Record<string, number>;

export function FeaturedInfo() {
  const [userCounts, setUserCounts] = useState<UserCounts>({});
  const dateRanges = getLastThreeMonths().map(({ startDate, endDate }) => ({
    startDate: startDate.toISOString().split("T")[0] as string,
    endDate: endDate.toISOString().split("T")[0] as string,
  }));

  const { data, isLoading } = trpc.useQuery([
    "user.getAllUsersByDateRanges",
    { dateRanges },
  ]);

  useEffect(() => {
    if (!isLoading && data) {
      const newUserCounts: UserCounts = {};
      for (let i = 0; i < data.length; i++) {
        const count = data[i];
        if (typeof count === "undefined") {
          continue;
        }

        const dateRangeItem = dateRanges[i];
        if (dateRangeItem) {
          const { startDate } = dateRangeItem;
          const monthYear = new Date(startDate)
            .toLocaleString("pt-BR", { month: "long", year: "numeric" })
            .toUpperCase();
          newUserCounts[monthYear] = count;
        }
      }
      setUserCounts(newUserCounts);
    }
  }, [data, isLoading, dateRanges]);

  return (
    <div className={styles.featured}>
      {Object.entries(userCounts).map(([month, count]) => (
        <div key={month} className={styles.featuredItem}>
          <span className={styles.featuredTitle}>NESSE MÊS</span>
          <div className={styles.featuredMoneyContainer}>
            <span className={styles.featuredMoney}>
              {count != null ? count.toString() : "Carregando..."}
            </span>
          </div>
          <span className={styles.featuredSub}>Usuários cadastrados</span>
        </div>
      ))}
    </div>
  );
}
