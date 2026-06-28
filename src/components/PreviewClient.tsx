"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { AppNav } from "./AppNav";
import { CertificateFrame } from "./CertificateFrame";
import { QRCode } from "./QRCode";
import { CopyButton } from "./CopyButton";
import { useCertDraft } from "@/lib/use-cert-draft";
import { fmtDate, verifyUrl, verifyDisplay, getCertMeta } from "@/lib/cert";
import type { CertData } from "@/db/schema";

export function PreviewClient({ credits, initials }: { credits: number; initials: string }) {
  const router = useRouter();
  const { cert, loaded } = useCertDraft();
  const frameRef = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState(false);
  const [origin, setOrigin] = useState("");
  const [issuedId, setIssuedId] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState<"pdf" | "png" | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    const t = setTimeout(() => setReveal(true), 80);
    return () => clearTimeout(t);
  }, []);

  const noCredits = credits <= 0;
  const displayCert: CertData = issuedId ? { ...cert, serial: issuedId } : cert;
  const url = verifyUrl(displayCert.serial, origin || undefined);

  const issue = async () => {
    setError("");
    setIssuing(true);
    try {
      const m = getCertMeta();
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cert, eventId: m.eventId, templateId: m.templateId }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "Could not issue certificate");
      setIssuedId(json.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to issue");
    } finally {
      setIssuing(false);
    }
  };

  const renderPng = async (): Promise<string | null> => {
    const node = frameRef.current?.firstElementChild as HTMLElement | undefined;
    if (!node) return null;
    const { toPng } = await import("html-to-image");
    return toPng(node, { pixelRatio: 2, cacheBust: true });
  };

  const store = async (kind: "pdf" | "png", dataUrl: string) => {
    if (!issuedId) return;
    try {
      await fetch(`/api/certificates/${issuedId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, dataUrl }),
      });
    } catch {
      /* best effort */
    }
  };

  const downloadPng = async () => {
    setWorking("png");
    try {
      const png = await renderPng();
      if (!png) return;
      const a = document.createElement("a");
      a.href = png;
      a.download = `${displayCert.serial}.png`;
      a.click();
      await store("png", png);
    } finally {
      setWorking(null);
    }
  };

  const downloadPdf = async () => {
    setWorking("pdf");
    try {
      const png = await renderPng();
      if (!png) return;
      const node = frameRef.current?.firstElementChild as HTMLElement | undefined;
      const w = node?.clientWidth || 1000;
      const h = node?.clientHeight || 700;
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: w >= h ? "landscape" : "portrait", unit: "px", format: [w, h] });
      pdf.addImage(png, "PNG", 0, 0, w, h);
      pdf.save(`${displayCert.serial}.pdf`);
      const pdfData = pdf.output("datauristring");
      await store("pdf", pdfData);
    } finally {
      setWorking(null);
    }
  };

  if (!loaded) {
    return (
      <>
        <AppNav credits={credits} initials={initials} />
        <div style={{ padding: 60, textAlign: "center", color: "var(--ink-4)" }}>Loading…</div>
      </>
    );
  }

  const downloads: [string, string, IconName, string, string, (() => void) | null][] = [
    ["PDF document", "High-res, print-ready", "doc", "var(--danger)", "var(--danger-tint)", issuedId ? downloadPdf : null],
    ["PNG image", "For web & social", "image", "var(--blue)", "var(--blue-tint)", issuedId ? downloadPng : null],
  ];

  return (
    <>
      <AppNav credits={credits} initials={initials} />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 22px 70px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          <div>
            <button onClick={() => router.push("/customize")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}><Icon name="arrowL" size={16} /> Back to customizer</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontSize: 28, letterSpacing: "-0.03em" }}>{issuedId ? "Your certificate is ready" : "Review your certificate"}</h1>
              {issuedId && <span className="chip"><Icon name="check" size={14} /> Sealed</span>}
            </div>
          </div>
        </div>

        <div className="prev-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 26, alignItems: "start" }}>
          <div>
            <div style={{ position: "relative", padding: 30, borderRadius: 22, background: "var(--canvas-2)", backgroundImage: "radial-gradient(var(--line-2) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
              <div ref={frameRef} style={{ width: cert.orientation === "landscape" ? "100%" : "min(62%, 460px)", margin: "0 auto", transform: reveal ? "none" : "translateY(20px)", opacity: reveal ? 1 : 0, transition: "all .7s cubic-bezier(.2,.7,.3,1)" }}>
                <CertificateFrame cert={displayCert} verifyUrl={url} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 84 }}>
            {!issuedId ? (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16 }}>Issue this certificate</h3>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>
                  Issuing creates a permanent, publicly verifiable record and assigns a final certificate ID. Costs <strong>1 credit</strong>.
                </p>
                {noCredits ? (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 13.5, color: "var(--danger)", background: "var(--danger-tint)", padding: "10px 12px", borderRadius: 8, marginBottom: 12 }}>
                      You&apos;re out of credits. Top up to keep issuing.
                    </div>
                    <Link href="/billing" className="btn btn-primary btn-block"><Icon name="coins" size={17} /> Buy credits</Link>
                  </div>
                ) : (
                  <>
                    {error && <div style={{ fontSize: 13.5, color: "var(--danger)", background: "var(--danger-tint)", padding: "10px 12px", borderRadius: 8, margin: "12px 0" }}>{error}</div>}
                    <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 14 }} onClick={issue} disabled={issuing}>
                      <Icon name="shield" size={18} /> {issuing ? "Sealing…" : "Issue certificate"}
                    </button>
                    <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>{credits} credits remaining</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                    <div style={{ width: 64, height: 64, background: "#fff", border: "1px solid var(--line)", borderRadius: 11, padding: 6, flex: "0 0 auto" }}><QRCode value={url} size="100%" /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700 }}>Public verify link</div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--blue)", marginTop: 3, wordBreak: "break-all" }}>{verifyDisplay(displayCert.serial, origin || undefined)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <CopyButton text={url} className="btn btn-ghost btn-sm" style={{ flex: 1 }} />
                    <Link className="btn btn-ink btn-sm" style={{ flex: 1 }} href={`/verify/${displayCert.serial}`} target="_blank"><Icon name="globe" size={15} /> Open</Link>
                  </div>
                </div>

                <div className="card" style={{ padding: 8 }}>
                  <div style={{ padding: "10px 12px 4px", fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Download</div>
                  {downloads.map(([t, d, ic, col, tint, fn], i) => (
                    <button key={i} onClick={fn || undefined} disabled={!fn || working !== null} style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", padding: 12, borderRadius: 11 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: tint, color: col, display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={ic} size={20} /></div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{working === (i === 0 ? "pdf" : "png") ? "Generating…" : d}</div>
                      </div>
                      <Icon name="download" size={17} style={{ color: "var(--ink-4)" }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Certificate details</div>
              {([["Recipient", displayCert.recipientName], ["Serial", displayCert.serial], ["Issued", fmtDate(displayCert.issueDate)], ["Status", issuedId ? "Active · Sealed" : "Draft"]] as const).map(([k, v], i) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                  <span className="muted" style={{ fontSize: 13.5 }}>{k}</span>
                  <span className={k === "Serial" ? "mono" : ""} style={{ fontSize: 13.5, fontWeight: 600, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>

            {issuedId && <button className="btn btn-primary btn-block btn-lg" onClick={() => router.push("/dashboard")}>Done <Icon name="check" size={18} /></button>}
          </div>
        </div>
      </div>
    </>
  );
}
