import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireUser,
  assertNotDemo,
  assertHandoutOwner,
} from "./_lib/authHelpers";
import { rankAfter, rankBetween, initialRank } from "./lexorank";

const blockTrigger = v.union(
  v.literal("slide"),
  v.literal("always"),
  v.literal("manual"),
);
const blockLayout = v.union(
  v.literal("default"),
  v.literal("centered"),
  v.literal("wide"),
  v.literal("compact"),
  v.literal("terminal"),
);
const blockTerminalVariant = v.union(
  v.literal("neutral"),
  v.literal("success"),
  v.literal("danger"),
);
const blockImagePos = v.union(
  v.literal("top"),
  v.literal("bottom"),
  v.literal("left"),
  v.literal("right"),
  v.literal("full"),
  v.literal("background"),
);
const blockFontSize = v.union(
  v.literal("sm"),
  v.literal("base"),
  v.literal("lg"),
  v.literal("xl"),
);

/**
 * Owner view: full block list, ordered by LexoRank.
 */
export const list = query({
  args: { userId: v.union(v.id("users"), v.null()), handoutId: v.id("handouts") },
  handler: async (ctx, { userId, handoutId }) => {
    const user = await requireUser(ctx, userId);
    await assertHandoutOwner(ctx, user, handoutId);
    return await ctx.db
      .query("blocks")
      .withIndex("by_handout_rank", (q) => q.eq("handoutId", handoutId))
      .collect();
  },
});

/**
 * Audience batched fetch: load several block contents in one round-trip.
 *
 * The reader subscribes to `reveals.streamForSession`, diffs against its local
 * cache, then calls `byIds` once for the missing ones. This avoids spawning N
 * parallel subscriptions per audience client.
 *
 * Public — no auth, but only blocks belonging to the given handout's currently
 * REVEALED set are returned. We re-check via the presenter session.
 */
export const byIds = query({
  args: {
    presenterSessionId: v.id("presenterSessions"),
    ids: v.array(v.id("blocks")),
  },
  handler: async (ctx, { presenterSessionId, ids }) => {
    if (ids.length === 0) return [];
    const session = await ctx.db.get(presenterSessionId);
    if (!session) return [];

    // Build a Set of legitimately-revealed block IDs for this session.
    const reveals = await ctx.db
      .query("reveals")
      .withIndex("by_session_revealedAt", (q) =>
        q.eq("presenterSessionId", presenterSessionId),
      )
      .collect();
    const revealedSet = new Set(reveals.map((r) => r.blockId));

    const blocks = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return blocks
      .filter(
        (b): b is NonNullable<typeof b> =>
          b !== null && b.handoutId === session.handoutId && revealedSet.has(b._id),
      )
      .map((b) => ({
        _id: b._id,
        title: b.title,
        markdown: b.markdown,
        imageS3Key: b.imageS3Key,
        imageUrl: b.imageUrl,
        imageCaption: b.imageCaption,
        layout: b.layout,
        imagePosition: b.imagePosition,
        fontSize: b.fontSize,
        terminalVariant: b.terminalVariant,
        terminalLabel: b.terminalLabel,
      }));
  },
});

/**
 * Always-visible blocks — pre-revealed for late joiners, no presenter action needed.
 * Public read for the audience reader.
 */
export const alwaysVisibleByHandout = query({
  args: { handoutId: v.id("handouts") },
  handler: async (ctx, { handoutId }) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_handout_rank", (q) => q.eq("handoutId", handoutId))
      .collect();
    return blocks
      .filter((b) => b.trigger === "always")
      .map((b) => ({
        _id: b._id,
        title: b.title,
        markdown: b.markdown,
        imageS3Key: b.imageS3Key,
        imageUrl: b.imageUrl,
        imageCaption: b.imageCaption,
        layout: b.layout,
        imagePosition: b.imagePosition,
        fontSize: b.fontSize,
        terminalVariant: b.terminalVariant,
        terminalLabel: b.terminalLabel,
      }));
  },
});

