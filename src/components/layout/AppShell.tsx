"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/sync/SyncIndicator";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { useSettings } from "@/hooks/useSettings";
import { hasSyncCode } from "@/lib/deviceId";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { updateSettings, markOnboarded } = useSettings();
  const [showOnboarding, setShowOnboarding] = useState(true); // Default true — block until we confirm sync code exists
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setShowOnboarding(!hasSyncCode());
  }, []);

  // Don't render any app content until hydrated and sync code is confirmed
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
        <WelcomeModal
          onComplete={(salary) => {
            if (salary) updateSettings({ salary });
            markOnboarded();
            setShowOnboarding(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <ExpenseFormModal />
    </div>
  );
}
