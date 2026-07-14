"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSession } from "@/hooks/useSession";
import { joinSession } from "@/lib/session";

export default function JoinSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { uid, loading: userLoading } = useCurrentUser();
  const { session, loading, notFound } = useSession(sessionId);

  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!uid) return;
    if (!name.trim()) {
      setError("Enter your name to join.");
      return;
    }
    setJoining(true);
    try {
      await joinSession(sessionId, uid, name.trim());
      router.replace(`/session/${sessionId}`);
    } catch {
      setError("Couldn't join this bill. Try again.");
      setJoining(false);
    }
  }

  if (loading || userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-foreground/50">Loading…</p>
      </div>
    );
  }

  if (notFound || !session) {
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
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-foreground/50">
          This bill has already been settled — ask the payer for a screenshot.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold">
          {session.restaurantName ? `Join the bill at ${session.restaurantName}` : "Join the bill"}
        </h1>
        <p className="text-sm text-foreground/60">
          Enter your name so people know which items are yours.
        </p>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoFocus
        className="w-full rounded-lg border border-foreground/10 bg-background px-4 py-3 text-center text-lg"
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleJoin}
        disabled={joining}
        className="flex h-14 w-full items-center justify-center rounded-full bg-accent text-base font-medium text-accent-foreground shadow-lg shadow-accent/25 disabled:opacity-60"
      >
        {joining ? "Joining…" : "Join Bill"}
      </button>
    </div>
  );
}
