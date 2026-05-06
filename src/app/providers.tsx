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

/**
 * Global keyboard-awareness effect.
 *
 * On iOS Safari the virtual keyboard overlays content without resizing the
 * layout viewport. The Visual Viewport API tells us when the keyboard appears
 * (vv.height shrinks). When that happens, scroll the currently-focused input
 * into the visible area so it isn't hidden behind the keyboard.
 *
 * On Android Chrome, interactive-widget=resizes-visual (set in layout.tsx
 * viewport meta) already shrinks the visual viewport, so dvh units respond
 * correctly and this extra scroll is just a belt-and-braces safety net.
 */
function KeyboardScrollEffect() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")
      ) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
    };
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);
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
              <KeyboardScrollEffect />
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
