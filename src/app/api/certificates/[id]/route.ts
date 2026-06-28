import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { certificate } from "@/db/schema";
import { getSessionContext } from "@/lib/session";

export const dynamic = "force-dynamic";

// Revoke / restore a certificate. Owner-scoped: the companyId guard means a
// user can only ever touch their own rows.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status;
  if (status !== "verified" && status !== "revoked") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getDb();
  const updated = await db
    .update(certificate)
    .set({ status })
    .where(and(eq(certificate.id, id), inArray(certificate.companyId, ctx.orgs.map((o) => o.id))))
    .returning({ id: certificate.id });

  if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, status });
}
