import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { RegisterPayload } from "#/lib/zod/auth";
import {
  hashPassword,
  generateSessionToken,
  sha256Hex,
} from "#/lib/auth/hash";
import {
  serverConvex,
  setSessionCookie,
  getClientIp,
  getUserAgent,
} from "#/lib/auth/session";
import { checkRateLimit } from "#/lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`register:${ip}`, 10);
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
  const convex = serverConvex();

  let userId: string;
  try {
    userId = await convex.mutation(api.users.createUser, {
      email: parsed.data.email,
      passwordHash,
      displayName: parsed.data.displayName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg.includes("EMAIL_ALREADY_REGISTERED")) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  const token = generateSessionToken();
  const tokenHash = await sha256Hex(token);
  await convex.mutation(api.auth.createSession, {
    userId: userId as never,
    tokenHash,
    userAgent: await getUserAgent(),
    ip,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
