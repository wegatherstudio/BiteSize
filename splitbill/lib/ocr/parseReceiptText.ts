import type { ParsedReceipt, ParsedReceiptLine } from "@/lib/types";

export interface OcrLine {
  text: string;
  /** 0-100, as reported by Tesseract for this line. */
  confidence: number;
}

const TRAILING_PRICE = /(\d{1,4}[.,]\d{2})\s*$/;
const LEADING_QTY = /^(\d{1,2})\s*[x×]?\s+/i;
const TRAILING_QTY = /[x×]\s*(\d{1,2})\s*$/i;
const NOISE_LINE =
  /^[-=_*.\s]*$|^(thank you|receipt|order|table|server|cashier|guest|visa|mastercard|amex|cash|change|card|auth|approved|tel|phone)\b/i;

type SummaryField = "guessedSubtotalCents" | "guessedTaxCents" | "guessedTotalCents";

const SUMMARY_KEYWORDS: { field: SummaryField; pattern: RegExp }[] = [
  { field: "guessedSubtotalCents", pattern: /\bsub\s?total\b/i },
  { field: "guessedTaxCents", pattern: /\b(tax|vat|gst)\b/i },
  { field: "guessedTotalCents", pattern: /\btotal\b/i },
];

function parsePriceToCents(raw: string): number {
  const normalized = raw.replace(",", ".");
  return Math.round(parseFloat(normalized) * 100);
}

function cleanName(raw: string): string {
  return raw
    .replace(/[.\-·•]{2,}/g, " ") // dot leaders like "Burger....12.99"
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Turns OCR line output into candidate receipt items plus best-effort
 * guesses for subtotal/tax/total, using simple, explainable heuristics
 * rather than a full grammar — good enough for a first-pass parse that the
 * payer then corrects in the item review UI.
 */
export function parseReceiptText(lines: OcrLine[]): ParsedReceipt {
  const rawText = lines.map((l) => l.text).join("\n");
  const items: ParsedReceiptLine[] = [];
  let guessedSubtotalCents: number | null = null;
  let guessedTaxCents: number | null = null;
  let guessedTotalCents: number | null = null;
  let guessedRestaurantName: string | null = null;

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    if (!guessedRestaurantName && !TRAILING_PRICE.test(text) && text.length >= 3) {
      guessedRestaurantName = cleanName(text);
    }

    const priceMatch = text.match(TRAILING_PRICE);
    if (!priceMatch) continue;

    const priceCents = parsePriceToCents(priceMatch[1]);
    const beforePrice = text.slice(0, priceMatch.index).trim();

    const summaryHit = SUMMARY_KEYWORDS.find((k) => k.pattern.test(beforePrice));
    if (summaryHit) {
      if (summaryHit.field === "guessedSubtotalCents") guessedSubtotalCents = priceCents;
      if (summaryHit.field === "guessedTaxCents") guessedTaxCents = priceCents;
      if (summaryHit.field === "guessedTotalCents") guessedTotalCents = priceCents;
      continue;
    }

    if (NOISE_LINE.test(beforePrice) || beforePrice.length === 0) continue;

    let quantity = 1;
    let namePart = beforePrice;
    const trailingQty = beforePrice.match(TRAILING_QTY);
    const leadingQty = beforePrice.match(LEADING_QTY);
    if (trailingQty) {
      quantity = parseInt(trailingQty[1], 10);
      namePart = beforePrice.slice(0, trailingQty.index).trim();
    } else if (leadingQty) {
      quantity = parseInt(leadingQty[1], 10);
      namePart = beforePrice.slice(leadingQty[0].length).trim();
    }

    const name = cleanName(namePart);
    if (!name || name.length > 60) continue;

    const unitPriceCents = quantity > 0 ? Math.round(priceCents / quantity) : priceCents;

    let confidence = line.confidence / 100;
    if (name.length < 2) confidence *= 0.5;
    if (!trailingQty && !leadingQty) confidence *= 0.95;

    items.push({
      name,
      quantity,
      unitPriceCents,
      lineTotalCents: priceCents,
      confidence: Math.max(0, Math.min(1, confidence)),
    });
  }

  const averageConfidence =
    items.length === 0
      ? 0
      : items.reduce((sum, item) => sum + item.confidence, 0) / items.length;

  return {
    lines: items,
    rawText,
    guessedSubtotalCents,
    guessedTaxCents,
    guessedTotalCents,
    guessedRestaurantName,
    averageConfidence,
  };
}
