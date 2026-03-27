"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, startTransition } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PlusCircle, Search, Briefcase } from "lucide-react";
import { useLedgers } from "@/hooks/useLedgers";
import { usePayments } from "@/hooks/usePayments";
import { useAllPayments } from "@/hooks/useAllPayments";
import { useBusinessCalculations } from "@/hooks/useBusinessCalculations";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
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
      <div className="flex flex-col items-center gap-3 py-16" style={{ color: 'var(--text-tertiary)' }}>
        <Briefcase className="h-10 w-10" />
        <p className="text-sm font-medium">No ledgers found</p>
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

  // Open ledger form when triggered from FAB / Sidebar via uiStore
  const showLedgerFormStore = useUIStore((s) => s.showLedgerForm);
  const closeLedgerForm = useUIStore((s) => s.closeLedgerForm);

  useEffect(() => {
    if (showLedgerFormStore) {
      startTransition(() => setShowForm(true));
      closeLedgerForm();
    }
  }, [showLedgerFormStore, closeLedgerForm]);

  // Cleanup on unmount — reset ledger form flag
  useEffect(() => {
    return () => { closeLedgerForm(); };
  }, [closeLedgerForm]);

  const handleAddLedger = async (data: LedgerInput) => {
    await addLedger(data);
    setShowForm(false);
  };

  if (!settings.businessMode) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Briefcase className="h-12 w-12 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Business Mode is Off</h2>
          <p className="max-w-sm text-sm text-slate-500">
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
      <div className="mx-auto max-w-5xl xl:max-w-7xl space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Business</h1>
            <p className="text-meta mt-0.5">{ledgers.length} ledger{ledgers.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator syncStatus={syncStatus} />
            {ledgers.length > 0 && (
              <BusinessExport ledgers={ledgers} allPayments={allPayments} receivedByLedger={stats.receivedByLedger} />
            )}
            <button
              onClick={() => setShowForm(true)}
              className="hidden items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.97] lg:flex"
            >
              <PlusCircle size={16} />
              New Ledger
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="card p-5">
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
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledgers..."
                className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : ledgers.length === 0 && !showForm ? (
          <div className="flex flex-col items-center gap-3 py-20" style={{ color: 'var(--text-tertiary)' }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-secondary)' }}>
              <Briefcase className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No ledgers yet</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Create a ledger to start tracking payments</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.97]"
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
