"use client";

import { useEffect, useMemo, useState } from "react";
import { useArbitrageSocket } from "../hooks/useArbitrageSocket";
import type { ArbitrageOpportunity } from "../server/router/orderbook";
import styles from "../styles/futuros-lite.module.scss";

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "decimal",
  maximumFractionDigits: 8,
});

export default function FuturosLitePage() {
  const [isExitMode, setIsExitMode] = useState(false);
  const [search, setSearch] = useState("");
  const buyExNames = [
    "Gateio",
    "Bitget",
    "Mexc",
    "Bingx",
    "Kucoin",
    "Bybit",
    "Huobi",
  ];
  const sellExNames = [
    "Gateio",
    "Bitget",
    "Mexc",
    "Bingx",
    "Kucoin",
    "Bybit",
    "Huobi",
  ];

  const { opportunities, isConnected } = useArbitrageSocket(
    [],
    500,
    buyExNames,
    sellExNames,
    false,
    true,
    0.5
  );

  const rows = useMemo(() => {
    const list = (opportunities ?? []).map((op) => {
      const spotAsk =
        op.lowestAsk.orderbook?.asks?.[0]?.price ?? op.lowestAsk.price;
      const spotBid =
        op.lowestAsk.orderbook?.bids?.[0]?.price ?? op.lowestAsk.price;
      const futBid =
        op.highestBid.orderbook?.bids?.[0]?.price ?? op.highestBid.price;
      const futAsk =
        op.highestBid.orderbook?.asks?.[0]?.price ?? op.highestBid.price;

      const spotPrice = isExitMode ? spotBid : spotAsk;
      const futPrice = isExitMode ? futAsk : futBid;
      const spread = isExitMode ? op.spreadS : op.spread;

      return {
        id: `${op.ticker}-${op.lowestAsk.exchange}-${op.highestBid.exchange}`,
        ticker: op.ticker.replace(/USDT$/i, ""),
        spotExchange: op.lowestAsk.exchange,
        futExchange: op.highestBid.exchange,
        spotPrice,
        futPrice,
        spread,
      };
    });
    const term = search.trim().toUpperCase();
    const filtered = term
      ? list.filter((r) => r.ticker.toUpperCase().includes(term))
      : list;

    return filtered.sort((a, b) => {
      const aPos = a.spread > 0 ? 1 : 0;
      const bPos = b.spread > 0 ? 1 : 0;
      if (aPos !== bPos) return bPos - aPos;
      return b.spread - a.spread;
    });
  }, [opportunities, isExitMode, search]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>Futuros Lite</div>
        <div className={styles.controls}>
          <input
            className={styles.search}
            type="text"
            placeholder="Buscar moeda"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setIsExitMode((v) => !v)}
          >
            {isExitMode ? "Saida" : "Entrada"}
          </button>
          <span className={styles.status}>
            {isConnected ? "socket on" : "socket off"}
          </span>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Moeda</th>
              <th>Spot</th>
              <th>Futuros</th>
              <th>Spread</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  Aguardando dados...
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className={styles.mono}>{r.ticker}</td>
                  <td>
                    <div className={styles.ex}>{r.spotExchange}</div>
                    <div>{numberFormatter.format(r.spotPrice)}</div>
                  </td>
                  <td>
                    <div className={styles.ex}>{r.futExchange}</div>
                    <div>{numberFormatter.format(r.futPrice)}</div>
                  </td>
                  <td className={r.spread >= 0 ? styles.pos : styles.neg}>
                    {r.spread >= 0 ? "+" : ""}
                    {r.spread.toFixed(2)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
