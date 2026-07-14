"use client";

import { useState } from "react";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { ClaimableItemList } from "@/components/ClaimableItemList";
import { lockSession } from "@/lib/session";
import { formatCents } from "@/lib/money";
import type { Participant, ReceiptItem, SplitBillSession } from "@/lib/types";

interface PayerDashboardProps {
  sessionId: string;
  session: SplitBillSession;
  items: ReceiptItem[];
  participants: Participant[];
  currentUid: string;
}

export function PayerDashboard({
  sessionId,
  session,
  items,
  participants,
  currentUid,
}: PayerDashboardProps) {
  const [locking, setLocking] = useState(false);
  const [joinUrl] = useState(() =>
    typeof window === "undefined" ? "" : `${window.location.origin}/session/${sessionId}/join`,
  );

  const unclaimedCount = items.filter((item) => item.claimedBy.length === 0).length;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join the bill on SplitBill", url: joinUrl });
        return;
      } catch {
        // user cancelled — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(joinUrl);
  }

  async function handleLock() {
    setLocking(true);
    try {
      await lockSession(sessionId);
    } finally {
      setLocking(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8 pb-28">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">
          {session.restaurantName || "Your bill"}
        </h1>
        {joinUrl && <QRCodeDisplay url={joinUrl} />}
        <button
          type="button"
          onClick={handleShare}
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Share join link
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground/60">
          Who&apos;s here ({participants.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-foreground/5 px-3 py-1 text-sm"
            >
              {p.name}
              {p.isPayer && " (you)"}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground/60">
          Items — tap yours too
        </h2>
        <ClaimableItemList
          sessionId={sessionId}
          items={items}
          participants={participants}
          currentUid={currentUid}
        />
      </div>

      {unclaimedCount > 0 && (
        <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          {unclaimedCount} item{unclaimedCount > 1 ? "s" : ""} still unclaimed —
          their cost will be added to your total if you lock now.
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-foreground/10 bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <span className="flex-1 text-sm text-foreground/60">
            Total {formatCents(session.receiptTotalCents)}
          </span>
          <button
            type="button"
            onClick={handleLock}
            disabled={locking}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground shadow-lg shadow-accent/25 disabled:opacity-60"
          >
            {locking ? "Locking…" : "Lock & Calculate"}
          </button>
        </div>
      </div>
    </div>
  );
}
