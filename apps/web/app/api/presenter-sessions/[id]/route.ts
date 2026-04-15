import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

type Params = { id: string };

export const DELETE = defineRoute<Params>({
  name: "sessions.end",
  run: async ({ userId, params }) => {
    await serverConvex().mutation(api.sessions.end, {
      userId,
      presenterSessionId: params.id as Id<"presenterSessions">,
    });
  },
});

/** Slide advance — used by the PowerPoint Add-in (session-cookie path). */
const AdvanceBody = z.object({ slideNumber: z.number().int().min(1) });

export const PATCH = defineRoute<Params, z.infer<typeof AdvanceBody>>({
  name: "sessions.advanceSlide",
  body: AdvanceBody,
  run: async ({ userId, params, body }) => {
    await serverConvex().mutation(api.sessions.advanceSlide, {
      userId,
      presenterSessionId: params.id as Id<"presenterSessions">,
      slideNumber: body.slideNumber,
    });
  },
});
