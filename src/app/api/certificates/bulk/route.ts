import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { certificate, type CertData } from "@/db/schema";
import { getSessionAndCompany } from "@/lib/session";
import { deductCredits, addCredits } from "@/lib/credits";
import { DEFAULT_CERT, genSerial } from "@/lib/cert";

export const dynamic = "force-dynamic";

const MAX_ROWS = 10000;
type Row = Record<string, string>;

export async function POST(req: Request) {
  const { company } = await getSessionAndCompany();
  if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    template?: Partial<CertData>;
    mapping?: Record<string, string>;
    customColumns?: string[];
    rows?: Row[];
  } | null;

  const rows = body?.rows;
  const mapping = body?.mapping || {};
  const customColumns = body?.customColumns || [];
  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "No rows to issue" }, { status: 400 });
  if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS})` }, { status: 400 });
  if (!mapping.recipientName) return NextResponse.json({ error: "Recipient name column is not mapped" }, { status: 400 });

  const template: CertData = { ...DEFAULT_CERT, ...(body?.template || {}) };
  const n = rows.length;

  const ok = await deductCredits(company.id, n);
  if (!ok) return NextResponse.json({ error: `Not enough credits — you need ${n}.` }, { status: 402 });

  const now = new Date();
  const get = (r: Row, field: string) => (mapping[field] ? (r[mapping[field]] || "").trim() : "");

  const values = rows.map((r) => {
    const id = genSerial();
    const recipientName = get(r, "recipientName") || "Recipient";
    const eventName = get(r, "eventName") || template.eventName;
    const grade = get(r, "grade") || template.grade;
    const email = get(r, "email") || null;
    const customFields = [
      ...template.customFields,
      ...customColumns.map((c) => ({ key: c, value: r[c] || "" })).filter((f) => f.value),
    ];
    const data: CertData = { ...template, serial: id, recipientName, eventName, grade, recipientEmail: email || "", customFields };
    return {
      id,
      companyId: company.id,
      recipientName,
      recipientEmail: email,
      title: template.title,
      eventName,
      issueDate: template.issueDate || now.toISOString().slice(0, 10),
      expiryDate: template.expiryDate || null,
      status: "verified" as const,
      data,
      views: 0,
      createdAt: now,
    };
  });

  const db = getDb();
  try {
    // Insert in chunks to stay within D1 statement limits.
    const CHUNK = 25;
    for (let i = 0; i < values.length; i += CHUNK) {
      await db.insert(certificate).values(values.slice(i, i + CHUNK));
    }
  } catch (e) {
    await addCredits(company.id, n, false).catch(() => {});
    console.error("bulk insert failed", e);
    return NextResponse.json({ error: "Could not issue certificates" }, { status: 500 });
  }

  return NextResponse.json({ issued: n });
}
