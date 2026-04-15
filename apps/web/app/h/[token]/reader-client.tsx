"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BlockRenderer, type RenderableBlock } from "#/components/reader/block-renderer";

/**
 * Audience LIVE-Subscription.
 *
 * Architektur (siehe Plan, Korrektur Nr. 3):
 *   1. EINE Subscription auf `reveals.streamForSession` — minimaler Delta-Stream
 *      (~50 Bytes pro Reveal).
 *   2. Bei neuen IDs ein BATCHED `convex.query(api.blocks.byIds, …)` —
 *      Block-Inhalte werden einmalig geladen und im React-State gecached.
 *   3. KEIN Spawn von N parallelen `useQuery(blocks.byId)`-Subscriptions.
 *
 * Außerdem:
 *   - Auto-Scroll zum neu freigegebenen Block.
 *   - Visibility-API: bei hidden-Tab → Pulse-Effekt beim Wiederkommen.
 */
export function ReaderClient({
  presenterSessionId,
  preRenderedIds,
}: {
  presenterSessionId: Id<"presenterSessions">;
  preRenderedIds: Id<"blocks">[];
}): React.ReactElement {
  const convex = useConvex();

  const reveals = useQuery(api.reveals.streamForSession, {
    presenterSessionId,
  });

  // Local cache of fetched block contents, keyed by id.
  const [contents, setContents] = useState<Map<string, RenderableBlock>>(
    () => new Map(),
  );
  // Order of revealed (and not pre-rendered) blocks, in reveal order.
  const [revealOrder, setRevealOrder] = useState<Id<"blocks">[]>([]);
  const lastSeenAtRef = useRef<number>(0);
  const tabHiddenWhenRevealedRef = useRef<boolean>(false);
  const newestBlockRef = useRef<HTMLDivElement | null>(null);

  // 1. Diff incoming reveals against state, batch-fetch missing.
  useEffect(() => {
    if (!reveals) return;
    const items = reveals.items;
    const preRenderedSet = new Set(preRenderedIds);
    const newOnes = items.filter(
      (r) =>
        !preRenderedSet.has(r.blockId) &&
        !contents.has(r.blockId) &&
        r.revealedAt > lastSeenAtRef.current,
    );
    if (newOnes.length === 0) return;

    lastSeenAtRef.current = Math.max(
      ...items.map((r) => r.revealedAt),
      lastSeenAtRef.current,
    );

    if (document.visibilityState === "hidden") {
      tabHiddenWhenRevealedRef.current = true;
    }

    const ids = newOnes.map((r) => r.blockId);
    void convex
      .query(api.blocks.byIds, { presenterSessionId, ids })
      .then((blocks) => {
        setContents((prev) => {
          const next = new Map(prev);
          for (const b of blocks) next.set(b._id, b);
          return next;
        });
        setRevealOrder((prev) => {
          const seen = new Set(prev);
          return [...prev, ...ids.filter((id) => !seen.has(id))];
        });
      });
  }, [reveals, contents, convex, presenterSessionId, preRenderedIds]);

  // 2. Auto-scroll to newest revealed block.
  useEffect(() => {
    if (revealOrder.length > 0) {
      newestBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [revealOrder.length]);

  // 3. Pulse on tab refocus if reveals happened while hidden.
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    function onVisibility(): void {
      if (
        document.visibilityState === "visible" &&
        tabHiddenWhenRevealedRef.current
      ) {
        tabHiddenWhenRevealedRef.current = false;
        setPulse(true);
        setTimeout(() => setPulse(false), 1500);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const orderedBlocks = useMemo(
    () =>
      revealOrder
        .map((id) => contents.get(id))
        .filter((b): b is RenderableBlock => !!b),
    [revealOrder, contents],
  );

  if (orderedBlocks.length === 0) return <></>;

  return (
    <>
      {orderedBlocks.map((b, i) => {
        const isNewest = i === orderedBlocks.length - 1;
        return (
          <div
            key={b._id}
            ref={isNewest ? newestBlockRef : undefined}
            className={isNewest && pulse ? "pulse-once" : undefined}
          >
            <BlockRenderer block={b} />
          </div>
        );
      })}
    </>
  );
}
