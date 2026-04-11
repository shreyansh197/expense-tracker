"use client";

import { useEffect } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { SplashScreen } from "@/components/app/SplashScreen";
import { OfflineScreen } from "@/components/app/OfflineScreen";
import { SWUpdateListener } from "@/components/pwa/SWUpdateListener";
import { startSyncEngine, stopSyncEngine } from "@/lib/syncEngine";
import { applyAccentColor } from "@/components/settings/AccentColorPicker";
import { useSettings } from "@/hooks/useSettings";

function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startSyncEngine();
    return () => stopSyncEngine();
  }, []);
  return <>{children}</>;
}

/** Apply the user's accent color on mount and when theme/color changes */
function AccentColorEffect() {
  const { settings } = useSettings();
  const { resolved } = useTheme();
  useEffect(() => {
    applyAccentColor(settings.accentColor);
  }, [settings.accentColor, resolved]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <ToastProvider>
              <SWUpdateListener />
              <AccentColorEffect />
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
