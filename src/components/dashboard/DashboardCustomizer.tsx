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
  heatmap: "Spending Heatmap",
  recent: "Recent Expenses",
  achievements: "Achievements",
  insights: "Spending Insights",
};

export const DEFAULT_SECTIONS: DashboardSectionConfig[] = [
  { id: "kpi", visible: true, order: 0 },
  { id: "alerts", visible: true, order: 1 },
  { id: "subscriptions", visible: true, order: 2 },
  { id: "goals", visible: true, order: 3 },
  { id: "charts", visible: true, order: 4 },
  { id: "heatmap", visible: true, order: 5 },
  { id: "recent", visible: true, order: 6 },
  { id: "achievements", visible: true, order: 7 },
  { id: "insights", visible: true, order: 8 },
];

// ── Time-aware Bento ordering ──────────────────────────────

type TimeContext = "morning" | "afternoon" | "evening" | "night";

/** Returns which part of the day it currently is. */
export function getTimeContext(): TimeContext {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "morning";
  if (hour >= 10 && hour < 19) return "afternoon";
  if (hour >= 19 && hour < 24) return "evening";
  return "night";
}

/** Personal-mode preferred section order by time and health. */
const PERSONAL_ORDER: Record<TimeContext, DashboardSectionId[]> = {
  morning:   ["kpi", "subscriptions", "alerts", "recent", "charts", "heatmap", "goals", "achievements", "insights"],
  afternoon: ["kpi", "alerts", "charts", "recent", "subscriptions", "heatmap", "insights", "goals", "achievements"],
  evening:   ["recent", "kpi", "charts", "insights", "achievements", "heatmap", "alerts", "goals", "subscriptions"],
  night:     ["kpi", "recent", "insights", "charts", "heatmap", "alerts", "goals", "subscriptions", "achievements"],
};

/** Business-mode preferred order — ledger / collection first. */
const BIZ_ORDER: Record<TimeContext, DashboardSectionId[]> = {
  morning:   ["kpi", "subscriptions", "alerts", "charts", "recent", "heatmap", "goals", "insights", "achievements"],
  afternoon: ["kpi", "alerts", "subscriptions", "charts", "heatmap", "recent", "insights", "goals", "achievements"],
  evening:   ["kpi", "recent", "charts", "alerts", "insights", "heatmap", "subscriptions", "goals", "achievements"],
  night:     ["kpi", "alerts", "charts", "recent", "subscriptions", "heatmap", "insights", "goals", "achievements"],
};

/**
 * Returns an auto-ordered section list based on time of day.
 * Only applies if the user has NOT manually reordered their layout
 * (detected by comparing stored order against DEFAULT_SECTIONS order).
 */
export function getAutoOrder(
  layout: DashboardLayout | undefined,
  isBusiness = false,
): DashboardSectionConfig[] {
  const stored = getSections(layout);

  // If user has manually reordered, respect their choice
  const isDefaultOrder = DEFAULT_SECTIONS.every(
    (def, i) => stored[i]?.id === def.id,
  );
  if (!isDefaultOrder) return stored;

  const ctx = getTimeContext();
  const priority = isBusiness ? BIZ_ORDER[ctx] : PERSONAL_ORDER[ctx];

  return priority.map((id, order) => {
    const existing = stored.find((s) => s.id === id);
    return existing ? { ...existing, order } : { id, visible: true, order };
  });
}

/**
 * Returns only visible section configs in display order (config objects).
 * Used internally by getAutoOrder.
 */
function getVisibleSectionConfigs(layout?: DashboardLayout): DashboardSectionConfig[] {
  return getSections(layout)
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get ordered visible section IDs from dashboard layout.
 * Returns default order if no custom layout is set.
 * @deprecated Use getVisibleSections for config objects; this returns IDs only.
 */
export function getVisibleSectionIds(layout?: DashboardLayout): DashboardSectionId[] {
  return getVisibleSectionConfigs(layout).map((s) => s.id);
}

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
        className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
        style={{ color: section.visible ? "var(--primary)" : "var(--text-muted)" }}
        aria-label={section.visible ? "Hide section" : "Show section"}
      >
        {section.visible ? <Eye size={18} /> : <EyeOff size={18} />}
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
        className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
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
              className="fixed inset-0 z-[200] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <m.div
              className="fixed right-0 top-0 z-[201] flex h-full w-full max-w-sm flex-col shadow-2xl"
              style={{ background: "var(--surface)", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
                  className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Close customizer"
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
                  aria-label="Reset dashboard to default layout"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary btn-md"
                  aria-label="Save dashboard layout"
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
 * Applies time-aware auto-ordering if the user has not manually reordered.
 */
export function getVisibleSections(layout?: DashboardLayout, isBusiness = false): DashboardSectionId[] {
  const sections = getAutoOrder(layout, isBusiness);
  return sections.filter(s => s.visible).map(s => s.id);
}