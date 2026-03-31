"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Loader2, RotateCcw, Check, X, FileImage } from "lucide-react";
import Image from "next/image";
import { extractFromReceipt, terminateOcr, type OcrResult } from "@/lib/ocr";
import { useSettings } from "@/hooks/useSettings";
import { buildCategoryMap } from "@/lib/categories";

interface ReceiptCaptureProps {
  onExtracted: (data: { amount?: number; category?: string; remark?: string }) => void;
  onClose: () => void;
}

type Stage = "idle" | "preview" | "processing" | "result";

export function ReceiptCapture({ onExtracted, onClose }: ReceiptCaptureProps) {
  const { settings } = useSettings();
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Revoke blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validate file type
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (10MB max)
    if (f.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setFile(f);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setStage("preview");
  }, []);

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    setError(null);

    try {
      const categoryLabels = Object.entries(catMap).map(([id, meta]) => ({
        id,
        label: meta.label,
      }));
      const ocrResult = await extractFromReceipt(file, categoryLabels);
      setResult(ocrResult);
      setStage("result");
    } catch {
      setError("Failed to process receipt. Please try again.");
      setStage("preview");
    }
  }, [file, catMap]);

  const cleanup = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    terminateOcr();
    onClose();
  }, [preview, onClose]);

  const handleUse = useCallback(() => {
    if (!result) return;
    onExtracted({
      amount: result.amount,
      category: result.category,
      remark: result.remark,
    });
    cleanup();
  }, [result, onExtracted, cleanup]);

  const handleRetry = useCallback(() => {
    setStage("idle");
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    fileRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Scan Receipt
        </h3>
        <button
          onClick={cleanup}
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: "var(--text-muted)" }}
          aria-label="Close scanner"
        >
          <X size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stage: idle — file input */}
      {stage === "idle" && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-32 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <Camera size={24} />
            <span className="text-sm font-medium">Take Photo or Choose Image</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            Supported: JPG, PNG, WebP — max 10MB
          </p>
        </div>
      )}

      {/* Stage: preview — show image + process button */}
      {stage === "preview" && preview && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <Image
              src={preview}
              alt="Receipt preview"
              width={400}
              height={192}
              className="h-48 w-full object-contain"
              style={{ background: "var(--surface-secondary)" }}
              unoptimized
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-colors"
              style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
            >
              <RotateCcw size={14} />
              Retake
            </button>
            <button
              onClick={handleProcess}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-xs font-semibold text-white transition-colors"
            >
              <FileImage size={14} />
              Extract Data
            </button>
          </div>
        </div>
      )}

      {/* Stage: processing — spinner */}
      {stage === "processing" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Processing receipt...
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            This may take a few seconds
          </p>
        </div>
      )}

      {/* Stage: result — show extracted data */}
      {stage === "result" && result && (
        <div className="space-y-3">
          {/* Extracted fields */}
          <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-secondary)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Amount</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: result.amount ? "var(--text-primary)" : "var(--text-muted)" }}>
                {result.amount != null ? result.amount.toLocaleString() : "Not detected"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Category</span>
              <span className="text-xs font-medium" style={{ color: result.category ? "var(--text-primary)" : "var(--text-muted)" }}>
                {result.category ? (catMap[result.category]?.label || result.category) : "Not detected"}
              </span>
            </div>
            {result.remark && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Merchant</span>
                <span className="text-xs" style={{ color: "var(--text-primary)" }}>{result.remark}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Confidence</span>
              <span className={`text-xs font-medium ${
                result.confidence >= 70 ? "text-green-600 dark:text-green-400"
                  : result.confidence >= 40 ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
              }`}>
                {Math.round(result.confidence)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-colors"
              style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
            >
              <RotateCcw size={14} />
              Retry
            </button>
            <button
              onClick={handleUse}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-xs font-semibold text-white transition-colors"
            >
              <Check size={14} />
              Use Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
