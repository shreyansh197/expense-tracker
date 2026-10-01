/**
 * Branded Analytics share card (1080 × 1350 PNG), drawn on a canvas.
 *
 * Canvas cannot read CSS custom properties, so the export uses the fixed
 * "Living Terrain" light palette below — the image looks the same whatever
 * theme the user has on screen. Extracted from the Analytics page (M4) so the
 * page stays within the component-size budget and the ridge title follows the
 * selected period.
 */

const W = 1080;
const H = 1350;

const PALETTE = {
  paper: "#FAF7F2",
  ink: "#1A1B2E",
  inkSoft: "#4A4E6B",
  muted: "#7A7F96",
  moss: "#2D6B5A",
  sage: "#7BAF9E",
  under: "#1B5B4A",
  over: "#C0392B",
  cell: "#EDEBE6",
} as const;

export interface ShareCardData {
  title: string;
  subtitle: string;
  total: string;
  /** e.g. "₹2,000 under budget"; omitted without a budget. */
  budgetLine?: { text: string; over: boolean };
  ridgeTitle: string;
  months: { label: string; total: number; totalLabel: string; isSelected: boolean }[];
  /** Monthly budget in major units, or null without one. */
  budget: number | null;
  metrics: { label: string; value: string }[];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (const [color, base, a, b] of [[PALETTE.moss, 80, 25, 12], [PALETTE.sage, 50, 18, 8]] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, H - base - Math.sin(x / 60) * a - Math.sin(x / 30) * b);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawRidge(ctx: CanvasRenderingContext2D, data: ShareCardData, top: number): number {
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText(data.ridgeTitle, 80, top);

  const rowH = Math.min(56, 560 / Math.max(data.months.length, 1));
  const barMaxW = W - 300;
  // Shared scale with the budget so neither bars nor the marker overflow.
  const scale = Math.max(...data.months.map((m) => m.total), data.budget ?? 0, 1);
  data.months.forEach((m, i) => {
    const y = top + 45 + i * rowH;
    const barW = Math.max((m.total / scale) * barMaxW, 8);
    ctx.fillStyle = m.isSelected ? PALETTE.ink : PALETTE.muted;
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(m.label, 160, y + 4);
    ctx.textAlign = "left";
    ctx.fillStyle = m.isSelected ? PALETTE.moss : PALETTE.muted;
    ctx.globalAlpha = m.isSelected ? 0.9 : 0.3;
    roundRect(ctx, 180, y - 12, barW, 22, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = "600 20px 'Courier New', monospace";
    ctx.fillText(m.totalLabel, 180 + barW + 14, y + 4);
  });

  const bottom = top + 45 + data.months.length * rowH;
  if (data.budget !== null) {
    const x = 180 + (data.budget / scale) * barMaxW;
    ctx.strokeStyle = PALETTE.over;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, top + 30);
    ctx.lineTo(x, bottom - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  return bottom;
}

function drawMetrics(ctx: CanvasRenderingContext2D, metrics: ShareCardData["metrics"], top: number) {
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText("Key Metrics", 80, top);
  const cellW = (W - 160 - 30) / 2;
  metrics.forEach((m, i) => {
    const cx = 80 + (i % 2) * (cellW + 30);
    const cy = top + 30 + Math.floor(i / 2) * 90;
    ctx.fillStyle = PALETTE.cell;
    ctx.globalAlpha = 0.6;
    roundRect(ctx, cx, cy, cellW, 80, 12);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.fillText(m.label.toUpperCase(), cx + 16, cy + 30);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillText(m.value, cx + 16, cy + 64);
  });
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = PALETTE.moss;
  ctx.globalAlpha = 0.25;
  ctx.font = "500 22px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("ExpenStream", W - 80, H - 40);
  for (const [dx, dy] of [[0, -6], [-6, 4], [6, 4]]) {
    ctx.beginPath();
    ctx.arc(W - 210 + dx, H - 44 + dy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

/** Draw the share card and return it as a PNG blob (`null` if canvas is unavailable). */
export async function renderAnalyticsShareCard(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = W;
  canvas.height = H;

  drawBackground(ctx);
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "italic 72px Georgia, serif";
  ctx.fillText(data.title, 80, 130);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = "300 36px system-ui, sans-serif";
  ctx.fillText(data.subtitle, 80, 180);
  ctx.fillStyle = PALETTE.moss;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(80, 200, 80, 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "bold 80px 'Courier New', monospace";
  ctx.fillText(data.total, 80, 300);
  if (data.budgetLine) {
    ctx.fillStyle = data.budgetLine.over ? PALETTE.over : PALETTE.under;
    ctx.font = "500 30px system-ui, sans-serif";
    ctx.fillText(data.budgetLine.text, 80, 350);
  }

  const ridgeBottom = drawRidge(ctx, data, 410);
  drawMetrics(ctx, data.metrics, ridgeBottom + 40);
  drawWatermark(ctx);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}
