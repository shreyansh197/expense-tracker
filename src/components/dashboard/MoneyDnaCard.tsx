"use client";

import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { Dna, ChevronRight, Share2 } from "lucide-react";
import { computeMoneyDna } from "@/lib/moneyDna";
import { computeFingerprint } from "@/lib/fingerprint";
import { FingerprintBlob } from "@/components/dashboard/FingerprintBlob";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/Toast";

export function MoneyDnaCard() {
  const { currentMonth, currentYear } = useUIStore();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const recurringTotal = useMemo(
    () => (settings.recurringExpenses ?? []).filter((r) => r.active).reduce((s, r) => s + r.amount, 0),
    [settings.recurringExpenses],
  );

  const dna = useMemo(
    () => computeMoneyDna(expenses, recurringTotal, settings.categories),
    [expenses, recurringTotal, settings.categories],
  );

  const fingerprint = useMemo(
    () => computeFingerprint(expenses, recurringTotal, settings.categories),
    [expenses, recurringTotal, settings.categories],
  );

  if (!dna) return null;

  const handleShare = async () => {
    const text = `My Money DNA: ${dna.primary.emoji} ${dna.primary.name}\n${dna.primary.description}\n\nTraits: ${dna.traits.join(", ")}\n\n— ExpenStream`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Money DNA", text });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard", "success");
    }
  };

  return (
    <m.div
      className="card-terrain overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl">{dna.primary.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Dna size={13} style={{ color: "var(--accent)" }} />
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Money DNA
            </p>
          </div>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {dna.primary.name}
          </p>
        </div>
        <ChevronRight
          size={16}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: "var(--text-muted)",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden border-t px-4 pb-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {dna.primary.description}
          </p>

          {/* Confidence bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Confidence</span>
              <span>{Number(dna.primary.confidence.toFixed(2))}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full" style={{ background: "var(--border)" }}>
              <m.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${dna.primary.confidence}%` }}
                transition={{ delay: 0.1, duration: 0.6 }}
              />
            </div>
          </div>

          {/* Secondary archetype */}
          {dna.secondary && (
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Also resembles: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{dna.secondary.emoji} {dna.secondary.name}</span> ({Number(dna.secondary.confidence.toFixed(2))}%)
            </p>
          )}

          {/* Traits */}
          {dna.traits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {dna.traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
                >
                  {trait}
                </span>
              ))}
            </div>
          )}

          {/* Financial Fingerprint */}
          {fingerprint && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Spending Fingerprint
              </p>
              <FingerprintBlob axes={fingerprint} />
            </div>
          )}

          {/* Tip */}
          <div className="mt-3 rounded-lg p-3" style={{ background: "var(--surface-secondary)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              💡 {dna.primary.tip}
            </p>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
          >
            <Share2 size={12} />
            Share my DNA
          </button>
        </m.div>
      )}
    </m.div>
  );
}
