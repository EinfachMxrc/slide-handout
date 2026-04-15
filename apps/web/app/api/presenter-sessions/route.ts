import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

const Body = z.object({ handoutId: z.string().min(1) });

export const POST = defineRoute<Record<string, string>, z.infer<typeof Body>>({
  name: "sessions.start",
  body: Body,
  run: async ({ userId, body }) => {
    const id = await serverConvex().mutation(api.sessions.start, {
      userId,
      handoutId: body.handoutId as Id<"handouts">,
    });
    return { id };
  },
});
