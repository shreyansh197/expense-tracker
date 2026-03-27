"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useCurrency } from "@/hooks/useCurrency";

interface CollectionChartProps {
  data: { month: string; received: number; expected: number }[];
}

function CollectionTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  const { formatCurrency } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className={p.dataKey === "received" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-300"}>
            {p.dataKey === "received" ? "Received" : "Expected"}
          </span>
          <span className="font-medium text-slate-900 dark:text-white">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CollectionChart({ data }: CollectionChartProps) {
  const { symbol } = useCurrency();
  if (data.length === 0) return null;

  const hasAnyReceived = data.some((d) => d.received > 0);
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("en-IN", { month: "short" }),
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Monthly Collections
      </h3>
      {!hasAnyReceived && (
        <p className="mb-2 text-xs text-slate-400">No payments received yet — grey bars show expected amounts.</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="[&_line]:stroke-slate-200 dark:[&_line]:stroke-slate-700" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} className="dark:[&_text]:!fill-slate-400" />
          <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v: number) => `${symbol}${(v / 1000).toFixed(0)}k`} className="dark:[&_text]:!fill-slate-400" />
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
