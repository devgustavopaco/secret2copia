"use client";

import React from "react";
import styles from "./glass-table.module.scss";
import LockIcon from "../../Icons/LockIcon";
import GroupIcon from "../../Icons/GroupIcon";
import FilterIcon from "../../Icons/FilterIcon";
import CalculatorIcon from "../../Icons/CalculatorIcon";
import ConfigIcon from "../../Icons/ConfigIcon";
import CalculatorTableIcon from "../../Icons/CalculatorTableIcon";
import TradingViewIcon from "../../Icons/TradingViewIcon";
import StarIcon from "../../Icons/StarIcon";
import TrashIcon from "../../Icons/TrashIcon";

export type Align = "left" | "center" | "right";

export type Column<T> = {
  /** ID única da coluna */
  id: string;
  /** Cabeçalho (string/JSX) */
  header: React.ReactNode;
  /** Chave do objeto ou função para renderizar a célula */
  field?: keyof T;
  accessor?: (row: T, rowIndex: number) => React.ReactNode;
  /** Largura (ex.: '120px', '12%', 'minmax(160px,1fr)') */
  width?: string;
  /** Alinhamento */
  align?: Align;
  /** Classe extra */
  className?: string;
};

export type GlassTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  /** chave única por linha */
  rowKey?: (row: T, index: number) => string | number;
  /** clique na linha */
  onRowClick?: (row: T) => void;
  /** cabeçalho fixo (true = header fora do scroll) */
  stickyHeader?: boolean;
  /** altura máx. com scroll interno (ex.: 520, '60vh') */
  maxHeight?: number | string;
  /** zebra */
  zebra?: boolean;
  /** linhas mais compactas */
  dense?: boolean;
  /** mensagem quando vazio */
  emptyMessage?: string;
  /** classe extra */
  className?: string;
  /** se o sidebar está aberto */
  isSidebarOpen?: boolean;
};

