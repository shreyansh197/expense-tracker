import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)", locale: "en-IN" },
  { code: "USD", symbol: "$", label: "US Dollar ($)", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "Euro (€)", locale: "de-DE" },
  { code: "GBP", symbol: "£", label: "British Pound (£)", locale: "en-GB" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

function getCurrencyMeta(code: string) {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0];
}

export function formatCurrency(amount: number, currency = "INR"): string {
  const meta = getCurrencyMeta(currency);
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency = "INR"): string {
  const meta = getCurrencyMeta(currency);
  if (amount >= 100000) {
    return `${meta.symbol}${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${meta.symbol}${(amount / 1000).toFixed(1)}K`;
  }
  const hasDecimals = amount % 1 !== 0;
  return `${meta.symbol}${hasDecimals ? amount.toFixed(2) : amount}`;
}

export function getCurrencySymbol(currency = "INR"): string {
  return getCurrencyMeta(currency).symbol;
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
