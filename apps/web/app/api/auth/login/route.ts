import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { LoginPayload } from "#/lib/zod/auth";
import {
  verifyPassword,
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
  const rl = await checkRateLimit(`login:${ip}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = LoginPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const convex = serverConvex();
  const user = await convex.query(api.users.findByEmail, {
    email: parsed.data.email,
  });

  // Constant-time-ish: always run a hash even if no user, to avoid email enum.
  const dummyHash =
    "$argon2id$v=19$m=19456,t=2,p=1$" +
    "ZHVtbXlzYWx0ZHVtbXlzYWx0$" +
    "Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYg";
  const ok = await verifyPassword(
    user?.passwordHash ?? dummyHash,
    parsed.data.password,
  );
  if (!user || !ok) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401 },
    );
  }

  const token = generateSessionToken();
  const tokenHash = await sha256Hex(token);
  await convex.mutation(api.auth.createSession, {
    userId: user._id,
    tokenHash,
    userAgent: await getUserAgent(),
    ip,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
