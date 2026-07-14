import type {
  Participant,
  ParticipantSplitResult,
  ReceiptItem,
  SplitResult,
} from "@/lib/types";

export interface CalculateSplitInput {
  items: ReceiptItem[];
  participants: Participant[];
  taxCents: number;
  serviceChargeCents: number;
  tipCents: number;
  discountCents: number;
  /** Printed total from the receipt; the source of truth for reconciliation. */
  receiptTotalCents: number;
  payerParticipantId: string;
}

/**
 * Pure function: given claimed items and the extra charges/discounts on a
 * receipt, computes exactly what each participant owes. Shared items split
 * evenly among their claimants; tax/service/tip/discount are distributed
 * proportionally to how much of the subtotal each person ordered. Any
 * leftover cents from rounding are absorbed into the payer's own total so
 * the sum of everyone's share always equals the receipt total exactly.
 */
export function calculateSplit(input: CalculateSplitInput): SplitResult {
  const {
    items,
    participants,
    taxCents,
    serviceChargeCents,
    tipCents,
    discountCents,
    receiptTotalCents,
    payerParticipantId,
  } = input;

  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

  const itemShareByParticipant = new Map<string, number>();
  for (const participant of participants) {
    itemShareByParticipant.set(participant.id, 0);
  }

  for (const item of items) {
    if (item.claimedBy.length === 0) continue;
    const claimants = item.isShared ? item.claimedBy : item.claimedBy.slice(0, 1);
    const baseShare = Math.floor(item.lineTotalCents / claimants.length);
    let remainder = item.lineTotalCents - baseShare * claimants.length;

    claimants.forEach((participantId) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      const current = itemShareByParticipant.get(participantId) ?? 0;
      itemShareByParticipant.set(participantId, current + baseShare + extra);
    });
  }

  const perParticipant: ParticipantSplitResult[] = participants.map((participant) => {
    const itemShareCents = itemShareByParticipant.get(participant.id) ?? 0;
    const proportion = subtotalCents > 0 ? itemShareCents / subtotalCents : 0;

    const taxShareCents = Math.round(taxCents * proportion);
    const serviceShareCents = Math.round(serviceChargeCents * proportion);
    const tipShareCents = Math.round(tipCents * proportion);
    const discountShareCents = Math.round(discountCents * proportion);

    const totalCents =
      itemShareCents + taxShareCents + serviceShareCents + tipShareCents - discountShareCents;

    return {
      participantId: participant.id,
      name: participant.name,
      itemShareCents,
      taxShareCents,
      serviceShareCents,
      tipShareCents,
      discountShareCents,
      totalCents,
    };
  });

  const computedTotalBeforeReconciliation = perParticipant.reduce(
    (sum, p) => sum + p.totalCents,
    0,
  );
  const roundingAdjustmentCents = receiptTotalCents - computedTotalBeforeReconciliation;

  const payerResult = perParticipant.find((p) => p.participantId === payerParticipantId);
  if (payerResult && roundingAdjustmentCents !== 0) {
    payerResult.totalCents += roundingAdjustmentCents;
  }

  const computedTotalCents = perParticipant.reduce((sum, p) => sum + p.totalCents, 0);

  return {
    perParticipant,
    subtotalCents,
    receiptTotalCents,
    computedTotalCents,
    roundingAdjustmentCents,
  };
}
