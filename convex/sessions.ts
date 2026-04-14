import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, assertHandoutOwner } from "./_lib/authHelpers";

/**
 * Presenter SESSIONS — live state of a running presentation.
 *
 * `advanceSlide` is the integration point for the future PowerPoint Add-in:
 * the add-in posts the current slide number; we reveal any blocks tied to
 * that slide via the auto-reveal scheduler call.
 */

function generatePairingCode(): string {
  // 6 digits, zero-padded. 1M combinations — sufficient for live sessions.
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(6, "0");
}

export const start = mutation({
  args: { tokenHash: v.union(v.string(), v.null()), handoutId: v.id("handouts") },
  handler: async (ctx, { tokenHash, handoutId }) => {
    const user = await requireUser(ctx, tokenHash);
    await assertHandoutOwner(ctx, user, handoutId);

    // End any previous live session for this handout (one-active-at-a-time).
    const live = await ctx.db
      .query("presenterSessions")
      .withIndex("by_handout", (q) => q.eq("handoutId", handoutId))
      .filter((q) => q.eq(q.field("status"), "live"))
      .collect();
    for (const s of live) {
      await ctx.db.patch(s._id, { status: "ended", endedAt: Date.now() });
    }

    // Generate a collision-free pairing code (tiny chance at 1M sessions).
    let pairingCode = generatePairingCode();
    for (let i = 0; i < 5; i++) {
      const collision = await ctx.db
        .query("presenterSessions")
        .withIndex("by_pairingCode", (q) => q.eq("pairingCode", pairingCode))
        .filter((q) => q.eq(q.field("status"), "live"))
        .first();
      if (!collision) break;
      pairingCode = generatePairingCode();
    }

    const id = await ctx.db.insert("presenterSessions", {
      handoutId,
      ownerId: user._id,
      status: "live",
      currentSlide: 1,
      audienceCount: 0,
      pairingCode,
      syncMode: "manual",
      startedAt: Date.now(),
    });
    return id;
  },
});

/** Update non-critical session settings (currently just syncMode). */
export const updateSettings = mutation({
  args: {
    tokenHash: v.union(v.string(), v.null()),
    presenterSessionId: v.id("presenterSessions"),
    syncMode: v.optional(
      v.union(v.literal("auto"), v.literal("hybrid"), v.literal("manual")),
    ),
    currentSlide: v.optional(v.number()),
  },
  handler: async (ctx, { tokenHash, presenterSessionId, ...patch }) => {
    const user = await requireUser(ctx, tokenHash);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) return;
    await assertHandoutOwner(ctx, user, session.handoutId);
    const clean: Record<string, unknown> = {};
    if (patch.syncMode !== undefined) clean.syncMode = patch.syncMode;
    if (patch.currentSlide !== undefined && patch.currentSlide >= 0) {
      clean.currentSlide = patch.currentSlide;
    }
    if (Object.keys(clean).length > 0) await ctx.db.patch(presenterSessionId, clean);
  },
});

/**
 * Public endpoint for the PowerPoint Add-in. NOT authenticated via cookie —
 * the caller proves it controls the presenter by knowing the 6-digit pairing
 * code shown on the presenter panel.
 *
 * Returns the session id + handout id on success. Rejects otherwise.
 */
export const bindByPairingCode = mutation({
  args: { pairingCode: v.string() },
  handler: async (ctx, { pairingCode }) => {
    const code = pairingCode.trim();
    if (!/^\d{6}$/.test(code)) throw new Error("INVALID_PAIRING_CODE");

    const session = await ctx.db
      .query("presenterSessions")
      .withIndex("by_pairingCode", (q) => q.eq("pairingCode", code))
      .filter((q) => q.eq(q.field("status"), "live"))
      .unique();
    if (!session) throw new Error("PAIRING_CODE_NOT_FOUND");

    return {
      presenterSessionId: session._id,
      handoutId: session.handoutId,
    };
  },
});

/**
 * Slide-advance via the add-in. Still requires the pairing code on EVERY call
 * — so if the presenter ends the session, further posts are rejected cleanly.
 */
