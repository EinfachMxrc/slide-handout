import { api } from "@convex/_generated/api";
import { sha256Hex } from "#/lib/auth/hash";
import { serverConvex } from "#/lib/auth/session";
import { corsHeaders, ok, preflight } from "#/lib/addin/token";

export const runtime = "nodejs";

export async function OPTIONS(): Promise<Response> {
  return preflight();
}

export async function POST(req: Request): Promise<Response> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  if (match) {
    const tokenHash = await sha256Hex(match[1]!);
    await serverConvex()
      .mutation(api.auth.revokeAddinToken, { tokenHash })
      .catch(() => {});
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders(), "content-type": "application/json" },
  });
}
