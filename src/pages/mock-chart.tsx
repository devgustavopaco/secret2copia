"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import mock from "../../test.json";

type MockTick = {
  ticker_formatted: string;
  exchange: string;
  ask_price: string;
  bid_price: string;
  timestamp: string | number;
};

type ChartRow = {
  ts: number;
  time: string;
  [key: string]: number | string | null;
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

const makeKey = (exchange: string) =>
  exchange.toLowerCase().replace(/[^a-z0-9]+/g, "_");

export default function MockChartPage() {
  const { data, exchangeKeys, exchangeLabels } = React.useMemo(() => {
    const GAP_MS = 5 * 60 * 1000;
    const rows = new Map<number, ChartRow>();
    const labels = new Map<string, string>();

    (mock as MockTick[]).forEach((tick) => {
      const ts = Number(tick.timestamp);
      if (!Number.isFinite(ts)) return;

      const ask = Number(tick.ask_price);
      const bid = Number(tick.bid_price);
      const price = Number.isFinite(ask) && Number.isFinite(bid)
        ? (ask + bid) / 2
        : Number.isFinite(ask)
        ? ask
        : Number.isFinite(bid)
        ? bid
        : NaN;
      if (!Number.isFinite(price)) return;

      const exchange = tick.exchange || "Unknown";
      const key = makeKey(exchange);
      labels.set(key, exchange);

      const existing = rows.get(ts) || {
        ts,
        time: formatTime(ts),
      };
      existing[key] = price;
      rows.set(ts, existing);
    });

    const keys = Array.from(labels.keys());
    const sorted = Array.from(rows.values()).sort((a, b) => a.ts - b.ts);
    const withGaps: ChartRow[] = [];
    let prev: ChartRow | null = null;
    sorted.forEach((row) => {
      if (prev && row.ts - prev.ts > GAP_MS) {
        const gapTs = row.ts - 1;
        const gapRow: ChartRow = { ts: gapTs, time: formatTime(gapTs) };
        keys.forEach((key) => {
          gapRow[key] = null;
        });
        withGaps.push(gapRow);
      }
      withGaps.push(row);
      prev = row;
    });

    return {
      data: withGaps,
      exchangeKeys: keys,
      exchangeLabels: labels,
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at 20% 20%, #1f2937 0%, #0b0f16 60%)",
        color: "#e5e7eb",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Mock Chart</h1>
        <p style={{ marginBottom: 24, color: "#9ca3af" }}>
          Dados do test.json ordenados por timestamp (preço médio de bid/ask).
        </p>

        <div
          style={{
            height: 520,
            borderRadius: 16,
            padding: 16,
            background:
              "linear-gradient(135deg, rgba(17,24,39,0.8), rgba(3,7,18,0.9))",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="ts"
                type="number"
                domain={["auto", "auto"]}
                tickFormatter={(value) => formatTime(value as number)}
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
                labelFormatter={(value) => formatTime(value as number)}
              />
              <Legend />
              {exchangeKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="stepAfter"
                  dataKey={key}
                  name={exchangeLabels.get(key) || key}
                  dot={false}
                  strokeWidth={1.6}
                  stroke={
                    ["#38BDF8", "#F472B6", "#F59E0B", "#34D399"][
                      idx % 4
                    ]
                  }
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
