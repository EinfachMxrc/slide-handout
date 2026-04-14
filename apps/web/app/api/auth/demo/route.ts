import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { hashPassword } from "#/lib/auth/hash";
import { serverConvex } from "#/lib/auth/session";
import { signIn } from "#/auth";
import { checkRateLimit } from "#/lib/auth/rate-limit";

export const runtime = "nodejs";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@slide-handout.app";
// Feste, öffentlich-bekannte Demo-Zugangsdaten. Der Account kann nichts
// Schreiben (assertNotDemo blockt alle Mutations auf Handouts/Blocks),
// daher ist das unkritisch.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "slide-handout-demo-2026";
const DEMO_NAME = "Demo-Konto";

/**
 * Ein-Klick-Demo-Login. Auf Knopfdruck:
 *  1. Demo-User anlegen, falls er noch nicht existiert
 *  2. Demo-Handout (SQL Injection + Terminal-Blöcke) seeden, falls leer
 *  3. Über Auth.js als Demo-User einloggen
 *
 * Rate-Limit: 10 Klicks/Minute/IP, um Missbrauch des Auto-Seeds zu drosseln.
 */
export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`demo:${ip}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const convex = serverConvex();

  // 1. Sicherstellen, dass der Demo-User existiert.
  let user = await convex.query(api.users.findByEmail, {
    email: DEMO_EMAIL.toLowerCase(),
  });
  if (!user) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    try {
      await convex.mutation(api.users.createUser, {
        email: DEMO_EMAIL,
        passwordHash,
        displayName: DEMO_NAME,
        isDemo: true,
      });
    } catch (e) {
      // Race: ein parallel laufender Demo-Login hat's angelegt — ignorieren.
      const msg = e instanceof Error ? e.message : "";
      if (!msg.includes("EMAIL_ALREADY_REGISTERED")) {
        return NextResponse.json({ error: "create_failed" }, { status: 500 });
      }
    }
    user = await convex.query(api.users.findByEmail, {
      email: DEMO_EMAIL.toLowerCase(),
    });
  }

  if (!user) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
  if (!user.isDemo) {
    // Paranoia: falls irgendwer manuell den Demo-User als echten User
    // umgestaltet hat, lehnen wir den Demo-Login ab.
    return NextResponse.json({ error: "not_a_demo_user" }, { status: 500 });
  }

  // 2. Inhalt seeden — idempotent.
  try {
    await convex.mutation(api.demo.seedIfEmpty, { userId: user._id });
  } catch {
    /* schon seeded ist ok, unbekannte Fehler schlucken wir hier nicht weiter */
  }

  // 3. Via Auth.js einloggen.
  try {
    await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirect: false,
    });
  } catch {
    return NextResponse.json({ error: "login_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
