"use client";

import { useMemo } from "react";
import { calculateSplit } from "@/lib/split/calculateSplit";
import { formatCents } from "@/lib/money";
import type { Participant, ReceiptItem, SplitBillSession } from "@/lib/types";

interface SplitSummaryProps {
  session: SplitBillSession;
  items: ReceiptItem[];
  participants: Participant[];
  currentUid: string;
  isPayer: boolean;
}

export function SplitSummary({
  session,
  items,
  participants,
  currentUid,
  isPayer,
}: SplitSummaryProps) {
  const result = useMemo(
    () =>
      calculateSplit({
        items,
        participants,
        taxCents: session.taxCents,
        serviceChargeCents: session.serviceChargeCents,
        tipCents: session.tipCents,
        discountCents: session.discountCents,
        receiptTotalCents: session.receiptTotalCents,
        payerParticipantId: session.payerParticipantId,
      }),
    [items, participants, session],
  );

  const payer = participants.find((p) => p.isPayer);

  if (!isPayer) {
    const mine = result.perParticipant.find((p) => p.participantId === currentUid);
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-foreground/60">
            You owe {payer ? payer.name : "the payer"}
          </span>
          <span className="text-5xl font-semibold tracking-tight">
            {formatCents(mine?.totalCents ?? 0)}
          </span>
        </div>
        {mine && (
          <div className="flex w-full flex-col gap-1 rounded-xl border border-foreground/10 p-4 text-left text-sm text-foreground/60">
            <div className="flex justify-between">
              <span>Your items</span>
              <span>{formatCents(mine.itemShareCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCents(mine.taxShareCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service + tip</span>
              <span>{formatCents(mine.serviceShareCents + mine.tipShareCents)}</span>
            </div>
            {mine.discountShareCents > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-{formatCents(mine.discountShareCents)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-sm text-foreground/60">Bill total</span>
        <span className="text-4xl font-semibold tracking-tight">
          {formatCents(result.receiptTotalCents)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground/60">Who owes what</h2>
        {result.perParticipant
          .slice()
          .sort((a, b) => b.totalCents - a.totalCents)
          .map((p) => (
            <div
              key={p.participantId}
              className="flex items-center justify-between rounded-xl border border-foreground/10 p-3"
            >
              <span className="text-sm font-medium">
                {p.name}
                {p.participantId === session.payerParticipantId && " (you)"}
              </span>
              <span className="text-sm font-semibold">{formatCents(p.totalCents)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
