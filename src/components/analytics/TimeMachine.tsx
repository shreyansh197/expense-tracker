"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Clock, ArrowRightLeft, RotateCcw, Bookmark, Trash2, Copy, Check } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { getAllCategories, buildCategoryMap } from "@/lib/categories";
import { db } from "@/lib/db";

interface Scenario {
  sourceCategory: string;
  targetCategory: string;
  replacementAmount: number; // what each source expense would become
}

interface SavedScenario extends Scenario {
  id: string;
  name: string;
  savedAt: number;
}

export function TimeMachine() {
  const { currentMonth, currentYear } = useUIStore();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const { monthlyTotal, effectiveBudget } = useCalculationsContext();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  // Load saved scenarios from Dexie on mount
  useEffect(() => {
    db.timeMachineScenarios
      .orderBy("savedAt")
      .reverse()
      .limit(10)
      .toArray()
      .then((rows) =>
        setSavedScenarios(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            sourceCategory: r.sourceCategory,
            targetCategory: r.targetCategory,
            replacementAmount: r.replacementAmount,
            savedAt: r.savedAt,
          }))
        )
      )
      .catch(() => {});
  }, []);

  const allCategories = useMemo(
    () => getAllCategories(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );
  const catMap = useMemo(
    () => buildCategoryMap(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  const saveScenario = useCallback(async () => {
    if (!scenario) return;
    const entry: SavedScenario = {
      ...scenario,
      id: crypto.randomUUID(),
      name: `${catMap[scenario.sourceCategory]?.label ?? scenario.sourceCategory} → ${formatCurrency(scenario.replacementAmount)}`,
      savedAt: Date.now(),
    };
    try {
      await db.timeMachineScenarios.put({
        id: entry.id,
        name: entry.name,
        sourceCategory: entry.sourceCategory,
        targetCategory: entry.targetCategory,
        replacementAmount: entry.replacementAmount,
        savedAt: entry.savedAt,
      });
      // Reload from DB to stay in sync
      const rows = await db.timeMachineScenarios.orderBy("savedAt").reverse().limit(10).toArray();
      setSavedScenarios(
        rows.map((r) => ({
          id: r.id, name: r.name, sourceCategory: r.sourceCategory,
          targetCategory: r.targetCategory, replacementAmount: r.replacementAmount, savedAt: r.savedAt,
        }))
      );
    } catch { /* non-fatal */ }
  }, [scenario, catMap, formatCurrency]);

  const deleteSavedScenario = useCallback(async (id: string) => {
    try {
      await db.timeMachineScenarios.delete(id);
      setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch { /* non-fatal */ }
  }, []);

  const loadSavedScenario = useCallback((saved: SavedScenario) => {
    setScenario({ sourceCategory: saved.sourceCategory, targetCategory: saved.targetCategory, replacementAmount: saved.replacementAmount });
    setShowWhatIf(true);
  }, []);

  const active = useMemo(() => expenses.filter((e) => !e.deletedAt), [expenses]);

  // Category totals for scenario building
  const catTotals = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const e of active) {
      if (!map[e.category]) map[e.category] = { total: 0, count: 0 };
      map[e.category].total += e.amount;
      map[e.category].count++;
    }
    return map;
  }, [active]);

  // Compute what-if totals
  const whatIfResult = useMemo(() => {
    if (!scenario) return null;
    const { sourceCategory, replacementAmount } = scenario;
    const sourceTxns = active.filter((e) => e.category === sourceCategory);
    if (sourceTxns.length === 0) return null;

    const originalSourceTotal = sourceTxns.reduce((s, e) => s + e.amount, 0);
    const newSourceTotal = sourceTxns.length * replacementAmount;
    const savings = originalSourceTotal - newSourceTotal;
    const newMonthlyTotal = monthlyTotal - savings;

    return {
      originalSourceTotal,
      newSourceTotal,
      savings,
      newMonthlyTotal,
      transactionCount: sourceTxns.length,
      newRemaining: effectiveBudget > 0 ? effectiveBudget - newMonthlyTotal : null,
    };
  }, [scenario, active, monthlyTotal, effectiveBudget]);

  const handleReset = useCallback(() => {
    setScenario(null);
    setShowWhatIf(false);
  }, []);

  if (active.length < 3) return null;

  const sortedCategories = Object.entries(catTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([id]) => id);

  return (
    <m.div
      className="card-terrain overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Time Machine
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-secondary)", color: "var(--text-muted)" }}>
            What if?
          </span>
        </div>

        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Simulate how your month would look with different spending choices.
        </p>

        {/* Category picker */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              If every time I spent on...
            </label>
            <select
              value={scenario?.sourceCategory ?? ""}
              onChange={(e) => {
                const cat = e.target.value;
                if (!cat) { handleReset(); return; }
                const avgAmount = catTotals[cat] ? Math.round(catTotals[cat].total / catTotals[cat].count * 0.5) : 0;
                setScenario({
                  sourceCategory: cat,
                  targetCategory: cat,
                  replacementAmount: avgAmount,
                });
                setShowWhatIf(true);
              }}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-base sm:text-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="">Choose a category</option>
              {sortedCategories.map((id) => (
                <option key={id} value={id}>
                  {catMap[id]?.label ?? id} ({formatCurrency(catTotals[id].total)} · {catTotals[id].count} txns)
                </option>
              ))}
            </select>
          </div>

          {scenario && (
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                ...I had spent this instead per transaction:
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={scenario.replacementAmount === 0 ? "" : scenario.replacementAmount}
                  placeholder="0"
                  onChange={(e) => setScenario((s) => s ? { ...s, replacementAmount: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)) } : null)}
                  className="w-32 rounded-lg border px-3 py-2 text-base sm:text-sm font-numeric"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  (was avg {formatCurrency(Math.round(catTotals[scenario.sourceCategory]?.total / catTotals[scenario.sourceCategory]?.count || 0))})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {showWhatIf && whatIfResult && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-lg p-4" style={{ background: "var(--surface-secondary)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRightLeft size={14} style={{ color: "var(--accent)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Reality vs What-If
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reality</p>
                    <p className="text-lg font-bold font-numeric" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(monthlyTotal)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {catMap[scenario!.sourceCategory]?.label}: {formatCurrency(whatIfResult.originalSourceTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>What-If</p>
                    <p className="text-lg font-bold font-numeric" style={{ color: whatIfResult.savings > 0 ? "var(--success)" : "var(--danger)" }}>
                      {formatCurrency(whatIfResult.newMonthlyTotal)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {catMap[scenario!.sourceCategory]?.label}: {formatCurrency(whatIfResult.newSourceTotal)}
                    </p>
                  </div>
                </div>

                {whatIfResult.savings !== 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm font-medium" style={{ color: whatIfResult.savings > 0 ? "var(--success-text)" : "var(--danger-text)" }}>
                      {whatIfResult.savings > 0
                        ? `You would have saved ${formatCurrency(whatIfResult.savings)} across ${whatIfResult.transactionCount} transactions`
                        : `You would have spent ${formatCurrency(Math.abs(whatIfResult.savings))} more`}
                    </p>
                    {whatIfResult.newRemaining !== null && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        Budget remaining would be {formatCurrency(whatIfResult.newRemaining)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
                <button
                  onClick={saveScenario}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  <Bookmark size={12} />
                  Save scenario
                </button>
                {whatIfResult && (
                  <button
                    onClick={() => {
                      const catLabel = catMap[scenario!.sourceCategory]?.label ?? scenario!.sourceCategory;
                      const text = [
                        `Time Machine — ${catLabel}`,
                        `Reality: ${formatCurrency(monthlyTotal)} (${catLabel}: ${formatCurrency(whatIfResult.originalSourceTotal)})`,
                        `What-If: ${formatCurrency(whatIfResult.newMonthlyTotal)} (${catLabel}: ${formatCurrency(whatIfResult.newSourceTotal)})`,
                        whatIfResult.savings > 0
                          ? `Would save ${formatCurrency(whatIfResult.savings)} across ${whatIfResult.transactionCount} transactions`
                          : `Would spend ${formatCurrency(Math.abs(whatIfResult.savings))} more`,
                      ].join('\n');
                      navigator.clipboard.writeText(text).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Copy scenario as text"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Saved scenarios */}
        {savedScenarios.length > 0 && (
          <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Saved Scenarios</p>
            <div className="space-y-1.5">
              {savedScenarios.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: "var(--surface-secondary)" }}>
                  <button
                    onClick={() => loadSavedScenario(s)}
                    className="text-xs text-left flex-1 min-w-0 truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.name}
                  </button>
                  <button
                    onClick={() => deleteSavedScenario(s.id)}
                    className="shrink-0 p-1 rounded transition-colors hover:bg-[var(--danger-soft)]"
                    style={{ color: "var(--text-muted)" }}
                    aria-label={`Delete saved scenario: ${s.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
}
