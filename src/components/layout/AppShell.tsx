"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { AuthModal } from "@/components/onboarding/AuthModal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUIStore } from "@/stores/uiStore";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  useKeyboardShortcuts(() => setShowShortcuts(true));
  const { nextMonth, prevMonth } = useUIStore();

  // Swipe to navigate months (mobile)
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    // Only trigger if horizontal swipe is dominant and >80px
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) prevMonth();
      else nextMonth();
    }
  }, [nextMonth, prevMonth]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-20 lg:pb-0"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
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
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
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
          window.location.replace("/");
        }}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--background)' }}>
      <AppShellInner>{children}</AppShellInner>
    </div>
  );
}