export const advanceSlideByPairing = mutation({
  args: {
    pairingCode: v.string(),
    presenterSessionId: v.id("presenterSessions"),
    slideNumber: v.number(),
  },
  handler: async (ctx, { pairingCode, presenterSessionId, slideNumber }) => {
    const session = await ctx.db.get(presenterSessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== "live") throw new Error("SESSION_NOT_LIVE");
    if (session.pairingCode !== pairingCode.trim()) {
      throw new Error("PAIRING_CODE_MISMATCH");
    }
    await ctx.db.patch(presenterSessionId, { currentSlide: slideNumber });

    // Auto-reveal slide-bound blocks.
    const matching = await ctx.db
      .query("blocks")
      .withIndex("by_handout_slide", (q) =>
        q.eq("handoutId", session.handoutId).eq("slideNumber", slideNumber),
      )
      .collect();
    for (const block of matching) {
      if (block.trigger !== "slide") continue;
      const existing = await ctx.db
        .query("reveals")
        .withIndex("by_session_block", (q) =>
          q
            .eq("presenterSessionId", presenterSessionId)
            .eq("blockId", block._id),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("reveals", {
          presenterSessionId,
          blockId: block._id,
          revealedAt: Date.now(),
        });
      }
    }
  },
});

export const end = mutation({
  args: {
    tokenHash: v.union(v.string(), v.null()),
    presenterSessionId: v.id("presenterSessions"),
  },
  handler: async (ctx, { tokenHash, presenterSessionId }) => {
    const user = await requireUser(ctx, tokenHash);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) return;
    await assertHandoutOwner(ctx, user, session.handoutId);
    await ctx.db.patch(presenterSessionId, {
      status: "ended",
      endedAt: Date.now(),
    });
  },
});

export const advanceSlide = mutation({
  args: {
    tokenHash: v.union(v.string(), v.null()),
    presenterSessionId: v.id("presenterSessions"),
    slideNumber: v.number(),
  },
  handler: async (ctx, { tokenHash, presenterSessionId, slideNumber }) => {
    const user = await requireUser(ctx, tokenHash);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    await assertHandoutOwner(ctx, user, session.handoutId);
    await ctx.db.patch(presenterSessionId, { currentSlide: slideNumber });

    // Auto-reveal blocks bound to this slide.
    const matching = await ctx.db
      .query("blocks")
      .withIndex("by_handout_slide", (q) =>
        q.eq("handoutId", session.handoutId).eq("slideNumber", slideNumber),
      )
      .collect();
    for (const block of matching) {
      if (block.trigger !== "slide") continue;
      const existing = await ctx.db
        .query("reveals")
        .withIndex("by_session_block", (q) =>
          q
            .eq("presenterSessionId", presenterSessionId)
            .eq("blockId", block._id),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("reveals", {
          presenterSessionId,
          blockId: block._id,
          revealedAt: Date.now(),
        });
      }
    }
  },
});

/**
 * Live state of a presenter session, callable without auth so the presenter
 * page can subscribe via useQuery from the browser. Returns ONLY non-sensitive
 * fields — never the pairing code.
 */
export const publicState = query({
  args: { presenterSessionId: v.id("presenterSessions") },
  handler: async (ctx, { presenterSessionId }) => {
    const session = await ctx.db.get(presenterSessionId);
    if (!session) return null;
    return {
      status: session.status,
      currentSlide: session.currentSlide,
      syncMode: session.syncMode ?? "manual",
    };
  },
});

export const getForOwner = query({
  args: {
    tokenHash: v.union(v.string(), v.null()),
    presenterSessionId: v.id("presenterSessions"),
  },
  handler: async (ctx, { tokenHash, presenterSessionId }) => {
    const user = await requireUser(ctx, tokenHash);
    const session = await ctx.db.get(presenterSessionId);
    if (!session) return null;
    await assertHandoutOwner(ctx, user, session.handoutId);
    return session;
  },
});

export const listMine = query({
  args: { tokenHash: v.union(v.string(), v.null()) },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    return await ctx.db
      .query("presenterSessions")
      .withIndex("by_owner_status", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .collect();
  },
});
