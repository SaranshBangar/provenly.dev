import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { company } from "@/db/schema";
import { getSessionContext, ORG_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// Create a new organization and switch to it.
export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  if (ctx.orgs.length >= 50) return NextResponse.json({ error: "Organization limit reached" }, { status: 400 });

  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(company).values({ id, userId: ctx.user.id, name, createdAt: new Date() });
  (await cookies()).set(ORG_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  return NextResponse.json({ id, name });
}
