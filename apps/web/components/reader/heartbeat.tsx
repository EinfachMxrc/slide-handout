"use client";

import { useEffect } from "react";
import { useConvex } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

const INTERVAL_MS = 20_000;
const LS_KEY = "sh-reader-client-id";

function getClientId(): string {
  try {
    const existing = localStorage.getItem(LS_KEY);
    if (existing) return existing;
    const fresh =
      crypto.randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(LS_KEY, fresh);
    return fresh;
  } catch {
    // No localStorage (Safari private mode) — fall back to per-mount id.
    return Math.random().toString(36).slice(2);
  }
}

/**
 * Kleiner unsichtbarer Komponent, der die Audience-Präsenz live hält.
 * Ping jede 20s; pausiert bei hidden Tab (wichtig für mobile Devices).
 */
export function ReaderHeartbeat({
  presenterSessionId,
}: {
  presenterSessionId: Id<"presenterSessions">;
}): null {
  const convex = useConvex();

  useEffect(() => {
    const clientId = getClientId();
    let timer: ReturnType<typeof setInterval> | null = null;

    async function ping(): Promise<void> {
      if (document.visibilityState !== "visible") return;
      try {
        await convex.mutation(api.audience.heartbeat, {
          presenterSessionId,
          clientId,
        });
      } catch {
        /* network hiccup — next tick will retry */
      }
    }

    void ping(); // immediate first beat
    timer = setInterval(ping, INTERVAL_MS);
    const onVis = (): void => {
      if (document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [convex, presenterSessionId]);

  return null;
}
