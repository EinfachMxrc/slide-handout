import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Slide Handout — Convex Schema
 *
 * Realtime-Fan-out core: presenter reveals blocks → audience sees deltas.
 *
 * Key design decisions (see plan):
 *   - `reveals` is a separate delta-table, queried by `by_session_revealedAt`.
 *     Subscriptions only stream new reveals, never the full handout state.
 *   - Block ordering uses LexoRank-strings (`rank`) — no float rebalancing.
 *   - Idempotency for reveals enforced in mutation code via `by_session_block` index;
 *     Convex has no declarative unique constraints.
 *   - Auth records (sessions) store only SHA-256 hashes of cookie tokens.
 */
export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(), // Argon2id-encoded string ($argon2id$v=19$...)
    displayName: v.string(),
    isDemo: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Auth sessions (cookie-based). Token plaintext is never stored.
  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(), // SHA-256 hex of the random cookie token
    expiresAt: v.number(),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_userId", ["userId"]),

  handouts: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    publicToken: v.string(), // 16-byte random URL-safe token for /h/[token]
    presetPdfS3Key: v.optional(v.string()),

    // --- Reader customization (all optional) ---
    accentColor: v.optional(v.string()), // hex "#rrggbb" — validated server-side
    coverImageUrl: v.optional(v.string()), // https URL, shown above the title
    logoUrl: v.optional(v.string()), // https URL, shown in header
    fontFamily: v.optional(
      v.union(v.literal("sans"), v.literal("serif"), v.literal("mono")),
    ),
    readerTheme: v.optional(
      v.union(v.literal("auto"), v.literal("light"), v.literal("dark")),
    ),
    footerMarkdown: v.optional(v.string()), // shown at the bottom of the reader

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_publicToken", ["publicToken"]),

  blocks: defineTable({
    handoutId: v.id("handouts"),
    rank: v.string(), // LexoRank fraction, e.g. "n", "u", "n5"
    title: v.string(),
    markdown: v.string(),
    imageS3Key: v.optional(v.string()), // legacy — object-storage key
    imageUrl: v.optional(v.string()), // new — pastable https URL, wins over key
    imageCaption: v.optional(v.string()),
    trigger: v.union(
      v.literal("slide"),
      v.literal("always"),
      v.literal("manual"),
    ),
    slideNumber: v.optional(v.number()),
    layout: v.union(
      v.literal("default"),
      v.literal("centered"),
      v.literal("wide"),
      v.literal("compact"),
      v.literal("terminal"),
    ),
    // Optional: Variante eines Terminal-Blocks. Beeinflusst Header-Farbe
    // und das Statusicon (✓ / ✗) — z.B. für „SICHER vs. UNSICHER"-Vergleiche.
    terminalVariant: v.optional(
      v.union(
        v.literal("neutral"),
        v.literal("success"),
        v.literal("danger"),
      ),
    ),
    terminalLabel: v.optional(v.string()),
    imagePosition: v.union(
      v.literal("top"),
      v.literal("bottom"),
      v.literal("left"),
      v.literal("right"),
      v.literal("full"),
      v.literal("background"),
    ),
    fontSize: v.union(
      v.literal("sm"),
      v.literal("base"),
      v.literal("lg"),
      v.literal("xl"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_handout_rank", ["handoutId", "rank"])
    .index("by_handout_slide", ["handoutId", "slideNumber"]),

  // Live presenter sessions — one per active presentation.
  presenterSessions: defineTable({
    handoutId: v.id("handouts"),
    ownerId: v.id("users"),
    status: v.union(v.literal("live"), v.literal("ended")),
    currentSlide: v.number(),
    audienceCount: v.number(), // denormalized; updated by cron
    // 6-digit code the PowerPoint Add-in types in to bind itself to this
    // session without needing a cookie or OAuth.
    pairingCode: v.optional(v.string()),
    // How slide → reveal mapping is driven:
    //   "auto"   — only PowerPoint Add-in advances reveal blocks
    //   "hybrid" — both add-in AND manual reveal-buttons work
    //   "manual" — presenter clicks Reveal for each block (default)
    syncMode: v.optional(
      v.union(v.literal("auto"), v.literal("hybrid"), v.literal("manual")),
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_handout", ["handoutId"])
    .index("by_status", ["status"])
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_pairingCode", ["pairingCode"]),

  // Delta-table: one row per reveal event. Subscriptions read this incrementally.
  reveals: defineTable({
    presenterSessionId: v.id("presenterSessions"),
    blockId: v.id("blocks"),
    revealedAt: v.number(),
  })
    .index("by_session_revealedAt", ["presenterSessionId", "revealedAt"])
    .index("by_session_block", ["presenterSessionId", "blockId"]),

  // Live audience presence — one row per browser tab, upserted via heartbeat
  // every ~20s. Count of rows with lastSeenAt > now - 45s = live audience.
  audienceHeartbeats: defineTable({
    presenterSessionId: v.id("presenterSessions"),
    clientId: v.string(), // random ID kept in the reader's localStorage
    lastSeenAt: v.number(),
  })
    .index("by_session_lastSeenAt", ["presenterSessionId", "lastSeenAt"])
    .index("by_session_client", ["presenterSessionId", "clientId"]),

  // Sliding-window rate limiter, keyed by "endpoint:identifier".
  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),
});
