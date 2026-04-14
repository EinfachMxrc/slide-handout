import { NextResponse } from "next/server";
import { getSession } from "#/lib/auth/session";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      displayName: session.displayName,
      isDemo: session.isDemo,
    },
  });
}
