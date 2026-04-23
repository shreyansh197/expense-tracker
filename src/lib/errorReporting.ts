import * as Sentry from "@sentry/nextjs";

/**
 * Centralized error reporting — wraps Sentry so callers don't import it directly.
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const extras = context ? { extra: context } : undefined;

  if (error instanceof Error) {
    Sentry.captureException(error, extras);
  } else {
    Sentry.captureException(new Error(String(error)), extras);
  }

  if (process.env.NODE_ENV === "development") {
    console.error("[reportError]", error, context);
  }
}
