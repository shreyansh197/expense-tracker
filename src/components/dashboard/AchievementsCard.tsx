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
      {/* Counter — large JetBrains Mono fraction, no progress bar */}
      <div className="mb-4 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <Award size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-section-title">Achievements</h3>
        </div>
        <div className="text-right">
          <span className="font-numeric text-2xl font-semibold leading-none tabular-nums" style={{ color: "var(--text-primary)" }}>
            {unlockedCount}
          </span>
          <span className="font-numeric text-sm" style={{ color: "var(--text-muted)" }}>
            {" "}/ {totalCount}
          </span>
          <p className="mt-0.5 font-display italic text-xs" style={{ color: "var(--text-muted)" }}>
            {totalCount - unlockedCount} more to discover
          </p>
        </div>
      </div>

      {/* Badge grid — 2-col on mobile, 5-col on sm+ */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        {achievements.map(({ def, unlocked, unlockedAt }) => {
          const isCelebrated = celebratedId === def.id;
          return (
            <m.div
              key={def.id}
              className="flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-all"
              style={{
                background: unlocked ? "var(--surface-secondary)" : "var(--surface-secondary)",
                filter: unlocked ? undefined : "grayscale(1)",
                opacity: unlocked ? 1 : 0.35,
              }}
              initial={isCelebrated ? { scale: 0.8 } : false}
              animate={isCelebrated ? { scale: [0.8, 1.2, 1.0] } : undefined}
              transition={isCelebrated ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] } : undefined}
              title={unlocked
                ? `${def.name} — unlocked ${new Date(unlockedAt).toLocaleDateString()}`
                : `${def.name} — ???`}
            >
              <span
                className="text-xl leading-none"
                role="img"
                aria-label={unlocked ? def.name : "Locked achievement"}
                style={unlocked ? {
                  filter: `drop-shadow(0 2px 6px color-mix(in srgb, currentColor 40%, transparent))`,
                } : undefined}
              >
                {def.icon}
              </span>
              <span
                className="text-xs font-medium leading-tight sm:line-clamp-1 font-display italic"
                style={{ color: unlocked ? "var(--text-secondary)" : "var(--text-muted)" }}
              >
                {unlocked ? def.name : "???"}
              </span>
              <span
                className="line-clamp-2 text-xs leading-tight sm:hidden"
                style={{ color: "var(--text-muted)" }}
              >
                {unlocked ? def.description : "Keep going to discover this"}
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
