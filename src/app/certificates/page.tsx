import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { certificate, event } from "@/db/schema";
import { getSessionContext } from "@/lib/session";
import { fmtDate } from "@/lib/cert";
import { initialsOf } from "@/lib/util";
import { AppNav } from "@/components/AppNav";
import { Icon, type IconName } from "@/components/Icon";
import { DashboardTable, type CertRow } from "@/components/DashboardTable";

export const dynamic = "force-dynamic";

function Stat({ icon, tint, color, value, label }: { icon: IconName; tint: string; color: string; value: string; label: string }) {
  return (
    <div className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: tint, color, display: "grid", placeItems: "center" }}><Icon name={icon} size={23} /></div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
        <div className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

export default async function CertificatesPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { wallet, org } = ctx;

  const db = getDb();
  const [certs, events] = await Promise.all([
    db.select().from(certificate).where(eq(certificate.companyId, org.id)).orderBy(desc(certificate.createdAt)),
    db.select({ id: event.id, name: event.name }).from(event).where(eq(event.companyId, org.id)).orderBy(asc(event.name)),
  ]);

  const rows: CertRow[] = certs.map((c) => ({
    id: c.id,
    recipientName: c.recipientName,
    eventName: c.eventName || "-",
    eventId: c.eventId,
    date: fmtDate(c.issueDate),
    status: c.status,
    views: c.views,
  }));

  const issued = certs.filter((c) => c.status !== "draft").length;
  const totalViews = certs.reduce((a, c) => a + c.views, 0);

  return (
    <>
      <AppNav credits={wallet.credits} initials={initialsOf(org.name)} />
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 22px 70px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
          <div>
            <h1 style={{ fontSize: 30, letterSpacing: "-0.03em" }}>Issued certificates</h1>
            <p className="muted" style={{ marginTop: 6, fontSize: 15.5 }}>Every certificate issued by {org.name}.</p>
          </div>
          <Link className="btn btn-primary" href="/issue"><Icon name="bolt" size={18} /> Issue certificates</Link>
        </div>

        <div className="dash-top" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
          <Stat icon="doc" tint="var(--green-tint)" color="var(--green-700)" value={String(issued)} label="Certificates issued" />
          <Stat icon="globe" tint="var(--blue-tint)" color="#1d4fb0" value={totalViews.toLocaleString()} label="Verification views" />
          <Stat icon="shield" tint="var(--gold-tint)" color="#8a6a1e" value="100%" label="Authenticity rate" />
        </div>

        <DashboardTable certs={rows} events={events} />
      </div>
    </>
  );
}
