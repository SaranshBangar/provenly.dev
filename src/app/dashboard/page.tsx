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
import { OrgSwitcher } from "@/components/OrgSwitcher";

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

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { wallet, org, orgs } = ctx;

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
  const isFree = wallet.plan === "free";
  const freeUsed = Math.max(0, 5 - wallet.credits);
  const pct = isFree ? (wallet.credits / 5) * 100 : 100;

  return (
    <>
      <AppNav credits={wallet.credits} initials={initialsOf(org.name)} />
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 22px 70px" }}>
        <div style={{ marginBottom: 18 }}>
          <OrgSwitcher orgs={orgs} currentId={org.id} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
          <div>
            <h1 style={{ fontSize: 30, letterSpacing: "-0.03em" }}>Welcome back, {org.name}</h1>
            <p className="muted" style={{ marginTop: 6, fontSize: 15.5 }}>Here&apos;s what&apos;s happening with your certificates.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link className="btn btn-ghost" href="/upload"><Icon name="upload" size={18} /> Bulk issue</Link>
            <Link className="btn btn-primary" href="/customize"><Icon name="plus" size={18} /> New certificate</Link>
          </div>
        </div>

        <div className="dash-top" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr) 1.3fr", gap: 16, marginBottom: 16 }}>
          <Stat icon="doc" tint="var(--green-tint)" color="var(--green-700)" value={String(issued)} label="Certificates issued" />
          <Stat icon="globe" tint="var(--blue-tint)" color="#1d4fb0" value={totalViews.toLocaleString()} label="Verification views" />
          <Stat icon="shield" tint="var(--gold-tint)" color="#8a6a1e" value="100%" label="Authenticity rate" />

          <div className="card" style={{ padding: "20px 22px", background: "linear-gradient(135deg,#0F1B2D,#1d2f48)", color: "#fff", border: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="star" size={17} style={{ color: "var(--gold)" }} />
                <span style={{ fontWeight: 700 }}>{isFree ? "Free plan" : "Pro plan"}</span>
              </div>
              <Link className="tlink" href="/billing" style={{ color: "#7fe3bc", fontSize: 13 }}>{isFree ? "Upgrade" : "Top up"}</Link>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <span style={{ fontSize: 28, fontWeight: 800 }}>{wallet.credits}</span>
              <span style={{ color: "rgba(255,255,255,.6)", fontSize: 14 }}>{isFree ? `/ 5 free credits left` : "credits remaining"}</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,.16)", marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--green),#3ddc9a)", borderRadius: 99, transition: "width 1s" }} />
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", marginTop: 10 }}>
              {isFree ? `${freeUsed} of 5 used · verifying is always free` : "₹1 = 1 credit · top up anytime"}
            </div>
          </div>
        </div>

        <DashboardTable certs={rows} events={events} />
      </div>
    </>
  );
}
