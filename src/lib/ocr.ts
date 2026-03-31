import { createWorker, type Worker } from "tesseract.js";

export interface OcrResult {
  amount?: number;
  category?: string;
  remark?: string;
  rawText: string;
  confidence: number; // 0–100
}

let _worker: Worker | null = null;
let _initPromise: Promise<Worker> | null = null;

/** Lazy-initialize Tesseract worker (heavy — only loaded when needed). */
async function getWorker(): Promise<Worker> {
  if (_worker) return _worker;
  if (_initPromise) return _initPromise;

  _initPromise = createWorker("eng", 1, {
    // Use CDN for language data to avoid bundling
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js",
  }).then((w) => {
    _worker = w;
    _initPromise = null;
    return w;
  });

  return _initPromise;
}

/** Terminate the worker to free memory. Call after done processing. */
export async function terminateOcr(): Promise<void> {
  if (_worker) {
    await _worker.terminate();
    _worker = null;
  }
}

/**
 * Extract expense data from a receipt image.
 * - Runs Tesseract OCR
 * - Extracts amount via regex (currency symbol + number patterns)
 * - Guesses category from keyword matching
 */
export async function extractFromReceipt(
  image: File | Blob | string,
  categoryLabels: Array<{ id: string; label: string }> = [],
): Promise<OcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(image);
  const text = data.text;
  const confidence = data.confidence;

  const amount = extractAmount(text);
  const category = guessCategory(text, categoryLabels);
  const remark = extractRemark(text);

  return { amount, category, remark, rawText: text, confidence };
}

// ── Amount Extraction ──

const AMOUNT_PATTERNS = [
  // "Total: $123.45" or "TOTAL ₹1,234.56"
  /(?:total|amount|grand\s*total|net|due|payable)[:\s]*[₹$€£¥]?\s*([\d,]+\.?\d{0,2})/i,
  // "$123.45" or "₹1234"
  /[₹$€£¥]\s*([\d,]+\.?\d{0,2})/,
  // "123.45 INR" or "1234.00 USD"
  /([\d,]+\.\d{2})\s*(?:INR|USD|EUR|GBP)/i,
  // Standalone large number (likely total) — last resort
  /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/,
];

function extractAmount(text: string): number | undefined {
  // Try patterns in order of specificity
  for (const pattern of AMOUNT_PATTERNS) {
    const matches = text.match(new RegExp(pattern, "gi"));
    if (matches) {
      // Re-run to extract the capture group
      const m = matches[0].match(pattern);
      if (m && m[1]) {
        const num = parseFloat(m[1].replace(/,/g, ""));
        if (!isNaN(num) && num > 0) return Math.round(num * 100) / 100;
      }
    }
  }
  return undefined;
}

// ── Category Guessing ──

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  groceries: ["grocery", "groceries", "supermarket", "mart", "fresh", "vegetables", "fruits", "dairy", "bigbasket", "dmart"],
  "eat-out": ["restaurant", "cafe", "coffee", "pizza", "burger", "food", "dining", "zomato", "swiggy", "uber eats", "mcdonald", "starbucks", "dominos"],
  transport: ["uber", "ola", "lyft", "taxi", "cab", "petrol", "diesel", "fuel", "gas station", "metro", "parking", "toll"],
  shopping: ["amazon", "flipkart", "myntra", "mall", "store", "fashion", "clothing", "electronics", "walmart", "target"],
  subscriptions: ["netflix", "spotify", "prime", "disney", "hulu", "subscription", "youtube", "apple", "microsoft", "adobe"],
  internet: ["wifi", "internet", "broadband", "airtel", "jio", "bsnl", "vodafone"],
  "credit-card": ["credit card", "card payment", "emi", "loan", "interest"],
  "sip-nps": ["sip", "nps", "mutual fund", "investment", "deposit"],
};

function guessCategory(
  text: string,
  customCategories: Array<{ id: string; label: string }>,
): string | undefined {
  const lower = text.toLowerCase();

  // Check custom categories first (label keyword match)
  for (const cat of customCategories) {
    const words = cat.label.toLowerCase().split(/\s+/);
    if (words.some((w) => w.length > 2 && lower.includes(w))) {
      return cat.id;
    }
  }

  // Check built-in keyword map
  let bestMatch: string | undefined;
  let bestCount = 0;

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchCount = keywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount > bestCount) {
      bestCount = matchCount;
      bestMatch = catId;
    }
  }

  return bestMatch;
}

// ── Remark Extraction ──

function extractRemark(text: string): string | undefined {
  // Try to find a merchant/store name from the first few lines
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;

  // First non-empty line is often the merchant name
  const candidate = lines[0];
  // Clean up: remove excessive special chars
  const cleaned = candidate.replace(/[^a-zA-Z0-9\s&'-]/g, "").trim();
  if (cleaned.length >= 3 && cleaned.length <= 50) {
    return cleaned;
  }

  return undefined;
}
