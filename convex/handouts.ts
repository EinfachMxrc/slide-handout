import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, assertNotDemo, assertHandoutOwner } from "./_lib/authHelpers";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64) || "handout";
}

function randomToken(): string {
  // 16 bytes of randomness as base36 → ~22 chars URL-safe.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

export const dashboardStats = query({
  args: { userId: v.union(v.id("users"), v.null()) },
  handler: async (ctx, { userId }) => {
    const user = await requireUser(ctx, userId);
    const handouts = await ctx.db
      .query("handouts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    const liveSessions = await ctx.db
      .query("presenterSessions")
      .withIndex("by_owner_status", (q) =>
        q.eq("ownerId", user._id).eq("status", "live"),
      )
      .collect();

    // "Entwürfe" = total block count across all owned handouts.
    let blockCount = 0;
    for (const h of handouts) {
      const bs = await ctx.db
        .query("blocks")
        .withIndex("by_handout_rank", (q) => q.eq("handoutId", h._id))
        .collect();
      blockCount += bs.length;
    }
    return {
      handouts: handouts.length,
      liveSessions: liveSessions.length,
      drafts: blockCount,
    };
  },
});

export const listMine = query({
  args: { userId: v.union(v.id("users"), v.null()) },
  handler: async (ctx, { userId }) => {
    const user = await requireUser(ctx, userId);
    return await ctx.db
      .query("handouts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { userId: v.union(v.id("users"), v.null()), id: v.id("handouts") },
  handler: async (ctx, { userId, id }) => {
    const user = await requireUser(ctx, userId);
    const handout = await ctx.db.get(id);
    if (!handout || handout.ownerId !== user._id) return null;
    return handout;
  },
});

/** Public reader endpoint — no auth, lookup by URL token. */
export const getPublic = query({
  args: { publicToken: v.string() },
  handler: async (ctx, { publicToken }) => {
    const handout = await ctx.db
      .query("handouts")
      .withIndex("by_publicToken", (q) => q.eq("publicToken", publicToken))
      .unique();
    if (!handout) return null;
    // Find the active presenter session (if any).
    const live = await ctx.db
      .query("presenterSessions")
      .withIndex("by_handout", (q) => q.eq("handoutId", handout._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .order("desc")
      .first();
    return {
      _id: handout._id,
      title: handout.title,
      description: handout.description,
      presetPdfS3Key: handout.presetPdfS3Key,
      accentColor: handout.accentColor ?? null,
      coverImageUrl: handout.coverImageUrl ?? null,
      logoUrl: handout.logoUrl ?? null,
      fontFamily: handout.fontFamily ?? null,
      readerTheme: handout.readerTheme ?? null,
      footerMarkdown: handout.footerMarkdown ?? null,
      presenterSessionId: live?._id ?? null,
      currentSlide: live?.currentSlide ?? 0,
    };
  },
});

export const create = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { userId, title, description }) => {
    const user = await requireUser(ctx, userId);
    assertNotDemo(user);
    const now = Date.now();
    return await ctx.db.insert("handouts", {
      ownerId: user._id,
      title,
      description,
      slug: slugify(title),
      publicToken: randomToken(),
      createdAt: now,
      updatedAt: now,
    });
  },
});

function validateHex(hex: string): string {
  const m = hex.trim();
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(m)) {
    throw new Error("INVALID_HEX_COLOR");
  }
  return m.toLowerCase();
}

function validateHttpsUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed === "") return "";
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:") throw new Error("NOT_HTTPS");
    return u.toString();
  } catch {
    throw new Error("INVALID_URL");
  }
}

export const update = mutation({
  args: {
    userId: v.union(v.id("users"), v.null()),
    id: v.id("handouts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    presetPdfS3Key: v.optional(v.string()),

    accentColor: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    fontFamily: v.optional(
      v.union(v.literal("sans"), v.literal("serif"), v.literal("mono")),
    ),
    readerTheme: v.optional(
      v.union(v.literal("auto"), v.literal("light"), v.literal("dark")),
    ),
    footerMarkdown: v.optional(v.string()),
  },
  handler: async (ctx, { userId, id, ...patch }) => {
    const user = await requireUser(ctx, userId);
    assertNotDemo(user);
    await assertHandoutOwner(ctx, user, id);

    // Normalize / validate appearance fields.
    const clean: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v0] of Object.entries(patch)) {
      if (v0 === undefined) continue;
      if (k === "accentColor") {
        clean[k] = v0 === "" ? undefined : validateHex(String(v0));
      } else if (k === "coverImageUrl" || k === "logoUrl") {
        const url = validateHttpsUrl(String(v0));
        clean[k] = url === "" ? undefined : url;
      } else if (k === "footerMarkdown") {
        const s = String(v0).slice(0, 2000);
        clean[k] = s === "" ? undefined : s;
      } else {
        clean[k] = v0;
      }
    }
    await ctx.db.patch(id, clean);
  },
});

export const remove = mutation({
  args: { userId: v.union(v.id("users"), v.null()), id: v.id("handouts") },
  handler: async (ctx, { userId, id }) => {
    const user = await requireUser(ctx, userId);
    assertNotDemo(user);
    await assertHandoutOwner(ctx, user, id);
    // Cascade — delete blocks, presenter sessions, and reveals belonging to this handout.
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_handout_rank", (q) => q.eq("handoutId", id))
      .collect();
    await Promise.all(blocks.map((b) => ctx.db.delete(b._id)));

    const sessions = await ctx.db
      .query("presenterSessions")
      .withIndex("by_handout", (q) => q.eq("handoutId", id))
      .collect();
    for (const s of sessions) {
      const reveals = await ctx.db
        .query("reveals")
        .withIndex("by_session_revealedAt", (q) =>
          q.eq("presenterSessionId", s._id),
        )
        .collect();
      await Promise.all(reveals.map((r) => ctx.db.delete(r._id)));
      await ctx.db.delete(s._id);
    }
    await ctx.db.delete(id);
  },
});
