"use client";

import { useState } from "react";
import { Plus, Trash2, Zap, X } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { getAllCategories } from "@/lib/categories";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export interface AutoRule {
  id: string;
  name: string;
  condition: {
    field: "remark" | "amount" | "category";
    operator: "contains" | "equals" | "greater_than" | "less_than";
    value: string;
  };
  action: {
    type: "set_category" | "add_tag" | "flag";
    value: string;
  };
  enabled: boolean;
  createdAt: number;
}

const STORAGE_KEY = "expense-tracker-auto-rules";

function loadRules(): AutoRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveRules(rules: AutoRule[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function useAutoRules() {
  const [rules, setRules] = useState<AutoRule[]>(loadRules);

  const addRule = (rule: Omit<AutoRule, "id" | "createdAt">) => {
    const newRule: AutoRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    setRules((prev) => {
      const next = [...prev, newRule];
      saveRules(next);
      return next;
    });
    return newRule;
  };

  const removeRule = (id: string) => {
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRules(next);
      return next;
    });
  };

  const toggleRule = (id: string) => {
    setRules((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      saveRules(next);
      return next;
    });
  };

  return { rules, addRule, removeRule, toggleRule };
}

export function AutoRulesManager() {
  const { rules, addRule, removeRule, toggleRule } = useAutoRules();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [condField, setCondField] = useState<"remark" | "amount">("remark");
  const [condOp, setCondOp] = useState<"contains" | "equals" | "greater_than" | "less_than">("contains");
  const [condValue, setCondValue] = useState("");
  const [actionType, setActionType] = useState<"set_category" | "flag">("set_category");
  const [actionValue, setActionValue] = useState<string>(allCategories[0]?.id || "");

  const resetForm = () => {
    setName("");
    setCondField("remark");
    setCondOp("contains");
    setCondValue("");
    setActionType("set_category");
    setActionValue(allCategories[0]?.id || "");
    setShowForm(false);
  };

  const handleAdd = () => {
    if (!name.trim() || !condValue.trim()) {
      toast("Fill in all fields", "error");
      return;
    }
    addRule({
      name: name.trim(),
      condition: { field: condField, operator: condOp, value: condValue.trim() },
      action: { type: actionType, value: actionValue },
      enabled: true,
    });
    resetForm();
    toast("Rule created");
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
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Auto-categorize expenses based on remark or amount patterns.
      </p>

      {rules.length === 0 && !showForm && (
        <p className="py-3 text-center text-xs text-gray-400">
          No rules yet. Create one to auto-categorize your expenses.
        </p>
      )}

      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
            rule.enabled
              ? "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50"
              : "border-gray-100 bg-gray-50/50 opacity-60 dark:border-gray-800 dark:bg-gray-800/30"
          }`}
        >
          <Zap size={14} className={rule.enabled ? "text-amber-500" : "text-gray-400"} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
              {rule.name}
            </p>
            <p className="text-[10px] text-gray-400">
              If {rule.condition.field} {rule.condition.operator.replace("_", " ")}{" "}
              &ldquo;{rule.condition.value}&rdquo; → {rule.action.type === "set_category" ? catMap[rule.action.value]?.label || rule.action.value : "Flag"}
            </p>
          </div>
          <button
            onClick={() => toggleRule(rule.id)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              rule.enabled
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {rule.enabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => handleDelete(rule.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {showForm ? (
        <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">New Rule</span>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Rule name (e.g., Swiggy = Eat Out)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full rounded border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={condField}
              onChange={(e) => setCondField(e.target.value as "remark" | "amount")}
              className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="remark">Remark</option>
              <option value="amount">Amount</option>
            </select>
            <select
              value={condOp}
              onChange={(e) => setCondOp(e.target.value as typeof condOp)}
              className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {condField === "remark" ? (
                <>
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                </>
              ) : (
                <>
                  <option value="greater_than">Greater than</option>
                  <option value="less_than">Less than</option>
                  <option value="equals">Equals</option>
                </>
              )}
            </select>
            <input
              type={condField === "amount" ? "number" : "text"}
              placeholder={condField === "amount" ? "₹ amount" : "keyword"}
              value={condValue}
              onChange={(e) => setCondValue(e.target.value)}
              className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as "set_category" | "flag")}
              className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="set_category">Set Category</option>
              <option value="flag">Flag for Review</option>
            </select>
            {actionType === "set_category" && (
              <select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Create Rule
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
        >
          <Plus size={14} />
          Add Rule
        </button>
      )}
    </div>
  );
}
