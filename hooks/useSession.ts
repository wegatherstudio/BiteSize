"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Participant, ReceiptItem, SplitBillSession } from "@/lib/types";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return typeof value === "number" ? value : 0;
}

export interface UseSessionResult {
  session: SplitBillSession | null;
  items: ReceiptItem[];
  participants: Participant[];
  loading: boolean;
  notFound: boolean;
}

/** Realtime subscription to a session and its items/participants subcollections. */
export function useSession(sessionId: string | null): UseSessionResult {
  const [session, setSession] = useState<SplitBillSession | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const db = getFirebaseDb();

    const unsubSession = onSnapshot(
      doc(db, "sessions", sessionId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setSession(null);
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = snapshot.data();
        setSession({
          id: snapshot.id,
          createdAt: toMillis(data.createdAt),
          updatedAt: toMillis(data.updatedAt),
          payerParticipantId: data.payerParticipantId,
          status: data.status,
          receiptImageUrl: data.receiptImageUrl ?? null,
          restaurantName: data.restaurantName ?? null,
          currency: data.currency ?? "USD",
          subtotalCents: data.subtotalCents ?? 0,
          taxCents: data.taxCents ?? 0,
          serviceChargeCents: data.serviceChargeCents ?? 0,
          tipCents: data.tipCents ?? 0,
          discountCents: data.discountCents ?? 0,
          receiptTotalCents: data.receiptTotalCents ?? 0,
          roundingAdjustmentCents: data.roundingAdjustmentCents ?? 0,
          ocrRawText: data.ocrRawText ?? null,
          ocrConfidence: data.ocrConfidence ?? null,
        });
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );

    const unsubItems = onSnapshot(
      query(collection(db, "sessions", sessionId, "items"), orderBy("sortOrder")),
      (snapshot) => {
        setItems(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              quantity: data.quantity,
              unitPriceCents: data.unitPriceCents,
              lineTotalCents: data.lineTotalCents,
              isShared: data.isShared ?? false,
              claimedBy: data.claimedBy ?? [],
              sortOrder: data.sortOrder ?? 0,
              ocrConfidence: data.ocrConfidence ?? null,
              wasEdited: data.wasEdited ?? false,
            };
          }),
        );
      },
    );

    const unsubParticipants = onSnapshot(
      collection(db, "sessions", sessionId, "participants"),
      (snapshot) => {
        setParticipants(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              authUid: data.authUid,
              isPayer: data.isPayer ?? false,
              joinedAt: toMillis(data.joinedAt),
              amountOwedCents: data.amountOwedCents ?? 0,
            };
          }),
        );
      },
    );

    return () => {
      unsubSession();
      unsubItems();
      unsubParticipants();
    };
  }, [sessionId]);

  return { session, items, participants, loading, notFound };
}
