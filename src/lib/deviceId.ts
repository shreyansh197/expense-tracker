const SYNC_CODE_KEY = "expense-tracker-sync-code";

function generateSyncCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 6; i++) {
    code += chars[arr[i] % chars.length];
  }
  return code;
}

export function getSyncCode(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SYNC_CODE_KEY) || "";
}

export function setSyncCode(code: string): void {
  localStorage.setItem(SYNC_CODE_KEY, code.toUpperCase().trim());
}

export function createNewSyncCode(): string {
  const code = generateSyncCode();
  setSyncCode(code);
  return code;
}

export function hasSyncCode(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(SYNC_CODE_KEY);
}

export function clearSyncCode(): void {
  localStorage.removeItem(SYNC_CODE_KEY);
}
