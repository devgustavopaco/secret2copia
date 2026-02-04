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

type SystemMetrics = {
  cpu: {
    cores: number;
    usagePct: number;
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    usedPct: number;
    availableBytes: number;
  };
  loadAvg: number[];
  uptimeSec: number;
};

type ContainerStats = {
  name: string;
  cpuPercent: number;
  memUsageBytes: number;
  memPercentHost: number;
  netRxBytes: number;
  netTxBytes: number;
};

type ContainersMetrics = {
  enabled: boolean;
  count: number;
  containers: ContainerStats[];
};

type LatencyResponse = {
  now: number;
  windowMs: number;
  totals: LatencyTotals;
  entries: LatencyEntry[];
  system?: SystemMetrics;
  containers?: ContainersMetrics;
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

function buildSystemUrl() {
  return new URL("/api/metrics/system", window.location.origin).toString();
}

function buildContainersUrl() {
  return new URL("/api/metrics/containers", window.location.origin).toString();
}

function formatNumber(value?: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value?: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${value.toFixed(2)}%`;
}

function formatBytes(value?: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 100 ? 0 : 2)} ${units[unit]}`;
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

function formatUptime(value?: number) {
  if (!value || Number.isNaN(value)) return "--";
  const total = Math.floor(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function MetricsLatencyPage() {
  const [data, setData] = useState<LatencyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [systemData, setSystemData] = useState<SystemMetrics | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [containersData, setContainersData] =
    useState<ContainersMetrics | null>(null);
  const [containersError, setContainersError] = useState<string | null>(null);
  const [containersLoading, setContainersLoading] = useState(false);
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

  const loadLatency = useCallback(async () => {
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

  const loadSystem = useCallback(async () => {
    try {
      setSystemLoading(true);
      setSystemError(null);
      const res = await fetch(buildSystemUrl());
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao buscar system");
      }
      const payload = (await res.json()) as SystemMetrics;
      setSystemData(payload);
    } catch (err: any) {
      setSystemError(err?.message || "Erro inesperado");
    } finally {
      setSystemLoading(false);
    }
  }, []);

  const loadContainers = useCallback(async () => {
    try {
      setContainersLoading(true);
      setContainersError(null);
      const res = await fetch(buildContainersUrl());
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao buscar containers");
      }
      const payload = (await res.json()) as ContainersMetrics;
      setContainersData(payload);
    } catch (err: any) {
      setContainersError(err?.message || "Erro inesperado");
    } finally {
      setContainersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatency();
    loadSystem();
    loadContainers();
  }, [loadLatency, loadSystem, loadContainers]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = Number(refreshMs);
    if (!Number.isFinite(interval) || interval < 2000) return;
    const id = setInterval(() => {
      loadLatency();
      loadSystem();
      loadContainers();
    }, interval);
    return () => clearInterval(id);
  }, [autoRefresh, refreshMs, loadLatency, loadSystem, loadContainers]);

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

  const resolvedSystem = systemData ?? data?.system ?? null;
  const systemCards = useMemo(() => {
    if (!resolvedSystem) return [];
    const { cpu, memory, loadAvg, uptimeSec } = resolvedSystem;
    return [
      {
        label: "CPU",
        value: formatPercent(cpu?.usagePct),
        unit: "",
        info: `Cores: ${formatNumber(cpu?.cores)}`,
      },
      {
        label: "Memoria",
        value: formatBytes(memory?.usedBytes),
        unit: "",
        info: `Uso: ${formatPercent(memory?.usedPct)} / Total: ${formatBytes(
          memory?.totalBytes
        )}`,
      },
      {
        label: "Disponivel",
        value: formatBytes(memory?.availableBytes),
        unit: "",
        info: "Memoria livre do host.",
      },
      {
        label: "Load avg",
        value: loadAvg ? loadAvg.map((v) => v.toFixed(2)).join(" / ") : "--",
        unit: "",
        info: "Load average 1m / 5m / 15m.",
      },
      {
        label: "Uptime",
        value: formatUptime(uptimeSec),
        unit: "",
        info: "Tempo ligado da VPS.",
      },
    ];
  }, [resolvedSystem]);

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
              onClick={() => {
                loadLatency();
                loadSystem();
                loadContainers();
              }}
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

        {systemError && (
          <section className={styles.errorBox}>
            <strong>System:</strong> {systemError}
          </section>
        )}

        {(resolvedSystem || systemLoading) && (
          <section className={styles.cards}>
            {systemLoading && !systemCards.length ? (
              <div className={styles.card}>
                <span>Sistema</span>
                <strong>Carregando...</strong>
              </div>
            ) : (
              systemCards.map((card, index) => (
                <div
                  key={card.label}
                  className={styles.card}
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
                  <strong>
                    {card.value}{" "}
                    {card.unit ? (
                      <em className={styles.unitInline}>{card.unit}</em>
                    ) : null}
                  </strong>
                </div>
              ))
            )}
          </section>
        )}

        {containersError && (
          <section className={styles.errorBox}>
            <strong>Containers:</strong> {containersError}
          </section>
        )}

        {(containersData || containersLoading || data?.containers) && (
          <section className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h2>Containers</h2>
              <div className={styles.tableMeta}>
                <span>
                  Status:{" "}
                  {(containersData ?? data?.containers)?.enabled
                    ? "Ativo"
                    : "Indisponivel"}
                </span>
                <span>
                  Containers:{" "}
                  {formatNumber(
                    (containersData ?? data?.containers)?.count || 0
                  )}
                </span>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPU</th>
                    <th>Memoria</th>
                    <th>% Host</th>
                    <th>Net RX</th>
                    <th>Net TX</th>
                  </tr>
                </thead>
                <tbody>
                  {containersLoading &&
                  !(containersData ?? data?.containers)?.containers?.length ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyRow}>
                        Carregando containers...
                      </td>
                    </tr>
                  ) : (
                    (containersData ?? data?.containers)?.containers?.map(
                      (container) => (
                        <tr key={container.name}>
                          <td>{container.name}</td>
                          <td>{formatPercent(container.cpuPercent)}</td>
                          <td>{formatBytes(container.memUsageBytes)}</td>
                          <td>{formatPercent(container.memPercentHost)}</td>
                          <td>{formatBytes(container.netRxBytes)}</td>
                          <td>{formatBytes(container.netTxBytes)}</td>
                        </tr>
                      )
                    )
                  )}
                  {!(containersData ?? data?.containers)?.containers?.length &&
                    !containersLoading && (
                      <tr>
                        <td colSpan={6} className={styles.emptyRow}>
                          Nenhum container reportado.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
