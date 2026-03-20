import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("expense-device-id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("expense-device-id", deviceId);
  }
  return deviceId;
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString("en", { month: "long" });
}

export function getShortMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString("en", { month: "short" });
}
