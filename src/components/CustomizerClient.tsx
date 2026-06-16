"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { AppNav } from "./AppNav";
import { ImageUpload } from "./ImageUpload";
import { CertificateFrame, PresetSeal } from "./CertificateFrame";
import { QRCode } from "./QRCode";
import { useCertDraft } from "@/lib/use-cert-draft";
import { genSerial, verifyUrl, verifyDisplay } from "@/lib/cert";
import type { CertData } from "@/db/schema";

const BRAND_SWATCHES = ["#0E9F6E", "#2E6FE6", "#7C3AED", "#C79A3A", "#D4543B", "#0F1B2D", "#0891B2", "#DB2777"];
const FONT_OPTS: [string, string][] = [["Source Serif 4", "Serif · classic"], ["Hanken Grotesk", "Sans · modern"]];
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

export function CustomizerClient({ credits, initials }: { credits: number; initials: string }) {
  const router = useRouter();
  const { cert, update } = useCertDraft();
  const [open, setOpen] = useState("template");
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  const [origin, setOrigin] = useState("");
  const toggle = (k: string) => setOpen((o) => (o === k ? "" : k));

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
                <div className="eyebrow">Customizer</div>
                <h2 style={{ fontSize: 19, marginTop: 3 }}>Design your certificate</h2>
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

          <div style={{ padding: 20 }}>
            <button onClick={() => router.push("/preview")} className="btn btn-primary btn-block btn-lg">Continue to preview <Icon name="arrow" size={18} /></button>
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
              <div style={{ animation: flash ? "pop-in .3s ease both" : "none", borderRadius: 4 }}>
                <CertificateFrame cert={cert} verifyUrl={url} />
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
