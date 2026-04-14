import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js-Konfiguration.
 *
 * Enthält keinen Provider-Zugriff auf Node-only Module (Argon2) — der volle
 * Provider wird in `auth.ts` ergänzt. Diese Datei kann gefahrlos von der
 * Middleware (`proxy.ts`) importiert werden.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * Gate-Keeper für geschützte Routen. Wird auch von der Middleware
     * aufgerufen — wir redirecten anonyme User vom Dashboard auf /login.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isProtected =
        path.startsWith("/dashboard") || path.startsWith("/handouts");
      if (!isProtected) return true;
      if (isLoggedIn) return true;
      const url = new URL("/login", nextUrl);
      url.searchParams.set("next", path);
      return Response.redirect(url);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.displayName = (user as { displayName?: string }).displayName;
        token.isDemo = (user as { isDemo?: boolean }).isDemo;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { displayName?: string }).displayName =
          token.displayName as string | undefined;
        (session.user as { isDemo?: boolean }).isDemo = Boolean(token.isDemo);
      }
      return session;
    },
  },
  providers: [], // wird in auth.ts gefüllt
} satisfies NextAuthConfig;
