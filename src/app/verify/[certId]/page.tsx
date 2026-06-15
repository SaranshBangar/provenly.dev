import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { certificate } from "@/db/schema";
import { DEFAULT_CERT, type CertData } from "@/lib/cert";
import { VerifyView } from "@/components/VerifyView";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify certificate · Provenly",
  robots: { index: false },
};

function isExpired(expiry?: string): boolean {
  if (!expiry) return false;
  const d = new Date(expiry + "T23:59:59");
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

export default async function VerifyPage({ params }: { params: Promise<{ certId: string }> }) {
  const { certId } = await params;

  // Public demo for the landing-page CTA.
  if (certId === "demo") {
    return <VerifyView cert={{ ...DEFAULT_CERT, serial: "PRV-2026-DEMO-CERT" }} status="verified" />;
  }

  const db = getDb();
  const row = await db.query.certificate.findFirst({ where: eq(certificate.id, certId) });

  if (!row) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
        <header style={{ borderBottom: "1px solid var(--line)", background: "#fff" }}>
          <div className="container" style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/"><Logo size={20} /></Link>
            <Link className="btn btn-ghost btn-sm" href="/login">Issue your own <Icon name="arrow" size={15} /></Link>
          </div>
        </header>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "90px 24px", textAlign: "center" }}>
          <div style={{ width: 110, height: 110, margin: "0 auto 22px", borderRadius: "50%", background: "var(--danger-tint)", color: "var(--danger)", display: "grid", placeItems: "center", animation: "pop-in .5s both" }}>
            <Icon name="x" size={56} stroke={2.2} />
          </div>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.02em" }}>Certificate not found</h1>
          <p className="muted" style={{ marginTop: 12, fontSize: 16, lineHeight: 1.55 }}>
            No certificate matches this link. It may have been mistyped, or this certificate was never issued through Provenly.
          </p>
          <div className="mono" style={{ marginTop: 16, fontSize: 13, color: "var(--ink-4)", wordBreak: "break-all" }}>{certId}</div>
          <Link href="/" className="btn btn-ghost" style={{ marginTop: 26 }}>Back to Provenly</Link>
        </div>
      </div>
    );
  }

  // Increment view counter (best effort, fire-and-forget).
  try {
    await db.update(certificate).set({ views: sql`${certificate.views} + 1` }).where(eq(certificate.id, certId));
  } catch {
    /* ignore */
  }

  const data: CertData = { ...DEFAULT_CERT, ...row.data, serial: row.id };
  const status: "verified" | "revoked" | "expired" =
    row.status === "revoked" ? "revoked" : isExpired(row.expiryDate || data.expiryDate) ? "expired" : "verified";

  return <VerifyView cert={data} status={status} />;
}
