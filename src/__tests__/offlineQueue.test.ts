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

import { enqueue, dequeue, getAll, getPendingCount, clearQueue, flushQueue } from "../lib/offlineQueue";

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

  test("dequeue processes items in FIFO order", () => {
    enqueue({ type: "add", payload: { a: 1 }, timestamp: 1 });
    enqueue({ type: "update", payload: { a: 2 }, timestamp: 2 });
    enqueue({ type: "delete", payload: { a: 3 }, timestamp: 3 });
    expect(dequeue()?.type).toBe("add");
    expect(dequeue()?.type).toBe("update");
    expect(dequeue()?.type).toBe("delete");
    expect(dequeue()).toBeUndefined();
  });

  test("enqueue preserves payload data", () => {
    const payload = { amount: 999, category: "groceries", id: "test-123" };
    enqueue({ type: "add", payload, timestamp: 12345 });
    const all = getAll();
    expect(all[0].payload).toEqual(payload);
    expect(all[0].timestamp).toBe(12345);
  });

  test("handles corrupted localStorage gracefully", () => {
    store[QUEUE_KEY] = "not-valid-json{{{";
    // Should not throw — returns empty
    expect(getPendingCount()).toBe(0);
    expect(getAll()).toEqual([]);
  });

  test("clearQueue on already empty queue is no-op", () => {
    clearQueue();
    expect(getPendingCount()).toBe(0);
  });

  test("large queue handles many items", () => {
    for (let i = 0; i < 100; i++) {
      enqueue({ type: "add", payload: { i }, timestamp: i });
    }
    expect(getPendingCount()).toBe(100);
    for (let i = 0; i < 100; i++) {
      const item = dequeue();
      expect(item?.payload).toEqual({ i });
    }
    expect(getPendingCount()).toBe(0);
  });
});

// =========== flushQueue ===========

const QUEUE_KEY = "expenstream-offline-queue";

describe("flushQueue", () => {
  const successHandlers = {
    add: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 0/0 when queue is empty", async () => {
    const result = await flushQueue(successHandlers);
    expect(result).toEqual({ success: 0, failed: 0 });
    expect(successHandlers.add).not.toHaveBeenCalled();
  });

  test("flushes all items successfully", async () => {
    enqueue({ type: "add", payload: { amount: 100 }, timestamp: 1 });
    enqueue({ type: "update", payload: { amount: 200 }, timestamp: 2 });
    enqueue({ type: "delete", payload: { id: "x" }, timestamp: 3 });

    const result = await flushQueue(successHandlers);
    expect(result).toEqual({ success: 3, failed: 0 });
    expect(getPendingCount()).toBe(0);
    expect(successHandlers.add).toHaveBeenCalledWith({ amount: 100 });
    expect(successHandlers.update).toHaveBeenCalledWith({ amount: 200 });
    expect(successHandlers.delete).toHaveBeenCalledWith({ id: "x" });
  });

  test("keeps failed items in queue", async () => {
    enqueue({ type: "add", payload: { amount: 100 }, timestamp: 1 });
    enqueue({ type: "add", payload: { amount: 200 }, timestamp: 2 });
    enqueue({ type: "delete", payload: { id: "y" }, timestamp: 3 });

    const failOnSecond = {
      add: jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Network error")),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const result = await flushQueue(failOnSecond);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(1);
    expect(getPendingCount()).toBe(1);
    // The remaining item is the one that failed
    const remaining = getAll();
    expect(remaining[0].payload).toEqual({ amount: 200 });
  });

  test("all items fail — queue is preserved", async () => {
    enqueue({ type: "add", payload: { a: 1 }, timestamp: 1 });
    enqueue({ type: "add", payload: { a: 2 }, timestamp: 2 });

    const allFail = {
      add: jest.fn().mockRejectedValue(new Error("fail")),
      update: jest.fn().mockRejectedValue(new Error("fail")),
      delete: jest.fn().mockRejectedValue(new Error("fail")),
    };

    const result = await flushQueue(allFail);
    expect(result).toEqual({ success: 0, failed: 2 });
    expect(getPendingCount()).toBe(2);
  });
});
