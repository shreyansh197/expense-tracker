"use client";

import { m } from "framer-motion";
import { Check } from "lucide-react";

/**
 * Brief success checkmark burst — shows a circle + check that scales in,
 * with a fading ring expanding outward. Auto-removes after ~600ms.
 */
export function SuccessFlash({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative flex items-center justify-center">
        {/* Expanding ring */}
        <m.div
          className="absolute h-16 w-16 rounded-full border-2 border-emerald-400"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* Circle + check */}
        <m.div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.15, 1] }}
          transition={{ duration: 0.4, times: [0, 0.6, 1], ease: "easeOut" }}
          onAnimationComplete={onComplete}
        >
          <m.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Check size={32} strokeWidth={3} />
          </m.div>
        </m.div>
      </div>
    </div>
  );
}
