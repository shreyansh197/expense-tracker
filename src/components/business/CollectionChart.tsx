"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CollectionChartProps {
  data: { month: string; received: number; expected: number }[];
}

function CollectionTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs dark:border-gray-700 dark:bg-gray-900">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className={p.dataKey === "received" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-300"}>
            {p.dataKey === "received" ? "Received" : "Expected"}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
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
          <CartesianGrid strokeDasharray="3 3" className="[&_line]:stroke-gray-200 dark:[&_line]:stroke-gray-700" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} className="dark:[&_text]:!fill-gray-400" />
          <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} className="dark:[&_text]:!fill-gray-400" />
          <Tooltip content={<CollectionTooltip />} />
          <Legend
            formatter={(value) => {
              const color = value === "received" ? "#10b981" : "#6B7280";
              return <span style={{ color }}>{value === "received" ? "Received" : "Expected"}</span>;
            }}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="expected" fill="#e5e7eb" stroke="#d1d5db" strokeWidth={1} radius={[4, 4, 0, 0]} />
          <Bar dataKey="received" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
