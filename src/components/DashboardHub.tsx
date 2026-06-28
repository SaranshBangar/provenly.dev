"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

export type HubEvent = { id: string; name: string; date: string | null; count: number };
export type HubTemplate = { id: string; name: string; type: string; count: number };

function Panel({ icon, title, sub, action, children }: { icon: React.ComponentProps<typeof Icon>["name"]; title: string; sub: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-tint)", color: "var(--green-700)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={icon} size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 16 }}>{title}</h3>
          <div className="muted" style={{ fontSize: 12.5 }}>{sub}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function DashboardHub({ events, templates }: { events: HubEvent[]; templates: HubTemplate[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const createEvent = async () => {
    const name = window.prompt("New event name");
    if (!name?.trim()) return;
    const date = window.prompt("Event date (optional, e.g. 2026-07-01)") || "";
    setBusy("event:new");
    try {
      const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), date: date.trim() }) });
      if (!res.ok) throw new Error((((await res.json().catch(() => ({}))) as { error?: string }).error) || "");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error && e.message ? e.message : "Could not create event.");
    } finally {
      setBusy(null);
    }
  };

  const del = async (kind: "events" | "templates", id: string, name: string, count: number) => {
    const noun = kind === "events" ? "event" : "template";
    if (count > 0 && !window.confirm(`${name} is used by ${count} certificate${count === 1 ? "" : "s"}. Deleting the ${noun} won't remove those certificates, but they'll lose this link. Continue?`)) return;
    if (count === 0 && !window.confirm(`Delete ${noun} "${name}"?`)) return;
    setBusy(`${kind}:${id}`);
    try {
      const res = await fetch(`/api/${kind}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert(`Could not delete ${noun}.`);
    } finally {
      setBusy(null);
    }
  };

  const Empty = ({ text }: { text: string }) => (
    <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--ink-4)", fontSize: 13.5 }}>{text}</div>
  );

  return (
    <div className="hub-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Panel
        icon="cal"
        title="Events"
        sub="Group certificates by program or cohort"
        action={<button onClick={createEvent} disabled={busy === "event:new"} className="btn btn-ghost btn-sm"><Icon name="plus" size={15} /> New event</button>}
      >
        {events.length === 0 ? (
          <Empty text="No events yet. Create one to group your certificates." />
        ) : (
          <div>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: "1px solid var(--line)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{ev.date || "No date"} · {ev.count} issued</div>
                </div>
                <Link href={`/certificates`} className="tlink" style={{ fontSize: 13, color: "var(--blue)", fontWeight: 600 }}>View</Link>
                <button onClick={() => del("events", ev.id, ev.name, ev.count)} disabled={busy === `events:${ev.id}`} title="Delete event" style={{ color: "var(--ink-4)", padding: 4, opacity: busy === `events:${ev.id}` ? 0.4 : 1 }}><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        icon="sliders"
        title="Templates"
        sub="Reusable certificate designs"
        action={<Link href="/customize" className="btn btn-ghost btn-sm"><Icon name="plus" size={15} /> New template</Link>}
      >
        {templates.length === 0 ? (
          <Empty text="No templates yet. Design one in the Templates editor." />
        ) : (
          <div>
            {templates.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: "1px solid var(--line)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name} <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>· {t.type}</span></div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{t.count} issued with this template</div>
                </div>
                <Link href="/issue" className="tlink" style={{ fontSize: 13, color: "var(--green-700)", fontWeight: 600 }}>Issue</Link>
                <button onClick={() => del("templates", t.id, t.name, t.count)} disabled={busy === `templates:${t.id}`} title="Delete template" style={{ color: "var(--ink-4)", padding: 4, opacity: busy === `templates:${t.id}` ? 0.4 : 1 }}><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
