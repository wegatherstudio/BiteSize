"use client";

import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { ParsedReceiptLine, ReceiptItem } from "@/lib/types";

export function newSessionId(db: Firestore = getFirebaseDb()): string {
  return doc(collection(db, "sessions")).id;
}

export interface CreateSessionInput {
  sessionId: string;
  payerAuthUid: string;
  payerName: string;
  receiptImageUrl: string | null;
  restaurantName: string | null;
  currency: string;
  items: ParsedReceiptLine[];
  subtotalCents: number;
  taxCents: number;
  serviceChargeCents: number;
  tipCents: number;
  discountCents: number;
  receiptTotalCents: number;
  ocrRawText: string | null;
  ocrConfidence: number | null;
}

/** Creates the session, the payer's own participant doc, and all items in one batch. */
export async function createSession(input: CreateSessionInput): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);

  const sessionRef = doc(db, "sessions", input.sessionId);
  batch.set(sessionRef, {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    payerParticipantId: input.payerAuthUid,
    status: "collecting",
    receiptImageUrl: input.receiptImageUrl,
    restaurantName: input.restaurantName,
    currency: input.currency,
    subtotalCents: input.subtotalCents,
    taxCents: input.taxCents,
    serviceChargeCents: input.serviceChargeCents,
    tipCents: input.tipCents,
    discountCents: input.discountCents,
    receiptTotalCents: input.receiptTotalCents,
    roundingAdjustmentCents: 0,
    ocrRawText: input.ocrRawText,
    ocrConfidence: input.ocrConfidence,
  });

  const payerRef = doc(db, "sessions", input.sessionId, "participants", input.payerAuthUid);
  batch.set(payerRef, {
    name: input.payerName,
    authUid: input.payerAuthUid,
    isPayer: true,
    joinedAt: serverTimestamp(),
    amountOwedCents: 0,
  });

  input.items.forEach((line, index) => {
    const itemRef = doc(collection(db, "sessions", input.sessionId, "items"));
    batch.set(itemRef, {
      name: line.name,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents,
      isShared: false,
      claimedBy: [],
      sortOrder: index,
      ocrConfidence: line.confidence,
      wasEdited: false,
    });
  });

  await batch.commit();
}

export async function joinSession(
  sessionId: string,
  authUid: string,
  name: string,
): Promise<void> {
  const db = getFirebaseDb();
  const participantRef = doc(db, "sessions", sessionId, "participants", authUid);
  await setDoc(participantRef, {
    name,
    authUid,
    isPayer: false,
    joinedAt: serverTimestamp(),
    amountOwedCents: 0,
  });
}

export async function lockSession(sessionId: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "sessions", sessionId), {
    status: "locked",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggles the current user's claim on an item inside a transaction, so two
 * people tapping a non-shared item at the same instant can't both win it.
 */
export async function toggleClaim(
  sessionId: string,
  item: ReceiptItem,
  authUid: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const db = getFirebaseDb();
  const itemRef = doc(db, "sessions", sessionId, "items", item.id);

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(itemRef);
      if (!snapshot.exists()) throw new Error("Item no longer exists.");
      const data = snapshot.data() as ReceiptItem;
      const claimedBy: string[] = data.claimedBy ?? [];
      const alreadyClaimed = claimedBy.includes(authUid);

      if (alreadyClaimed) {
        transaction.update(itemRef, { claimedBy: claimedBy.filter((id) => id !== authUid) });
        return;
      }

      if (!data.isShared && claimedBy.length > 0) {
        throw new Error("ALREADY_CLAIMED");
      }

      transaction.update(itemRef, { claimedBy: [...claimedBy, authUid] });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_CLAIMED") {
      return { ok: false, reason: "Someone already claimed this item." };
    }
    return { ok: false, reason: "Couldn't update your claim. Try again." };
  }
}

/**
 * Marks an item as shared (so more than one person can claim it) or back
 * to solo. Turning "shared" off is blocked if more than one person has
 * already claimed it — they need to unclaim first.
 */
export async function toggleShared(
  sessionId: string,
  item: ReceiptItem,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const db = getFirebaseDb();
  const itemRef = doc(db, "sessions", sessionId, "items", item.id);

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(itemRef);
      if (!snapshot.exists()) throw new Error("Item no longer exists.");
      const data = snapshot.data() as ReceiptItem;
      const claimedBy: string[] = data.claimedBy ?? [];

      if (data.isShared && claimedBy.length > 1) {
        throw new Error("STILL_SHARED_BY_OTHERS");
      }

      transaction.update(itemRef, { isShared: !data.isShared });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "STILL_SHARED_BY_OTHERS") {
      return {
        ok: false,
        reason: "Other people already claimed this — they need to unclaim it first.",
      };
    }
    return { ok: false, reason: "Couldn't update this item. Try again." };
  }
}
