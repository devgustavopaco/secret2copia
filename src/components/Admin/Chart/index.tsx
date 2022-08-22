import styles from './styles.module.scss'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function Chart() {
  const data = [
    {
      name: 'Janeiro',
      2021: 4000,
      2022: 2400,
      amt: 2400,
    },
    {
      name: 'Fevereiro',
      2021: 3000,
      2022: 1398,
      amt: 2210,
    },
    {
      name: 'Março',
      2021: 2000,
      2022: 9800,
      amt: 2290,
    },
    {
      name: 'Abril',
      2021: 2780,
      2022: 3908,
      amt: 2000,
    },
    {
      name: 'Maio',
      2021: 1890,
      2022: 4800,
      amt: 2181,
    },
    {
      name: 'Junho',
      2021: 2090,
      2022: 3400,
      amt: 2560,
    },
    {
      name: 'Julho',
      2021: 3400,
      2022: 4380,
      amt: 2100,
    },
    {
      name: 'Agosto',
      2021: 3410,
      2022: 4550,
      amt: 2100,
    },
    {
      name: 'Setembro',
      2021: 3490,
      2022: 10000,
      amt: 2100,
    },
    {
      name: 'Outubro',
      2021: 3490,
      2022: 4300,
      amt: 2100,
    },
    {
      name: 'Novembro',
      2021: 3490,
      2022: 2100,
      amt: 2100,
    },
    {
      name: 'Dezembro',
      2021: 3490,
      2022: 9500,
      amt: 2100,
    },
  ]

  return (
    <div className={styles.chart}>
      <h3 className={styles.chartTitle}>Análise das Vendas</h3>
      <ResponsiveContainer width="100%" aspect={4 / 1}>
        <LineChart
          width={500}
          height={300}
          data={data}
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
            dataKey="2022"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="2021" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
