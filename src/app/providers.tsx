"use client";

import { useEffect } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { SplashScreen } from "@/components/app/SplashScreen";
import { OfflineScreen } from "@/components/app/OfflineScreen";
import { SWUpdateListener } from "@/components/pwa/SWUpdateListener";
import { startSyncEngine, stopSyncEngine } from "@/lib/syncEngine";

function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startSyncEngine();
    return () => stopSyncEngine();
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <ToastProvider>
              <SWUpdateListener />
              <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
          </SyncProvider>
        </AuthProvider>
        <SplashScreen />
        <OfflineScreen />
      </ThemeProvider>
    </LazyMotion>
  );
}
