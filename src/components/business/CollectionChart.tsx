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
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className={p.dataKey === "received" ? "text-emerald-600 dark:text-emerald-400" : ""} style={p.dataKey !== "received" ? { color: 'var(--text-secondary)' } : undefined}>
            {p.dataKey === "received" ? "Received" : "Expected"}
          </span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
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
    <div className="card p-5">
      <h3 className="text-card-title mb-3">
        Monthly Collections
      </h3>
      {!hasAnyReceived && (
        <p className="text-meta mb-2">No payments received yet — grey bars show expected amounts.</p>
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
