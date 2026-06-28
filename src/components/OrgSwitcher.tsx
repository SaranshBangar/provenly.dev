"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

export type Org = { id: string; name: string };

export function OrgSwitcher({ orgs, currentId }: { orgs: Org[]; currentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = orgs.find((o) => o.id === currentId);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const switchTo = async (id: string) => {
    if (id === currentId) return setOpen(false);
    setBusy(true);
    try {
      const res = await fetch("/api/orgs/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      alert("Could not switch organization.");
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    const name = window.prompt("New organization name");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/orgs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string })?.error);
      setOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error && e.message ? e.message : "Could not create organization.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        style={{ display: "flex", alignItems: "center", gap: 10, height: 42, padding: "0 14px", borderRadius: 11, border: "1px solid var(--line-2)", background: "#fff", fontWeight: 700, fontSize: 14.5, color: "var(--ink)", opacity: busy ? 0.6 : 1 }}
      >
        <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--green-tint)", color: "var(--green-700)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800 }}>
          {(current?.name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current?.name || "Select organization"}</span>
        <Icon name="chevD" size={16} style={{ color: "var(--ink-3)" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: 48, left: 0, minWidth: 260, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--sh-2, 0 12px 40px rgba(0,0,0,.14))", padding: 6, zIndex: 50 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-4)", padding: "8px 10px 6px" }}>Organizations</div>
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => switchTo(o.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--ink)", background: o.id === currentId ? "var(--canvas-2)" : "transparent", textAlign: "left" }}
            >
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
              {o.id === currentId && <Icon name="check" size={16} style={{ color: "var(--green-700)" }} />}
            </button>
          ))}
          <div style={{ height: 1, background: "var(--line)", margin: "6px 4px" }} />
          <button onClick={create} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "var(--green-700)" }}>
            <Icon name="plus" size={16} /> New organization
          </button>
        </div>
      )}
    </div>
  );
}
