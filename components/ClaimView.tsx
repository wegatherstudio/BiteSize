"use client";

import { useMemo } from "react";
import { ClaimableItemList } from "@/components/ClaimableItemList";
import { calculateSplit } from "@/lib/split/calculateSplit";
import { formatCents } from "@/lib/money";
import type { Participant, ReceiptItem, SplitBillSession } from "@/lib/types";

interface ClaimViewProps {
  sessionId: string;
  session: SplitBillSession;
  items: ReceiptItem[];
  participants: Participant[];
  currentUid: string;
}

export function ClaimView({
  sessionId,
  session,
  items,
  participants,
  currentUid,
}: ClaimViewProps) {
  const myEstimateCents = useMemo(() => {
    const result = calculateSplit({
      items,
      participants,
      taxCents: session.taxCents,
      serviceChargeCents: session.serviceChargeCents,
      tipCents: session.tipCents,
      discountCents: session.discountCents,
      receiptTotalCents: session.receiptTotalCents,
      payerParticipantId: session.payerParticipantId,
    });
    return result.perParticipant.find((p) => p.participantId === currentUid)?.totalCents ?? 0;
  }, [items, participants, session, currentUid]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8 pb-28">
      <h1 className="text-xl font-semibold">
        {session.restaurantName || "The bill"}
      </h1>
      <p className="text-sm text-foreground/60">
        Tap everything you ordered. Use &ldquo;Split this&rdquo; for items you shared.
      </p>

      <ClaimableItemList
        sessionId={sessionId}
        items={items}
        participants={participants}
        currentUid={currentUid}
      />

      <div className="fixed inset-x-0 bottom-0 border-t border-foreground/10 bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <span className="text-sm text-foreground/60">Your estimate</span>
          <span className="text-lg font-semibold">{formatCents(myEstimateCents)}</span>
        </div>
      </div>
    </div>
  );
}
