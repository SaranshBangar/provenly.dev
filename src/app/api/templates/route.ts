import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { template, type CertData } from "@/db/schema";
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

// List templates for the active organization.
export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = await db.select().from(template).where(eq(template.companyId, ctx.org.id)).orderBy(desc(template.createdAt));
  return NextResponse.json({ templates: rows });
}

// Save the current design as a reusable template.
export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { name?: string; type?: string; cert?: Partial<CertData> } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  if (!body?.cert) return NextResponse.json({ error: "Missing design data" }, { status: 400 });

  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(template).values({
    id,
    companyId: ctx.org.id,
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
