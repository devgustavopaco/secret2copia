import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import styles from "../styles/arb-calculators.module.scss";

/** ===================== helpers ===================== */
const toNum = (v: string | number) => {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number, d = 4) => (Number.isFinite(n) ? n.toFixed(d) : "--");
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const Positive = ({ value }: { value: number }) => (
  <span className={value >= 0 ? styles.pos : styles.neg}>{fmtPct(value)}</span>
);

/** ===================== Preço Médio ===================== */
type BuyRow = { id: string; price: string; qty: string };
function AveragePriceCalculator({ onBack }: { onBack?: () => void }) {
  const [rows, setRows] = useState<BuyRow[]>([
    { id: crypto.randomUUID(), price: "", qty: "" },
    { id: crypto.randomUUID(), price: "", qty: "" },
  ]);

  const totals = useMemo(() => {
    let qty = 0;
    let cost = 0;
    for (const r of rows) {
      const p = toNum(r.price);
      const q = toNum(r.qty);
      if (q > 0 && p >= 0) {
        qty += q;
        cost += p * q;
      }
    }
    return { qty, cost, avg: qty > 0 ? cost / qty : 0 };
  }, [rows]);

  return (
    <section className={styles.card}>
      <div className={styles.headRow}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            ← Voltar
          </button>
        )}
        <header className={styles.cardHeader}>
          <h2>Preço Médio</h2>
          <button
            className={`${styles.btn} ${styles.sm}`}
            onClick={() =>
              setRows((r) => [
                ...r,
                { id: crypto.randomUUID(), price: "", qty: "" },
              ])
            }
          >
            + Adicionar
          </button>
        </header>
      </div>

      <div className={styles.list}>
        {rows.map((r, idx) => (
          <div className={styles.row} key={r.id}>
            <div className={styles.rowTitle}>Compra #{idx + 1}</div>
            <div className={styles.grid2}>
              <label>
                <span>Preço</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={r.price}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, price: e.target.value } : x
                      )
                    )
                  }
                />
              </label>
              <label>
                <span>Quantidade</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={r.qty}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, qty: e.target.value } : x
                      )
                    )
                  }
                />
              </label>
            </div>

            {rows.length > 1 && (
              <button
                className={`${styles.iconBtn} ${styles.danger}`}
                aria-label="Remover"
                onClick={() =>
                  setRows((prev) => prev.filter((x) => x.id !== r.id))
                }
                title="Remover"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <footer className={styles.resultBox}>
        <div className={styles.big}>Preço Médio</div>
        <div className={styles.avg}>{fmt(totals.avg, 4)}</div>
        <div className={styles.muted}>
          Quantidade Total: {fmt(totals.qty, 4)}
        </div>
      </footer>
    </section>
  );
}

/** ===================== Ordens Fracionadas ===================== */
type FractionRow = { id: string; percent: string; needPass: string };
function FractionalOrdersCalculator({ onBack }: { onBack?: () => void }) {
  const [originalQty, setOriginalQty] = useState<string>("");
  const [rows, setRows] = useState<FractionRow[]>([]);

  const progress = useMemo(
    () =>
      rows.reduce((acc, r) => {
        const p = toNum(r.percent);
        return acc + (p > 0 ? p : 0);
      }, 0),
    [rows]
  );

  const total = toNum(originalQty);
  const tokensPerOrder = (p: number) => (total * p) / 100;

  return (
    <section className={styles.card}>
      <div className={styles.headRow}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            ← Voltar
          </button>
        )}
        <header className={styles.cardHeader}>
          <h2>Ordem Fracionada</h2>
          <button
            className={`${styles.btn} ${styles.sm}`}
            onClick={() =>
              setRows((r) => [
                ...r,
                { id: crypto.randomUUID(), percent: "", needPass: "" },
              ])
            }
          >
            + Adicionar Ordem
          </button>
        </header>
      </div>

      <label>
        <span>Quantidade Total de Tokens</span>
        <input
          type="number"
          inputMode="decimal"
          step="any"
          placeholder="Ex.: 1000"
          value={originalQty}
          onChange={(e) => setOriginalQty(e.target.value)}
        />
      </label>

      <div className={styles.list}>
        {rows.map((r, idx) => (
          <div className={styles.row} key={r.id}>
            <div className={styles.rowTitle}>Ordem #{idx + 1}</div>

            <div className={styles.grid3}>
              <label>
                <span>Porcentagem (%)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={r.percent}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, percent: e.target.value } : x
                      )
                    )
                  }
                />
              </label>
              <label>
                <span>Precisa Passar</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={r.needPass}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, needPass: e.target.value } : x
                      )
                    )
                  }
                />
              </label>
              <div className={styles.mini}>
                <span>Qtd. desta ordem</span>
                <div className={styles.pill}>
                  {fmt(tokensPerOrder(toNum(r.percent)), 4)}
                </div>
              </div>
            </div>

            <button
              className={`${styles.iconBtn} ${styles.danger}`}
              aria-label="Remover"
              onClick={() =>
                setRows((prev) => prev.filter((x) => x.id !== r.id))
              }
              title="Remover"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className={styles.progressBox}>
        <div className={styles.progressHeader}>
          <span>Progresso Total</span>
          <strong>{Math.min(progress, 100).toFixed(2)}%</strong>
        </div>
        <div className={styles.progress}>
          <div
            className={styles.bar}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

