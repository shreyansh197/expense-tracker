"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/pushSubscription";
import type { NotificationPrefs } from "@/types";

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
export function useNotifications(month: number, year: number) {
  const { settings } = useSettings();
  const { budgetUsedPercent, monthlyTotal, effectiveBudget } = useCalculationsContext();
  const subscribedRef = useRef(false);

  const prefs = settings.notificationPrefs as Partial<NotificationPrefs> | undefined;

  // Manage Web Push subscription based on notification prefs
  useEffect(() => {
    const enabled = prefs?.enabled ?? false;

    if (enabled && !subscribedRef.current) {
      subscribeToPush().then((ok) => {
        subscribedRef.current = ok;
        if (ok) console.log("[notifications] Push subscription active");
      });
    } else if (!enabled && subscribedRef.current) {
      unsubscribeFromPush().then(() => {
        subscribedRef.current = false;
        console.log("[notifications] Push subscription removed");
      });
    }
  }, [prefs?.enabled]);

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
}

function formatSimple(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}
