"use client";

import { useState } from "react";
import { ClaimCheckbox } from "@/components/ClaimCheckbox";
import { toggleClaim, toggleShared } from "@/lib/session";
import type { Participant, ReceiptItem } from "@/lib/types";

interface ClaimableItemListProps {
  sessionId: string;
  items: ReceiptItem[];
  participants: Participant[];
  currentUid: string;
  disabled?: boolean;
}

export function ClaimableItemList({
  sessionId,
  items,
  participants,
  currentUid,
  disabled,
}: ClaimableItemListProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggleClaim(item: ReceiptItem) {
    setPendingId(item.id);
    const result = await toggleClaim(sessionId, item, currentUid);
    setPendingId(null);
    if (!result.ok) showToast(result.reason);
  }

  async function handleToggleShared(item: ReceiptItem) {
    setPendingId(item.id);
    const result = await toggleShared(sessionId, item);
    setPendingId(null);
    if (!result.ok) showToast(result.reason);
  }

  return (
    <div className="flex flex-col gap-2">
      {toast && (
        <div className="rounded-lg bg-foreground text-background px-3 py-2 text-center text-sm">
          {toast}
        </div>
      )}
      {items.map((item) => (
        <ClaimCheckbox
          key={item.id}
          item={item}
          participants={participants}
          currentUid={currentUid}
          disabled={disabled || pendingId === item.id}
          onToggleClaim={() => handleToggleClaim(item)}
          onToggleShared={() => handleToggleShared(item)}
        />
      ))}
    </div>
  );
}
