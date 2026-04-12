"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { Confetti } from "@/components/motion/Confetti";
import type { AchievementStatus } from "@/hooks/useAchievements";

interface AchievementsCardProps {
  achievements: AchievementStatus[];
  newlyUnlocked: string[];
  persistNew: () => void;
  unlockedCount: number;
  totalCount: number;
}

export function AchievementsCard({ achievements, newlyUnlocked, persistNew, unlockedCount, totalCount }: AchievementsCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebratedId, setCelebratedId] = useState<string | null>(null);

  // Persist + celebrate newly unlocked achievements (deferred to avoid cascading renders)
  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    persistNew();
    const timer = setTimeout(() => {
      setCelebratedId(newlyUnlocked[0]);
      setShowConfetti(true);
    }, 0);
    const hideTimer = setTimeout(() => setShowConfetti(false), 3000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, [newlyUnlocked, persistNew]);

  return (
    <div className="card p-5">
      <Confetti active={showConfetti} />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-section-title">Achievements</h3>
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-secondary)" }}
        role="progressbar"
        aria-valuenow={unlockedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${unlockedCount} of ${totalCount} achievements unlocked`}
      >
        <m.div
          className="h-full rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ width: 0 }}
          animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Badge grid — 2-col on mobile (with description), 5-col on sm+ */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        {achievements.map(({ def, unlocked, unlockedAt }) => {
          const isCelebrated = celebratedId === def.id;
          return (
            <m.div
              key={def.id}
              className="flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-colors"
              style={{
                background: unlocked ? "var(--surface-secondary)" : "transparent",
                opacity: unlocked ? 1 : 0.4,
              }}
              initial={isCelebrated ? { scale: 0.5 } : false}
              animate={isCelebrated ? { scale: [0.5, 1.2, 1] } : undefined}
              transition={isCelebrated ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] } : undefined}
              title={unlocked ? `${def.name} — unlocked ${new Date(unlockedAt).toLocaleDateString()}` : `${def.name} — ${def.description}`}
            >
              <span className="text-xl leading-none" role="img" aria-label={def.name}>
                {def.icon}
              </span>
              <span
                className="text-[10px] font-medium leading-tight sm:line-clamp-1"
                style={{ color: unlocked ? "var(--text-secondary)" : "var(--text-muted)" }}
              >
                {def.name}
              </span>
              <span
                className="line-clamp-2 text-[9px] leading-tight sm:hidden"
                style={{ color: "var(--text-muted)" }}
              >
                {def.description}
              </span>
            </m.div>
          );
        })}
      </div>

      {/* Celebration banner for newly unlocked */}
      <AnimatePresence>
        {celebratedId && (() => {
          const celebrated = achievements.find((a) => a.def.id === celebratedId);
          if (!celebrated) return null;
          return (
            <m.div
              key="celebration"
              className="mt-3 flex items-center gap-2 rounded-xl p-3"
              style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-lg">{celebrated.def.icon}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                  Achievement Unlocked!
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {celebrated.def.name} — {celebrated.def.description}
                </p>
              </div>
            </m.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
