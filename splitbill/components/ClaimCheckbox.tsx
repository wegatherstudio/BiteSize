"use client";

import { formatCents } from "@/lib/money";
import type { Participant, ReceiptItem } from "@/lib/types";

interface ClaimCheckboxProps {
  item: ReceiptItem;
  participants: Participant[];
  currentUid: string;
  disabled?: boolean;
  onToggleClaim: () => void;
  onToggleShared: () => void;
}

export function ClaimCheckbox({
  item,
  participants,
  currentUid,
  disabled,
  onToggleClaim,
  onToggleShared,
}: ClaimCheckboxProps) {
  const claimedByMe = item.claimedBy.includes(currentUid);
  const claimants = item.claimedBy
    .map((id) => participants.find((p) => p.authUid === id))
    .filter((p): p is Participant => Boolean(p));
  const takenBySomeoneElse = !item.isShared && item.claimedBy.length > 0 && !claimedByMe;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
      <button
        type="button"
        onClick={onToggleClaim}
        disabled={disabled || takenBySomeoneElse}
        aria-pressed={claimedByMe}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          claimedByMe
            ? "border-accent bg-accent text-accent-foreground"
            : "border-foreground/20"
        } ${takenBySomeoneElse ? "opacity-40" : ""}`}
      >
        {claimedByMe && "✓"}
      </button>

      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">
          {item.name}
          {item.quantity > 1 && (
            <span className="text-foreground/40"> × {item.quantity}</span>
          )}
        </span>
        <div className="flex items-center gap-2 text-xs text-foreground/50">
          {claimants.length > 0 ? (
            <span>{claimants.map((c) => c.name).join(", ")}</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">Unclaimed</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold">{formatCents(item.lineTotalCents)}</span>
        <button
          type="button"
          onClick={onToggleShared}
          disabled={disabled}
          className={`text-[11px] font-medium ${
            item.isShared ? "text-accent" : "text-foreground/40"
          }`}
        >
          {item.isShared ? "Shared" : "Split this"}
        </button>
      </div>
    </div>
  );
}
