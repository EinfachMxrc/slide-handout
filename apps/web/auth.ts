import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { verifyPassword } from "#/lib/auth/hash";
import { env } from "#/env";
import { authConfig } from "./auth.config";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function convex(): ConvexHttpClient {
  return new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
}

/**
 * Volle Auth.js-Konfiguration mit Credentials-Provider.
 *
 *   import { auth, signIn, signOut, handlers } from "#/auth";
 *
 * Diese Datei läuft in der Node-Runtime (Argon2-Verify). In der Middleware
 * nutzen wir nur `authConfig` + ein separates `auth()`-Binding ohne den
 * Credentials-Provider, um den Edge-Runtime-Pfad schlank zu halten.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await convex().query(api.users.findByEmail, {
          email: email.toLowerCase(),
        });
        if (!user) return null;
        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) return null;
        return {
          id: user._id as Id<"users">,
          email: user.email,
          displayName: user.displayName,
          isDemo: user.isDemo,
        };
      },
    }),
  ],
});
