"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { Seal } from "./Seal";
import { QRCode } from "./QRCode";
import { CopyButton } from "./CopyButton";
import { CertificateFrame } from "./CertificateFrame";
import { Confetti } from "./Confetti";
import { fmtDate, verifyUrl } from "@/lib/cert";
import type { CertData } from "@/db/schema";

export function VerifyView({
  cert,
  status,
}: {
  cert: CertData;
  status: "verified" | "revoked" | "expired";
}) {
  const [phase, setPhase] = useState(0); // 0 checking, 1 done
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
    const t = setTimeout(() => setPhase(1), 1000);
    return () => clearTimeout(t);
  }, []);

  const valid = status === "verified";
  const url = verifyUrl(cert.serial, origin || undefined);
  const hash = useMemo(
    () => "0x" + Array.from(cert.serial).reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(4, "0") + "f4a9c1e7b2d8",
    [cert.serial],
  );

  const badProblem = status === "revoked" ? "This certificate has been revoked by its issuer." : "This certificate has expired.";

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <header style={{ borderBottom: "1px solid var(--line)", background: "#fff" }}>
        <div className="container" style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/"><Logo size={20} /></Link>
          <Link className="btn btn-ghost btn-sm" href="/login">Issue your own <Icon name="arrow" size={15} /></Link>
        </div>
      </header>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: phase === 0 ? "var(--ink)" : valid ? "linear-gradient(135deg,#0d8a60,#0E9F6E 55%,#14b67e)" : "linear-gradient(135deg,#8f2f1f,#D4543B)",
          transition: "background .6s",
          color: "#fff",
        }}
      >
        {phase === 1 && valid && <Confetti n={80} />}
        <div className="container" style={{ position: "relative", padding: "52px 24px 56px", textAlign: "center" }}>
          <div style={{ width: 130, height: 130, margin: "0 auto 18px", position: "relative" }}>
            {phase === 1 && valid && [0, 1].map((i) => <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,.6)", animation: `ring-pulse 2.4s ${i * 1.1}s ease-out infinite` }} />)}
            {phase === 0 ? (
              <div style={{ width: 130, height: 130, borderRadius: "50%", border: "5px solid rgba(255,255,255,.2)", borderTopColor: "#fff", animation: "spin 1s linear infinite" }} />
            ) : valid ? (
              <div style={{ animation: "sealdrop .8s cubic-bezier(.2,.8,.3,1.1) both" }}>
                <Seal size={130} color="#0b8a5f" ring="#C79A3A" label="VERIFIED" drawCheck />
              </div>
            ) : (
              <div style={{ width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center", animation: "pop-in .5s both" }}>
                <Icon name="x" size={70} stroke={2.4} />
              </div>
            )}
          </div>
          {phase === 0 ? (
            <>
              <h1 style={{ fontSize: 30, letterSpacing: "-0.02em" }}>Checking authenticity…</h1>
              <p style={{ opacity: 0.75, marginTop: 8, fontSize: 16 }}>Validating the certificate record</p>
            </>
          ) : valid ? (
            <div style={{ animation: "fade-up .5s both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 99, background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: "#9dffcf", boxShadow: "0 0 0 4px rgba(157,255,207,.3)" }} /> AUTHENTIC
              </div>
              <h1 style={{ fontSize: "clamp(32px,5vw,46px)", letterSpacing: "-0.03em" }}>Verified <span style={{ opacity: 0.9 }}>✓</span> by Provenly</h1>
              <p style={{ opacity: 0.92, marginTop: 12, fontSize: 17, maxWidth: 540, marginInline: "auto", lineHeight: 1.5 }}>
                This certificate is genuine and was issued by <strong>{cert.orgName}</strong>. Its record is intact and unaltered.
              </p>
            </div>
          ) : (
            <div style={{ animation: "fade-up .5s both" }}>
              <h1 style={{ fontSize: "clamp(30px,5vw,42px)", letterSpacing: "-0.03em" }}>Certificate {status === "revoked" ? "revoked" : "expired"}</h1>
              <p style={{ opacity: 0.92, marginTop: 12, fontSize: 17, maxWidth: 540, marginInline: "auto", lineHeight: 1.5 }}>{badProblem}</p>
            </div>
          )}
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 40, position: "relative" }}>
          <path d="M0 40 Q360 0 720 30 T1440 25 V60 H0 Z" fill="var(--canvas)" />
        </svg>
      </div>

      <div className="container" style={{ paddingBottom: 70, marginTop: -10 }}>
        <div className="verify-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 26, alignItems: "start" }}>
          <div style={{ animation: phase ? "fade-up .6s .2s both" : "none" }}>
            <div style={{ padding: 24, borderRadius: 20, background: "#fff", border: "1px solid var(--line)", boxShadow: "var(--sh-2)", filter: valid ? "none" : "grayscale(.7) opacity(.85)" }}>
              <div style={{ width: cert.orientation === "landscape" ? "100%" : "min(64%, 440px)", margin: "0 auto" }}>
                <CertificateFrame cert={cert} verifyUrl={url} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24, animation: phase ? "fade-up .6s .3s both" : "none" }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><Icon name="shield" size={19} style={{ color: valid ? "var(--green)" : "var(--danger)" }} /> Verification record</h3>
              {([
                ["Recipient", cert.recipientName, false],
                ["Issued by", cert.orgName, false],
                ["Credential", cert.title, false],
                ["Issue date", fmtDate(cert.issueDate), false],
                ...(cert.expiryDate ? [["Expires", fmtDate(cert.expiryDate), false] as [string, string, boolean]] : []),
                ["Serial", cert.serial, true],
              ] as [string, string, boolean][]).map(([k, v, mono], i) => (
                <div key={k} style={{ padding: "9px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{k}</div>
                  <div className={mono ? "mono" : ""} style={{ fontSize: mono ? 13 : 15, fontWeight: 600, marginTop: 3, wordBreak: mono ? "break-all" : "normal" }}>{v}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 18, background: "var(--ink)", color: "#fff", border: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                <Icon name="lock" size={16} style={{ color: valid ? "#7fe3bc" : "#ff9b86" }} /> {valid ? "Record seal intact" : "Record flagged"}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "rgba(255,255,255,.6)", background: "rgba(255,255,255,.06)", padding: "9px 11px", borderRadius: 8, wordBreak: "break-all" }}>{hash}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12.5, color: "rgba(255,255,255,.7)" }}>
                <Icon name={valid ? "check" : "x"} size={14} style={{ color: valid ? "#7fe3bc" : "#ff9b86" }} /> {valid ? "Content hash matches issuer record" : badProblem}
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 60, height: 60, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: 5, flex: "0 0 auto" }}><QRCode value={url} size="100%" /></div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>Share this proof</div>
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>Anyone can scan to verify, no account needed.</p>
                </div>
              </div>
              <CopyButton text={url} className="btn btn-ghost btn-sm" block style={{ marginTop: 12 }} />
            </div>

            <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-4)" }}>
              Powered by <Link href="/" style={{ fontWeight: 700, color: "var(--green-700)" }}>Provenly</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
