import type { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { HandoutUpdate } from "#/lib/zod/handout";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

type Params = { id: string };

export const PATCH = defineRoute<Params, z.infer<typeof HandoutUpdate>>({
  name: "handouts.update",
  body: HandoutUpdate,
  run: async ({ userId, params, body }) => {
    await serverConvex().mutation(api.handouts.update, {
      userId,
      id: params.id as Id<"handouts">,
      ...body,
    });
  },
});

export const DELETE = defineRoute<Params>({
  name: "handouts.remove",
  run: async ({ userId, params }) => {
    await serverConvex().mutation(api.handouts.remove, {
      userId,
      id: params.id as Id<"handouts">,
    });
  },
});