/** ===================== Calculadoras nomeáveis (Entrada/Saída) ===================== */
type ExecCalc = {
  id: string;
  name: string;
  entrySpot: string;
  entryShort: string;
  exitSpot: string;
  exitShort: string;
};
const LS_KEY = "arbitrage_exec_calculators_v1";

function loadCalcs(): ExecCalc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ExecCalc[]) : [];
  } catch {
    return [];
  }
}
function saveCalcs(c: ExecCalc[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(c));
}

function OneExecCard({
  calc,
  onChange,
  onDelete,
}: {
  calc: ExecCalc;
  onChange: (next: ExecCalc) => void;
  onDelete: () => void;
}) {
  const entry = useMemo(() => {
    const s = toNum(calc.entrySpot);
    const sh = toNum(calc.entryShort);
    if (s <= 0 || sh <= 0) return 0;
    return (sh / s - 1) * 100;
  }, [calc.entrySpot, calc.entryShort]);

  const exit = useMemo(() => {
    const s = toNum(calc.exitSpot);
    const sh = toNum(calc.exitShort);
    if (s <= 0 || sh <= 0) return 0;
    return (s / sh - 1) * 100;
  }, [calc.exitSpot, calc.exitShort]);

  const total = entry + exit;

  return (
    <div className={styles.execCard}>
      <div className={styles.execHeader}>
        <input
          className={styles.nameInput}
          placeholder="Nome da calculadora"
          value={calc.name}
          onChange={(e) => onChange({ ...calc, name: e.target.value })}
        />
        <button
          className={`${styles.iconBtn} ${styles.danger}`}
          onClick={onDelete}
          title="Remover"
        >
          ✕
        </button>
      </div>

      <div className={styles.box}>
        <div className={`${styles.legend} ${styles.green}`}>
          + Ordem de Entrada
        </div>
        <div className={styles.grid2}>
          <label>
            <span>Valor SPOT</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={calc.entrySpot}
              onChange={(e) => onChange({ ...calc, entrySpot: e.target.value })}
            />
          </label>
          <label>
            <span>Valor SHORT</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={calc.entryShort}
              onChange={(e) =>
                onChange({ ...calc, entryShort: e.target.value })
              }
            />
          </label>
        </div>
        <div className={styles.center}>
          Lucro da Entrada: <Positive value={entry} />
        </div>
      </div>

      <div className={styles.box}>
        <div className={`${styles.legend} ${styles.red}`}>→ Ordem de Saída</div>
        <div className={styles.grid2}>
          <label>
            <span>Valor SPOT</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={calc.exitSpot}
              onChange={(e) => onChange({ ...calc, exitSpot: e.target.value })}
            />
          </label>
          <label>
            <span>Valor SHORT</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={calc.exitShort}
              onChange={(e) => onChange({ ...calc, exitShort: e.target.value })}
            />
          </label>
        </div>
        <div className={styles.center}>
          Lucro da Saída: <Positive value={exit} />
        </div>
      </div>

      <div className={styles.resultFinal}>
        <div className={styles.muted}>Resultado Final</div>
        <div className={styles.finalNumber}>
          <Positive value={total} />
        </div>
        <div className={`${styles.muted} ${styles.small}`}>
          {fmtPct(entry)} + {fmtPct(exit)} = {fmtPct(total)}
        </div>
      </div>
    </div>
  );
}

