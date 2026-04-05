"use client";

export function VaultDoorFallback() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vault locked">
      <circle cx="24" cy="24" r="18" stroke="#94a3b8" strokeWidth="2.5" fill="#f1f5f9" />
      <circle cx="24" cy="24" r="15" stroke="#64748b" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="24" x2="32" y2="24" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="16" x2="24" y2="32" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="#334155" />
      <path d="M20 20l8 8M28 20l-8 8" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
