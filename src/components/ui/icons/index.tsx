interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Rounded grid — Dashboard/Home nav icon */
export function IconDashboard({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2.5" fill="currentColor" opacity="0.9" />
      <rect x="13" y="3" width="8" height="8" rx="2.5" fill="currentColor" opacity="0.45" />
      <rect x="3" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity="0.45" />
      <rect x="13" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity="0.65" />
    </svg>
  );
}

/** Bar chart with trend dot — Analytics/Insights nav icon */
export function IconAnalytics({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <rect x="3" y="13" width="4" height="8" rx="1.5" fill="currentColor" opacity="0.5" />
      <rect x="10" y="8" width="4" height="13" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="17" y="3" width="4" height="18" rx="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="19" cy="5" r="2" fill="currentColor" />
    </svg>
  );
}

/** Plus in rounded circle — Add Expense icon */
export function IconAddExpense({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="currentColor" opacity="0.12" />
      <circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.2" />
      <path d="M12 8.5v7M8.5 12h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Rounded sliders — Settings icon */
export function IconSettings({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="3" y="15.5" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="8" cy="7" r="2.5" fill="currentColor" />
      <circle cx="16" cy="12" r="2.5" fill="currentColor" />
      <circle cx="10" cy="17" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** Soft wallet shape — Wallet/Expenses icon */
export function IconWallet({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <rect x="14" y="10" width="8" height="5" rx="2" fill="currentColor" opacity="0.25" />
      <circle cx="17" cy="12.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Ascending arc with steps — Goals/Savings icon */
export function IconGoals({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <path d="M4 20 Q 8 14, 12 12 Q 16 10, 20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <circle cx="7" cy="16.5" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" opacity="0.7" />
      <circle cx="18" cy="6" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** Circular arrow loop — Recurring/Calendar icon */
export function IconRecurring({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <path d="M17.5 6.5A8 8 0 0 0 4.1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M6.5 17.5A8 8 0 0 0 19.9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M4 7.5L4.1 11l3.5-.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 16.5l-.1-3.5-3.5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Upward curve with dot — Trend Up icon */
export function IconTrendUp({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <path d="M4 18 Q 8 14, 12 10 Q 16 6, 20 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="4" r="2.5" fill="currentColor" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}

/** Downward curve with dot — Trend Down icon */
export function IconTrendDown({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <path d="M4 6 Q 8 10, 12 14 Q 16 18, 20 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <path d="M4 4h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}

/** Soft info circle — Insight/Info icon */
export function IconInsight({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="currentColor" opacity="0.12" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
      <rect x="11" y="10.5" width="2" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

/** Rounded triangle — Warning/Advisory icon */
export function IconWarning({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <path d="M12 3L2.5 20.5h19L12 3z" fill="currentColor" opacity="0.12" />
      <path d="M12 4.5L3.5 19.5h17L12 4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      <rect x="11.2" y="9.5" width="1.6" height="5" rx="0.8" fill="currentColor" />
    </svg>
  );
}

/** Check in rounded square — Success/Completed icon */
export function IconSuccess({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.12" />
      <path d="M8 12.5l2.8 2.8 5.2-5.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Rounded person silhouette — Profile/Account icon */
export function IconProfile({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="8.5" r="4" fill="currentColor" opacity="0.7" />
      <path d="M4 20.5c0-3.5 3.5-6 8-6s8 2.5 8 6" fill="currentColor" opacity="0.35" />
      <path d="M4 20.5c0-3.5 3.5-6 8-6s8 2.5 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

/** Rounded tag/dot — Category placeholder icon */
export function IconCategory({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.1" />
      <circle cx="9" cy="9" r="2" fill="currentColor" opacity="0.6" />
      <path d="M12.5 3.5l8 8-7.5 7.5a3 3 0 0 1-4.2 0L4.5 14.7a3 3 0 0 1 0-4.2l8-7z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}