function classnames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function GlassTable<T extends object>({
  columns,
  data,
  rowKey,
  onRowClick,
  stickyHeader = true,
  maxHeight,
  zebra = false,
  dense = false,
  emptyMessage = "Sem dados",
  className,
  isSidebarOpen,
}: GlassTableProps<T>) {
  const styleVars: React.CSSProperties | undefined = maxHeight
    ? {
        ["--gt-max-h" as any]:
          typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
      }
    : undefined;

  const renderColgroup = () => (
    <colgroup>
      {columns.map((col) => (
        <col
          key={col.id}
          style={col.width ? { width: col.width } : undefined}
        />
      ))}
    </colgroup>
  );

  const Header = (
    <div className={styles.tableHead}>
      <table className={styles.table}>
        {renderColgroup()}
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={classnames(
                  styles.th,
                  col.align && styles[`align-${col.align}`],
                  col.className
                )}
                style={col.width ? { width: col.width } : undefined}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </div>
  );

  const Body = (
    <div className={styles.tableBody}>
      <div className={styles.scroller}>
        <table className={styles.table}>
          {renderColgroup()}
          {!stickyHeader && (
            <thead className={styles.thead}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={classnames(
                      styles.th,
                      col.align && styles[`align-${col.align}`],
                      col.className
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    scope="col"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody className={styles.tbody}>
            {data.length === 0 && (
              <tr className={styles.row}>
                <td
                  className={classnames(styles.td, styles.empty)}
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {data.map((row, i) => {
              const key = rowKey ? rowKey(row, i) : i;
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={key}
                  className={classnames(
                    styles.row,
                    clickable && styles.clickable
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : -1}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => {
                    const content = col.accessor
                      ? col.accessor(row, i)
                      : col.field
                      ? // @ts-ignore – acesso dinâmico seguro pelo tipo
                        (row as any)[col.field]
                      : null;

                    return (
                      <td
                        key={col.id}
                        className={classnames(
                          styles.td,
                          col.align && styles[`align-${col.align}`],
                          col.className
                        )}
                        style={col.width ? { width: col.width } : undefined}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className={classnames(
        styles.wrapper,
        !isSidebarOpen && styles.sidebarClosed,
        zebra && styles.zebra,
        dense && styles.dense,
        className
      )}
      style={styleVars}
    >
      <div className={styles.toolbar}>
        <label className={styles.searchGlass}>
          <img
            src="/new-page/search-icon.svg"
            alt=""
            aria-hidden
            className={styles.searchIcon}
          />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filtrar por símbolo"
            aria-label="Filtrar por símbolo"
          />
        </label>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Privado"
          >
            <LockIcon />
          </button>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Modo grade"
          >
            <GroupIcon />
          </button>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Filtrar"
          >
            <FilterIcon />
          </button>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Calculadora"
          >
            <CalculatorIcon />
          </button>
          <button
            type="button"
            className={styles.iconGlass}
            aria-label="Configurar"
          >
            <ConfigIcon />
          </button>
        </div>
      </div>

      <div className={styles.surface}>
        {stickyHeader && Header}
        {Body}
      </div>
    </div>
  );
}

/* =========================
   DEMO COM MOCK DE DADOS
   ========================= */

type CoinRow = {
  id: string;
  coin: { ticker: string; logo: string };
  spot: { price: string; bingo: string; live: string };
  futures: { price: string; bingo: string; live: string };
  spreads: { long: string; short: string };
  funding: string;
  tempo: string;
  volumes: { s: string; f: string };
  volumes24h: { s: string; f: string };
};

const mockData: CoinRow[] = Array.from({ length: 100 }).map((_, i) => ({
  id: `bdxn-${i}`,
  coin: { ticker: "BDXN", logo: "/new-page/logo.svg" },
  spot: { price: "$0.04", bingo: "BingX", live: "Live $24" },
  futures: { price: "$0.04", bingo: "BingX", live: "Live $24" },
  spreads: { long: "E: 13,61%", short: "S: 13,61%" },
  funding: "0,61%",
  tempo: "5h 3min 44seg",
  volumes: { s: "S: 1201", f: "F: 351" },
  volumes24h: { s: "S: 30K", f: "F: 351K" },
}));

export function DemoGlassTable({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const columns: Column<CoinRow>[] = [
    {
      id: "moeda",
      header: "Moeda",
      accessor: (r) => (
        <div className={styles.cellCoin}>
          <img
            src={r.coin.logo}
            alt=""
            aria-hidden
            className={styles.coinLogo}
          />
          <span className={styles.coinTicker}>{r.coin.ticker}</span>
        </div>
      ),
      width: "160px",
    },
    {
      id: "spot",
      header: "Spot",
      accessor: (r) => (
        <div className={styles.cellStack}>
          <div className={styles.bingo}>
            {r.spot.bingo} <img src="/new-page/link.svg" alt="" />
          </div>
          <div className={styles.price}>{r.spot.price}</div>
          <div className={styles.live}>{r.spot.live}</div>
        </div>
      ),
      width: "150px",
      align: "center",
    },
    {
      id: "futuros",
      header: "Futuros",
      accessor: (r) => (
        <div className={styles.cellStack}>
          <div className={styles.bingo}>
            {r.futures.bingo} <img src="/new-page/link.svg" alt="" />
          </div>
          <div className={styles.price}>{r.futures.price}</div>
          <div className={styles.live}>{r.futures.live}</div>
        </div>
      ),
      width: "150px",
      align: "center",
    },
    {
      id: "spreads",
      header: "Spreads",
      accessor: (r) => (
        <div className={styles.cellSplit}>
          <span className={classnames(styles.positive, styles.bold)}>
            {r.spreads.long}
          </span>
          <span className={classnames(styles.negative, styles.bold)}>
            {r.spreads.short}
          </span>
        </div>
      ),
      width: "160px",
    },
    { id: "funding", header: "Funding", field: "funding", width: "120px" },
    {
      id: "tempo",
      header: "Tempo",
      accessor: (r) => <span className={styles.chip}>{r.tempo}</span>,
      width: "150px",
    },
    {
      id: "volumes",
      header: "Volumes",
      accessor: (r) => (
        <div className={styles.cellSplit}>
          <span className={styles.muted}>{r.volumes.s}</span>
          <span className={styles.muted}>{r.volumes.f}</span>
        </div>
      ),
      width: "120px",
    },
    {
      id: "volumes24",
      header: "Volumes 24H",
      accessor: (r) => (
        <div className={styles.cellSplit}>
          <span className={styles.muted}>{r.volumes24h.s}</span>
          <span className={styles.muted}>{r.volumes24h.f}</span>
        </div>
      ),
      width: "140px",
    },
    {
      id: "acoes",
      header: "Ações",
      accessor: () => (
        <div className={styles.actions}>
          <button className={styles.iconBtn} aria-label="Favoritar">
            <StarIcon />
          </button>
          <button className={styles.iconBtn} aria-label="Copiar">
            <CalculatorTableIcon />
          </button>
          <button className={styles.iconBtn} aria-label="Abrir">
            <TradingViewIcon />
          </button>
          <button className={styles.iconBtn} aria-label="Excluir">
            <TrashIcon />
          </button>
        </div>
      ),
      width: "112px",
    },
  ];

  return (
    <GlassTable<CoinRow>
      columns={columns}
      data={mockData}
      rowKey={(r) => r.id}
      maxHeight={560}
      zebra
      onRowClick={(r) => console.log("click row:", r.id)}
      isSidebarOpen={isSidebarOpen}
    />
  );
}
