"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Zap, X, Pencil } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { getAllCategories } from "@/lib/categories";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useCurrency } from "@/hooks/useCurrency";
import type { AutoRule } from "@/types";

export type { AutoRule };

const LEGACY_STORAGE_KEY = "expenstream-auto-rules";

export function useAutoRules() {
  const { settings, updateSettings } = useSettings();
  const rules = (settings.autoRules ?? []) as AutoRule[];
  const migrated = useRef(false);

  // One-time migration from localStorage to synced settings
  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const legacy: AutoRule[] = JSON.parse(raw);
        if (legacy.length > 0 && rules.length === 0) {
          updateSettings({ autoRules: legacy });
        }
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addRule = (rule: Omit<AutoRule, "id" | "createdAt">) => {
    const newRule: AutoRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    updateSettings({ autoRules: [...rules, newRule] });
    return newRule;
  };

  const removeRule = (id: string) => {
    updateSettings({ autoRules: rules.filter((r) => r.id !== id) });
  };

  const toggleRule = (id: string) => {
    updateSettings({
      autoRules: rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  const updateRule = (id: string, updates: Partial<Omit<AutoRule, "id" | "createdAt">>) => {
    updateSettings({
      autoRules: rules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  return { rules, addRule, removeRule, toggleRule, updateRule };
}

export function AutoRulesManager() {
  const { symbol } = useCurrency();
  const { rules, addRule, removeRule, toggleRule, updateRule } = useAutoRules();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [condField, setCondField] = useState<"remark" | "amount" | "day_of_month" | "is_recurring">("remark");
  const [condOp, setCondOp] = useState<"contains" | "equals" | "greater_than" | "less_than" | "starts_with" | "ends_with" | "between">("contains");
  const [condValue, setCondValue] = useState("");
  const [condValue2, setCondValue2] = useState("");
  const [actionType, setActionType] = useState<"set_category" | "flag">("set_category");
  const [actionValue, setActionValue] = useState<string>(allCategories[0]?.id || "");

  const resetForm = () => {
    setName("");
    setCondField("remark");
    setCondOp("contains");
    setCondValue("");
    setCondValue2("");
    setActionType("set_category");
    setActionValue(allCategories[0]?.id || "");
    setEditingId(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast("Fill in all fields", "error");
      return;
    }
    // is_recurring needs no value; between needs both values; other fields need condValue
    if (condField === "is_recurring") {
      // value is "true"/"false", always valid
    } else if (condOp === "between") {
      if (!condValue.trim() || !condValue2.trim()) {
        toast("Fill in both range values", "error");
        return;
      }
    } else if (!condValue.trim()) {
      toast("Fill in all fields", "error");
      return;
    }

    const finalValue = condField === "is_recurring"
      ? condValue || "true"
      : condOp === "between"
        ? `${condValue.trim()},${condValue2.trim()}`
        : condValue.trim();

    if (editingId) {
      updateRule(editingId, {
        name: name.trim(),
        condition: { field: condField, operator: condOp, value: finalValue },
        action: { type: actionType, value: actionValue },
      });
      toast("Rule updated");
    } else {
      addRule({
        name: name.trim(),
        condition: { field: condField, operator: condOp, value: finalValue },
        action: { type: actionType, value: actionValue },
        enabled: true,
      });
      toast("Rule created");
    }
    resetForm();
  };

  const handleEdit = (rule: AutoRule) => {
    setEditingId(rule.id);
    setName(rule.name);
    setCondField(rule.condition.field as typeof condField);
    setCondOp(rule.condition.operator as typeof condOp);
    if (rule.condition.operator === "between" && rule.condition.value.includes(",")) {
      const [v1, v2] = rule.condition.value.split(",");
      setCondValue(v1);
      setCondValue2(v2);
    } else {
      setCondValue(rule.condition.value);
      setCondValue2("");
    }
    setActionType(rule.action.type as typeof actionType);
    setActionValue(rule.action.value);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete rule?",
      message: "This rule will be permanently removed.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      removeRule(id);
      toast("Rule deleted", "error");
    }
  };

  const catMap = Object.fromEntries(allCategories.map((c) => [c.id, c]));

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Auto-categorize expenses based on remark or amount patterns.
      </p>

      {rules.length === 0 && !showForm && (
        <p className="py-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          No rules yet. Create one to auto-categorize your expenses.
        </p>
      )}

      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${rule.enabled ? "" : "opacity-60"}`}
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <Zap size={14} className={rule.enabled ? "text-amber-500" : ""} style={!rule.enabled ? { color: 'var(--text-muted)' } : undefined} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {rule.name}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              If {rule.condition.field === "is_recurring" ? "recurring" : rule.condition.field.replace("_", " ")}{" "}
              {rule.condition.field === "is_recurring"
                ? (rule.condition.value === "true" ? "= yes" : "= no")
                : rule.condition.operator === "between"
                  ? `between ${rule.condition.value.replace(",", " and ")}`
                  : `${rule.condition.operator.replace(/_/g, " ")} "${rule.condition.value}"`}{" "}
              → {rule.action.type === "set_category" ? catMap[rule.action.value]?.label || rule.action.value : "Flag"}
            </p>
          </div>
          <button
            onClick={() => handleEdit(rule)}
            className="rounded p-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Edit rule"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => toggleRule(rule.id)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              rule.enabled
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : ""
            }`}
            style={!rule.enabled ? { background: 'var(--surface-hover)', color: 'var(--text-secondary)' } : undefined}
          >
            {rule.enabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => handleDelete(rule.id)}
            className="rounded p-1 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {showForm ? (
        <div className="space-y-3 rounded-lg p-3" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{editingId ? "Edit Rule" : "New Rule"}</span>
            <button onClick={resetForm} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Rule name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="form-input text-sm"
          />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={condField}
                onChange={(e) => {
                  const f = e.target.value as typeof condField;
                  setCondField(f);
                  setCondValue("");
                  setCondValue2("");
                  // Set sensible default operators per field
                  if (f === "remark") setCondOp("contains");
                  else if (f === "amount") setCondOp("greater_than");
                  else if (f === "day_of_month") setCondOp("equals");
                  else if (f === "is_recurring") setCondOp("equals");
                }}
                className="form-select rounded px-2 py-1.5 text-xs"
              >
                <option value="remark">Remark</option>
                <option value="amount">Amount</option>
                <option value="day_of_month">Day of Month</option>
                <option value="is_recurring">Is Recurring</option>
              </select>
              {condField !== "is_recurring" && (
                <select
                  value={condOp}
                  onChange={(e) => setCondOp(e.target.value as typeof condOp)}
                  className="form-select rounded px-2 py-1.5 text-xs"
                >
                  {condField === "remark" ? (
                    <>
                      <option value="contains">Contains</option>
                      <option value="equals">Equals</option>
                      <option value="starts_with">Starts with</option>
                      <option value="ends_with">Ends with</option>
                    </>
                  ) : condField === "day_of_month" ? (
                    <>
                      <option value="equals">Equals</option>
                      <option value="greater_than">After day</option>
                      <option value="less_than">Before day</option>
                      <option value="between">Between</option>
                    </>
                  ) : (
                    <>
                      <option value="greater_than">Greater than</option>
                      <option value="less_than">Less than</option>
                      <option value="equals">Equals</option>
                      <option value="between">Between</option>
                    </>
                  )}
                </select>
              )}
            </div>
            {condField === "is_recurring" ? (
              <select
                value={condValue || "true"}
                onChange={(e) => setCondValue(e.target.value)}
                className="form-select rounded px-2 py-1.5 text-xs w-full"
              >
                <option value="true">Yes (recurring)</option>
                <option value="false">No (one-time)</option>
              </select>
            ) : condOp === "between" ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  style={{ fontSize: "16px" }}
                  placeholder={condField === "day_of_month" ? "From day" : `Min ${symbol}`}
                  value={condValue}
                  onChange={(e) => setCondValue(e.target.value)}
                  className="form-input rounded px-2 py-1.5 text-xs"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  style={{ fontSize: "16px" }}
                  placeholder={condField === "day_of_month" ? "To day" : `Max ${symbol}`}
                  value={condValue2}
                  onChange={(e) => setCondValue2(e.target.value)}
                  className="form-input rounded px-2 py-1.5 text-xs"
                />
              </div>
            ) : (
              <input
                type={condField === "amount" || condField === "day_of_month" ? "number" : "text"}
                inputMode={condField === "amount" || condField === "day_of_month" ? "decimal" : undefined}
                style={condField === "amount" || condField === "day_of_month" ? { fontSize: "16px" } : undefined}
                placeholder={
                  condField === "amount" ? `${symbol} amount`
                  : condField === "day_of_month" ? "Day (1-31)"
                  : "keyword"
                }
                value={condValue}
                onChange={(e) => setCondValue(e.target.value)}
                className="form-input rounded px-2 py-1.5 text-xs w-full"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as "set_category" | "flag")}
              className="form-select rounded px-2 py-1.5 text-xs"
            >
              <option value="set_category">Set Category</option>
              <option value="flag">Flag for Review</option>
            </select>
            {actionType === "set_category" && (
              <select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="form-select rounded px-2 py-1.5 text-xs"
              >
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !condValue.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {editingId ? "Update Rule" : "Create Rule"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
        >
          <Plus size={14} />
          Add Rule
        </button>
      )}
    </div>
  );
}
