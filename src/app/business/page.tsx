"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PlusCircle, Search, Briefcase } from "lucide-react";
import { useLedgers } from "@/hooks/useLedgers";
import { usePayments } from "@/hooks/usePayments";
import { useAllPayments } from "@/hooks/useAllPayments";
import { useBusinessCalculations } from "@/hooks/useBusinessCalculations";
import { useSettings } from "@/hooks/useSettings";
import { LedgerCard } from "@/components/business/LedgerCard";
import { LedgerForm } from "@/components/business/LedgerForm";
import { BusinessKpiCards } from "@/components/business/BusinessKpiCards";
import { CollectionChart } from "@/components/business/CollectionChart";
import { TagBreakdown } from "@/components/business/TagBreakdown";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { BusinessExport } from "@/components/business/BusinessExport";
import type { LedgerInput, Ledger } from "@/types";

// Helper to compute received per ledger — we fetch all payments for all ledgers
function LedgerListWithTotals({
  ledgers,
  filter,
  searchQuery,
}: {
  ledgers: Ledger[];
  filter: string;
  searchQuery: string;
}) {
  const filtered = ledgers.filter((l) => {
    if (filter && filter !== "all" && l.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
        <Briefcase className="h-10 w-10" />
        <p className="text-sm">No ledgers found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {filtered.map((ledger) => (
        <LedgerCardWithPayments key={ledger.id} ledger={ledger} />
      ))}
    </div>
  );
}

function LedgerCardWithPayments({ ledger }: { ledger: Ledger }) {
  const { totalReceived } = usePayments(ledger.id);
  return <LedgerCard ledger={ledger} totalReceived={totalReceived} />;
}

export default function BusinessPage() {
  const { ledgers, loading, syncStatus, addLedger } = useLedgers();
  const { settings } = useSettings();
  const { payments: allPayments } = useAllPayments();
  const stats = useBusinessCalculations(ledgers, allPayments);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Handle ?add=1 from nav button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      setShowForm(true);
      window.history.replaceState({}, "", "/business");
    }
  }, []);

  const handleAddLedger = async (data: LedgerInput) => {
    await addLedger(data);
    setShowForm(false);
  };

  if (!settings.businessMode) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Briefcase className="h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Business Mode is Off</h2>
          <p className="max-w-sm text-sm text-gray-500">
            Enable Business Owner Mode in Settings to start tracking ledgers and payments.
          </p>
          <a
            href="/settings"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Go to Settings
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Business</h1>
            <p className="text-xs text-gray-500">{ledgers.length} ledger{ledgers.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator syncStatus={syncStatus} />
            {ledgers.length > 0 && (
              <BusinessExport ledgers={ledgers} allPayments={allPayments} receivedByLedger={stats.receivedByLedger} />
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"
            >
              <PlusCircle size={16} />
              New Ledger
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/50 dark:bg-gray-900">
            <LedgerForm onSubmit={handleAddLedger} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* KPI Cards */}
        {!loading && ledgers.length > 0 && (
          <BusinessKpiCards
            totalExpected={stats.totalExpected}
            totalReceived={stats.totalReceived}
            collectionPercent={stats.collectionPercent}
            activeCount={stats.activeCount}
            overdueCount={stats.overdueCount}
            completedCount={stats.completedCount}
          />
        )}

        {/* Analytics */}
        {!loading && ledgers.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <CollectionChart data={stats.monthlyCollections} />
            <TagBreakdown data={stats.tagBreakdown} />
          </div>
        )}

        {/* Search & Filters */}
        {ledgers.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledgers..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* Ledger List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : ledgers.length === 0 && !showForm ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <Briefcase className="h-12 w-12" />
            <p className="text-sm">No ledgers yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <PlusCircle size={16} />
              Create Your First Ledger
            </button>
          </div>
        ) : (
          <LedgerListWithTotals
            ledgers={ledgers}
            filter={statusFilter}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </AppShell>
  );
}
