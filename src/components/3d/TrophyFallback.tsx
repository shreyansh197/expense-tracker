"use client";

export function TrophyFallback() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Budget success trophy">
      {/* Base */}
      <rect x="16" y="38" width="16" height="4" rx="1" fill="#64748b" />
      {/* Stem */}
      <rect x="22" y="30" width="4" height="10" rx="1" fill="#b45309" />
      {/* Cup */}
      <path d="M14 12 C14 12 14 26 24 28 C34 26 34 12 34 12 Z" fill="#f59e0b" />
      {/* Rim */}
      <rect x="12" y="10" width="24" height="3" rx="1.5" fill="#d97706" />
      {/* Handles */}
      <path d="M12 14 C8 14 8 22 12 22" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M36 14 C40 14 40 22 36 22" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Star */}
      <polygon points="24,16 25.5,20 30,20 26.5,22.5 28,26 24,24 20,26 21.5,22.5 18,20 22.5,20" fill="#fffbeb" opacity="0.7" />
    </svg>
  );
}