function ExecCalculatorDeck({ onBack }: { onBack?: () => void }) {
  const [calcs, setCalcs] = useState<ExecCalc[]>([]);
  useEffect(() => setCalcs(loadCalcs()), []);
  useEffect(() => saveCalcs(calcs), [calcs]);

  return (
    <section className={`${styles.card} ${styles.full}`}>
      <div className={styles.headRow}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            ← Voltar
          </button>
        )}
        <header className={styles.cardHeader}>
          <h2>Calculadoras</h2>
          <button
            className={styles.btn}
            onClick={() =>
              setCalcs((c) => [
                ...c,
                {
                  id: crypto.randomUUID(),
                  name: `Calculadora #${c.length + 1}`,
                  entrySpot: "",
                  entryShort: "",
                  exitSpot: "",
                  exitShort: "",
                },
              ])
            }
          >
            + Adicionar Nova
          </button>
        </header>
      </div>

      {calcs.length === 0 ? (
        <div className={styles.empty}>Nenhuma calculadora criada.</div>
      ) : (
        <div className={styles.deck}>
          {calcs.map((c) => (
            <OneExecCard
              key={c.id}
              calc={c}
              onChange={(next) =>
                setCalcs((prev) =>
                  prev.map((x) => (x.id === next.id ? next : x))
                )
              }
              onDelete={() =>
                setCalcs((prev) => prev.filter((x) => x.id !== c.id))
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** ===================== Página com navegação ===================== */
type View = "menu" | "avg" | "fraction" | "deck";

export default function Calculators() {
  const [view, setView] = useState<View>("menu");

  return (
    <>
      <Head>
        <title>Calculadoras de Arbitragem</title>
      </Head>

      <main className={styles.wrap}>
        <h1 className={styles.pageTitle}>Calculadoras de Arbitragem</h1>

        {/* Abas (desktop + sticky no mobile) */}
        <nav className={styles.tabbar}>
          <button
            className={`${styles.tab} ${view === "menu" ? styles.active : ""}`}
            onClick={() => setView("menu")}
          >
            Início
          </button>
          <button
            className={`${styles.tab} ${view === "avg" ? styles.active : ""}`}
            onClick={() => setView("avg")}
          >
            Preço Médio
          </button>
          <button
            className={`${styles.tab} ${
              view === "fraction" ? styles.active : ""
            }`}
            onClick={() => setView("fraction")}
          >
            Ordem Fracionada
          </button>
          <button
            className={`${styles.tab} ${view === "deck" ? styles.active : ""}`}
            onClick={() => setView("deck")}
          >
            Calculadoras
          </button>
        </nav>

        {/* Menu de entrada com CTAs grandes */}
        {view === "menu" && (
          <div className={styles.ctaGrid}>
            <button
              className={`${styles.cta} ${styles.ctaAvg}`}
              onClick={() => setView("avg")}
            >
              <span className={styles.ctaTitle}>Preço Médio</span>
              <span className={styles.ctaSubtitle}>
                Calcular média de compras
              </span>
            </button>

            <button
              className={`${styles.cta} ${styles.ctaFraction}`}
              onClick={() => setView("fraction")}
            >
              <span className={styles.ctaTitle}>Ordem Fracionada</span>
              <span className={styles.ctaSubtitle}>
                Divide execução em partes
              </span>
            </button>

            <button
              className={`${styles.cta} ${styles.ctaDeck}`}
              onClick={() => setView("deck")}
            >
              <span className={styles.ctaTitle}>Calculadoras</span>
              <span className={styles.ctaSubtitle}>
                Nomeie e salve entradas/saídas
              </span>
            </button>
          </div>
        )}

        {/* Conteúdo das calculadoras */}
        {view === "avg" && (
          <AveragePriceCalculator onBack={() => setView("menu")} />
        )}
        {view === "fraction" && (
          <FractionalOrdersCalculator onBack={() => setView("menu")} />
        )}
        {view === "deck" && (
          <ExecCalculatorDeck onBack={() => setView("menu")} />
        )}
      </main>
    </>
  );
}
