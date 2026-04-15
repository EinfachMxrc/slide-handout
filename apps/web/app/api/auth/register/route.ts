import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { RegisterPayload } from "#/lib/zod/auth";
import { hashPassword } from "#/lib/auth/hash";
import { serverConvex } from "#/lib/auth/session";
import { signIn } from "#/auth";
import { checkRateLimit } from "#/lib/auth/rate-limit";
import { logApiError } from "#/lib/log/api";

export const runtime = "nodejs";

/**
 * Registrierung. Auth.js deckt das von Haus aus nicht mit Credentials ab —
 * wir legen den User in Convex an, hashen das Passwort und loggen den User
 * direkt über `signIn("credentials")` ein (setzt das Auth.js-Cookie).
 */
export async function POST(req: Request): Promise<Response> {
  const rl = await checkRateLimit(`register:${req.headers.get("x-forwarded-for") ?? "unknown"}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = RegisterPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await serverConvex().mutation(api.users.createUser, {
      email: parsed.data.email,
      passwordHash,
      displayName: parsed.data.displayName,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("EMAIL_ALREADY_REGISTERED")) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    logApiError("auth.register", err, { email: parsed.data.email });
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  // Sign the user in via Auth.js Credentials provider. `redirect: false`
  // stops Auth.js from throwing the signal it otherwise uses to navigate.
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    // If auto-login fails, the account still exists — client can retry /login.
    return NextResponse.json({ ok: true, autoLogin: false });
  }

  return NextResponse.json({ ok: true, autoLogin: true });
}
