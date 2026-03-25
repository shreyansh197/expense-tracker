"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { AuthModal } from "@/components/onboarding/AuthModal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/components/providers/AuthProvider";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  useKeyboardShortcuts(() => setShowShortcuts(true));

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main id="main-content" className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <BottomNav />
      <ExpenseFormModal />
      <KeyboardShortcutsHelp
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { updateSettings, markOnboarded } = useSettings();
  const { isAuthenticated } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Don't render any app content until hydrated
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Show auth landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <AuthModal
        onComplete={(salary) => {
          if (salary) updateSettings({ salary });
          markOnboarded();
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <AppShellInner>{children}</AppShellInner>
    </div>
  );
}
