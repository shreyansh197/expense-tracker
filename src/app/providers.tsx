"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { SplashScreen } from "@/components/app/SplashScreen";
import { OfflineScreen } from "@/components/app/OfflineScreen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
        <SplashScreen />
        <OfflineScreen />
      </ThemeProvider>
    </LazyMotion>
  );
}
