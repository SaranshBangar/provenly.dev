import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, asc, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { certificate, event, template } from "@/db/schema";
import { getSessionContext } from "@/lib/session";
import { initialsOf } from "@/lib/util";
import { AppNav } from "@/components/AppNav";
import { Icon } from "@/components/Icon";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { DashboardHub, type HubEvent, type HubTemplate } from "@/components/DashboardHub";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { wallet, org, orgs } = ctx;

  const db = getDb();
  const [events, templates, certs] = await Promise.all([
    db.select({ id: event.id, name: event.name, date: event.date }).from(event).where(eq(event.companyId, org.id)).orderBy(asc(event.name)),
    db.select({ id: template.id, name: template.name, type: template.type }).from(template).where(eq(template.companyId, org.id)).orderBy(desc(template.createdAt)),
    db.select({ id: certificate.id, eventId: certificate.eventId, templateId: certificate.templateId }).from(certificate).where(eq(certificate.companyId, org.id)),
  ]);

  const byEvent = new Map<string, number>();
  const byTemplate = new Map<string, number>();
  for (const c of certs) {
    if (c.eventId) byEvent.set(c.eventId, (byEvent.get(c.eventId) || 0) + 1);
    if (c.templateId) byTemplate.set(c.templateId, (byTemplate.get(c.templateId) || 0) + 1);
  }

  const hubEvents: HubEvent[] = events.map((e) => ({ ...e, count: byEvent.get(e.id) || 0 }));
  const hubTemplates: HubTemplate[] = templates.map((t) => ({ ...t, count: byTemplate.get(t.id) || 0 }));

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
            <p className="muted" style={{ marginTop: 6, fontSize: 15.5 }}>Manage your organization, events and templates from here.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link className="btn btn-ghost" href="/certificates"><Icon name="doc" size={18} /> Issued certificates</Link>
            <Link className="btn btn-primary" href="/issue"><Icon name="bolt" size={18} /> Issue certificates</Link>
          </div>
        </div>

        <div className="dash-top" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.3fr", gap: 16, marginBottom: 16 }}>
          <Link href="/certificates" className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--green-tint)", color: "var(--green-700)", display: "grid", placeItems: "center" }}><Icon name="doc" size={23} /></div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{certs.length}</div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>Certificates issued</div>
            </div>
          </Link>
          <div className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--blue-tint)", color: "#1d4fb0", display: "grid", placeItems: "center" }}><Icon name="cal" size={23} /></div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{events.length} · {templates.length}</div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>Events · templates</div>
            </div>
          </div>

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

        <DashboardHub events={hubEvents} templates={hubTemplates} />
      </div>
    </>
  );
}
