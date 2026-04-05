"use client";

import { useState, useEffect, startTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";
import { PlusCircle, Search, Briefcase, ArrowRightLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLedgers } from "@/hooks/useLedgers";
import { usePayments } from "@/hooks/usePayments";
import { useAllPayments } from "@/hooks/useAllPayments";
import { useBusinessCalculations } from "@/hooks/useBusinessCalculations";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LedgerCard } from "@/components/business/LedgerCard";
import { LedgerForm } from "@/components/business/LedgerForm";
import { BusinessKpiCards } from "@/components/business/BusinessKpiCards";
import { TagBreakdown } from "@/components/business/TagBreakdown";
import { RevealOnScroll } from "@/components/motion/RevealOnScroll";

const CollectionChart = dynamic(
  () => import("@/components/business/CollectionChart").then((m) => m.CollectionChart),
  { ssr: false },
);
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { BusinessExport } from "@/components/business/BusinessExport";
import { SkeletonBusinessKpi, SkeletonLedgerList } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { WalletIllustration, BusinessGraphic } from "@/components/ui/illustrations";
import { m, AnimatePresence } from "framer-motion";
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

  // Sort by most recent creation, active status first
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Active ledgers before completed/cancelled
      const statusOrder = { active: 0, completed: 1, cancelled: 2 } as const;
      const aOrder = statusOrder[a.status] ?? 1;
      const bOrder = statusOrder[b.status] ?? 1;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.createdAt - a.createdAt;
    });
  }, [filtered]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16" style={{ color: 'var(--text-tertiary)' }}>
        <Briefcase className="h-10 w-10" />
        <p className="text-sm font-medium">No ledgers found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((ledger) => (
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
  usePageTitle("Business");
  const { ledgers, loading, addLedger } = useLedgers();
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
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <EmptyState
            icon={Briefcase}
            title="Business Mode is Off"
            description="Enable Business Mode in Settings to unlock ledger tracking, collection charts, and payment management."
            action={{ label: "Go to Settings", onClick: () => window.location.href = "/settings", color: "emerald" }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTransition className="relative mx-auto min-h-[80vh] max-w-5xl xl:max-w-7xl space-y-6 p-4 lg:p-6">
        {/* Header + KPIs — emerald zone */}
        <div className="section-zone section-emerald space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BusinessGraphic />
            <div>
              <h1 className="text-page-title">Business</h1>
              <p className="text-meta mt-0.5">{ledgers.length} ledger{ledgers.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator />
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
        <AnimatePresence mode="wait">
          {loading ? (
            <m.div key="biz-kpi-skeleton" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <SkeletonBusinessKpi />
            </m.div>
          ) : ledgers.length > 0 ? (
          <BusinessKpiCards
            totalExpected={stats.totalExpected}
            totalReceived={stats.totalReceived}
            collectionPercent={stats.collectionPercent}
            activeCount={stats.activeCount}
            overdueCount={stats.overdueCount}
            completedCount={stats.completedCount}
          />
        ) : null}
        </AnimatePresence>
        </div>

        {/* Analytics — teal zone */}
        {!loading && ledgers.length > 0 && (
          <div className="section-zone section-teal">
          <div className="grid gap-4 lg:grid-cols-2">
            <RevealOnScroll>
              <CollectionChart data={stats.monthlyCollections} />
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <TagBreakdown data={stats.tagBreakdown} />
            </RevealOnScroll>
          </div>
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
        <AnimatePresence mode="wait">
          {loading ? (
            <m.div key="ledger-skeleton" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <SkeletonLedgerList />
            </m.div>
          ) : ledgers.length === 0 && !showForm ? (
          <EmptyState
            icon={Briefcase}
            secondaryIcon={ArrowRightLeft}
            illustration={<WalletIllustration />}
            title="Ready to track payments"
            description="Track client payments, freelance projects, or business receivables. Create your first ledger to get started."
            action={{ label: "Create Your First Ledger", onClick: () => setShowForm(true), color: "emerald" }}
          />
        ) : (
          <LedgerListWithTotals
            ledgers={ledgers}
            filter={statusFilter}
            searchQuery={searchQuery}
          />
        )}
        </AnimatePresence>
      </PageTransition>
    </AppShell>
  );
}
