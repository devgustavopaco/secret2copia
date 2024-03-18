import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./styles.module.scss";

import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { trpc } from "../../../utils/trpc";
import { FeaturedInfo } from "../FeaturedInfo";

type ChartData = {
  name: string;
  vendas: number;
  totalPrice: number;
};

const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const { totalPrice, vendas } = payload[0]?.payload;

    const formattedAmount = totalPrice.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return (
      <div className={styles.customTooltip}>
        <p className="label">{`Valor total: ${formattedAmount}`}</p>
        <p className="label">{`Usuários cadastrados: ${vendas}`}</p>
      </div>
    );
  }

  return null;
};

const transformUserDataForChart = (userData: any[]): ChartData[] => {
  const uservendasByMonth = new Map<
    string,
    { vendas: number; totalPrice: number }
  >();

  userData.forEach(
    (user: { createdAt: string | number | Date; pricePaid: number }) => {
      const monthYear = new Date(user.createdAt).toLocaleString("pt-BR", {
        month: "long",
        year: "numeric",
      });

      const currentData = uservendasByMonth.get(monthYear) || {
        vendas: 0,
        totalPrice: 0,
      };

      uservendasByMonth.set(monthYear, {
        vendas: currentData.vendas + 1,
        totalPrice: currentData.totalPrice + user.pricePaid,
      });
    }
  );

  const chartData: ChartData[] = Array.from(
    uservendasByMonth,
    ([name, data]) => ({
      name,
      vendas: data.vendas,
      totalPrice: data.totalPrice,
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
    <>
      <FeaturedInfo data={chartData} />
      <div className={styles.chart}>
        <h3 className={styles.chartTitle}>Análise de Cadastros de Usuários</h3>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <Legend />
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: "rgba(0, 0, 0, 0.15)",
              }}
            />
            <YAxis
              label={{
                value: "Vendas totais",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Line type="monotone" dataKey="vendas" stroke="#8000ff" />
            <Bar
              type="monotone"
              dataKey="vendas"
              fill="#8000ff0f"
              stroke="#8000ff"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
