"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/sync/SyncIndicator";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { useSettings } from "@/hooks/useSettings";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isFirstVisit, updateSettings, markOnboarded } = useSettings();

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
      {isFirstVisit && (
        <WelcomeModal
          onComplete={(salary) => {
            updateSettings({ salary });
            markOnboarded();
          }}
        />
      )}
    </div>
  );
}
