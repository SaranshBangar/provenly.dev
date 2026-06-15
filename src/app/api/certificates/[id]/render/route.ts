import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { certificate } from "@/db/schema";
import { getSessionAndCompany } from "@/lib/session";

export const dynamic = "force-dynamic";

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string } | null {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!m) return null;
  return { contentType: m[1], bytes: Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)) };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { company } = await getSessionAndCompany();
  if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = getDb();
  const row = await db.query.certificate.findFirst({ where: and(eq(certificate.id, id), eq(certificate.companyId, company.id)) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { kind?: "pdf" | "png"; dataUrl?: string } | null;
  if (!body?.dataUrl || (body.kind !== "pdf" && body.kind !== "png")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const decoded = decodeDataUrl(body.dataUrl);
  if (!decoded) return NextResponse.json({ error: "Bad data URL" }, { status: 400 });
  if (decoded.bytes.length > 15 * 1024 * 1024) return NextResponse.json({ error: "File too large" }, { status: 413 });

  const { env } = getCloudflareContext();
  const key = `certs/${id}.${body.kind}`;
  await env.BUCKET.put(key, decoded.bytes, { httpMetadata: { contentType: decoded.contentType } });
  const url = `/api/file/${key}`;

  await db
    .update(certificate)
    .set(body.kind === "pdf" ? { pdfUrl: url } : { pngUrl: url })
    .where(eq(certificate.id, id));

  return NextResponse.json({ url });
}