export const create = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    handoutId: v.id("handouts"),
    title: v.string(),
    markdown: v.string(),
    trigger: blockTrigger,
    slideNumber: v.optional(v.number()),
    layout: blockLayout,
    imagePosition: blockImagePos,
    fontSize: blockFontSize,
    imageS3Key: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
    terminalVariant: v.optional(blockTerminalVariant),
    terminalLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.userId);
    assertNotDemo(user);
    await assertHandoutOwner(ctx, user, args.handoutId);

    // Append at the end: read max rank for this handout, place after.
    const last = await ctx.db
      .query("blocks")
      .withIndex("by_handout_rank", (q) => q.eq("handoutId", args.handoutId))
      .order("desc")
      .first();
    const rank = last ? rankAfter(last.rank) : initialRank();

    const now = Date.now();
    return await ctx.db.insert("blocks", {
      handoutId: args.handoutId,
      rank,
      title: args.title,
      markdown: args.markdown,
      trigger: args.trigger,
      slideNumber: args.slideNumber,
      layout: args.layout,
      imagePosition: args.imagePosition,
      fontSize: args.fontSize,
      imageS3Key: args.imageS3Key,
      imageUrl: args.imageUrl,
      imageCaption: args.imageCaption,
      terminalVariant: args.terminalVariant,
      terminalLabel: args.terminalLabel,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    id: v.id("blocks"),
    title: v.optional(v.string()),
    markdown: v.optional(v.string()),
    trigger: v.optional(blockTrigger),
    slideNumber: v.optional(v.number()),
    layout: v.optional(blockLayout),
    imagePosition: v.optional(blockImagePos),
    fontSize: v.optional(blockFontSize),
    imageS3Key: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
    terminalVariant: v.optional(blockTerminalVariant),
    terminalLabel: v.optional(v.string()),
  },
  handler: async (ctx, { userId, id, ...patch }) => {
    const user = await requireUser(ctx, userId);
    assertNotDemo(user);
    const block = await ctx.db.get(id);
    if (!block) throw new Error("BLOCK_NOT_FOUND");
    await assertHandoutOwner(ctx, user, block.handoutId);
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { userId: v.union(v.id("users"), v.null()), id: v.id("blocks") },
  handler: async (ctx, { userId, id }) => {
    const user = await requireUser(ctx, userId);
    assertNotDemo(user);
    const block = await ctx.db.get(id);
    if (!block) return;
    await assertHandoutOwner(ctx, user, block.handoutId);
    await ctx.db.delete(id);
  },
});

export const duplicate = mutation({
  args: { userId: v.union(v.id("users"), v.null()), id: v.id("blocks") },
  handler: async (ctx, { userId, id }) => {
    const user = await requireUser(ctx, userId);
    assertNotDemo(user);
    const src = await ctx.db.get(id);
    if (!src) throw new Error("BLOCK_NOT_FOUND");
    await assertHandoutOwner(ctx, user, src.handoutId);

    // Place the duplicate directly after the source: find its immediate
    // neighbour by rank and use LexoRank "between".
    const after = await ctx.db
      .query("blocks")
      .withIndex("by_handout_rank", (q) =>
        q.eq("handoutId", src.handoutId).gt("rank", src.rank),
      )
      .order("asc")
      .first();
    const newRank = rankBetween(src.rank, after?.rank ?? null);

    const now = Date.now();
    return await ctx.db.insert("blocks", {
      handoutId: src.handoutId,
      rank: newRank,
      title: src.title + " (Kopie)",
      markdown: src.markdown,
      trigger: src.trigger,
      slideNumber: src.slideNumber,
      layout: src.layout,
      imagePosition: src.imagePosition,
      fontSize: src.fontSize,
      imageS3Key: src.imageS3Key,
      imageUrl: src.imageUrl,
      imageCaption: src.imageCaption,
      terminalVariant: src.terminalVariant,
      terminalLabel: src.terminalLabel,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Reorder by passing the block to move and the rank-bracket it should land
 * between. Caller looks up `prevRank` and `nextRank` from the current order.
 */
export const reorder = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    id: v.id("blocks"),
    prevRank: v.union(v.string(), v.null()),
    nextRank: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { userId, id, prevRank, nextRank }) => {
    const user = await requireUser(ctx, userId);
    assertNotDemo(user);
    const block = await ctx.db.get(id);
    if (!block) throw new Error("BLOCK_NOT_FOUND");
    await assertHandoutOwner(ctx, user, block.handoutId);
    const newRank = rankBetween(prevRank, nextRank);
    await ctx.db.patch(id, { rank: newRank, updatedAt: Date.now() });
  },
});
