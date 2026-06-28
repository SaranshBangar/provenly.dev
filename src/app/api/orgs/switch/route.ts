import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionContext, ORG_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// Switch the active organization (stored in the `provenly_org` cookie).
export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;
  if (!id || !ctx.orgs.some((o) => o.id === id)) {
    return NextResponse.json({ error: "Unknown organization" }, { status: 400 });
  }
  (await cookies()).set(ORG_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return NextResponse.json({ ok: true });
}
