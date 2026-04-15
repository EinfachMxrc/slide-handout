import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

type Params = { id: string };

const SettingsBody = z.object({
  syncMode: z.enum(["auto", "hybrid", "manual"]).optional(),
  currentSlide: z.number().int().min(1).optional(),
});

export const PATCH = defineRoute<Params, z.infer<typeof SettingsBody>>({
  name: "sessions.updateSettings",
  body: SettingsBody,
  run: async ({ userId, params, body }) => {
    await serverConvex().mutation(api.sessions.updateSettings, {
      userId,
      presenterSessionId: params.id as Id<"presenterSessions">,
      syncMode: body.syncMode,
      currentSlide: body.currentSlide,
    });
  },
});
