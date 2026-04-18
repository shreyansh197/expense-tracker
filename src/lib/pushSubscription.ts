"use client";

import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";

/**
 * Subscribe the current browser to Web Push notifications.
 * 1. Fetches the VAPID public key from the server
 * 2. Subscribes via the Push API on the service worker registration
 * 3. Sends the subscription to the server for storage
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
    if (typeof PushManager === "undefined") return false;

    const workspaceId = getActiveWorkspaceId();
    if (!workspaceId) return false;

    // 1. Get VAPID public key
    const keyRes = await fetch("/api/push/vapid-key");
    if (!keyRes.ok) return false;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    // 2. Subscribe via Push API
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();

    // If already subscribed, just ensure server has it
    let subscription = existing;
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return false;
    }

    // 3. Send to server
    const res = await authFetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        subscription: {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("[push] Subscribe failed:", err);
    return false;
  }
}

/**
 * Unsubscribe the current browser from Web Push notifications.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Tell the server to remove it
      await authFetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
    }

    return true;
  } catch (err) {
    console.error("[push] Unsubscribe failed:", err);
    return false;
  }
}

/**
 * Check if the current browser has an active push subscription.
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// ── Helpers ──

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
