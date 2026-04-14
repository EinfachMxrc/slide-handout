import { z } from "zod";
import { api } from "@convex/_generated/api";
import { verifyPassword } from "#/lib/auth/hash";
import { serverConvex } from "#/lib/auth/session";
import { checkRateLimit } from "#/lib/auth/rate-limit";
import {
  bad,
  corsHeaders,
  mintToken,
  ok,
  preflight,
  unauthorized,
} from "#/lib/addin/token";

export const runtime = "nodejs";

const Payload = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function OPTIONS(): Promise<Response> {
  return preflight();
}

export async function POST(req: Request): Promise<Response> {
  const rl = await checkRateLimit(
    `addin-login:${req.headers.get("x-forwarded-for") ?? "unknown"}`,
    10,
  );
  if (!rl.allowed) return bad("rate_limited", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }
  const parsed = Payload.safeParse(body);
  if (!parsed.success) return bad("validation");

  const convex = serverConvex();
  const user = await convex.query(api.users.findByEmail, {
    email: parsed.data.email.toLowerCase(),
  });

  // Constant-time-ish: always run argon2 to avoid email-enumeration.
  const dummy =
    "$argon2id$v=19$m=19456,t=2,p=1$" +
    "ZHVtbXlzYWx0ZHVtbXlzYWx0$" +
    "Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYg";
  const ok_ = await verifyPassword(user?.passwordHash ?? dummy, parsed.data.password);
  if (!user || !ok_) return unauthorized();

  const { raw, hash } = await mintToken();
  await convex.mutation(api.auth.issueAddinToken, {
    userId: user._id,
    tokenHash: hash,
    label: "PowerPoint Add-in",
  });

  return new Response(
    JSON.stringify({
      token: raw,
      user: {
        email: user.email,
        displayName: user.displayName,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders(), "content-type": "application/json" },
    },
  );
}
