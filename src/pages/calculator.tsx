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
  // Disparar evento customizado para atualizar outros componentes
  window.dispatchEvent(new CustomEvent("calculatorsUpdated"));
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

  useEffect(() => {
    setCalcs(loadCalcs());
  }, []);

  // Escutar mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setCalcs(loadCalcs());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("calculatorsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("calculatorsUpdated", handleStorageChange);
    };
  }, []);

  // Função para atualizar calculadoras
  const updateCalcs = (newCalcs: ExecCalc[]) => {
    setCalcs(newCalcs);
    saveCalcs(newCalcs);
  };

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
              updateCalcs([
                ...calcs,
                {
                  id: crypto.randomUUID(),
                  name: `Calculadora #${calcs.length + 1}`,
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
                updateCalcs(calcs.map((x) => (x.id === next.id ? next : x)))
              }
              onDelete={() => updateCalcs(calcs.filter((x) => x.id !== c.id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** ===================== Grid de Calculadoras Salvas ===================== */
function SavedCalculatorsGrid({
  onViewDeck,
  onEditCalculator,
}: {
  onViewDeck: () => void;
  onEditCalculator?: (calcId: string) => void;
}) {
  const [calcs, setCalcs] = useState<ExecCalc[]>([]);

  useEffect(() => {
    setCalcs(loadCalcs());
  }, []);

  // Escutar mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setCalcs(loadCalcs());
    };

    window.addEventListener("storage", handleStorageChange);

    // Também escutar um evento customizado para mudanças na mesma aba
    window.addEventListener("calculatorsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("calculatorsUpdated", handleStorageChange);
    };
  }, []);

  if (calcs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📱</div>
        <h3 className={styles.emptyTitle}>Nenhuma calculadora criada</h3>
        <p className={styles.emptyDescription}>
          Crie sua primeira calculadora personalizada para começar
        </p>
        <button className={styles.createBtn} onClick={onViewDeck}>
          + Criar Calculadora
        </button>
      </div>
    );
  }

  return (
    <div className={styles.savedGrid}>
      {calcs.slice(0, 4).map((calc) => (
        <div
          key={calc.id}
          className={styles.savedCard}
          onClick={() =>
            onEditCalculator ? onEditCalculator(calc.id) : onViewDeck()
          }
        >
          <div className={styles.savedHeader}>
            <h4 className={styles.savedName}>{calc.name}</h4>
            <div className={styles.savedStatus}>
              {calc.entrySpot &&
              calc.entryShort &&
              calc.exitSpot &&
              calc.exitShort
                ? "✅ Completa"
                : "⚠️ Incompleta"}
            </div>
          </div>
          <div className={styles.savedPreview}>
            <div className={styles.savedRow}>
              <span>Entrada:</span>
              <span className={styles.savedValue}>
                {calc.entrySpot && calc.entryShort
                  ? `${(
                      (toNum(calc.entryShort) / toNum(calc.entrySpot) - 1) *
                      100
                    ).toFixed(2)}%`
                  : "--"}
              </span>
            </div>
            <div className={styles.savedRow}>
              <span>Saída:</span>
              <span className={styles.savedValue}>
                {calc.exitSpot && calc.exitShort
                  ? `${(
                      (toNum(calc.exitSpot) / toNum(calc.exitShort) - 1) *
                      100
                    ).toFixed(2)}%`
                  : "--"}
              </span>
            </div>
            <div className={styles.savedRow}>
              <span>Total:</span>
              <span className={styles.savedValue}>
                {(() => {
                  if (
                    calc.entrySpot &&
                    calc.entryShort &&
                    calc.exitSpot &&
                    calc.exitShort
                  ) {
                    const entryProfit =
                      (toNum(calc.entryShort) / toNum(calc.entrySpot) - 1) *
                      100;
                    const exitProfit =
                      (toNum(calc.exitSpot) / toNum(calc.exitShort) - 1) * 100;
                    return `${(entryProfit + exitProfit).toFixed(2)}%`;
                  }
                  return "--";
                })()}
              </span>
            </div>
          </div>
        </div>
      ))}
      {calcs.length > 4 && (
        <div className={styles.viewAllCard} onClick={onViewDeck}>
          <div className={styles.viewAllContent}>
            <div className={styles.viewAllIcon}>📋</div>
            <div className={styles.viewAllText}>
              <h4>Ver Todas</h4>
              <p>+{calcs.length - 4} calculadoras</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ===================== Página com navegação ===================== */
type View = "menu" | "avg" | "fraction" | "deck";

export default function Calculators() {
  const [view, setView] = useState<View>("menu");
  const [editingCalcId, setEditingCalcId] = useState<string | null>(null);

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
          <div className={styles.menuContainer}>
            {/* Seção de Calculadoras Criadas */}
            <div className={styles.savedSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Suas Calculadoras</h2>
                <button
                  className={styles.refreshBtn}
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("calculatorsUpdated"))
                  }
                  title="Atualizar calculadoras"
                >
                  🔄
                </button>
              </div>
              <SavedCalculatorsGrid
                onViewDeck={() => setView("deck")}
                onEditCalculator={(calcId) => {
                  setEditingCalcId(calcId);
                  setView("deck");
                }}
              />
            </div>

            {/* Seção de Ferramentas */}
            <div className={styles.toolsSection}>
              <h2 className={styles.sectionTitle}>Ferramentas</h2>
              <div className={styles.toolsGrid}>
                <button
                  className={`${styles.toolCard} ${styles.toolAvg}`}
                  onClick={() => setView("avg")}
                >
                  <div className={styles.toolIcon}>📊</div>
                  <div className={styles.toolContent}>
                    <h3 className={styles.toolTitle}>Preço Médio</h3>
                    <p className={styles.toolDescription}>
                      Calcular média ponderada de compras
                    </p>
                  </div>
                  <div className={styles.toolArrow}>→</div>
                </button>

                <button
                  className={`${styles.toolCard} ${styles.toolFraction}`}
                  onClick={() => setView("fraction")}
                >
                  <div className={styles.toolIcon}>🔢</div>
                  <div className={styles.toolContent}>
                    <h3 className={styles.toolTitle}>Ordem Fracionada</h3>
                    <p className={styles.toolDescription}>
                      Divide execução em partes percentuais
                    </p>
                  </div>
                  <div className={styles.toolArrow}>→</div>
                </button>
              </div>
            </div>
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
