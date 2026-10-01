"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { reportError } from "@/lib/errorReporting";
import { renderAnalyticsShareCard, type ShareCardData } from "@/lib/analyticsShareImage";

/** Delay before revoking the download URL so the browser has started the download. */
const DOWNLOAD_CLEANUP_MS = 200;

/**
 * Share the Analytics summary card through the Web Share API, falling back to
 * a PNG download. Failures surface as a toast and go to the error reporter —
 * never to the console (IMPLEMENTATION_RULES §12–13).
 */
export function useAnalyticsShare() {
  const { toast } = useToast();

  return useCallback(
    async (data: ShareCardData, fileName: string) => {
      try {
        const blob = await renderAnalyticsShareCard(data);
        if (!blob) return;
        const file = new File([blob], fileName, { type: "image/png" });

        if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ title: `${data.title} · ${data.subtitle} — ExpenStream`, files: [file] });
            return;
          } catch (err) {
            // The user dismissing the share sheet is not an error.
            if (err instanceof DOMException && err.name === "AbortError") return;
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, DOWNLOAD_CLEANUP_MS);
      } catch (err) {
        reportError(err, { feature: "analytics-share" });
        toast("Failed to generate share image");
      }
    },
    [toast],
  );
}
