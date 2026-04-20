"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Trophy, Plus, ChevronRight, Check, X, Info } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useExpenses } from "@/hooks/useExpenses";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";
import {
  CHALLENGE_TEMPLATES,
  getAvailableChallenges,
  startChallenge,
  evaluateChallenge,
} from "@/lib/challenges";
import type { Challenge } from "@/types";

export function SpendingChallenges() {
  const { currentMonth, currentYear } = useUIStore();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const [showPicker, setShowPicker] = useState(false);

  const activeChallenges = settings.activeChallenges ?? [];

  // Evaluate active challenges
  const evaluated = useMemo(
    () => activeChallenges.map((c) => evaluateChallenge(c, expenses)),
    [activeChallenges, expenses],
  );

  // Persist ONLY when evaluateChallenge transitions a challenge to completed/failed.
  // Adding new challenges and progress updates are handled elsewhere — this avoids
  // racing with handleStart or the sync engine.
  useEffect(() => {
    if (evaluated.length === 0 || activeChallenges.length === 0) return;
    const origMap = new Map(activeChallenges.map((c) => [c.id, c.status]));
    const hasTerminalTransition = evaluated.some((e) => {
      const origStatus = origMap.get(e.id);
      return origStatus === "active" && (e.status === "completed" || e.status === "failed");
    });
    if (!hasTerminalTransition) return;
    updateSettings({ activeChallenges: evaluated });
  }, [evaluated, activeChallenges, updateSettings]);

  const active = evaluated.filter((c) => c.status === "active");
  const recent = evaluated.filter((c) => c.status === "completed" || c.status === "failed").slice(-3);
  const available = useMemo(() => getAvailableChallenges(activeChallenges), [activeChallenges]);

  const handleStart = useCallback((templateId: string) => {
    const challenge = startChallenge(templateId);
    const updated = [...(settings.activeChallenges ?? []), challenge];
    updateSettings({ activeChallenges: updated });
    setShowPicker(false);
    const template = CHALLENGE_TEMPLATES.find((t) => t.id === templateId);
    toast(`${template?.emoji} Challenge started: ${template?.name}`, "success");
  }, [settings.activeChallenges, updateSettings, toast]);

  const handleAbandon = useCallback((challengeId: string) => {
    const updated = (settings.activeChallenges ?? []).map((c) =>
      c.id === challengeId ? { ...c, status: "abandoned" as const } : c,
    );
    updateSettings({ activeChallenges: updated });
    toast("Challenge abandoned", "success");
  }, [settings.activeChallenges, updateSettings, toast]);

  // Don't render if no challenges and no expenses
  if (expenses.length < 3 && active.length === 0) return null;

  return (
    <div className="card-terrain overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Trophy size={15} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Challenges</h3>
        </div>
        {active.length < 3 && (
          <button
            onClick={() => setShowPicker((o) => !o)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
            style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
          >
            <Plus size={12} />
            New
          </button>
        )}
      </div>

      {/* Active challenges */}
      {active.length > 0 && (
        <div className="space-y-2 px-4 pb-3">
          {active.map((challenge) => {
            const template = CHALLENGE_TEMPLATES.find((t) => t.id === challenge.templateId);
            if (!template) return null;
            return (
              <ChallengeRow
                key={challenge.id}
                challenge={challenge}
                template={template}
                onAbandon={() => handleAbandon(challenge.id)}
              />
            );
          })}
        </div>
      )}

      {/* Recent completions */}
      {active.length === 0 && recent.length > 0 && (
        <div className="px-4 pb-3">
          {recent.map((c) => {
            const template = CHALLENGE_TEMPLATES.find((t) => t.id === c.templateId);
            if (!template) return null;
            return (
              <div key={c.id} className="flex items-center gap-2 py-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {c.status === "completed" ? <Check size={12} style={{ color: "var(--success)" }} /> : <X size={12} style={{ color: "var(--text-muted)" }} />}
                <span>{template.emoji} {template.name}</span>
                <span className="ml-auto">{c.status === "completed" ? "Done!" : "Missed"}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {active.length === 0 && recent.length === 0 && !showPicker && (
        <div className="px-4 pb-4">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Start a micro-challenge to build better spending habits.
          </p>
        </div>
      )}

      {/* Challenge picker */}
      <AnimatePresence>
        {showPicker && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t"
            style={{ borderColor: "var(--border-default)" }}
          >
            {/* How it works */}
            <div className="mx-3 mt-3 mb-2 rounded-lg p-2.5 flex gap-2" style={{ background: "var(--surface-secondary)" }}>
              <Info size={13} className="shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Pick a challenge and it starts today. Progress updates automatically based on your expenses. 
                Reach 80%+ by the end to complete it. You can run up to 3 at once.
              </p>
            </div>
            <div className="space-y-1 p-3">
              {available.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleStart(template.id)}
                  className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-[var(--surface-secondary)]"
                >
                  <span className="text-lg">{template.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{template.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{template.description} · {template.durationDays}d</p>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChallengeRow({ challenge, template, onAbandon }: {
  challenge: Challenge;
  template: { name: string; emoji: string; durationDays: number };
  onAbandon: () => void;
}) {
  const [sy, sm, sd] = challenge.endDate.split("-").map(Number);
  const endDate = new Date(sy, sm - 1, sd);
  endDate.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return (
    <div className="rounded-lg p-3" style={{ background: "var(--surface-secondary)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{template.emoji}</span>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{template.name}</p>
        </div>
        <button
          onClick={onAbandon}
          className="text-xs px-2 py-0.5 rounded"
          style={{ color: "var(--text-muted)" }}
        >
          Quit
        </button>
      </div>
      <div className="mt-2">
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <m.div
            className="h-full rounded-full"
            style={{ background: challenge.progress >= 80 ? "var(--success)" : "var(--accent)" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(challenge.progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{challenge.progress}%</span>
          <span>{daysLeft}d left</span>
        </div>
      </div>
    </div>
  );
}
