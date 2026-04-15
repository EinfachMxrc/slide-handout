import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

const Body = z.object({
  id: z.string().min(1),
  prevRank: z.string().nullable(),
  nextRank: z.string().nullable(),
});

export const POST = defineRoute<Record<string, string>, z.infer<typeof Body>>({
  name: "blocks.reorder",
  body: Body,
  run: async ({ userId, body }) => {
    await serverConvex().mutation(api.blocks.reorder, {
      userId,
      id: body.id as Id<"blocks">,
      prevRank: body.prevRank,
      nextRank: body.nextRank,
    });
  },
});
