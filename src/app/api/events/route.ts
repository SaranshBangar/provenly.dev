import { NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { event } from "@/db/schema";
import { getSessionContext } from "@/lib/session";

export const dynamic = "force-dynamic";

// List events for the active organization.
export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = await db.select().from(event).where(eq(event.companyId, ctx.org.id)).orderBy(asc(event.name));
  return NextResponse.json({ events: rows });
}

// Create an event in the active organization.
export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { name?: string; date?: string } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Event name is required" }, { status: 400 });

  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(event).values({ id, companyId: ctx.org.id, name, date: body?.date?.trim() || null, createdAt: new Date() });
  return NextResponse.json({ id, name });
}

// Delete an event (own org only).
export async function DELETE(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = getDb();
  await db.delete(event).where(and(eq(event.id, id), eq(event.companyId, ctx.org.id)));
  return NextResponse.json({ ok: true });
}
