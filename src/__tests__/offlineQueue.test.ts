/// <reference types="jest" />

// Mock localStorage and window for the offline queue (which checks typeof window)
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
};

// Set up global window + localStorage before module import
Object.defineProperty(global, "window", { value: {}, writable: true, configurable: true });
Object.defineProperty(global, "localStorage", { value: mockLocalStorage, writable: true, configurable: true });

import { enqueue, dequeue, getAll, getPendingCount, clearQueue } from "../lib/offlineQueue";

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("offlineQueue", () => {
  test("starts empty", () => {
    expect(getPendingCount()).toBe(0);
    expect(getAll()).toEqual([]);
  });

  test("enqueue adds items", () => {
    enqueue({ type: "add", payload: { amount: 100 }, timestamp: Date.now() });
    expect(getPendingCount()).toBe(1);
  });

  test("enqueue multiple items", () => {
    enqueue({ type: "add", payload: { amount: 100 }, timestamp: Date.now() });
    enqueue({ type: "delete", payload: { id: "abc" }, timestamp: Date.now() });
    expect(getPendingCount()).toBe(2);
  });

  test("dequeue returns first item and removes it", () => {
    enqueue({ type: "add", payload: { amount: 100 }, timestamp: 1 });
    enqueue({ type: "delete", payload: { id: "abc" }, timestamp: 2 });
    const item = dequeue();
    expect(item?.type).toBe("add");
    expect(getPendingCount()).toBe(1);
  });

  test("dequeue returns undefined when empty", () => {
    expect(dequeue()).toBeUndefined();
  });

  test("getAll returns all items without removing", () => {
    enqueue({ type: "add", payload: { amount: 100 }, timestamp: 1 });
    enqueue({ type: "delete", payload: { id: "abc" }, timestamp: 2 });
    const all = getAll();
    expect(all).toHaveLength(2);
    expect(getPendingCount()).toBe(2);
  });

  test("clearQueue empties the queue", () => {
    enqueue({ type: "add", payload: { amount: 100 }, timestamp: 1 });
    enqueue({ type: "delete", payload: { id: "abc" }, timestamp: 2 });
    clearQueue();
    expect(getPendingCount()).toBe(0);
    expect(getAll()).toEqual([]);
  });
});
