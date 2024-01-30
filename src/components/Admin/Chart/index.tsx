import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./styles.module.scss";

import { trpc } from "../../../utils/trpc";

interface ChartData {
  name: string;
  vendas: number;
}

const transformUserDataForChart = (userData: any[]): ChartData[] => {
  const uservendasByMonth = new Map<string, number>();

  userData.forEach((user: { createdAt: string | number | Date }) => {
    const monthYear = new Date(user.createdAt).toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    uservendasByMonth.set(
      monthYear,
      (uservendasByMonth.get(monthYear) || 0) + 1
    );
  });

  const chartData: ChartData[] = Array.from(
    uservendasByMonth,
    ([name, vendas]) => ({
      name,
      vendas,
    })
  );
  return chartData;
};

export function Chart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const {
    data: users,
    isLoading,
    error,
  } = trpc.useQuery(["user.getAllUsers", { search: "" }]);

  useEffect(() => {
    if (users) {
      const transformedData = transformUserDataForChart(users);
      setChartData(transformedData);
    }
  }, [users]);

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div className={styles.chart}>
      <h3 className={styles.chartTitle}>Análise de Cadastros de Usuários</h3>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="vendas"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
