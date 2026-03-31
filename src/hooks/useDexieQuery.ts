"use client";

import { useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import { liveQuery, type Observable } from "dexie";

/**
 * Reactive hook for Dexie queries. Re-renders when underlying IDB data changes.
 * Returns `undefined` while the initial query is in flight, then `T` thereafter.
 * Pass a default value to always get `T` (never `undefined`).
 */
export function useDexieQuery<T>(
  querier: () => T | Promise<T>,
  deps: unknown[],
): T | undefined;
export function useDexieQuery<T>(
  querier: () => T | Promise<T>,
  deps: unknown[],
  defaultValue: T,
): T;
export function useDexieQuery<T>(
  querier: () => T | Promise<T>,
  deps: unknown[],
  defaultValue?: T,
): T | undefined {
  const querierRef = useRef(querier);
  querierRef.current = querier;

  // Create a stable store object that useSyncExternalStore can use
  const store = useMemo(() => {
    let current: T | undefined = defaultValue;
    const listeners = new Set<() => void>();
    let sub: { unsubscribe(): void } | null = null;

    function subscribe(listener: () => void) {
      listeners.add(listener);
      if (!sub) {
        const obs: Observable<T> = liveQuery(() => querierRef.current());
        sub = obs.subscribe({
          next(value: T) {
            current = value;
            listeners.forEach(fn => fn());
          },
          error() {
            // Keep previous value on error
          },
        });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && sub) {
          sub.unsubscribe();
          sub = null;
        }
      };
    }

    function getSnapshot(): T | undefined {
      return current;
    }

    function reset() {
      current = defaultValue;
      if (sub) { sub.unsubscribe(); sub = null; }
    }

    return { subscribe, getSnapshot, reset };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Clean up on unmount / deps change
  useEffect(() => {
    return () => { store.reset(); };
  }, [store]);

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => defaultValue,
  );
}
