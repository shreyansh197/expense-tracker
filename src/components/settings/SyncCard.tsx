"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Eye, EyeOff, QrCode } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getSyncCode } from "@/lib/deviceId";

export function SyncCard() {
  const { toast } = useToast();
  const syncCode = getSyncCode();
  const [copied, setCopied] = useState(false);
  const [masked, setMasked] = useState(true);
  const [showQR, setShowQR] = useState(false);

  if (!syncCode) return null;

  const maskedCode = syncCode.slice(0, 2) + "••••";

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    toast("Sync code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Use this code on other devices to sync your expenses. Keep it private.
      </p>
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
        <span className="flex-1 font-mono text-lg font-bold tracking-[0.3em] text-blue-600 dark:text-blue-400">
          {masked ? maskedCode : syncCode}
        </span>
        <button
          onClick={() => setMasked(!masked)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={masked ? "Show sync code" : "Hide sync code"}
        >
          {masked ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button
          onClick={handleCopy}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Copy sync code"
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Show QR code"
        >
          <QrCode size={16} />
        </button>
      </div>

      {showQR && <QRDisplay code={syncCode} />}
    </div>
  );
}

function QRDisplay({ code }: { code: string }) {
  // Simple visual QR-like representation using a grid pattern derived from the code
  // This is a visual aid, not a scannable QR code (would need a library for that)
  const grid = useMemo(() => {
    const cells: boolean[][] = [];
    const seed = code.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const size = 11;
    for (let r = 0; r < size; r++) {
      cells.push([]);
      for (let c = 0; c < size; c++) {
        // Finder patterns in corners
        const isFinderCorner =
          (r < 3 && c < 3) ||
          (r < 3 && c >= size - 3) ||
          (r >= size - 3 && c < 3);
        if (isFinderCorner) {
          const localR = r < 3 ? r : r - (size - 3);
          const localC = c < 3 ? c : c - (size - 3);
          cells[r].push(
            localR === 0 || localR === 2 || localC === 0 || localC === 2 || (localR === 1 && localC === 1)
          );
        } else {
          // Data area - derive from code characters
          const val = (seed * (r + 1) * (c + 1) + code.charCodeAt((r + c) % code.length)) % 7;
          cells[r].push(val < 3);
        }
      }
    }
    return cells;
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-4 dark:bg-gray-800">
      <div className="inline-grid gap-px" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}>
        {grid.flat().map((filled, i) => (
          <div
            key={i}
            className={`h-3 w-3 ${filled ? "bg-gray-900 dark:bg-white" : "bg-white dark:bg-gray-800"}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-400">
        Share your sync code: <span className="font-mono font-bold">{code}</span>
      </p>
    </div>
  );
}
