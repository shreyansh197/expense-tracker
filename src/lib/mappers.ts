import type { Expense, CategoryId } from "@/types";

/** Map a Dexie expense row to the Expense domain type. */
export function toExpense(row: {
  id: string;
  category: string;
  amount: number;
  currency?: string;
  day: number;
  month: number;
  year: number;
  remark?: string;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null | undefined;
}): Expense {
  return {
    id: row.id,
    category: row.category as CategoryId,
    amount: row.amount,
    currency: row.currency,
    day: row.day,
    month: row.month,
    year: row.year,
    remark: row.remark,
    isRecurring: row.isRecurring ?? false,
    recurringId: row.recurringId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    deviceId: "",
  };
}
