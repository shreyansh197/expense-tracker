"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CollectionChartProps {
  data: { month: string; received: number; expected: number }[];
}

export function CollectionChart({ data }: CollectionChartProps) {
  if (data.length === 0) return null;

  const hasAnyReceived = data.some((d) => d.received > 0);
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("en-IN", { month: "short" }),
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Monthly Collections
      </h3>
      {!hasAnyReceived && (
        <p className="mb-2 text-xs text-gray-400">No payments received yet — grey bars show expected amounts.</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "received" ? "Received" : "Expected",
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value) => (value === "received" ? "Received" : "Expected")}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="expected" fill="#e5e7eb" stroke="#d1d5db" strokeWidth={1} radius={[4, 4, 0, 0]} />
          <Bar dataKey="received" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
