"use client";

import { useState } from "react";
import { Wallet, Link2, Copy, Check } from "lucide-react";
import { createNewSyncCode, setSyncCode } from "@/lib/deviceId";

interface WelcomeModalProps {
  onComplete: (salary?: number) => void;
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState<"choose" | "new" | "join">("choose");
  const [salary, setSalary] = useState("");
  const [syncCode, setSyncCodeLocal] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleNew = () => {
    const code = createNewSyncCode();
    setSyncCodeLocal(code);
    setStep("new");
  };

  const handleJoin = () => {
    setStep("join");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(salary);
    if (isNaN(val) || val <= 0) return;
    onComplete(val);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.toUpperCase().trim();
    if (code.length < 4) return;
    setSyncCode(code);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        {step === "choose" && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Wallet className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Welcome!
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track your expenses and sync across devices.
            </p>
            <div className="mt-5 space-y-3">
              <button
                onClick={handleNew}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Wallet className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">New Account</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Start fresh with a new sync code</p>
                </div>
              </button>
              <button
                onClick={handleJoin}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Link2 className="text-emerald-600 dark:text-emerald-400" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Join Existing</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enter a sync code from another device</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "new" && (
          <form onSubmit={handleNewSubmit} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Your Sync Code
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Save this code — use it on your other devices to sync your data.
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-4 dark:bg-gray-800">
              <span className="font-mono text-2xl font-bold tracking-[0.3em] text-blue-600 dark:text-blue-400">
                {syncCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Monthly Salary / Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <input
                  type="number"
                  min="1"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g., 50000"
                  autoFocus
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-7 pr-3 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!salary || parseFloat(salary) <= 0}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40"
            >
              Get Started
            </button>
          </form>
        )}

        {step === "join" && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Enter Sync Code
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the code from your other device to sync your expenses.
            </p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g., AB3XK7"
              maxLength={10}
              autoFocus
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-center font-mono text-xl font-bold tracking-[0.3em] text-gray-900 placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-normal placeholder:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-600"
              required
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={joinCode.length < 4}
                className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40"
              >
                Connect
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
