import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../styles/LatencyMetrics.module.scss";

type LatencyTotals = {
  exchange: string;
  side: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  lastTs: number;
  lastLag: number;
};

type LatencyEntry = LatencyTotals;

type LatencyResponse = {
  now: number;
  windowMs: number;
  totals: LatencyTotals;
  entries: LatencyEntry[];
};

const WINDOW_PRESETS = [
  { label: "30s", value: "30s" },
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "10m", value: "10m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
];

const ALERT_THRESHOLDS = {
  p95: { warn: 150, crit: 300 },
  p99: { warn: 250, crit: 450 },
  lastLag: { warn: 120, crit: 250 },
  delay: { warn: 200, crit: 500 },
};

function buildUrl(windowValue: string, windowMsValue: string) {
  const url = new URL("/metrics/latency", window.location.origin);
  if (windowMsValue) {
    url.searchParams.set("windowMs", windowMsValue);
  } else if (windowValue) {
    url.searchParams.set("window", windowValue);
  }
  return url.toString();
}

function formatNumber(value?: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatMs(value?: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${formatNumber(value)} ms`;
}

function formatTs(value?: number) {
  if (!value) return "--";
  return new Date(value).toLocaleString("pt-BR");
}

function calcDelay(now?: number, lastTs?: number) {
  if (!now || !lastTs) return undefined;
  const diff = now - lastTs;
  if (!Number.isFinite(diff)) return undefined;
  return diff < 0 ? 0 : diff;
}

export default function MetricsLatencyPage() {
  const [data, setData] = useState<LatencyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [windowPreset, setWindowPreset] = useState("1m");
  const [windowCustom, setWindowCustom] = useState("");
  const [windowMs, setWindowMs] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshMs, setRefreshMs] = useState("10000");

  const effectiveWindow = useMemo(() => {
    if (windowMs.trim()) return `${windowMs.trim()}ms`;
    if (windowCustom.trim()) return windowCustom.trim();
    return windowPreset;
  }, [windowMs, windowCustom, windowPreset]);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url = buildUrl(
        windowCustom.trim() || windowPreset,
        windowMs.trim()
      );
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao buscar metricas");
      }
      const payload = (await res.json()) as LatencyResponse;
      setData(payload);
    } catch (err: any) {
      setError(err?.message || "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  }, [windowCustom, windowMs, windowPreset]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = Number(refreshMs);
    if (!Number.isFinite(interval) || interval < 2000) return;
    const id = setInterval(load, interval);
    return () => clearInterval(id);
  }, [autoRefresh, refreshMs, load]);

  const sortedEntries = useMemo(() => {
    if (!data?.entries) return [];
    return [...data.entries].sort((a, b) => {
      const ex = a.exchange.localeCompare(b.exchange);
      if (ex !== 0) return ex;
      return a.side.localeCompare(b.side);
    });
  }, [data?.entries]);

  const totalsDelay = useMemo(
    () => calcDelay(data?.now, data?.totals?.lastTs),
    [data?.now, data?.totals?.lastTs]
  );

  const getAlertTone = (
    metric: keyof typeof ALERT_THRESHOLDS,
    value?: number
  ) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "ok";
    }
    const { warn, crit } = ALERT_THRESHOLDS[metric];
    if (value >= crit) return "crit";
    if (value >= warn) return "warn";
    return "ok";
  };

  const toneToCardClass = (tone: string) => {
    if (tone === "crit") return styles.cardCrit;
    if (tone === "warn") return styles.cardWarn;
    return "";
  };

  const toneToValueClass = (tone: string) => {
    if (tone === "crit") return styles.valueCrit;
    if (tone === "warn") return styles.valueWarn;
    return "";
  };

  const totalsCards = [
    {
      label: "Total",
      value: data?.totals?.count,
      unit: "eventos",
      info: "Quantidade total de eventos dentro da janela.",
    },
    {
      label: "Min",
      value: data?.totals?.min,
      unit: "ms",
      info: "Menor latencia observada na janela.",
    },
    {
      label: "Max",
      value: data?.totals?.max,
      unit: "ms",
      info: "Maior latencia observada na janela.",
    },
    {
      label: "Avg",
      value: data?.totals?.avg,
      unit: "ms",
      info: "Media simples das latencias na janela.",
    },
    {
      label: "P50",
      value: data?.totals?.p50,
      unit: "ms",
      info: "Percentil 50 da latencia.",
    },
    {
      label: "P95",
      value: data?.totals?.p95,
      unit: "ms",
      info: "Percentil 95 da latencia.",
      toneKey: "p95" as const,
    },
    {
      label: "P99",
      value: data?.totals?.p99,
      unit: "ms",
      info: "Percentil 99 da latencia.",
      toneKey: "p99" as const,
    },
    {
      label: "Last lag",
      value: data?.totals?.lastLag,
      unit: "ms",
      info: "Latencia do ultimo tick recebido.",
      toneKey: "lastLag" as const,
    },
    {
      label: "Delay",
      value: totalsDelay,
      unit: "ms",
      info: "Diferenca entre now e lastTs (agora - ultimo tick).",
      toneKey: "delay" as const,
    },
  ];

  return (
    <>
      <Head>
        <title>Metricas de Latencia</title>
      </Head>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.kicker}>Monitoramento em tempo real</span>
            <h1 className={styles.title}>Metricas de Latencia</h1>
            <p className={styles.subtitle}>
              Acompanhe p50, p95 e p99 por exchange e lado, com janela
              configuravel.
            </p>
            <div className={styles.metaRow}>
              <div className={styles.meta}>
                <span>Janela efetiva</span>
                <strong>{effectiveWindow}</strong>
              </div>
              <div className={styles.meta}>
                <span>Ultima atualizacao</span>
                <strong>{data ? formatTs(data.now) : "--"}</strong>
              </div>
              <div className={styles.meta}>
                <span>Status</span>
                <strong className={isLoading ? styles.loading : styles.ready}>
                  {isLoading ? "Atualizando" : "Pronto"}
                </strong>
              </div>
            </div>
          </div>
          <div className={styles.heroGlow} aria-hidden="true" />
        </section>

        <section className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Janela</label>
            <select
              value={windowPreset}
              onChange={(event) => setWindowPreset(event.target.value)}
            >
              {WINDOW_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>Janela custom</label>
            <input
              type="text"
              placeholder="ex: 45s, 2m, 5000ms"
              value={windowCustom}
              onChange={(event) => setWindowCustom(event.target.value)}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Window ms</label>
            <input
              type="number"
              min="0"
              placeholder="ex: 60000"
              value={windowMs}
              onChange={(event) => setWindowMs(event.target.value)}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Auto refresh</label>
            <div className={styles.inline}>
              <button
                type="button"
                className={autoRefresh ? styles.toggleOn : styles.toggleOff}
                onClick={() => setAutoRefresh((prev) => !prev)}
              >
                {autoRefresh ? "Ligado" : "Desligado"}
              </button>
              <input
                type="number"
                min="2000"
                step="1000"
                value={refreshMs}
                onChange={(event) => setRefreshMs(event.target.value)}
              />
              <span className={styles.unit}>ms</span>
            </div>
          </div>
          <div className={styles.controlGroup}>
            <label>&nbsp;</label>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={load}
            >
              Atualizar agora
            </button>
          </div>
        </section>

        {error && (
          <section className={styles.errorBox}>
            <strong>Erro:</strong> {error}
          </section>
        )}

        <section className={styles.cards}>
          {totalsCards.map((card, index) => {
            const tone = card.toneKey
              ? getAlertTone(card.toneKey, card.value)
              : "ok";
            const cardClass = toneToCardClass(tone);
            const valueClass = toneToValueClass(tone);
            return (
              <div
                key={card.label}
                className={[styles.card, cardClass].filter(Boolean).join(" ")}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span>
                  {card.label}
                  <span
                    className={styles.info}
                    title={card.info}
                    aria-label={card.info}
                  >
                    i
                  </span>
                </span>
                <strong className={valueClass}>
                  {formatNumber(card.value)}{" "}
                  <em className={styles.unitInline}>{card.unit}</em>
                </strong>
              </div>
            );
          })}
        </section>

        <section className={styles.legend}>
          <div className={styles.legendCard}>
            <h3>Legenda</h3>
            <p>
              <strong>now</strong>: timestamp atual do servidor (ms).
            </p>
            <p>
              <strong>windowMs</strong>: janela usada no calculo.
            </p>
            <p>
              <strong>totals</strong>: agregados de todas as exchanges/lados.
            </p>
            <p>
              <strong>entries</strong>: cada exchange + side (spot/futures).
            </p>
            <p>
              <strong>lastTs</strong>: ultimo timestamp da exchange observado.
            </p>
            <p>
              <strong>lastLag</strong>: latencia do ultimo tick.
            </p>
            <p>
              <strong>delay</strong>: now - lastTs (ms).
            </p>
          </div>
          <div className={styles.legendCard}>
            <h3>Alertas</h3>
            <p>
              <span className={styles.badgeOk}>Normal</span> abaixo dos
              limiares.
            </p>
            <p>
              <span className={styles.badgeWarn}>Atencao</span> quando passar de
              <strong> {ALERT_THRESHOLDS.p95.warn}ms</strong> (P95),
              <strong> {ALERT_THRESHOLDS.p99.warn}ms</strong> (P99),
              <strong> {ALERT_THRESHOLDS.lastLag.warn}ms</strong> (Last lag) ou
              <strong> {ALERT_THRESHOLDS.delay.warn}ms</strong> (Delay).
            </p>
            <p>
              <span className={styles.badgeCrit}>Critico</span> acima de
              <strong> {ALERT_THRESHOLDS.p95.crit}ms</strong> (P95),
              <strong> {ALERT_THRESHOLDS.p99.crit}ms</strong> (P99),
              <strong> {ALERT_THRESHOLDS.lastLag.crit}ms</strong> (Last lag) ou
              <strong> {ALERT_THRESHOLDS.delay.crit}ms</strong> (Delay).
            </p>
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>Detalhamento por exchange</h2>
            <div className={styles.tableMeta}>
              <span>
                Janela reportada: {data ? formatMs(data.windowMs) : "--"}
              </span>
              <span>
                Ultimo timestamp:{" "}
                {data?.totals?.lastTs ? formatTs(data.totals.lastTs) : "--"}
              </span>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Exchange</th>
                  <th>Side</th>
                  <th>Count</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Avg</th>
                  <th>
                    <span className={styles.thLabel}>
                      P50
                      <span
                        className={styles.info}
                        title="Percentil 50 da latencia."
                        aria-label="Percentil 50 da latencia."
                      >
                        i
                      </span>
                    </span>
                  </th>
                  <th>
                    <span className={styles.thLabel}>
                      P95
                      <span
                        className={styles.info}
                        title="Percentil 95 da latencia."
                        aria-label="Percentil 95 da latencia."
                      >
                        i
                      </span>
                    </span>
                  </th>
                  <th>
                    <span className={styles.thLabel}>
                      P99
                      <span
                        className={styles.info}
                        title="Percentil 99 da latencia."
                        aria-label="Percentil 99 da latencia."
                      >
                        i
                      </span>
                    </span>
                  </th>
                  <th>
                    <span className={styles.thLabel}>
                      Last lag
                      <span
                        className={styles.info}
                        title="Latencia do ultimo tick."
                        aria-label="Latencia do ultimo tick."
                      >
                        i
                      </span>
                    </span>
                  </th>
                  <th>
                    <span className={styles.thLabel}>
                      Delay
                      <span
                        className={styles.info}
                        title="now - lastTs (ms)."
                        aria-label="now - lastTs (ms)."
                      >
                        i
                      </span>
                    </span>
                  </th>
                  <th>
                    <span className={styles.thLabel}>
                      Last ts
                      <span
                        className={styles.info}
                        title="Ultimo timestamp observado na exchange."
                        aria-label="Ultimo timestamp observado na exchange."
                      >
                        i
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => {
                  const p95Tone = getAlertTone("p95", entry.p95);
                  const p99Tone = getAlertTone("p99", entry.p99);
                  const lastLagTone = getAlertTone("lastLag", entry.lastLag);
                  const delay = calcDelay(data?.now, entry.lastTs);
                  const delayTone = getAlertTone("delay", delay);
                  return (
                    <tr key={`${entry.exchange}-${entry.side}`}>
                      <td>{entry.exchange}</td>
                      <td>
                        <span
                          className={
                            entry.side === "futures"
                              ? styles.sideFutures
                              : styles.sideSpot
                          }
                        >
                          {entry.side}
                        </span>
                      </td>
                      <td>{formatNumber(entry.count)}</td>
                      <td>{formatMs(entry.min)}</td>
                      <td>{formatMs(entry.max)}</td>
                      <td>{formatMs(entry.avg)}</td>
                      <td>{formatMs(entry.p50)}</td>
                      <td className={toneToValueClass(p95Tone)}>
                        {formatMs(entry.p95)}
                      </td>
                      <td className={toneToValueClass(p99Tone)}>
                        {formatMs(entry.p99)}
                      </td>
                      <td className={toneToValueClass(lastLagTone)}>
                        {formatMs(entry.lastLag)}
                      </td>
                      <td className={toneToValueClass(delayTone)}>
                        {formatMs(delay)}
                      </td>
                      <td>{formatTs(entry.lastTs)}</td>
                    </tr>
                  );
                })}
                {!sortedEntries.length && (
                  <tr>
                    <td colSpan={12} className={styles.emptyRow}>
                      Nenhum dado ainda. Aguarde a proxima coleta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
