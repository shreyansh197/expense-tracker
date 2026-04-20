"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Clock, TrendingUp, Target, Sparkles } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/pushSubscription";
import type { NotificationPrefs } from "@/types";

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  eveningReminder: true,
  eveningReminderTime: "21:00",
  weeklyDigest: false,
  budgetAlerts: true,
};

function getPrefs(settingsNotifications?: Partial<NotificationPrefs>): NotificationPrefs {
  return { ...DEFAULT_PREFS, ...settingsNotifications };
}

export function NotificationSettings() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const prefs = getPrefs(settings.notificationPrefs as Partial<NotificationPrefs> | undefined);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      toast("Notifications are not supported in this browser", "error");
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "denied") {
      toast("Notification permission denied. You can change this in browser settings.", "error");
      return false;
    }
    return result === "granted";
  }, [toast]);

  const updatePrefs = useCallback((update: Partial<NotificationPrefs>) => {
    const newPrefs = { ...prefs, ...update };
    updateSettings({ notificationPrefs: newPrefs });
  }, [prefs, updateSettings]);

  const handleToggleEnabled = useCallback(async () => {
    if (!prefs.enabled) {
      const granted = await requestPermission();
      if (!granted) return;
      const subscribed = await subscribeToPush();
      if (!subscribed) {
        toast("Could not set up push notifications. Try again later.", "error");
        return;
      }
      updatePrefs({ enabled: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      toast("Notifications enabled", "success");
    } else {
      await unsubscribeFromPush();
      updatePrefs({ enabled: false });
      toast("Notifications disabled", "success");
    }
  }, [prefs.enabled, requestPermission, updatePrefs, toast]);

  const notSupported = typeof Notification === "undefined";
  const blocked = permission === "denied";

  return (
    <div className="space-y-4">
      {notSupported && (
        <p className="text-xs" style={{ color: "var(--warning-text)" }}>
          Push notifications are not supported in this browser.
        </p>
      )}

      {blocked && (
        <div className="rounded-lg p-3" style={{ background: "var(--warning-soft)" }}>
          <p className="text-xs" style={{ color: "var(--warning-text)" }}>
            Notifications are blocked. Update your browser settings to allow notifications for this site.
          </p>
        </div>
      )}

      {!notSupported && !blocked && (
        <div className="space-y-3">
          {/* Evening Reminder */}
          <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: "var(--surface-secondary)" }}>
            <Clock size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Evening reminder</p>
                <button
                  role="switch"
                  aria-checked={prefs.enabled && prefs.eveningReminder}
                  disabled={!prefs.enabled}
                  onClick={() => updatePrefs({ eveningReminder: !prefs.eveningReminder })}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    prefs.enabled && prefs.eveningReminder ? "bg-brand" : "bg-[var(--border-strong)]"
                  } ${!prefs.enabled ? "opacity-40" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      prefs.enabled && prefs.eveningReminder ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                A gentle &quot;Log your day?&quot; nudge
              </p>
              {prefs.enabled && prefs.eveningReminder && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs" style={{ color: "var(--text-muted)" }}>Time:</label>
                  <input
                    type="time"
                    value={prefs.eveningReminderTime}
                    onChange={(e) => updatePrefs({ eveningReminderTime: e.target.value })}
                    className="rounded-md border px-2 py-1 text-xs"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Weekly Digest */}
          <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: "var(--surface-secondary)" }}>
            <TrendingUp size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Weekly digest</p>
                <button
                  role="switch"
                  aria-checked={prefs.enabled && prefs.weeklyDigest}
                  disabled={!prefs.enabled}
                  onClick={() => updatePrefs({ weeklyDigest: !prefs.weeklyDigest })}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    prefs.enabled && prefs.weeklyDigest ? "bg-brand" : "bg-[var(--border-strong)]"
                  } ${!prefs.enabled ? "opacity-40" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      prefs.enabled && prefs.weeklyDigest ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Sunday summary of your week&apos;s spending
              </p>
            </div>
          </div>

          {/* Budget Alerts */}
          <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: "var(--surface-secondary)" }}>
            <Target size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Budget milestones</p>
                <button
                  role="switch"
                  aria-checked={prefs.enabled && prefs.budgetAlerts}
                  disabled={!prefs.enabled}
                  onClick={() => updatePrefs({ budgetAlerts: !prefs.budgetAlerts })}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    prefs.enabled && prefs.budgetAlerts ? "bg-brand" : "bg-[var(--border-strong)]"
                  } ${!prefs.enabled ? "opacity-40" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      prefs.enabled && prefs.budgetAlerts ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Alert when you cross 75% or 100% of budget
              </p>
            </div>
          </div>

          {/* Smart Nudges */}
          <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: "var(--surface-secondary)" }}>
            <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Smart nudges</p>
                <button
                  role="switch"
                  aria-checked={prefs.enabled && (prefs.smartNudges ?? false)}
                  disabled={!prefs.enabled}
                  onClick={() => updatePrefs({ smartNudges: !(prefs.smartNudges ?? false) })}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    prefs.enabled && prefs.smartNudges ? "bg-brand" : "bg-[var(--border-strong)]"
                  } ${!prefs.enabled ? "opacity-40" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      prefs.enabled && prefs.smartNudges ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Context-aware tips based on your spending patterns (max 3/week)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Prefs are synced to the server via the notification_prefs field in settings.
// The server sends push notifications based on the stored prefs and push subscriptions.
