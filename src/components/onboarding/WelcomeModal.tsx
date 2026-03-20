"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

interface WelcomeModalProps {
  onComplete: (salary: number) => void;
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [salary, setSalary] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(salary);
    if (isNaN(val) || val <= 0) return;
    onComplete(val);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
          <Wallet className="text-blue-600 dark:text-blue-400" size={24} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Welcome!
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set your monthly budget to get started. You can change this later in settings.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              Monthly Salary / Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                ₹
              </span>
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
      </div>
    </div>
  );
}
