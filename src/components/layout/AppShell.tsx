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
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only check after hydration so localStorage is available
    setShowOnboarding(!hasSyncCode());
  }, []);

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
      {showOnboarding && (
        <WelcomeModal
          onComplete={(salary) => {
            if (salary) updateSettings({ salary });
            markOnboarded();
            setShowOnboarding(false);
            // Full reload so useExpenses re-fetches with the new sync code
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
