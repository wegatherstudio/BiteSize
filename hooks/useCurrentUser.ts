"use client";

import { useEffect, useState } from "react";
import { ensureAnonymousUser } from "@/lib/firebase/client";

/** Signs the visitor in anonymously (if needed) and returns their uid once ready. */
export function useCurrentUser(): { uid: string | null; loading: boolean } {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ensureAnonymousUser()
      .then((user) => {
        if (!cancelled) setUid(user.uid);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { uid, loading };
}
