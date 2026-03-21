"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical, Pencil, Check, X, RotateCcw } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import {
  getAllCategories,
  PRESET_COLORS,
  DEFAULT_CATEGORIES_META,
} from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
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

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (allCategories.some((c) => c.id === id)) {
      toast("Category already exists", "error");
      return;
    }
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
    const val = parseFloat(budgetValue);
    if (isNaN(val) || val < 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    const next = { ...budgets };
    if (val === 0) delete next[catId];
    else next[catId] = val;
    updateSettings({ categoryBudgets: next });
    setBudgetEditId(null);
    toast(val === 0 ? "Budget removed" : "Budget saved");
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
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <RotateCcw size={12} />
          Restore {settings.hiddenDefaults.length} hidden default
          {settings.hiddenDefaults.length > 1 ? "s" : ""}
        </button>
      )}

      {/* Add category form */}
      {showAdd ? (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
              maxLength={30}
              autoFocus
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg px-2 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="h-6 w-6 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? "#1d4ed8" : "transparent",
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
        >
          <Plus size={14} />
          Add Category
        </button>
      )}

      <p className="text-[10px] text-gray-400">
        Tap the budget amount to set per-category spending limits. Drag custom categories to reorder.
      </p>
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
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
        isDragging ? "opacity-50" : ""
      } ${isDragOver ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? (e) => { e.preventDefault(); onDragOver(); } : undefined}
      onDrop={draggable ? onDragEnd : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      {draggable && (
        <GripVertical size={14} className="shrink-0 cursor-grab text-gray-300 dark:text-gray-600" />
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
            className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="flex gap-0.5">
            {PRESET_COLORS.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onEditColor(c)}
                className="h-4 w-4 rounded-full border"
                style={{
                  backgroundColor: c,
                  borderColor: editColor === c ? "#1d4ed8" : "transparent",
                }}
              />
            ))}
          </div>
          <button onClick={onSaveEdit} className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
            <Check size={14} />
          </button>
          <button onClick={onCancelEdit} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
            {cat.label}
          </span>

          {/* Budget display/edit */}
          {isBudgetEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">₹</span>
              <input
                type="number"
                min="0"
                value={budgetValue}
                onChange={(e) => onBudgetChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onBudgetSave(); if (e.key === "Escape") onBudgetCancel(); }}
                autoFocus
                className="w-20 rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-right text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button onClick={onBudgetSave} className="rounded px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400">
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={onBudgetStart}
              className="text-xs font-medium text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {budget ? formatCurrency(budget) : "Set limit"}
            </button>
          )}

          {isCustom && (
            <button
              onClick={onStartEdit}
              className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={`Edit ${cat.label}`}
            >
              <Pencil size={12} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            aria-label={`Remove ${cat.label}`}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}
