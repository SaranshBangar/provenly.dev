"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { avatarColor, initialsOf } from "@/lib/util";

export type CertRow = {
  id: string;
  recipientName: string;
  eventName: string;
  eventId: string | null;
  date: string;
  status: "verified" | "draft" | "revoked";
  views: number;
};

const STATUS: Record<CertRow["status"], { label: string; cls: string; icon: IconName; style?: React.CSSProperties }> = {
  verified: { label: "Verified", cls: "chip", icon: "check" },
  draft: { label: "Draft", cls: "chip chip-ink", icon: "pen" },
  revoked: { label: "Revoked", cls: "chip", icon: "x", style: { background: "var(--danger-tint)", color: "var(--danger)" } },
};

const PAGE_SIZES = [10, 20, 50, 100];

export function DashboardTable({ certs, events = [] }: { certs: CertRow[]; events?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | CertRow["status"]>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);

  // Search + filter run over the whole dataset, not just the visible page.
  const filtered = certs.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (eventFilter === "all" || c.eventId === eventFilter) &&
      (c.recipientName.toLowerCase().includes(q.toLowerCase()) || c.id.toLowerCase().includes(q.toLowerCase())),
  );

  // Any change to the result set or page size sends us back to page 1.
  useEffect(() => setPage(1), [filter, eventFilter, q, pageSize]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const toggle = async (c: CertRow) => {
    const revoking = c.status !== "revoked";
    if (
      revoking &&
      !window.confirm(
        `Revoke the certificate for ${c.recipientName}?\n\nIts public verify page will immediately show as "revoked". You can restore it to normal later.`,
      )
    )
      return;
    setBusy(c.id);
    try {
      const res = await fetch(`/api/certificates/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: revoking ? "revoked" : "verified" }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Could not update the certificate. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="dash-toolbar" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 17, marginRight: "auto" }}>Issued certificates</h3>
        <select
          className="select"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          title="Filter by event"
          style={{ height: 38, width: "auto", padding: "0 30px 0 12px", fontSize: 13.5, fontWeight: 600 }}
        >
          <option value="all">All events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
        <div className="dash-search" style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}><Icon name="grid" size={15} /></span>
          <input className="input" placeholder="Search name or ID…" value={q} onChange={(e) => setQ(e.target.value)} style={{ height: 38, width: 200, paddingLeft: 32, fontSize: 13.5 }} />
        </div>
        <div className="dash-filters" style={{ display: "flex", gap: 4, padding: 3, background: "var(--canvas-2)", borderRadius: 9 }}>
          {([["all", "All"], ["verified", "Verified"], ["draft", "Drafts"], ["revoked", "Revoked"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600, color: filter === k ? "var(--ink)" : "var(--ink-3)", background: filter === k ? "#fff" : "transparent", boxShadow: filter === k ? "var(--sh-1)" : "none" }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="scroll dash-tablewrap" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-3)", fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
              <th style={{ padding: "12px 18px" }}>Recipient</th>
              <th style={{ padding: "12px 18px" }}>Certificate ID</th>
              <th style={{ padding: "12px 18px" }}>Issued</th>
              <th style={{ padding: "12px 18px" }}>Status</th>
              <th style={{ padding: "12px 18px" }}>Views</th>
              <th style={{ padding: "12px 18px", textAlign: "right" }}>Verify</th>
              <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c, i) => {
              const st = STATUS[c.status];
              return (
                <tr key={c.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 99, background: avatarColor(start + i), color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>{initialsOf(c.recipientName)}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{c.recipientName}</div>
                        <div className="muted" style={{ fontSize: 12.5 }}>{c.eventName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px" }}><span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.id}</span></td>
                  <td style={{ padding: "14px 18px", fontSize: 14, color: "var(--ink-2)" }}>{c.date}</td>
                  <td style={{ padding: "14px 18px" }}><span className={st.cls} style={st.style}><Icon name={st.icon} size={13} /> {st.label}</span></td>
                  <td style={{ padding: "14px 18px", fontSize: 14, color: "var(--ink-2)" }}>{c.views}</td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <Link href={`/verify/${c.id}`} target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--blue)" }}>
                      <Icon name="link" size={15} /> Open
                    </Link>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    {c.status === "draft" ? (
                      <span className="muted" style={{ fontSize: 13 }}>—</span>
                    ) : c.status === "revoked" ? (
                      <button onClick={() => toggle(c)} disabled={busy === c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--green-700)", opacity: busy === c.id ? 0.5 : 1 }}>
                        <Icon name="check" size={15} /> Restore
                      </button>
                    ) : (
                      <button onClick={() => toggle(c)} disabled={busy === c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--danger)", opacity: busy === c.id ? 0.5 : 1 }}>
                        <Icon name="x" size={15} /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="dash-cardlist" style={{ display: "none" }}>
        {visible.map((c, i) => {
          const st = STATUS[c.status];
          return (
            <div key={c.id} style={{ borderTop: "1px solid var(--line)", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 99, background: avatarColor(start + i), color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flex: "0 0 auto" }}>{initialsOf(c.recipientName)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.recipientName}</div>
                  <div className="muted" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.eventName}</div>
                </div>
                <span className={st.cls} style={{ flex: "0 0 auto", ...st.style }}><Icon name={st.icon} size={13} /> {st.label}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px", marginTop: 11, fontSize: 12.5, color: "var(--ink-3)" }}>
                <span className="mono" style={{ color: "var(--ink-2)" }}>{c.id}</span>
                <span>Issued {c.date}</span>
                <span>{c.views} views</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <Link href={`/verify/${c.id}`} target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--blue)" }}>
                  <Icon name="link" size={15} /> Open verify page
                </Link>
                <div style={{ marginLeft: "auto" }}>
                  {c.status === "draft" ? (
                    <span className="muted" style={{ fontSize: 13 }}>—</span>
                  ) : c.status === "revoked" ? (
                    <button onClick={() => toggle(c)} disabled={busy === c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--green-700)", opacity: busy === c.id ? 0.5 : 1 }}>
                      <Icon name="check" size={15} /> Restore
                    </button>
                  ) : (
                    <button onClick={() => toggle(c)} disabled={busy === c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--danger)", opacity: busy === c.id ? 0.5 : 1 }}>
                      <Icon name="x" size={15} /> Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 ? (
        <div style={{ padding: 50, textAlign: "center", color: "var(--ink-4)" }}>
          {certs.length === 0 ? "No certificates yet, create your first one." : "No certificates match your filter."}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--ink-3)" }}>
            <span>Rows per page</span>
            <select className="select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ height: 34, width: "auto", padding: "0 28px 0 10px", fontSize: 13.5 }}>
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 13.5, color: "var(--ink-3)", marginLeft: "auto" }}>
            {start + 1}–{Math.min(start + pageSize, total)} of {total}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(current - 1)} disabled={current <= 1}><Icon name="arrowL" size={15} /> Prev</button>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "0 10px", fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)" }}>{current} / {pageCount}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(current + 1)} disabled={current >= pageCount}>Next <Icon name="arrow" size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
