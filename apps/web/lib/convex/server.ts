import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

/**
 * Convex SSR boundary.
 *
 * Convex's Next.js Server Rendering (preloadQuery + Preloaded<>) is BETA per
 * official docs. We isolate every server-side fetch behind this thin module so
 * the reader and dashboard pages don't import `convex/nextjs` directly.
 *
 * If we ever need to swap to plain HTTP queries (or a future stable API), only
 * this file changes.
 */

export async function loadHandoutByPublicToken(publicToken: string) {
  return await preloadQuery(api.handouts.getPublic, { publicToken });
}

export async function loadAlwaysVisibleBlocks(handoutId: Id<"handouts">) {
  return await preloadQuery(api.blocks.alwaysVisibleByHandout, { handoutId });
}

export async function loadRevealsForSession(
  presenterSessionId: Id<"presenterSessions">,
) {
  return await preloadQuery(api.reveals.streamForSession, {
    presenterSessionId,
  });
}
