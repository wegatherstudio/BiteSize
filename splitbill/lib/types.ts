// "draft" (still reviewing OCR results) is handled entirely in local React
// state before the session doc is created — Firestore only ever sees a
// session once it's shareable.
export type SessionStatus = "collecting" | "locked";

export interface SplitBillSession {
  id: string;
  createdAt: number;
  updatedAt: number;
  payerParticipantId: string;
  status: SessionStatus;
  receiptImageUrl: string | null;
  restaurantName: string | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  serviceChargeCents: number;
  tipCents: number;
  discountCents: number;
  receiptTotalCents: number;
  roundingAdjustmentCents: number;
  ocrRawText: string | null;
  ocrConfidence: number | null;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  isShared: boolean;
  claimedBy: string[];
  sortOrder: number;
  ocrConfidence: number | null;
  wasEdited: boolean;
}

export interface Participant {
  id: string;
  name: string;
  authUid: string;
  isPayer: boolean;
  joinedAt: number;
  amountOwedCents: number;
}

export interface ParsedReceiptLine {
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  confidence: number;
}

export interface ParsedReceipt {
  lines: ParsedReceiptLine[];
  rawText: string;
  guessedSubtotalCents: number | null;
  guessedTaxCents: number | null;
  guessedTotalCents: number | null;
  guessedRestaurantName: string | null;
  averageConfidence: number;
}

export interface ParticipantSplitResult {
  participantId: string;
  name: string;
  itemShareCents: number;
  taxShareCents: number;
  serviceShareCents: number;
  tipShareCents: number;
  discountShareCents: number;
  totalCents: number;
}

export interface SplitResult {
  perParticipant: ParticipantSplitResult[];
  subtotalCents: number;
  receiptTotalCents: number;
  computedTotalCents: number;
  roundingAdjustmentCents: number;
}
