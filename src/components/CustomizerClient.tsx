"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { AppNav } from "./AppNav";
import { ImageUpload } from "./ImageUpload";
import { CertificateFrame, PresetSeal } from "./CertificateFrame";
import { QRCode } from "./QRCode";
import { useCertDraft } from "@/lib/use-cert-draft";
import { genSerial, verifyUrl, verifyDisplay, getCertMeta, setCertMeta } from "@/lib/cert";
import { CertElementsLayer } from "./CertElementsLayer";
import type { CertData, CertElement } from "@/db/schema";

const BRAND_SWATCHES = ["#0E9F6E", "#2E6FE6", "#7C3AED", "#C79A3A", "#D4543B", "#0F1B2D", "#0891B2", "#DB2777"];
const FONT_OPTS: [string, string][] = [["Source Serif 4", "Serif"], ["Hanken Grotesk", "Sans"], ["Georgia, serif", "Georgia"], ["Arial, sans-serif", "Arial"]];
const BG_SWATCHES = ["#ffffff", "#FBFAF7", "#F4F7F5", "#0F1B2D", "#1d2f48", "#FDF6E3"];
const SEAL_OPTS: [string, string][] = [["verified", "Verified"], ["excellence", "Excellence"], ["official", "Official"], ["gold", "Award"]];
const TITLE_PRESETS = ["Certificate of Completion", "Certificate of Achievement", "Certificate of Participation", "Certificate of Excellence"];

