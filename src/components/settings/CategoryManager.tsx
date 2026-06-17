"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Pencil, Check, X, RotateCcw, GitMerge, Globe } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import {
  getAllCategories,
  PRESET_COLORS,
  DEFAULT_CATEGORIES_META,
} from "@/lib/categories";
import { useCurrency } from "@/hooks/useCurrency";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";
import type { CategoryMeta, CategoryId } from "@/types";

export function CategoryManager() {
  const { settings, updateSettings, addCategory, deleteCategory } = useSettings();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const budgets = settings.categoryBudgets || {};

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  // Budget edit state
  const [budgetEditId, setBudgetEditId] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState("");

  // Drag reorder state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Merge state
  const [mergingId, setMergingId] = useState<string | null>(null);

  // Locale preset state
  const [showPresets, setShowPresets] = useState(false);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    // Check by label to catch visually identical names ("Food" vs "Food!") regardless of slug
    if (allCategories.some((c) => c.label.toLowerCase() === name.toLowerCase())) {
      toast("Category already exists", "error");
      return;
    }
    // Append a random 4-char suffix to guarantee unique IDs even when slugs collide
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    addCategory({
      id,
      label: name,
      color: newColor,
      bgColor: newColor + "20",
      icon: "Tag",
    });
    setNewName("");
    setShowAdd(false);
    toast("Category added");
  };

  const handleDelete = async (cat: CategoryMeta) => {
    const ok = await confirm({
      title: `Remove "${cat.label}"?`,
      message: "Existing expenses in this category will keep their category tag.",
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;
    deleteCategory(cat.id);
    toast("Category removed", "error");
  };

  const handleMerge = async (sourceId: CategoryId, targetId: CategoryId) => {
    const source = allCategories.find((c) => c.id === sourceId);
    const target = allCategories.find((c) => c.id === targetId);
    if (!source || !target || sourceId === targetId) return;

    const ok = await confirm({
      title: `Merge "${source.label}" into "${target.label}"?`,
      message: `All expenses in "${source.label}" will be re-assigned to "${target.label}". This cannot be undone.`,
      confirmLabel: "Merge",
      variant: "danger",
    });
    if (!ok) { setMergingId(null); return; }

    const wid = getActiveWorkspaceId();
    if (!wid) { setMergingId(null); return; }

    // Re-assign all IDB expenses from source → target
    const expenses = await db.expenses
      .where("workspaceId").equals(wid)
      .filter((e) => e.category === sourceId && !e.deletedAt)
      .toArray();

    await Promise.all(
      expenses.map((e) => db.expenses.update(e.id, { category: targetId, updatedAt: Date.now() }))
    );

    // Remove the source category from settings
    deleteCategory(sourceId);
    setMergingId(null);
    toast(`Merged ${expenses.length} expense${expenses.length !== 1 ? "s" : ""} into "${target.label}"`);
  };

  const LOCALE_PRESETS = [
    {
      flag: "🇮🇳",
      label: "India",
      ids: ["groceries", "transport", "eat-out", "subscriptions", "credit-card", "internet", "sip-nps", "shopping", "miscellaneous"],
    },
    {
      flag: "🌍",
      label: "Global",
      ids: ["groceries", "transport", "eat-out", "subscriptions", "shopping", "miscellaneous"],
    },
    {
      flag: "🇺🇸",
      label: "US / Canada",
      ids: ["groceries", "eat-out", "transport", "subscriptions", "shopping", "miscellaneous", "internet"],
    },
    {
      flag: "🇪🇺",
      label: "Europe",
      ids: ["groceries", "transport", "eat-out", "subscriptions", "shopping", "internet", "miscellaneous"],
    },
  ];

  const applyLocalePreset = async (ids: string[]) => {
    // Show only the preset ids, hide all others from defaults
    const allDefaultIds = DEFAULT_CATEGORIES_META.map((c) => c.id);
    const hidden = allDefaultIds.filter((id) => !ids.includes(id));
    await updateSettings({ hiddenDefaults: hidden });
    setShowPresets(false);
    toast("Category preset applied");
  };

  const startEdit = (cat: CategoryMeta) => {
    setEditingId(cat.id);
    setEditName(cat.label);
    setEditColor(cat.color);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const isCustom = settings.customCategories.some((c) => c.id === editingId);
    if (isCustom) {
      const updated = settings.customCategories.map((c) =>
        c.id === editingId
          ? { ...c, label: editName.trim(), color: editColor, bgColor: editColor + "20" }
          : c
      );
      updateSettings({ customCategories: updated });
      toast("Category updated");
    }
    setEditingId(null);
  };

  const handleBudgetSave = (catId: CategoryId) => {
    const trimmed = budgetValue.trim();
    const next = { ...budgets };
    // Empty or zero → remove the limit
    if (trimmed === "" || parseFloat(trimmed) === 0) {
      delete next[catId];
      updateSettings({ categoryBudgets: next });
      setBudgetEditId(null);
      toast("Budget removed");
      return;
    }
    const val = parseFloat(trimmed);
    if (isNaN(val) || val < 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    next[catId] = val;
    updateSettings({ categoryBudgets: next });
    setBudgetEditId(null);
    toast("Budget saved");
  };

  const handleRestoreDefaults = () => {
    updateSettings({
      hiddenDefaults: [],
      categories: [
        ...DEFAULT_CATEGORIES_META.map((c) => c.id),
        ...settings.customCategories.map((c) => c.id),
      ],
    });
    toast("Default categories restored");
  };

  // Simple drag-reorder for custom categories
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (idx: number) => {
    if (dragIdx !== null && idx !== dragIdx) setDragOverIdx(idx);
  };
  const handleDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      const customCats = [...settings.customCategories];
      // Find actual indices in customCategories
      const defaultCount = DEFAULT_CATEGORIES_META.filter(
        (c) => !(settings.hiddenDefaults || []).includes(c.id)
      ).length;
      const fromCustomIdx = dragIdx - defaultCount;
      const toCustomIdx = dragOverIdx - defaultCount;

      if (fromCustomIdx >= 0 && toCustomIdx >= 0 && fromCustomIdx < customCats.length && toCustomIdx < customCats.length) {
        const [moved] = customCats.splice(fromCustomIdx, 1);
        customCats.splice(toCustomIdx, 0, moved);
        updateSettings({ customCategories: customCats });
      }
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const defaultCats = DEFAULT_CATEGORIES_META.filter(
    (cat) => !(settings.hiddenDefaults || []).includes(cat.id)
  );

  return (
    <div className="space-y-3">
      {/* Locale preset picker */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {allCategories.length} categories
        </span>
        <button
          onClick={() => setShowPresets((v) => !v)}
          className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 border transition-colors hover:bg-[var(--surface-secondary)]"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
          aria-label="Apply regional preset"
        >
          <Globe size={12} />
          Regional preset
        </button>
      </div>

      {showPresets && (
        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface-secondary)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Choose a regional preset to show relevant default categories:
          </p>
          <div className="flex flex-wrap gap-2">
            {LOCALE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyLocalePreset(p.ids)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors hover:bg-[var(--surface-primary)]"
                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                <span>{p.flag}</span>
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Hides irrelevant defaults — your custom categories and existing expenses are unaffected.
          </p>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-1">
        {defaultCats.map((cat, idx) => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            budget={budgets[cat.id]}
            isCustom={false}
            isEditing={editingId === cat.id}
            editName={editName}
            editColor={editColor}
            onEditName={setEditName}
            onEditColor={setEditColor}
            onStartEdit={() => startEdit(cat)}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onDelete={() => handleDelete(cat)}
            onMerge={() => setMergingId(cat.id)}
            isBudgetEditing={budgetEditId === cat.id}
            budgetValue={budgetValue}
            onBudgetStart={() => { setBudgetEditId(cat.id); setBudgetValue(budgets[cat.id]?.toString() || ""); }}
            onBudgetChange={setBudgetValue}
            onBudgetSave={() => handleBudgetSave(cat.id)}
            onBudgetCancel={() => setBudgetEditId(null)}
            // drag
            index={idx}
            isDragging={dragIdx === idx}
            isDragOver={dragOverIdx === idx}
            onDragStart={() => {}}
            onDragOver={() => {}}
            onDragEnd={() => {}}
            draggable={false}
          />
        ))}

        {settings.customCategories.map((cat, i) => {
          const idx = defaultCats.length + i;
          return (
            <CategoryRow
              key={cat.id}
              cat={cat}
              budget={budgets[cat.id]}
              isCustom={true}
              isEditing={editingId === cat.id}
              editName={editName}
              editColor={editColor}
              onEditName={setEditName}
              onEditColor={setEditColor}
              onStartEdit={() => startEdit(cat)}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => handleDelete(cat)}
              onMerge={() => setMergingId(cat.id)}
              isBudgetEditing={budgetEditId === cat.id}
              budgetValue={budgetValue}
              onBudgetStart={() => { setBudgetEditId(cat.id); setBudgetValue(budgets[cat.id]?.toString() || ""); }}
              onBudgetChange={setBudgetValue}
              onBudgetSave={() => handleBudgetSave(cat.id)}
              onBudgetCancel={() => setBudgetEditId(null)}
              // drag
              index={idx}
              isDragging={dragIdx === idx}
              isDragOver={dragOverIdx === idx}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={() => handleDragOver(idx)}
              onDragEnd={handleDragEnd}
              draggable={true}
            />
          );
        })}
      </div>

      {/* Restore hidden defaults */}
      {(settings.hiddenDefaults?.length ?? 0) > 0 && (
        <button
          onClick={handleRestoreDefaults}
          className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80"
          style={{ color: 'var(--secondary-text)' }}
        >
          <RotateCcw size={12} />
          Restore {settings.hiddenDefaults.length} hidden default
          {settings.hiddenDefaults.length > 1 ? "s" : ""}
        </button>
      )}

      {/* Add category form */}
      {showAdd ? (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
              maxLength={30}
              autoFocus
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--secondary-soft)' } as React.CSSProperties}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-40 transition-colors"
              style={{ background: 'var(--secondary)' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg px-2 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="h-7 w-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? "var(--secondary)" : "transparent",
                }}
                aria-label={`Select color ${c}`}
              />
            ))}
            {/* Live preview */}
            {newName.trim() && (
              <span
                className="ml-2 rounded-full px-2.5 py-1 text-[10px] font-medium"
                style={{ backgroundColor: newColor + "20", color: newColor }}
              >
                {newName.trim()}
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--secondary-text)' }}
        >
          <Plus size={14} />
          Add Category
        </button>
      )}

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Tap the budget amount to set per-category spending limits. Drag custom categories to reorder.
      </p>

      {/* Merge categories */}
      {mergingId && (
        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface-secondary)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Merge &quot;{allCategories.find((c) => c.id === mergingId)?.label}&quot; into:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allCategories
              .filter((c) => c.id !== mergingId)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleMerge(mergingId, c.id)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: c.color + "20", color: c.color }}
                >
                  {c.label}
                </button>
              ))}
          </div>
          <button
            onClick={() => setMergingId(null)}
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

