"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/pushSubscription";
import { evaluateSmartNudges, markNudgeSent } from "@/lib/smartNudges";
import { getSpendingStreak } from "@/lib/calculations";
import { buildCategoryMap } from "@/lib/categories";
import type { Expense, NotificationPrefs } from "@/types";

const LAST_BUDGET_ALERT_KEY = "expenstream-last-budget-alert";

/**
 * useNotifications — coordinates push notification subscriptions.
 *
 * 1. Evening reminder — handled by the server via Web Push API.
 *    This hook manages the push subscription lifecycle (subscribe/unsubscribe)
 *    when the user toggles notifications on/off.
 * 2. Budget milestone alerts — stay in the hook because they need live
 *    calculation data from the React tree (fires in-tab only).
 */
export function useNotifications(month: number, year: number, expenses?: Expense[]) {
  const { settings, updateSettings } = useSettings();
  const { budgetUsedPercent, monthlyTotal, effectiveBudget, remaining } = useCalculationsContext();
  const subscribedRef = useRef(false);
  const nudgeCheckedRef = useRef("");
  const notifPromptShownRef = useRef(false);
  const { toast } = useToast();

  const prefs = settings.notificationPrefs as Partial<NotificationPrefs> | undefined;

  // Manage Web Push subscription based on notification prefs
  useEffect(() => {
    const enabled = prefs?.enabled ?? false;

    if (enabled && !subscribedRef.current) {
      subscribeToPush().then((ok) => {
        subscribedRef.current = ok;
        if (ok) {
          console.log("[notifications] Push subscription active");
          // Auto-detect timezone on first subscription if not already saved
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz && !(prefs as Record<string, unknown> | undefined)?.timezone) {
            updateSettings({ notificationPrefs: { ...(prefs ?? {}), timezone: tz } as NotificationPrefs }).catch(() => {});
          }
        }
      });
    } else if (!enabled && subscribedRef.current) {
      unsubscribeFromPush().then(() => {
        subscribedRef.current = false;
        console.log("[notifications] Push subscription removed");
      });
    }
  }, [prefs?.enabled, prefs, updateSettings]);

  // Budget milestone alerts (in-tab, needs live data)
  useEffect(() => {
    if (!prefs?.enabled || !prefs.budgetAlerts) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (effectiveBudget <= 0) return;

    const monthKey = `${year}-${month}`;
    const lastAlert = localStorage.getItem(LAST_BUDGET_ALERT_KEY);
    const alertedMilestones: number[] = lastAlert?.startsWith(monthKey)
      ? JSON.parse(lastAlert.split(":").slice(1).join(":") || "[]")
      : [];

    const milestones = [75, 100];
    for (const milestone of milestones) {
      if (budgetUsedPercent >= milestone && !alertedMilestones.includes(milestone)) {
        const body = milestone >= 100
          ? `You've reached your monthly budget of ${formatSimple(effectiveBudget)}.`
          : `You've used 75% of your monthly budget. ${formatSimple(effectiveBudget - monthlyTotal)} remaining.`;

        new Notification("ExpenStream", {
          body,
          icon: "/icons/icon-192.png",
          tag: `budget-${milestone}`,
          silent: false,
        });

        alertedMilestones.push(milestone);
        localStorage.setItem(LAST_BUDGET_ALERT_KEY, `${monthKey}:${JSON.stringify(alertedMilestones)}`);
      }
    }
  }, [prefs?.enabled, prefs?.budgetAlerts, budgetUsedPercent, effectiveBudget, monthlyTotal, month, year]);

  // Contextual notification permission prompt at 70% budget
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (budgetUsedPercent < 70) return;
    if (notifPromptShownRef.current) return;
    if (localStorage.getItem("expenstream-notif-prompt-shown")) return;

    notifPromptShownRef.current = true;
    localStorage.setItem("expenstream-notif-prompt-shown", "1");
    toast(
      "You've used 70% of your budget — enable notifications to get alerted at 100%",
      "info",
      {
        label: "Enable",
        onClick: () => {
          Notification.requestPermission().catch(() => {});
        },
      }
    );
  }, [budgetUsedPercent, toast]);

  // Smart nudges (in-tab, max 3/week)
  useEffect(() => {
    const smartEnabled = (prefs as { smartNudges?: boolean } | undefined)?.smartNudges;
    if (!smartEnabled || !expenses || expenses.length < 10) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    // Only check once per hour
    const hourKey = `${new Date().toISOString().slice(0, 13)}`;
    if (nudgeCheckedRef.current === hourKey) return;
    nudgeCheckedRef.current = hourKey;

    const catMap = buildCategoryMap(settings.customCategories ?? [], settings.hiddenDefaults ?? []);
    const categoryLabels: Record<string, string> = {};
    for (const [id, meta] of Object.entries(catMap)) {
      categoryLabels[id] = meta.label;
    }

    const streak = getSpendingStreak(expenses);
    const nudge = evaluateSmartNudges({
      allExpenses: expenses,
      budgetRemaining: remaining,
      currentStreak: streak,
      categoryLabels,
      formatCurrency: formatSimple,
    });

    if (nudge) {
      new Notification("ExpenStream", {
        body: nudge.body,
        icon: "/icons/icon-192.png",
        tag: nudge.id,
        silent: false,
      });
      markNudgeSent(nudge.id);
    }
  }, [prefs, expenses, settings.customCategories, settings.hiddenDefaults, remaining]);
}

function formatSimple(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}
