import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Slide Handout — Convex Schema.
 *
 * Realtime-Fan-out core: presenter reveals blocks → audience sees deltas.
 *
 * Seit der Auth.js-Migration ist Convex nicht mehr für Session-Management
 * zuständig — Next.js hält die JWT-Session im Cookie, und jeder Convex-Call
 * bekommt die verifizierte `userId` als typisiertes Arg.
 */
export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(), // Argon2id-encoded string ($argon2id$v=19$...)
    displayName: v.string(),
    isDemo: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Langlebige API-Tokens für den PowerPoint-Add-in. Nicht zu verwechseln
  // mit Next.js-Cookie-Sessions (die liegen als JWT im Browser).
  addinTokens: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(), // SHA-256 hex des vom Client gehaltenen Secrets
    label: v.optional(v.string()),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.number(),
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

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_publicToken", ["publicToken"]),

  blocks: defineTable({
    handoutId: v.id("handouts"),
    rank: v.string(),
    title: v.string(),
    markdown: v.string(),
    imageS3Key: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
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

  presenterSessions: defineTable({
    handoutId: v.id("handouts"),
    ownerId: v.id("users"),
    status: v.union(v.literal("live"), v.literal("ended")),
    currentSlide: v.number(),
    audienceCount: v.number(),
    pairingCode: v.optional(v.string()),
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

  reveals: defineTable({
    presenterSessionId: v.id("presenterSessions"),
    blockId: v.id("blocks"),
    revealedAt: v.number(),
  })
    .index("by_session_revealedAt", ["presenterSessionId", "revealedAt"])
    .index("by_session_block", ["presenterSessionId", "blockId"]),

  audienceHeartbeats: defineTable({
    presenterSessionId: v.id("presenterSessions"),
    clientId: v.string(),
    lastSeenAt: v.number(),
  })
    .index("by_session_lastSeenAt", ["presenterSessionId", "lastSeenAt"])
    .index("by_session_client", ["presenterSessionId", "clientId"]),

  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),
});
