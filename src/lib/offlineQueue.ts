interface QueuedOperation {
  type: "add" | "update" | "delete";
  payload: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_KEY = "expense-tracker-offline-queue";

function readQueue(): QueuedOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(ops: QueuedOperation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

export function enqueue(op: QueuedOperation) {
  const queue = readQueue();
  queue.push(op);
  writeQueue(queue);
}

export function dequeue(): QueuedOperation | undefined {
  const queue = readQueue();
  const op = queue.shift();
  writeQueue(queue);
  return op;
}

export function getAll(): QueuedOperation[] {
  return readQueue();
}

export function getPendingCount(): number {
  return readQueue().length;
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function flushQueue(handlers: {
  add: (payload: Record<string, unknown>) => Promise<void>;
  update: (payload: Record<string, unknown>) => Promise<void>;
  delete: (payload: Record<string, unknown>) => Promise<void>;
}): Promise<{ success: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    try {
      await handlers[op.type](op.payload);
      success++;
    } catch {
      failed++;
      remaining.push(op);
    }
  }

  writeQueue(remaining);
  return { success, failed };
}
