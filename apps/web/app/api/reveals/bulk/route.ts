import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

const Body = z.object({
  action: z.enum(["all", "none"]),
  presenterSessionId: z.string().min(1),
});

export const POST = defineRoute<Record<string, string>, z.infer<typeof Body>>({
  name: "reveals.bulk",
  body: Body,
  run: async ({ userId, body }) => {
    const convex = serverConvex();
    const id = body.presenterSessionId as Id<"presenterSessions">;
    if (body.action === "all") {
      await convex.mutation(api.reveals.revealAll, {
        userId,
        presenterSessionId: id,
      });
    } else {
      await convex.mutation(api.reveals.hideAll, {
        userId,
        presenterSessionId: id,
      });
    }
  },
});
