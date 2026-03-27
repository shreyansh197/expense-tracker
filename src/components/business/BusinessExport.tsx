"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { Ledger, Payment } from "@/types";

interface BusinessExportProps {
  ledgers: Ledger[];
  allPayments: Payment[];
  receivedByLedger: Record<string, number>;
}

export function BusinessExport({ ledgers, allPayments, receivedByLedger }: BusinessExportProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");

  const exportData = () => {
    if (format === "csv") {
      exportCSV();
    } else {
      exportJSON();
    }
  };

  const exportCSV = () => {
    // Ledgers sheet
    const ledgerRows = [
      ["Name", "Expected", "Received", "Remaining", "Status", "Due Date", "Tags", "Notes"].join(","),
      ...ledgers.map((l) => {
        const received = receivedByLedger[l.id] || 0;
        return [
          `"${l.name.replace(/"/g, '""')}"`,
          l.expectedAmount,
          received,
          l.expectedAmount - received,
          l.status,
          l.dueDate ? new Date(l.dueDate).toISOString().split("T")[0] : "",
          `"${l.tags.join(", ")}"`,
          `"${(l.notes || "").replace(/"/g, '""')}"`,
        ].join(",");
      }),
    ].join("\n");

    // Payments sheet
    const paymentRows = [
      ["Ledger", "Amount", "Date", "Method", "Reference", "Notes"].join(","),
      ...allPayments.map((p) => {
        const ledger = ledgers.find((l) => l.id === p.ledgerId);
        return [
          `"${(ledger?.name || "Unknown").replace(/"/g, '""')}"`,
          p.amount,
          p.date,
          p.method || "",
          `"${(p.reference || "").replace(/"/g, '""')}"`,
          `"${(p.notes || "").replace(/"/g, '""')}"`,
        ].join(",");
      }),
    ].join("\n");

    const csv = `=== LEDGERS ===\n${ledgerRows}\n\n=== PAYMENTS ===\n${paymentRows}`;
    download(csv, "business-export.csv", "text/csv");
  };

  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      ledgers: ledgers.map((l) => ({
        ...l,
        received: receivedByLedger[l.id] || 0,
        payments: allPayments.filter((p) => p.ledgerId === l.id),
      })),
    };
    download(JSON.stringify(data, null, 2), "business-export.json", "application/json");
  };

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as "csv" | "json")}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>
      <button
        onClick={exportData}
        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <Download size={12} />
        Export
      </button>
    </div>
  );
}
