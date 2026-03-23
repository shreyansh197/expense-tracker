"use client";

import { useState, useCallback, createContext, useContext, useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  /** If set, user must type this string to confirm (for destructive actions) */
  requireInput?: string;
  requireInputLabel?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => Promise.resolve(false) });

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ options, resolve });
      setInputValue("");
    });
  }, []);

  useEffect(() => {
    if (pending?.options.requireInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pending]);

  const handleConfirm = () => {
    if (pending?.options.requireInput) {
      if (inputValue.toUpperCase().trim() !== pending.options.requireInput.toUpperCase().trim()) {
        return; // don't close — input doesn't match
      }
    }
    pending?.resolve(true);
    setPending(null);
  };

  const handleCancel = () => {
    pending?.resolve(false);
    setPending(null);
  };

  const variantColors = {
    danger: {
      icon: "text-red-500",
      button: "bg-red-600 hover:bg-red-700 text-white",
      border: "border-red-200 dark:border-red-800",
    },
    warning: {
      icon: "text-amber-500",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
      border: "border-amber-200 dark:border-amber-800",
    },
    default: {
      icon: "text-blue-500",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      border: "border-gray-200 dark:border-gray-700",
    },
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
          role="dialog"
          aria-modal="true"
          aria-label={pending.options.title}
        >
          <div className={cn(
            "w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl dark:bg-gray-900",
            variantColors[pending.options.variant || "default"].border
          )}>
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className={cn("mt-0.5 shrink-0", variantColors[pending.options.variant || "default"].icon)}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pending.options.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {pending.options.message}
                </p>
                {pending.options.requireInput && (
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      {pending.options.requireInputLabel || `Type "${pending.options.requireInput}" to confirm`}
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder={pending.options.requireInput}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {pending.options.cancelLabel || "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  pending.options.requireInput
                    ? inputValue.toUpperCase().trim() !== pending.options.requireInput.toUpperCase().trim()
                    : false
                }
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40",
                  variantColors[pending.options.variant || "default"].button
                )}
              >
                {pending.options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
