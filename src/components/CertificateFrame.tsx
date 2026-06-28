import type { CSSProperties } from "react";
import { Seal, type SealGlyph } from "./Seal";
import { QRCode } from "./QRCode";
import { fmtDate, SANS, SERIF, type CertData } from "@/lib/cert";
import type { CertElement } from "@/db/schema";

// Free-form draggable elements, drawn at percentage coordinates so they scale
// with the frame at any zoom or export size. Text size is expressed in cqw
// (1% of frame width) relative to a ~700px base so it tracks the frame.
const EL_BASE_W = 700;
function ElementsOverlay({ elements }: { elements?: CertElement[] }) {
  if (!elements || elements.length === 0) return null;
  return (
    <>
      {[...elements].sort((a, b) => a.z - b.z).map((el) => {
        const box: CSSProperties = {
          position: "absolute",
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.w}%`,
          height: `${el.h}%`,
          transform: `rotate(${el.rot || 0}deg)`,
          opacity: el.opacity ?? 1,
          zIndex: 4 + (el.z || 0),
          pointerEvents: "none",
        };
        if (el.type === "image") {
          return <img key={el.id} src={el.src} alt="" style={{ ...box, objectFit: "contain", borderRadius: el.radius ? `${el.radius}px` : undefined }} />;
        }
        if (el.type === "shape") {
          const fill = el.color || "#0E9F6E";
          const radius = el.shape === "ellipse" ? "50%" : el.shape === "line" ? "0" : `${el.radius ?? 4}px`;
          return <div key={el.id} style={{ ...box, background: fill, borderRadius: radius }} />;
        }
        return (
          <div
            key={el.id}
            style={{
              ...box,
              display: "flex",
              alignItems: "center",
              justifyContent: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
              textAlign: el.align || "center",
              color: el.color || "#0F1B2D",
              fontWeight: el.fontWeight || 700,
              fontFamily: el.fontFamily || SANS,
              fontSize: `${(((el.fontSize || 22) / EL_BASE_W) * 100).toFixed(2)}cqw`,
              lineHeight: 1.15,
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {el.text}
          </div>
        );
      })}
    </>
  );
}

export const TEMPLATES = [
  { id: "classic", name: "Classic", desc: "Formal serif & seal" },
  { id: "modern", name: "Modern", desc: "Accent sidebar, left-aligned" },
  { id: "minimal", name: "Minimal", desc: "Airy & understated" },
  { id: "bold", name: "Bold", desc: "Vibrant color block" },
  { id: "elegant", name: "Elegant", desc: "Refined gold frame" },
];

const SEAL_MAP: Record<string, { ring: string; c?: string; glyph: SealGlyph; label: string }> = {
  verified: { ring: "var(--gold)", glyph: "check", label: "VERIFIED" },
  excellence: { ring: "#B8902F", glyph: "star", label: "EXCELLENCE" },
  official: { ring: "#7C8794", glyph: "check", label: "OFFICIAL" },
  gold: { ring: "#C79A3A", c: "#A87E22", glyph: "star", label: "AWARD" },
};

export function PresetSeal({
  id,
  color,
  size,
  white,
}: {
  id: string;
  color: string;
  size: number | string;
  white?: boolean;
}) {
  const s = SEAL_MAP[id] || SEAL_MAP.verified;
  if (white) {
    return <Seal size={size} color="#ffffff" ring="rgba(255,255,255,.55)" glyph={s.glyph} label={s.label} drawCheck={false} />;
  }
  return <Seal size={size} color={s.c || color} ring={s.ring} glyph={s.glyph} label={s.label} drawCheck={false} />;
}

type LayoutProps = {
  c: CertData;
  accent: string;
  isPortrait: boolean;
  verifyUrl: string;
  seal: boolean;
};

function SigBlock({ sig, color }: { sig: CertData["signatures"][number]; color?: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <div style={{ height: "5cqmin", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {sig.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sig.image} alt="" style={{ maxHeight: "5cqmin", maxWidth: "22cqmin", objectFit: "contain" }} />
        ) : (
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "4.4cqmin", color: color || "var(--ink-2)", opacity: 0.9, transform: "rotate(-3deg)" }}>
            {(sig.name || "").split(" ")[0] || "Signed"}
          </span>
        )}
      </div>
      <div style={{ borderTop: "0.3cqmin solid currentColor", marginTop: "1cqmin", paddingTop: "1cqmin", opacity: 0.85 }}>
        <div style={{ fontSize: "2.5cqmin", fontWeight: 700 }}>{sig.name || "Name"}</div>
        <div style={{ fontSize: "2.1cqmin", opacity: 0.7 }}>{sig.title || "Title"}</div>
      </div>
    </div>
  );
}

function Tags({ c, accent, center = true, dark = false }: { c: CertData; accent: string; center?: boolean; dark?: boolean }) {
  if (!((c.showGrade && c.grade) || (c.skills && c.skills.length))) return null;
  return (
    <div style={{ marginTop: "2.8cqmin", display: "flex", gap: "1.4cqmin", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start", alignItems: "center" }}>
      {c.showGrade && c.grade && (
        <span style={{ fontSize: "2.3cqmin", fontWeight: 700, padding: "0.8cqmin 2cqmin", borderRadius: 99, background: dark ? "rgba(255,255,255,.2)" : accent, color: "#fff", fontFamily: SANS }}>{c.grade}</span>
      )}
      {(c.skills || []).map((s, i) => (
        <span key={i} style={{ fontSize: "2.1cqmin", fontWeight: 600, padding: "0.7cqmin 1.6cqmin", borderRadius: 99, border: `0.25cqmin solid ${dark ? "rgba(255,255,255,.5)" : accent}`, color: dark ? "#fff" : accent, fontFamily: SANS }}>{s}</span>
      ))}
    </div>
  );
}

function CustomFields({ c, center = true }: { c: CertData; center?: boolean }) {
  const fs = (c.customFields || []).filter((f) => f.key);
  if (!fs.length) return null;
  return (
    <div style={{ marginTop: "2cqmin", display: "flex", gap: "4cqmin", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start", fontFamily: SANS }}>
      {fs.map((f, i) => (
        <div key={i} style={{ textAlign: center ? "center" : "left" }}>
          <div style={{ fontSize: "1.8cqmin", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5, fontWeight: 700 }}>{f.key}</div>
          <div style={{ fontSize: "2.4cqmin", fontWeight: 600 }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

function QRBlock({ verifyUrl, serial }: { verifyUrl: string; serial: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1cqmin", flex: "0 0 auto" }}>
      <div style={{ width: "13cqmin", height: "13cqmin" }}>
        <QRCode value={verifyUrl} size="100%" fg="#0F1B2D" />
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "1.6cqmin", opacity: 0.6 }}>{serial}</div>
    </div>
  );
}

function SealMeta({ c, accent }: { c: CertData; accent: string }) {
  return (
    <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8cqmin" }}>
      <div style={{ width: "16cqmin", height: "16cqmin" }}>
        <PresetSeal id={c.seal} color={accent} size="100%" />
      </div>
      <div style={{ fontSize: "1.6cqmin", opacity: 0.55, fontFamily: "var(--mono)" }}>
        {fmtDate(c.issueDate)}
        {c.expiryDate ? " – " + fmtDate(c.expiryDate) : ""}
      </div>
    </div>
  );
}

function SigRow({ c, justify = "center", color }: { c: CertData; justify?: CSSProperties["justifyContent"]; color?: string }) {
  return (
    <div style={{ flex: 1, display: "flex", justifyContent: justify, gap: "6cqmin", alignItems: "flex-end" }}>
      {(c.signatures || []).map((s, i) => (
        <SigBlock key={i} sig={s} color={color} />
      ))}
    </div>
  );
}

function CertFooter({ c, accent, verifyUrl, showSeal = true, sigJustify = "center" }: LayoutProps & { showSeal?: boolean; sigJustify?: CSSProperties["justifyContent"] }) {
  return (
    <div style={{ marginTop: "auto", paddingTop: "3.2cqmin", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2cqmin" }}>
      <QRBlock verifyUrl={verifyUrl} serial={c.serial} />
      <SigRow c={c} justify={sigJustify} />
      {showSeal ? <SealMeta c={c} accent={accent} /> : <div style={{ width: "13cqmin", flex: "0 0 auto" }} />}
    </div>
  );
}

function LogoMark({ c, accent, white, size = "6cqmin" }: { c: CertData; accent: string; white?: boolean; size?: string }) {
  if (c.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.logo} alt="" style={{ maxHeight: "8cqmin", maxWidth: "40cqmin", objectFit: "contain" }} />;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.4cqmin" }}>
      <div style={{ width: size, height: size, borderRadius: "1.4cqmin", background: white ? "rgba(255,255,255,.2)" : accent, display: "grid", placeItems: "center", color: "#fff" }}>
        <span style={{ fontSize: "3.4cqmin", fontWeight: 800, fontFamily: SANS }}>{(c.orgName || "P")[0]}</span>
      </div>
      <span style={{ fontSize: "3cqmin", fontWeight: 700, letterSpacing: "0.04em", fontFamily: SANS, color: white ? "#fff" : "inherit" }}>{c.orgName || "Organization"}</span>
    </div>
  );
}

function Flourish({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.4cqmin", margin: "2.4cqmin 0 0", color }}>
      <div style={{ width: "12cqmin", height: "0.25cqmin", background: "currentColor", opacity: 0.6 }} />
      <div style={{ width: "1.6cqmin", height: "1.6cqmin", background: "currentColor", transform: "rotate(45deg)" }} />
      <div style={{ width: "12cqmin", height: "0.25cqmin", background: "currentColor", opacity: 0.6 }} />
    </div>
  );
}

function ClassicLayout({ c, accent, isPortrait, verifyUrl, seal }: LayoutProps) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% -10%, ${accent}0d, transparent 60%), repeating-linear-gradient(135deg, ${accent}05 0 2px, transparent 2px 9px)` }} />
      <div style={{ position: "relative", height: "100%", padding: "6cqmin 7cqmin", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", fontFamily: SERIF }}>
        <LogoMark c={c} accent={accent} />
        <div style={{ marginTop: "3.6cqmin" }}>
          <div style={{ fontSize: "6.4cqmin", fontWeight: 700, lineHeight: 1.04 }}>{c.title || "Certificate"}</div>
          <div style={{ width: "16cqmin", height: "0.5cqmin", background: accent, margin: "2.2cqmin auto 0", borderRadius: 99 }} />
        </div>
        <div style={{ marginTop: "3.2cqmin", fontSize: "2.6cqmin", opacity: 0.65 }}>{c.subtitle || "This certifies that"}</div>
        <div style={{ marginTop: "1.4cqmin", fontSize: "7.6cqmin", fontWeight: 600, fontStyle: "italic", color: accent, lineHeight: 1.05, letterSpacing: "-0.01em", maxWidth: "92%" }}>{c.recipientName || "Recipient Name"}</div>
        <div style={{ marginTop: "2.4cqmin", fontSize: "2.7cqmin", lineHeight: 1.5, maxWidth: isPortrait ? "92%" : "76%", opacity: 0.82, textWrap: "pretty" }}>
          {c.bodyText} {c.eventName && <strong style={{ opacity: 1 }}>{c.eventName}</strong>}.
        </div>
        <Tags c={c} accent={accent} />
        <CustomFields c={c} />
        <CertFooter c={c} accent={accent} verifyUrl={verifyUrl} isPortrait={isPortrait} seal={seal} showSeal={seal} />
      </div>
    </div>
  );
}

function ElegantLayout({ c, accent, isPortrait, verifyUrl, seal }: LayoutProps) {
  const gold = "#B08D2F";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FCFAF3" }}>
      <div style={{ position: "absolute", inset: "3cqmin", border: `0.4cqmin solid ${gold}`, opacity: 0.9 }} />
      <div style={{ position: "absolute", inset: "4.4cqmin", border: `0.18cqmin solid ${gold}`, opacity: 0.6 }} />
      <div style={{ position: "relative", height: "100%", padding: "8cqmin 9cqmin", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", fontFamily: SERIF, color: "#2a2417" }}>
        <LogoMark c={c} accent={gold} />
        <div style={{ marginTop: "1.2cqmin", fontSize: "2.2cqmin", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: gold }}>Certificate</div>
        <div style={{ marginTop: "1.4cqmin", fontSize: "5.6cqmin", fontWeight: 700, lineHeight: 1.05 }}>{c.title || "Certificate"}</div>
        <Flourish color={gold} />
        <div style={{ marginTop: "2.6cqmin", fontSize: "2.5cqmin", opacity: 0.6, fontStyle: "italic" }}>{c.subtitle || "is proudly presented to"}</div>
        <div style={{ marginTop: "1.4cqmin", fontSize: "8cqmin", fontWeight: 600, fontStyle: "italic", color: "#3a3320", lineHeight: 1.04, maxWidth: "92%" }}>{c.recipientName || "Recipient Name"}</div>
        <div style={{ marginTop: "2.6cqmin", fontSize: "2.6cqmin", lineHeight: 1.55, maxWidth: isPortrait ? "92%" : "74%", opacity: 0.8, textWrap: "pretty" }}>
          {c.bodyText} {c.eventName && <strong style={{ opacity: 1, color: gold }}>{c.eventName}</strong>}.
        </div>
        <Tags c={c} accent={gold} />
        <CustomFields c={c} />
        <CertFooter c={c} accent={accent} verifyUrl={verifyUrl} isPortrait={isPortrait} seal={seal} showSeal={seal} />
      </div>
    </div>
  );
}

function ModernLayout({ c, accent, isPortrait, verifyUrl, seal }: LayoutProps) {
  const sideW = isPortrait ? "20%" : "15%";
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", background: "#fff" }}>
      <div style={{ width: sideW, background: accent, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "5cqmin 0", flex: "0 0 auto", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-6%", right: "-30%", width: "70%", height: "30%", background: "rgba(255,255,255,.1)", borderRadius: "50%" }} />
        {seal && (
          <div style={{ width: "11cqmin", height: "11cqmin" }}>
            <PresetSeal id={c.seal} color={accent} size="100%" white />
          </div>
        )}
        <div style={{ marginTop: "auto", writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: "var(--mono)", fontSize: "1.9cqmin", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>{c.orgName || "Provenly"}</div>
      </div>
      <div style={{ flex: 1, padding: "6cqmin 6.5cqmin", display: "flex", flexDirection: "column", textAlign: "left", fontFamily: SANS, minWidth: 0 }}>
        <LogoMark c={c} accent={accent} />
        <div style={{ marginTop: "4cqmin", fontSize: "2.2cqmin", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: accent }}>Certificate of</div>
        <div style={{ fontSize: "6.4cqmin", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, marginTop: "0.6cqmin" }}>{(c.title || "Certificate").replace(/^Certificate of\s*/i, "")}</div>
        <div style={{ width: "10cqmin", height: "0.7cqmin", background: accent, borderRadius: 99, marginTop: "2.4cqmin" }} />
        <div style={{ marginTop: "3cqmin", fontSize: "2.4cqmin", opacity: 0.55 }}>{c.subtitle || "This certificate is awarded to"}</div>
        <div style={{ marginTop: "0.8cqmin", fontSize: "7.2cqmin", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.02 }}>{c.recipientName || "Recipient Name"}</div>
        <div style={{ marginTop: "2.4cqmin", fontSize: "2.6cqmin", lineHeight: 1.5, opacity: 0.78, maxWidth: "92%", textWrap: "pretty" }}>
          {c.bodyText} {c.eventName && <strong style={{ opacity: 1, color: accent }}>{c.eventName}</strong>}.
        </div>
        <Tags c={c} accent={accent} center={false} />
        <CustomFields c={c} center={false} />
        <div style={{ marginTop: "auto", paddingTop: "3.2cqmin", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "3cqmin" }}>
          <SigRow c={c} justify="flex-start" />
          <QRBlock verifyUrl={verifyUrl} serial={c.serial} />
        </div>
      </div>
    </div>
  );
}

function MinimalLayout({ c, accent, isPortrait, verifyUrl, seal }: LayoutProps) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "0.8cqmin", background: accent }} />
      <div style={{ position: "relative", height: "100%", padding: isPortrait ? "12cqmin 9cqmin" : "9cqmin 11cqmin", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", fontFamily: SANS }}>
        <LogoMark c={c} accent={accent} size="5cqmin" />
        <div style={{ marginTop: "auto" }} />
        <div style={{ fontSize: "2.1cqmin", fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: accent }}>{c.title || "Certificate"}</div>
        <div style={{ marginTop: "3cqmin", fontSize: "1.9cqmin", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.4 }}>{c.subtitle || "Presented to"}</div>
        <div style={{ marginTop: "2cqmin", fontSize: "9cqmin", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, maxWidth: "94%" }}>{c.recipientName || "Recipient Name"}</div>
        <div style={{ width: "100%", maxWidth: "60cqmin", height: "0.18cqmin", background: "var(--line-2)", margin: "4cqmin 0" }} />
        <div style={{ fontSize: "2.5cqmin", lineHeight: 1.55, maxWidth: isPortrait ? "90%" : "70%", opacity: 0.7, textWrap: "pretty" }}>
          {c.bodyText} {c.eventName && <strong style={{ opacity: 1, color: "var(--ink)" }}>{c.eventName}</strong>}.
        </div>
        <Tags c={c} accent={accent} />
        <CustomFields c={c} />
        <div style={{ marginTop: "auto" }} />
        <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2cqmin", paddingTop: "4cqmin" }}>
          <QRBlock verifyUrl={verifyUrl} serial={c.serial} />
          <SigRow c={c} />
          {seal ? <SealMeta c={c} accent={accent} /> : <div style={{ width: "13cqmin", flex: "0 0 auto" }} />}
        </div>
      </div>
    </div>
  );
}

function BoldLayout({ c, accent, isPortrait, verifyUrl, seal }: LayoutProps) {
  const bandH = isPortrait ? "26%" : "34%";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SANS }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: bandH, background: `linear-gradient(120deg, ${accent}, ${accent}cc)`, overflow: "hidden", padding: "5cqmin 6cqmin", display: "flex", flexDirection: "column", justifyContent: "center", color: "#fff" }}>
        <div style={{ position: "absolute", bottom: "-40%", right: "-6%", width: "40%", height: "120%", background: "rgba(255,255,255,.1)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "-50%", right: "18%", width: "26%", height: "120%", background: "rgba(255,255,255,.08)", borderRadius: "50%" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "2.3cqmin", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.85 }}>Certificate of</div>
            <div style={{ fontSize: "7cqmin", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, marginTop: "0.6cqmin" }}>{(c.title || "Certificate").replace(/^Certificate of\s*/i, "")}</div>
          </div>
          {seal && (
            <div style={{ width: "13cqmin", height: "13cqmin", flex: "0 0 auto" }}>
              <PresetSeal id={c.seal} color={accent} size="100%" white />
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "absolute", top: bandH, left: 0, right: 0, bottom: 0, padding: "5cqmin 6cqmin 5cqmin", display: "flex", flexDirection: "column", textAlign: "left" }}>
        <div style={{ marginTop: "1cqmin", fontSize: "2.4cqmin", fontWeight: 600, opacity: 0.5 }}>{c.subtitle || "Awarded to"}</div>
        <div style={{ fontSize: "8cqmin", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: accent, marginTop: "0.6cqmin" }}>{c.recipientName || "Recipient Name"}</div>
        <div style={{ marginTop: "2.2cqmin", fontSize: "2.6cqmin", lineHeight: 1.5, opacity: 0.8, maxWidth: "94%", textWrap: "pretty" }}>
          {c.bodyText} {c.eventName && <strong style={{ opacity: 1, color: accent }}>{c.eventName}</strong>}.
        </div>
        <Tags c={c} accent={accent} center={false} />
        <CustomFields c={c} center={false} />
        <div style={{ marginTop: "auto", paddingTop: "3cqmin", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "3cqmin" }}>
          <SigRow c={c} justify="flex-start" />
          <QRBlock verifyUrl={verifyUrl} serial={c.serial} />
        </div>
      </div>
    </div>
  );
}

const LAYOUTS: Record<string, (p: LayoutProps) => React.ReactNode> = {
  classic: ClassicLayout,
  modern: ModernLayout,
  minimal: MinimalLayout,
  bold: BoldLayout,
  elegant: ElegantLayout,
};

export function CertificateFrame({ cert, verifyUrl, seal = true }: { cert: CertData; verifyUrl?: string; seal?: boolean }) {
  const c = cert;
  const isPortrait = c.orientation === "portrait";
  const aspect = isPortrait ? "1 / 1.414" : "1.414 / 1";
  const accent = c.brandColor || "#0E9F6E";
  const Layout = LAYOUTS[c.template] || ClassicLayout;
  const border = c.border || "none";
  const url = verifyUrl || "provenly.dev/verify/" + c.serial;

  const borderStyle: Record<string, CSSProperties> = {
    none: {},
    solid: { border: `0.7cqmin solid ${accent}` },
    dashed: { border: `0.6cqmin dashed ${accent}` },
    double: { border: `0.5cqmin double ${accent}`, boxShadow: `inset 0 0 0 0.5cqmin #fff, inset 0 0 0 0.7cqmin ${accent}` },
    ornate: { border: `0.7cqmin solid ${accent}` },
  };
  const inset = border === "none" ? "0" : border === "double" ? "3cqmin" : "3.2cqmin";

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: aspect, containerType: "size", background: c.background || "#fff", color: "var(--ink)", boxShadow: "var(--sh-3)", overflow: "hidden" }}>
      <Layout c={c} accent={accent} isPortrait={isPortrait} verifyUrl={url} seal={seal} />
      <ElementsOverlay elements={c.elements} />
      {border !== "none" && (
        <div style={{ position: "absolute", inset, pointerEvents: "none", ...borderStyle[border] }}>
          {border === "ornate" &&
            (["tl", "tr", "bl", "br"] as const).map((pos) => {
              const m: Record<string, CSSProperties> = {
                tl: { top: "-0.4cqmin", left: "-0.4cqmin" },
                tr: { top: "-0.4cqmin", right: "-0.4cqmin", transform: "scaleX(-1)" },
                bl: { bottom: "-0.4cqmin", left: "-0.4cqmin", transform: "scaleY(-1)" },
                br: { bottom: "-0.4cqmin", right: "-0.4cqmin", transform: "scale(-1)" },
              };
              return (
                <svg key={pos} width="9%" viewBox="0 0 40 40" style={{ position: "absolute", ...m[pos], color: accent }}>
                  <path d="M2 2 H30 M2 2 V30 M8 8 Q8 20 20 20 M8 8 Q20 8 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="2" cy="2" r="2.4" fill="currentColor" />
                </svg>
              );
            })}
        </div>
      )}
    </div>
  );
}
