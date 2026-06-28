import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { event, template, type CertData } from "@/db/schema";
import { getSessionContext } from "@/lib/session";
import { DEFAULT_CERT } from "@/lib/cert";

export const dynamic = "force-dynamic";

function sanitize(input: Partial<CertData>): CertData {
  return {
    ...DEFAULT_CERT,
    ...input,
    signatures: Array.isArray(input.signatures) ? input.signatures.slice(0, 3) : DEFAULT_CERT.signatures,
    skills: Array.isArray(input.skills) ? input.skills.slice(0, 20) : [],
    customFields: Array.isArray(input.customFields) ? input.customFields.slice(0, 30) : [],
    elements: Array.isArray(input.elements) ? input.elements.slice(0, 100) : [],
  };
}

// List templates for the active organization, optionally filtered to one event.
export async function GET(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const eventId = new URL(req.url).searchParams.get("eventId");
  const db = getDb();
  const rows = await db
    .select()
    .from(template)
    .where(eventId ? and(eq(template.companyId, ctx.org.id), eq(template.eventId, eventId)) : eq(template.companyId, ctx.org.id))
    .orderBy(desc(template.createdAt));
  return NextResponse.json({ templates: rows });
}

// Save the current design as a reusable template.
export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { name?: string; type?: string; eventId?: string; cert?: Partial<CertData> } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  if (!body?.cert) return NextResponse.json({ error: "Missing design data" }, { status: 400 });
  const eventId = body?.eventId?.trim();
  if (!eventId) return NextResponse.json({ error: "Pick an event for this template first" }, { status: 400 });

  const db = getDb();
  // Templates depend on events — only allow linking to an event in this org.
  const ev = await db.select({ id: event.id }).from(event).where(and(eq(event.id, eventId), eq(event.companyId, ctx.org.id))).get();
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(template).values({
    id,
    companyId: ctx.org.id,
    eventId,
    name,
    type: body.type?.trim() || "participation",
    data: sanitize(body.cert),
    createdAt: new Date(),
  });
  return NextResponse.json({ id, name });
}

// Delete a template (own org only).
export async function DELETE(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = getDb();
  await db.delete(template).where(and(eq(template.id, id), eq(template.companyId, ctx.org.id)));
  return NextResponse.json({ ok: true });
}
