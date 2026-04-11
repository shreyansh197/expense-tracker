"use client";

import { m, AnimatePresence } from "framer-motion";

interface FormErrorProps {
  message?: string;
  visible: boolean;
}

/**
 * Shared animated form validation error message.
 * Slides in/out with height animation for smooth UX.
 */
export function FormError({ message, visible }: FormErrorProps) {
  return (
    <AnimatePresence>
      {visible && message && (
        <m.p
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-medium text-err overflow-hidden"
          role="alert"
        >
          {message}
        </m.p>
      )}
    </AnimatePresence>
  );
}
