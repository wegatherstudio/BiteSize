"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSession } from "@/hooks/useSession";
import { PayerDashboard } from "@/components/PayerDashboard";
import { ClaimView } from "@/components/ClaimView";
import { SplitSummary } from "@/components/SplitSummary";

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { uid, loading: userLoading } = useCurrentUser();
  const { session, items, participants, loading, notFound } = useSession(sessionId);

  const isPayer = Boolean(session && uid && session.payerParticipantId === uid);
  const currentParticipant = participants.find((p) => p.authUid === uid);

  useEffect(() => {
    if (loading || userLoading || !session) return;
    if (!isPayer && !currentParticipant) {
      router.replace(`/session/${sessionId}/join`);
    }
  }, [loading, userLoading, session, isPayer, currentParticipant, router, sessionId]);

  if (loading || userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-foreground/50">Loading…</p>
      </div>
    );
  }

  if (notFound || !session || !uid) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-foreground/50">
          This bill doesn&apos;t exist or the link is wrong.
        </p>
      </div>
    );
  }

  if (session.status === "locked") {
    return (
      <SplitSummary
        session={session}
        items={items}
        participants={participants}
        currentUid={uid}
        isPayer={isPayer}
      />
    );
  }

  if (isPayer) {
    return (
      <PayerDashboard
        sessionId={sessionId}
        session={session}
        items={items}
        participants={participants}
        currentUid={uid}
      />
    );
  }

  if (currentParticipant) {
    return (
      <ClaimView
        sessionId={sessionId}
        session={session}
        items={items}
        participants={participants}
        currentUid={uid}
      />
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-foreground/50">Taking you to the join screen…</p>
    </div>
  );
}
