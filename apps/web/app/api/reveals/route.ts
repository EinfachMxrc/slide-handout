import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

const Body = z.object({
  presenterSessionId: z.string().min(1),
  blockId: z.string().min(1),
});

export const POST = defineRoute<Record<string, string>, z.infer<typeof Body>>({
  name: "reveals.reveal",
  body: Body,
  rateLimit: { key: "reveal", limit: 120 },
  run: async ({ userId, body }) => {
    await serverConvex().mutation(api.reveals.reveal, {
      userId,
      presenterSessionId: body.presenterSessionId as Id<"presenterSessions">,
      blockId: body.blockId as Id<"blocks">,
    });
  },
});
