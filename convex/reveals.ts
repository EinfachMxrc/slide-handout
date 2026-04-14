import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, assertHandoutOwner } from "./_lib/authHelpers";

/**
 * REALTIME FAN-OUT CORE.
 *
 * Subscription pattern:
 *
 *   client →  useQuery(reveals.streamForSession, { sessionId })
 *          ← [{ blockId, revealedAt }, ...]   (only IDs, ~ 50 bytes each)
 *
 * On change, client diffs against local cache, then fires a single
 *   client →  blocks.byIds({ ids: missing })
 * to hydrate the new content. No N parallel subscriptions.
 *
 * The presenter mutation `reveals.reveal(...)` is idempotent in code:
 * Convex has no declarative unique constraints, so we check via the
 * `by_session_block` index inside the transaction.
 */

export const streamForSession = query({
  args: { presenterSessionId: v.id("presenterSessions") },
  handler: async (ctx, { presenterSessionId }) => {
    const reveals = await ctx.db
      .query("reveals")
      .withIndex("by_session_revealedAt", (q) =>
        q.eq("presenterSessionId", presenterSessionId),
      )
      .order("asc")
      .collect();
    return reveals.map((r) => ({
      blockId: r.blockId,
      revealedAt: r.revealedAt,
    }));
  },
});

export const reveal = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    presenterSessionId: v.id("presenterSessions"),
    blockId: v.id("blocks"),
  },
  handler: async (ctx, { userId, presenterSessionId, blockId }) => {
    const user = await requireUser(ctx, userId);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== "live") throw new Error("SESSION_NOT_LIVE");
    await assertHandoutOwner(ctx, user, session.handoutId);

    const block = await ctx.db.get(blockId);
    if (!block || block.handoutId !== session.handoutId) {
      throw new Error("BLOCK_NOT_IN_HANDOUT");
    }

    // Idempotency: existing reveal for this (session, block)?
    const existing = await ctx.db
      .query("reveals")
      .withIndex("by_session_block", (q) =>
        q.eq("presenterSessionId", presenterSessionId).eq("blockId", blockId),
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("reveals", {
      presenterSessionId,
      blockId,
      revealedAt: Date.now(),
    });
  },
});

/** Reveal every block in the handout (excluding `always`). Idempotent. */
export const revealAll = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    presenterSessionId: v.id("presenterSessions"),
  },
  handler: async (ctx, { userId, presenterSessionId }) => {
    const user = await requireUser(ctx, userId);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== "live") throw new Error("SESSION_NOT_LIVE");
    await assertHandoutOwner(ctx, user, session.handoutId);

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_handout_rank", (q) =>
        q.eq("handoutId", session.handoutId),
      )
      .collect();
    const existing = await ctx.db
      .query("reveals")
      .withIndex("by_session_revealedAt", (q) =>
        q.eq("presenterSessionId", presenterSessionId),
      )
      .collect();
    const alreadyRevealed = new Set(existing.map((r) => r.blockId));

    let now = Date.now();
    for (const block of blocks) {
      if (block.trigger === "always") continue;
      if (alreadyRevealed.has(block._id)) continue;
      await ctx.db.insert("reveals", {
        presenterSessionId,
        blockId: block._id,
        revealedAt: now++, // strictly increasing within the batch
      });
    }
  },
});

/** Hide every reveal for this session (returns to a clean slate). */
export const hideAll = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    presenterSessionId: v.id("presenterSessions"),
  },
  handler: async (ctx, { userId, presenterSessionId }) => {
    const user = await requireUser(ctx, userId);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) return;
    await assertHandoutOwner(ctx, user, session.handoutId);
    const reveals = await ctx.db
      .query("reveals")
      .withIndex("by_session_revealedAt", (q) =>
        q.eq("presenterSessionId", presenterSessionId),
      )
      .collect();
    await Promise.all(reveals.map((r) => ctx.db.delete(r._id)));
  },
});

export const unreveal = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    presenterSessionId: v.id("presenterSessions"),
    blockId: v.id("blocks"),
  },
  handler: async (ctx, { userId, presenterSessionId, blockId }) => {
    const user = await requireUser(ctx, userId);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) return;
    await assertHandoutOwner(ctx, user, session.handoutId);
    const existing = await ctx.db
      .query("reveals")
      .withIndex("by_session_block", (q) =>
        q.eq("presenterSessionId", presenterSessionId).eq("blockId", blockId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
