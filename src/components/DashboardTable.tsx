"use client";
import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { avatarColor, initialsOf } from "@/lib/util";

export type CertRow = {
  id: string;
  recipientName: string;
  eventName: string;
  date: string;
  status: "verified" | "draft" | "revoked";
  views: number;
};

const STATUS: Record<CertRow["status"], { label: string; cls: string; icon: IconName; style?: React.CSSProperties }> = {
  verified: { label: "Verified", cls: "chip", icon: "check" },
  draft: { label: "Draft", cls: "chip chip-ink", icon: "pen" },
  revoked: { label: "Revoked", cls: "chip", icon: "x", style: { background: "var(--danger-tint)", color: "var(--danger)" } },
};

export function DashboardTable({ certs }: { certs: CertRow[] }) {
  const [filter, setFilter] = useState<"all" | CertRow["status"]>("all");
  const [q, setQ] = useState("");
  const rows = certs.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (c.recipientName.toLowerCase().includes(q.toLowerCase()) || c.id.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 17, marginRight: "auto" }}>Issued certificates</h3>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}><Icon name="grid" size={15} /></span>
          <input className="input" placeholder="Search name or ID…" value={q} onChange={(e) => setQ(e.target.value)} style={{ height: 38, width: 200, paddingLeft: 32, fontSize: 13.5 }} />
        </div>
        <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--canvas-2)", borderRadius: 9 }}>
          {([["all", "All"], ["verified", "Verified"], ["draft", "Drafts"], ["revoked", "Revoked"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600, color: filter === k ? "var(--ink)" : "var(--ink-3)", background: filter === k ? "#fff" : "transparent", boxShadow: filter === k ? "var(--sh-1)" : "none" }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-3)", fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
              <th style={{ padding: "12px 18px" }}>Recipient</th>
              <th style={{ padding: "12px 18px" }}>Certificate ID</th>
              <th style={{ padding: "12px 18px" }}>Issued</th>
              <th style={{ padding: "12px 18px" }}>Status</th>
              <th style={{ padding: "12px 18px" }}>Views</th>
              <th style={{ padding: "12px 18px", textAlign: "right" }}>Verify</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => {
              const st = STATUS[c.status];
              return (
                <tr key={c.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 99, background: avatarColor(i), color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>{initialsOf(c.recipientName)}</div>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div style={{ padding: 50, textAlign: "center", color: "var(--ink-4)" }}>
          {certs.length === 0 ? "No certificates yet — create your first one." : "No certificates match your filter."}
        </div>
      )}
    </div>
  );
}