function Section({ icon, title, sub, children, open, onToggle, badge }: { icon: IconName; title: string; sub: string; children: React.ReactNode; open: boolean; onToggle: () => void; badge?: string }) {
  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "16px 20px", textAlign: "left" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: open ? "var(--green-tint)" : "var(--canvas-2)", color: open ? "var(--green-700)" : "var(--ink-3)", display: "grid", placeItems: "center", transition: "all .2s", flex: "0 0 auto" }}><Icon name={icon} size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>{title}{badge ? <span className="chip" style={{ height: 20, padding: "0 8px", fontSize: 11 }}>{badge}</span> : null}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{sub}</div>
        </div>
        <Icon name="chevD" size={18} style={{ color: "var(--ink-4)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .26s cubic-bezier(.2,.7,.3,1)" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "4px 20px 22px 20px", display: "flex", flexDirection: "column", gap: 15 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function TF({ label, value, onChange, placeholder, area, presets, onPick }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean; presets?: string[]; onPick?: (v: string) => void }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {area ? (
        <textarea className="textarea" rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {presets && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {presets.map((p) => (
            <button key={p} onClick={() => onPick?.(p)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 99, border: `1px solid ${value === p ? "var(--green)" : "var(--line-2)"}`, color: value === p ? "var(--green-700)" : "var(--ink-3)", background: value === p ? "var(--green-tint)" : "#fff" }}>{p.replace("Certificate of ", "")}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Seg({ options, value, onChange }: { options: [string, string, IconName?][]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${options.length},1fr)`, gap: 6, padding: 4, background: "var(--canvas-2)", borderRadius: 11 }}>
      {options.map(([k, l, ic]) => (
        <button key={k} onClick={() => onChange(k)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 6px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: value === k ? "var(--ink)" : "var(--ink-3)", background: value === k ? "#fff" : "transparent", boxShadow: value === k ? "var(--sh-1)" : "none", transition: "all .16s" }}>
          {ic && <Icon name={ic} size={16} />} {l}
        </button>
      ))}
    </div>
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (v: string[]) => void }) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setV("");
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: 8, border: "1px solid var(--line-2)", borderRadius: 9, background: "#fff" }}>
      {tags.map((t, i) => (
        <span key={i} className="chip chip-blue" style={{ height: 28 }}>{t}<button onClick={() => onChange(tags.filter((_, j) => j !== i))} style={{ display: "flex", color: "inherit", opacity: 0.7 }}><Icon name="x" size={13} /></button></span>
      ))}
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } if (e.key === "Backspace" && !v && tags.length) { onChange(tags.slice(0, -1)); } }} placeholder={tags.length ? "Add…" : "Type a skill and press Enter"} style={{ flex: 1, minWidth: 90, border: "none", outline: "none", fontSize: 13.5, background: "transparent" }} />
    </div>
  );
}

type PickEvent = { id: string; name: string };
type PickTemplate = { id: string; name: string; type: string; data: CertData };

export function CustomizerClient({
  credits,
  initials,
  events = [],
  templates = [],
}: {
  credits: number;
  initials: string;
  orgName?: string;
  events?: PickEvent[];
  templates?: PickTemplate[];
}) {
  const router = useRouter();
  const { cert, update, setCert } = useCertDraft();
  const [open, setOpen] = useState("template");
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  const [origin, setOrigin] = useState("");
  const [selEl, setSelEl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ eventId: string | null; templateId: string | null }>({ eventId: null, templateId: null });
  const toggle = (k: string) => setOpen((o) => (o === k ? "" : k));

  useEffect(() => setMeta(getCertMeta()), []);
  const updateMeta = (m: { eventId: string | null; templateId: string | null }) => { setMeta(m); setCertMeta(m); };

  // ---- Free-form ("Figma-lite") elements ----
  const maxZ = () => cert.elements.reduce((m, e) => Math.max(m, e.z), 0);
  const addEl = (e: Partial<CertElement>) => {
    const id = crypto.randomUUID();
    const base: CertElement = { id, type: "text", x: 34, y: 42, w: 32, h: 12, rot: 0, z: maxZ() + 1, text: "New text", color: "#0F1B2D", fontSize: 22, fontWeight: 700, align: "center", opacity: 1 };
    update((c) => ({ elements: [...c.elements, { ...base, ...e, id }] }));
    setSelEl(id);
    setOpen("elements");
  };
  const patchEl = (id: string, p: Partial<CertElement>) => update((c) => ({ elements: c.elements.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const removeEl = (id: string) => { update((c) => ({ elements: c.elements.filter((x) => x.id !== id) })); setSelEl(null); };
  const reorderEl = (id: string, dir: 1 | -1) => patchEl(id, { z: (cert.elements.find((x) => x.id === id)?.z || 0) + dir });
  const selected = cert.elements.find((e) => e.id === selEl) || null;

  // ---- Events & templates ----
  const createEvent = async () => {
    const name = window.prompt("New event name");
    if (!name?.trim()) return;
    try {
      const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      const j = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok) throw new Error(j?.error);
      updateMeta({ ...meta, eventId: j.id || null });
      update({ eventName: name.trim() });
      router.refresh();
    } catch (e) { alert(e instanceof Error && e.message ? e.message : "Could not create event."); }
  };
  const loadTemplate = (t: PickTemplate) => { setCert({ ...t.data, serial: cert.serial }); updateMeta({ ...meta, templateId: t.id }); };
  const saveTemplate = async () => {
    const name = window.prompt("Template name (e.g. Winner, Participation)");
    if (!name?.trim()) return;
    const type = window.prompt("Type label", "participation") || "participation";
    try {
      const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), type, cert }) });
      if (!res.ok) throw new Error();
      router.refresh();
      alert("Template saved to this organization.");
    } catch { alert("Could not save template."); }
  };

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 280);
    return () => clearTimeout(t);
  }, [cert.template, cert.orientation, cert.brandColor, cert.seal, cert.border]);

  const url = verifyUrl(cert.serial, origin || undefined);
  const setSig = (i: number, patch: Partial<CertData["signatures"][number]>) =>
    update((c) => ({ signatures: c.signatures.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const setCF = (i: number, patch: Partial<CertData["customFields"][number]>) =>
    update((c) => ({ customFields: c.customFields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));

  return (
    <>
      <AppNav credits={credits} initials={initials} />
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", height: "calc(100vh - var(--nav-h))" }} className="cust-grid">
        {/* CONTROLS */}
        <div className="scroll cust-controls" style={{ overflowY: "auto", borderRight: "1px solid var(--line)", background: "#fff" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "#fff", zIndex: 5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="eyebrow">Templates</div>
                <h2 style={{ fontSize: 19, marginTop: 3 }}>Design a template</h2>
              </div>
              <button onClick={() => router.push("/dashboard")} style={{ color: "var(--ink-4)" }}><Icon name="x" size={20} /></button>
            </div>
          </div>

          <Section icon="layout" title="Template & layout" sub="Style, orientation, border" open={open === "template"} onToggle={() => toggle("template")}>
            <div className="field"><label>Template</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([["classic", "Classic", "Elegant serif & seal"], ["modern", "Modern", "Clean & minimal"], ["minimal", "Minimal", "Airy & understated"], ["bold", "Bold", "Vibrant color block"], ["elegant", "Elegant", "Refined gold frame"]] as const).map(([k, t, d]) => (
                  <button key={k} onClick={() => update({ template: k })} style={{ textAlign: "left", padding: 12, borderRadius: 12, border: `1.5px solid ${cert.template === k ? "var(--green)" : "var(--line-2)"}`, background: cert.template === k ? "var(--green-tint)" : "#fff", transition: "all .15s" }}>
                    <div style={{ height: 44, borderRadius: 6, background: "#fff", border: "1px solid var(--line)", marginBottom: 9, position: "relative", overflow: "hidden" }}>
                      {k === "classic" || k === "elegant" ? <div style={{ position: "absolute", inset: 5, border: "1.5px double var(--ink-3)" }} /> : <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: cert.brandColor }} />}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="field"><label>Orientation</label>
              <Seg options={[["landscape", "Landscape", "layout"], ["portrait", "Portrait", "doc"]]} value={cert.orientation} onChange={(v) => update({ orientation: v })} />
            </div>
            <div className="field"><label>Border style</label>
              <Seg options={[["none", "None"], ["solid", "Solid"], ["double", "Double"], ["ornate", "Ornate"]]} value={cert.border} onChange={(v) => update({ border: v })} />
            </div>
          </Section>

          <Section icon="type" title="Content" sub="Title, recipient, body" open={open === "content"} onToggle={() => toggle("content")}>
            <TF label="Certificate title" value={cert.title} onChange={(v) => update({ title: v })} presets={TITLE_PRESETS} onPick={(v) => update({ title: v })} />
            <TF label="Recipient name" value={cert.recipientName} onChange={(v) => update({ recipientName: v })} placeholder="Jane Doe" />
            <TF label="Recipient email (optional)" value={cert.recipientEmail || ""} onChange={(v) => update({ recipientEmail: v })} placeholder="jane@example.com" />
            <TF label="Event / course name" value={cert.eventName} onChange={(v) => update({ eventName: v })} placeholder="Intro to Design" />
            <TF label="Body / description" area value={cert.bodyText} onChange={(v) => update({ bodyText: v })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field"><label>Issue date</label><input className="input" type="date" value={cert.issueDate} onChange={(e) => update({ issueDate: e.target.value })} /></div>
              <div className="field"><label>Expiry <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label><input className="input" type="date" value={cert.expiryDate} onChange={(e) => update({ expiryDate: e.target.value })} /></div>
            </div>
          </Section>

          <Section icon="palette" title="Branding" sub="Logo, color, font" open={open === "brand"} onToggle={() => toggle("brand")}>
            <TF label="Organization name" value={cert.orgName} onChange={(v) => update({ orgName: v })} />
            <ImageUpload label="Organization logo" value={cert.logo} onChange={(v) => update({ logo: v })} hint="Shown at the top, transparent PNG ideal" />
            <div className="field"><label>Brand color</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {BRAND_SWATCHES.map((c) => (
                  <button key={c} onClick={() => update({ brandColor: c })} style={{ width: 30, height: 30, borderRadius: 8, background: c, border: cert.brandColor === c ? "2.5px solid var(--ink)" : "1px solid rgba(0,0,0,.1)", boxShadow: cert.brandColor === c ? "0 0 0 2px #fff inset" : "none" }} />
                ))}
                <label style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px dashed var(--line-2)", display: "grid", placeItems: "center", cursor: "pointer", position: "relative", color: "var(--ink-4)" }}>
                  <Icon name="plus" size={16} />
                  <input type="color" value={cert.brandColor} onChange={(e) => update({ brandColor: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                </label>
              </div>
            </div>
            <div className="field"><label>Font</label>
              <Seg options={FONT_OPTS.map(([k, l]) => [k, l] as [string, string])} value={cert.font} onChange={(v) => update({ font: v })} />
            </div>
          </Section>

          <Section icon="shield" title="Seal & signatures" sub="Official stamp & sign-offs" open={open === "seal"} onToggle={() => toggle("seal")} badge={(cert.signatures || []).length + " sig"}>
            <div className="field"><label>Official seal</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {SEAL_OPTS.map(([k, l]) => (
                  <button key={k} onClick={() => update({ seal: k })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px", borderRadius: 11, border: `1.5px solid ${cert.seal === k ? "var(--green)" : "var(--line-2)"}`, background: cert.seal === k ? "var(--green-tint)" : "#fff" }}>
                    <PresetSeal id={k} color={cert.brandColor} size={42} />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field"><label>Signatures</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(cert.signatures || []).map((s, i) => (
                  <div key={i} style={{ padding: 13, borderRadius: 12, border: "1px solid var(--line)", background: "var(--canvas)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)" }}>Signature {i + 1}</span>
                      {cert.signatures.length > 1 && <button onClick={() => update((c) => ({ signatures: c.signatures.filter((_, j) => j !== i) }))} style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Icon name="trash" size={14} /> Remove</button>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <input className="input" placeholder="Signatory name" value={s.name} onChange={(e) => setSig(i, { name: e.target.value })} style={{ height: 40 }} />
                      <input className="input" placeholder="Designation / title" value={s.title} onChange={(e) => setSig(i, { title: e.target.value })} style={{ height: 40 }} />
                      <ImageUpload value={s.image} onChange={(v) => setSig(i, { image: v })} hint="Signature image (optional)" />
                    </div>
                  </div>
                ))}
                {cert.signatures.length < 3 && <button onClick={() => update((c) => ({ signatures: [...c.signatures, { name: "", title: "", image: null }] }))} className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}><Icon name="plus" size={15} /> Add signature</button>}
              </div>
            </div>
          </Section>

          <Section icon="star" title="Grade & skills" sub="Score and competency tags" open={open === "grade"} onToggle={() => toggle("grade")}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <button onClick={() => update({ showGrade: !cert.showGrade })} style={{ width: 42, height: 24, borderRadius: 99, background: cert.showGrade ? "var(--green)" : "var(--line-2)", position: "relative", transition: "background .2s", flex: "0 0 auto" }}>
                <span style={{ position: "absolute", top: 2, left: cert.showGrade ? 20 : 2, width: 20, height: 20, borderRadius: 99, background: "#fff", transition: "left .2s", boxShadow: "var(--sh-1)" }} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Show grade / score</span>
            </label>
            {cert.showGrade && <TF value={cert.grade} onChange={(v) => update({ grade: v })} placeholder="e.g. Distinction, 96%" />}
            <div className="field"><label>Skill / competency tags</label>
              <TagEditor tags={cert.skills} onChange={(v) => update({ skills: v })} />
            </div>
          </Section>

          <Section icon="tag" title="Custom fields" sub="Your own key / value pairs" open={open === "custom"} onToggle={() => toggle("custom")} badge="differentiator">
            <p className="muted" style={{ fontSize: 13, marginTop: -2 }}>Add anything unique to your program, cohort, credits, license number, hours.</p>
            {(cert.customFields || []).map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="input" placeholder="Label" value={f.key} onChange={(e) => setCF(i, { key: e.target.value })} style={{ height: 40 }} />
                <input className="input" placeholder="Value" value={f.value} onChange={(e) => setCF(i, { value: e.target.value })} style={{ height: 40 }} />
                <button onClick={() => update((c) => ({ customFields: c.customFields.filter((_, j) => j !== i) }))} style={{ color: "var(--ink-4)", padding: 6, flex: "0 0 auto" }}><Icon name="trash" size={17} /></button>
              </div>
            ))}
            <button onClick={() => update((c) => ({ customFields: [...c.customFields, { key: "", value: "" }] }))} className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}><Icon name="plus" size={15} /> Add field</button>
          </Section>

          <Section icon="qr" title="Verification & ID" sub="Serial number & QR code" open={open === "qr"} onToggle={() => toggle("qr")}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 14, borderRadius: 12, background: "var(--canvas)", border: "1px solid var(--line)" }}>
              <div style={{ width: 72, height: 72, flex: "0 0 auto", background: "#fff", padding: 6, borderRadius: 9, border: "1px solid var(--line)" }}><QRCode value={url} size="100%" /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)" }}>Auto-placed on certificate</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--blue)", marginTop: 4, wordBreak: "break-all" }}>{verifyDisplay(cert.serial, origin || undefined)}</div>
              </div>
            </div>
            <div className="field"><label>Certificate serial</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input mono" value={cert.serial} readOnly style={{ fontSize: 13 }} />
                <button onClick={() => update({ serial: genSerial() })} className="btn btn-ghost" style={{ flex: "0 0 auto", height: 44 }} title="Regenerate"><Icon name="spark" size={17} /></button>
              </div>
              <p className="muted" style={{ fontSize: 12 }}>Unique, auto-generated. A final ID is assigned when you issue.</p>
            </div>
          </Section>

          <Section icon="cal" title="Event & template" sub="Group certs and reuse designs" open={open === "evt"} onToggle={() => toggle("evt")}>
            <div className="field"><label>Event</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="select" value={meta.eventId || ""} onChange={(e) => { const ev = events.find((x) => x.id === e.target.value); updateMeta({ ...meta, eventId: e.target.value || null }); if (ev) update({ eventName: ev.name }); }} style={{ height: 44, flex: 1 }}>
                  <option value="">No event</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
                <button onClick={createEvent} className="btn btn-ghost" style={{ flex: "0 0 auto", height: 44 }}><Icon name="plus" size={16} /> New</button>
              </div>
              <p className="muted" style={{ fontSize: 12 }}>Certificates are filterable by event on your dashboard.</p>
            </div>
            <div className="field"><label>Saved templates</label>
              {templates.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>No templates yet. Design a certificate, then save it as a reusable type.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {templates.map((t) => (
                    <button key={t.id} onClick={() => loadTemplate(t)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${meta.templateId === t.id ? "var(--green)" : "var(--line-2)"}`, background: meta.templateId === t.id ? "var(--green-tint)" : "#fff", textAlign: "left" }}>
                      <span style={{ flex: 1 }}><span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span> <span className="muted" style={{ fontSize: 12 }}>· {t.type}</span></span>
                      <span className="tlink" style={{ fontSize: 12.5, color: "var(--green-700)" }}>Use</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={saveTemplate} className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginTop: 8 }}><Icon name="copy" size={15} /> Save current design as template</button>
            </div>
          </Section>

          <Section icon="palette" title="Design extras" sub="Subtitle, background, typeface" open={open === "extras"} onToggle={() => toggle("extras")}>
            <div className="field"><label>Subtitle line</label>
              <TF value={cert.subtitle} onChange={(v) => update({ subtitle: v })} placeholder="e.g. This is proudly presented to" />
            </div>
            <div className="field"><label>Background</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {BG_SWATCHES.map((c) => (
                  <button key={c} onClick={() => update({ background: c })} title={c} style={{ width: 34, height: 34, borderRadius: 8, background: c, border: `2px solid ${cert.background === c ? "var(--green)" : "var(--line-2)"}` }} />
                ))}
                <input type="color" value={cert.background || "#ffffff"} onChange={(e) => update({ background: e.target.value })} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--line-2)", background: "#fff", padding: 2 }} />
              </div>
            </div>
            <div className="field"><label>Typeface</label>
              <Seg options={FONT_OPTS.map(([v, l]) => [v, l] as [string, string])} value={cert.font} onChange={(v) => update({ font: v })} />
            </div>
            <div className="field"><label>Border style</label>
              <Seg options={[["none", "None"], ["solid", "Solid"], ["dashed", "Dashed"], ["double", "Double"], ["ornate", "Ornate"]]} value={cert.border} onChange={(v) => update({ border: v })} />
            </div>
          </Section>

          <Section icon="image" title="Elements" sub="Drag-and-drop logos, text & shapes" open={open === "elements"} onToggle={() => toggle("elements")} badge="new">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => addEl({ type: "text", text: "New text" })} className="btn btn-ghost btn-sm"><Icon name="type" size={15} /> Text</button>
              <button onClick={() => addEl({ type: "shape", shape: "rect", color: "#0E9F6E", w: 24, h: 16, text: "" })} className="btn btn-ghost btn-sm"><Icon name="layout" size={15} /> Box</button>
              <button onClick={() => addEl({ type: "shape", shape: "ellipse", color: "#2E6FE6", w: 18, h: 18, text: "" })} className="btn btn-ghost btn-sm"><Icon name="qr" size={15} /> Circle</button>
              <button onClick={() => addEl({ type: "shape", shape: "line", color: "#0F1B2D", w: 30, h: 2, text: "" })} className="btn btn-ghost btn-sm"><Icon name="sliders" size={15} /> Line</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <ImageUpload value={null} label="Add image / logo" hint="Uploads and drops onto the canvas" onChange={(url) => { if (url) addEl({ type: "image", src: url, text: "", w: 22, h: 22, fontSize: undefined }); }} />
            </div>

            {cert.elements.length > 0 && (
              <div className="field" style={{ marginTop: 6 }}><label>Layers</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...cert.elements].sort((a, b) => b.z - a.z).map((el) => (
                    <div key={el.id} onClick={() => setSelEl(el.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, border: `1.5px solid ${selEl === el.id ? "var(--green)" : "var(--line-2)"}`, background: selEl === el.id ? "var(--green-tint)" : "#fff", cursor: "pointer" }}>
                      <Icon name={el.type === "image" ? "image" : el.type === "shape" ? "layout" : "type"} size={15} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.type === "text" ? el.text || "Text" : el.type === "image" ? "Image" : el.shape}</span>
                      <button onClick={(e) => { e.stopPropagation(); reorderEl(el.id, 1); }} title="Bring forward" style={{ color: "var(--ink-4)" }}><Icon name="arrow" size={14} style={{ transform: "rotate(-90deg)" }} /></button>
                      <button onClick={(e) => { e.stopPropagation(); reorderEl(el.id, -1); }} title="Send back" style={{ color: "var(--ink-4)" }}><Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }} /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeEl(el.id); }} title="Delete" style={{ color: "var(--ink-4)" }}><Icon name="trash" size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected && (
              <div className="field" style={{ marginTop: 6, padding: 12, borderRadius: 12, background: "var(--canvas)", border: "1px solid var(--line)" }}>
                <label>Selected element</label>
                {selected.type === "text" && (
                  <>
                    <input className="input" value={selected.text || ""} onChange={(e) => patchEl(selected.id, { text: e.target.value })} placeholder="Text" style={{ height: 40 }} />
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                      <span className="muted" style={{ fontSize: 12.5 }}>Size</span>
                      <input type="range" min={8} max={72} value={selected.fontSize || 22} onChange={(e) => patchEl(selected.id, { fontSize: Number(e.target.value) })} style={{ flex: 1 }} />
                    </div>
                  </>
                )}
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                    <span className="muted" style={{ fontSize: 12.5 }}>{selected.type === "text" ? "Color" : "Fill"}</span>
                    <input type="color" value={selected.color || "#0F1B2D"} onChange={(e) => patchEl(selected.id, { color: e.target.value })} style={{ width: 32, height: 28, border: "1px solid var(--line-2)", borderRadius: 6, padding: 1 }} />
                  </label>
                  <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="muted" style={{ fontSize: 12.5 }}>Opacity</span>
                    <input type="range" min={0} max={100} value={Math.round((selected.opacity ?? 1) * 100)} onChange={(e) => patchEl(selected.id, { opacity: Number(e.target.value) / 100 })} style={{ flex: 1 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>Rotate</span>
                  <input type="range" min={-180} max={180} value={selected.rot || 0} onChange={(e) => patchEl(selected.id, { rot: Number(e.target.value) })} style={{ flex: 1 }} />
                </div>
              </div>
            )}
          </Section>

          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={saveTemplate} className="btn btn-primary btn-block btn-lg"><Icon name="copy" size={18} /> Save as template</button>
            <p className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>Templates are reusable designs. Issue certificates from the <strong>Issue</strong> tab.</p>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="cust-preview" style={{ position: "relative", display: "flex", flexDirection: "column", background: "var(--canvas-2)", backgroundImage: "radial-gradient(var(--line-2) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--green)", boxShadow: "0 0 0 3px var(--green-tint)" }} /> Live preview
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} style={{ minWidth: 34, height: 30, borderRadius: 7, border: "1px solid var(--line-2)", background: "#fff", fontSize: 13, fontWeight: 600 }}>−</button>
              <span style={{ minWidth: 44, textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--ink-3)" }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))} style={{ minWidth: 34, height: 30, borderRadius: 7, border: "1px solid var(--line-2)", background: "#fff", fontSize: 13, fontWeight: 600 }}>+</button>
            </div>
          </div>
          <div className="scroll" style={{ flex: 1, overflow: "auto", display: "grid", placeItems: "center", padding: 36 }}>
            <div style={{ width: cert.orientation === "landscape" ? `min(${720 * zoom}px, 92%)` : `min(${500 * zoom}px, 72%)`, transition: "width .3s" }}>
              <div style={{ animation: flash ? "pop-in .3s ease both" : "none", borderRadius: 4, position: "relative" }}>
                <CertificateFrame cert={cert} verifyUrl={url} />
                <CertElementsLayer elements={cert.elements} selectedId={selEl} onSelect={setSelEl} onChange={(els) => update({ elements: els })} />
              </div>
              <div style={{ textAlign: "center", marginTop: 16, color: "var(--ink-4)", fontSize: 12.5, fontWeight: 600 }}>
                <Icon name="check" size={14} style={{ color: "var(--green)", verticalAlign: "-2px" }} /> Changes save automatically · {cert.orientation} · {cert.template}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