interface CategoryRowProps {
  cat: CategoryMeta;
  budget?: number;
  isCustom: boolean;
  isEditing: boolean;
  editName: string;
  editColor: string;
  onEditName: (v: string) => void;
  onEditColor: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onMerge: () => void;
  isBudgetEditing: boolean;
  budgetValue: string;
  onBudgetStart: () => void;
  onBudgetChange: (v: string) => void;
  onBudgetSave: () => void;
  onBudgetCancel: () => void;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  draggable: boolean;
}

function CategoryRow({
  cat,
  budget,
  isCustom,
  isEditing,
  editName,
  editColor,
  onEditName,
  onEditColor,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onMerge,
  isBudgetEditing,
  budgetValue,
  onBudgetStart,
  onBudgetChange,
  onBudgetSave,
  onBudgetCancel,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  draggable,
}: CategoryRowProps) {
  const { formatCurrency, symbol } = useCurrency();
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
        isDragging ? "opacity-50" : ""
      } ${isDragOver ? "bg-[var(--secondary-soft)]" : "hover:bg-[var(--surface-secondary)]"}`}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? (e) => { e.preventDefault(); onDragOver(); } : undefined}
      onDrop={draggable ? onDragEnd : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      {draggable && (
        <GripVertical size={14} className="shrink-0 cursor-grab" style={{ color: 'var(--text-muted)' }} />
      )}

      <div
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: isEditing ? editColor : cat.color }}
      />

      {isEditing ? (
        <div className="flex flex-1 items-center gap-1.5">
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
            maxLength={30}
            autoFocus
            className="flex-1 rounded border px-2 py-1 text-sm focus:outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
          />
          <div className="flex flex-wrap gap-0.5 max-w-[200px] items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onEditColor(c)}
                title={c}
                className="h-5 w-5 rounded-full border transition-all hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: editColor === c ? "var(--secondary)" : "transparent",
                }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          {/* Live preview chip */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: editColor + "20", color: editColor }}
          >
            {editName || cat.label}
          </span>
          <button onClick={onSaveEdit} className="rounded p-2 transition-colors" style={{ color: 'var(--success-text)' }} aria-label="Save edit">
            <Check size={14} />
          </button>
          <button onClick={onCancelEdit} className="rounded p-2 transition-colors" style={{ color: 'var(--text-muted)' }} aria-label="Cancel edit">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
            {cat.label}
          </span>

          {/* Budget display/edit */}
          {isBudgetEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{symbol}</span>
              <input
                type="number"
                min="0"
                value={budgetValue}
                onChange={(e) => onBudgetChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onBudgetSave(); if (e.key === "Escape") onBudgetCancel(); }}
                autoFocus
                className="w-20 rounded border px-2 py-0.5 text-xs text-right focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
              />
              <button onClick={onBudgetSave} className="rounded px-1.5 py-0.5 text-xs font-medium transition-colors" style={{ color: 'var(--secondary-text)' }}>
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={onBudgetStart}
              className="text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              {budget ? formatCurrency(budget) : "Set limit"}
            </button>
          )}

          {isCustom && (
            <button
              onClick={onStartEdit}
              className="rounded p-1 transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              aria-label={`Edit ${cat.label}`}
            >
              <Pencil size={12} />
            </button>
          )}
          <button
            onClick={onMerge}
            className="rounded p-1 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            aria-label={`Merge ${cat.label}`}
            title="Merge into another category"
          >
            <GitMerge size={12} />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-2 flex items-center justify-center hover:bg-err-soft hover:text-err"
            style={{ color: 'var(--text-muted)' }}
            aria-label={`Remove ${cat.label}`}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}
