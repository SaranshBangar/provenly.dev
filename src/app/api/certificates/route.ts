import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { certificate, type CertData } from "@/db/schema";
import { getSessionAndCompany } from "@/lib/session";
import { deductCredits, addCredits } from "@/lib/credits";
import { DEFAULT_CERT, genSerial } from "@/lib/cert";

export const dynamic = "force-dynamic";

function sanitize(input: Partial<CertData>): CertData {
  return {
    ...DEFAULT_CERT,
    ...input,
    signatures: Array.isArray(input.signatures) ? input.signatures.slice(0, 3) : DEFAULT_CERT.signatures,
    skills: Array.isArray(input.skills) ? input.skills.slice(0, 20) : [],
    customFields: Array.isArray(input.customFields) ? input.customFields.slice(0, 30) : [],
  };
}

export async function GET() {
  const { company } = await getSessionAndCompany();
  if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = await db
    .select()
    .from(certificate)
    .where(eq(certificate.companyId, company.id))
    .orderBy(desc(certificate.createdAt));
  return NextResponse.json({ certificates: rows });
}

export async function POST(req: Request) {
  const { company } = await getSessionAndCompany();
  if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { cert?: Partial<CertData> } | null;
  if (!body?.cert) return NextResponse.json({ error: "Missing certificate data" }, { status: 400 });

  const cert = sanitize(body.cert);
  if (!cert.recipientName?.trim()) return NextResponse.json({ error: "Recipient name is required" }, { status: 400 });
  if (!cert.title?.trim()) return NextResponse.json({ error: "Certificate title is required" }, { status: 400 });

  const ok = await deductCredits(company.id, 1);
  if (!ok) return NextResponse.json({ error: "You're out of credits. Top up to keep issuing." }, { status: 402 });

  const id = genSerial();
  const data: CertData = { ...cert, serial: id };

  const db = getDb();
  try {
    await db.insert(certificate).values({
      id,
      companyId: company.id,
      recipientName: cert.recipientName.trim(),
      recipientEmail: cert.recipientEmail || null,
      title: cert.title.trim(),
      eventName: cert.eventName || null,
      issueDate: cert.issueDate || new Date().toISOString().slice(0, 10),
      expiryDate: cert.expiryDate || null,
      status: "verified",
      data,
      views: 0,
      createdAt: new Date(),
    });
  } catch (e) {
    // refund the credit on failure
    await addCredits(company.id, 1, false).catch(() => {});
    console.error("cert insert failed", e);
    return NextResponse.json({ error: "Could not save certificate" }, { status: 500 });
  }

  return NextResponse.json({ id });
}
