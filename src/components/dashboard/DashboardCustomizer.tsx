"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, Eye, EyeOff, RotateCcw, Settings2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardSectionId, DashboardSectionConfig, DashboardLayout } from "@/types";

const SECTION_LABELS: Record<DashboardSectionId, string> = {
  kpi: "KPI Cards",
  alerts: "Alerts & Budget Warnings",
  subscriptions: "Recurring Expenses",
  goals: "Savings Goals",
  charts: "Charts (Category + Daily Trend)",
  recent: "Recent Expenses",
};

export const DEFAULT_SECTIONS: DashboardSectionConfig[] = [
  { id: "kpi", visible: true, order: 0 },
  { id: "alerts", visible: true, order: 1 },
  { id: "subscriptions", visible: true, order: 2 },
  { id: "goals", visible: true, order: 3 },
  { id: "charts", visible: true, order: 4 },
  { id: "recent", visible: true, order: 5 },
];

function getSections(layout?: DashboardLayout): DashboardSectionConfig[] {
  if (!layout?.sections?.length) return DEFAULT_SECTIONS;
  // Ensure all section IDs are present (forward compat)
  const existing = new Set(layout.sections.map(s => s.id));
  const merged = [...layout.sections];
  for (const def of DEFAULT_SECTIONS) {
    if (!existing.has(def.id)) merged.push(def);
  }
  return merged.sort((a, b) => a.order - b.order);
}

// ── Sortable item ──

function SortableItem({ section, onToggle }: { section: DashboardSectionConfig; onToggle: (id: DashboardSectionId) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 transition-colors",
        isDragging ? "z-50 shadow-lg" : "",
      )}
      {...attributes}
    >
      <button
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing"
        style={{ color: "var(--text-muted)" }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      <span
        className={cn("flex-1 text-sm font-medium", !section.visible && "line-through opacity-50")}
        style={{ color: "var(--text-primary)" }}
      >
        {SECTION_LABELS[section.id]}
      </span>

      <button
        onClick={() => onToggle(section.id)}
        className="rounded-lg p-1.5 transition-colors"
        style={{ color: section.visible ? "var(--primary)" : "var(--text-muted)" }}
        aria-label={section.visible ? "Hide section" : "Show section"}
      >
        {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
}

// ── Main component ──

interface DashboardCustomizerProps {
  layout?: DashboardLayout;
  onSave: (layout: DashboardLayout) => void;
}

export function DashboardCustomizer({ layout, onSave }: DashboardCustomizerProps) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState(() => getSections(layout));

  // Reset when layout prop changes (e.g. after sync)
  const [prevLayout, setPrevLayout] = useState(layout);
  if (layout !== prevLayout) {
    setPrevLayout(layout);
    if (!open) setSections(getSections(layout));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id);
      const newIndex = prev.findIndex(s => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const handleToggle = useCallback((id: DashboardSectionId) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  }, []);

  const handleSave = useCallback(() => {
    onSave({ sections });
    setOpen(false);
  }, [sections, onSave]);

  const handleReset = useCallback(() => {
    setSections(DEFAULT_SECTIONS);
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setSections(getSections(layout)); setOpen(true); }}
        className="rounded-lg p-2 transition-colors"
        style={{ color: "var(--text-secondary)", background: "var(--surface-secondary)" }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
        aria-label="Customize dashboard"
        title="Customize dashboard"
      >
        <Settings2 size={18} />
      </button>

      {/* Slide-over panel — portalled to body to escape stacking contexts */}
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <m.div
              className="fixed inset-0 z-[70] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <m.div
              className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-sm flex-col shadow-2xl"
              style={{ background: "var(--surface)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between border-b px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  Customize Dashboard
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Section list */}
              <div className="flex-1 overflow-y-auto px-2 py-3">
                <p className="mb-3 px-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Drag to reorder sections. Toggle to show/hide.
                </p>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {sections.map(section => (
                        <SortableItem
                          key={section.id}
                          section={section}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between border-t px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors bg-cta hover:bg-cta-hover"
                >
                  Save Layout
                </button>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>,
      document.body)}
    </>
  );
}

/**
 * Get ordered visible section IDs from dashboard layout.
 * Returns default order if no custom layout is set.
 */
export function getVisibleSections(layout?: DashboardLayout): DashboardSectionId[] {
  const sections = getSections(layout);
  return sections.filter(s => s.visible).map(s => s.id);
}
