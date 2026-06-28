"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { AppNav } from "./AppNav";
import { CertificateFrame } from "./CertificateFrame";
import { verifyUrl } from "@/lib/cert";
import type { CertData } from "@/db/schema";

type Tpl = { id: string; name: string; type: string; eventId: string | null; data: CertData };
type Evt = { id: string; name: string };

export function IssueClient({
  credits,
  initials,
  events,
  templates,
}: {
  credits: number;
  initials: string;
  events: Evt[];
  templates: Tpl[];
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id || "");
  // Templates belong to events — the chosen event drives which templates are offered.
  const evTemplates = useMemo(() => (eventId ? templates.filter((t) => t.eventId === eventId) : templates), [eventId, templates]);
  const [tplId, setTplId] = useState(() => {
    const first = events[0]?.id;
    const list = first ? templates.filter((t) => t.eventId === first) : templates;
    return list[0]?.id || "";
  });
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ issued: number; id?: string } | null>(null);

  const tpl = evTemplates.find((t) => t.id === tplId) || null;
  const ev = events.find((e) => e.id === eventId) || null;
  const pickEvent = (id: string) => { setEventId(id); const list = id ? templates.filter((t) => t.eventId === id) : templates; setTplId(list[0]?.id || ""); };

  const bulkNames = useMemo(
    () => names.split("\n").map((n) => n.trim()).filter(Boolean),
    [names],
  );
  const cost = mode === "single" ? (name.trim() ? 1 : 0) : bulkNames.length;
  const enough = credits >= cost && cost > 0;

  const previewCert: CertData | null = tpl
    ? { ...tpl.data, recipientName: (mode === "single" ? name.trim() : bulkNames[0]) || tpl.data.recipientName, eventName: ev?.name || tpl.data.eventName, serial: "PRV-PREVIEW" }
    : null;

  const submit = async () => {
    setError("");
    setResult(null);
    if (!tpl) return setError("Select a template first.");
    if (cost === 0) return setError(mode === "single" ? "Enter a recipient name." : "Add at least one recipient name.");
    if (!enough) return setError(`You need ${cost} credit${cost === 1 ? "" : "s"} but have ${credits}. Top up to continue.`);
    setBusy(true);
    try {
      if (mode === "single") {
        const cert: Partial<CertData> = { ...tpl.data, recipientName: name.trim(), recipientEmail: email.trim(), eventName: ev?.name || tpl.data.eventName };
        const res = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cert, eventId: eventId || null, templateId: tpl.id }),
        });
        const j = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
        if (!res.ok) throw new Error(j.error || "Could not issue certificate");
        setResult({ issued: 1, id: j.id });
        setName("");
        setEmail("");
      } else {
        const res = await fetch("/api/certificates/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: { ...tpl.data, eventName: ev?.name || tpl.data.eventName },
            rows: bulkNames.map((n) => ({ name: n })),
            mapping: { recipientName: "name" },
            eventId: eventId || null,
            templateId: tpl.id,
            eventName: ev?.name,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { issued?: number; error?: string };
        if (!res.ok) throw new Error(j.error || "Could not issue certificates");
        setResult({ issued: j.issued || bulkNames.length });
        setNames("");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppNav credits={credits} initials={initials} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 22px 70px" }}>
        <button onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          <Icon name="arrowL" size={16} /> Dashboard
        </button>
        <h1 style={{ fontSize: 30, letterSpacing: "-0.03em" }}>Issue certificates</h1>
        <p className="muted" style={{ marginTop: 6, fontSize: 15.5 }}>Pick a template, add recipients, and issue. Each certificate uses one credit.</p>

        {templates.length === 0 ? (
          <div className="card" style={{ padding: 40, marginTop: 24, textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>No templates yet</div>
            <p className="muted" style={{ fontSize: 14, marginTop: 6, marginBottom: 18 }}>Design a reusable certificate template first, then come back to issue.</p>
            <Link className="btn btn-primary" href="/customize"><Icon name="plus" size={17} /> Create a template</Link>
          </div>
        ) : (
          <div className="prev-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, marginTop: 24, alignItems: "start" }}>
            <div className="card" style={{ padding: 26 }}>
              <div className="field">
                <label>Event</label>
                <select className="select" value={eventId} onChange={(e) => pickEvent(e.target.value)} style={{ height: 46 }}>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Template</label>
                {evTemplates.length === 0 ? (
                  <p className="muted" style={{ fontSize: 13 }}>No templates in this event yet. <Link href="/customize" className="tlink" style={{ color: "var(--green-700)", fontWeight: 600 }}>Design one</Link>.</p>
                ) : (
                  <select className="select" value={tplId} onChange={(e) => setTplId(e.target.value)} style={{ height: 46 }}>
                    {evTemplates.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.type}</option>)}
                  </select>
                )}
              </div>

              <div className="field">
                <label>Recipients</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 4, background: "var(--canvas-2)", borderRadius: 11, marginBottom: 12 }}>
                  {([["single", "Single", "user"], ["bulk", "Bulk", "rows"]] as const).map(([k, l, ic]) => (
                    <button key={k} onClick={() => setMode(k)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 6px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: mode === k ? "var(--ink)" : "var(--ink-3)", background: mode === k ? "#fff" : "transparent", boxShadow: mode === k ? "var(--sh-1)" : "none" }}>
                      <Icon name={ic} size={16} /> {l}
                    </button>
                  ))}
                </div>

                {mode === "single" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input className="input" placeholder="Recipient name" value={name} onChange={(e) => setName(e.target.value)} style={{ height: 46 }} />
                    <input className="input" placeholder="Recipient email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 46 }} />
                  </div>
                ) : (
                  <>
                    <textarea className="textarea" rows={7} placeholder={"One name per line\nJane Doe\nJohn Smith"} value={names} onChange={(e) => setNames(e.target.value)} />
                    <p className="muted" style={{ fontSize: 12.5 }}>{bulkNames.length} recipient{bulkNames.length === 1 ? "" : "s"} · one certificate each.</p>
                  </>
                )}
              </div>

              {error && (
                <div style={{ fontSize: 13.5, color: "var(--danger)", background: "var(--danger-tint)", padding: "10px 12px", borderRadius: 8, marginTop: 6 }}>{error}</div>
              )}

              {result && (
                <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginTop: 12, background: "var(--green-tint)", borderColor: "var(--green)" }}>
                  <Icon name="check" size={20} style={{ color: "var(--green-700)" }} />
                  <span style={{ fontWeight: 600, color: "var(--green-700)", flex: 1 }}>
                    Issued {result.issued} certificate{result.issued === 1 ? "" : "s"}.
                  </span>
                  {result.id ? (
                    <Link href={`/verify/${result.id}`} target="_blank" className="tlink" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--green-700)" }}>View</Link>
                  ) : (
                    <Link href="/certificates" className="tlink" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--green-700)" }}>View all</Link>
                  )}
                </div>
              )}

              <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 18 }} onClick={submit} disabled={busy || !enough}>
                <Icon name="bolt" size={18} /> {busy ? "Issuing…" : cost > 0 ? `Issue ${cost} · ${cost} credit${cost === 1 ? "" : "s"}` : "Issue"}
              </button>
              {!enough && cost > 0 && (
                <p className="muted" style={{ fontSize: 12.5, textAlign: "center", marginTop: 10 }}>
                  Not enough credits. <Link href="/billing" className="tlink" style={{ color: "var(--green-700)", fontWeight: 600 }}>Top up</Link>.
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ padding: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Preview</div>
                {previewCert && <CertificateFrame cert={previewCert} verifyUrl={verifyUrl(previewCert.serial)} />}
              </div>
              <div className="card" style={{ padding: 18, background: "linear-gradient(135deg,#0F1B2D,#1d2f48)", color: "#fff", border: "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <Icon name="coins" size={18} style={{ color: "var(--gold)", alignSelf: "center" }} />
                  <span style={{ fontSize: 26, fontWeight: 800 }}>{credits}</span>
                  <span style={{ color: "rgba(255,255,255,.6)", fontSize: 14 }}>credits</span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", marginTop: 8 }}>This batch uses <strong style={{ color: "#fff" }}>{cost}</strong>. Verifying is always free.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
