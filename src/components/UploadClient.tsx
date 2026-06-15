"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { Icon, type IconName } from "./Icon";
import { AppNav } from "./AppNav";
import { CertificateFrame } from "./CertificateFrame";
import { Confetti } from "./Confetti";
import { Seal } from "./Seal";
import { useCertDraft } from "@/lib/use-cert-draft";
import { verifyUrl } from "@/lib/cert";
import type { CertData } from "@/db/schema";

type Row = Record<string, string>;

const SAMPLE_COLUMNS = ["Full Name", "Email", "Course", "Score", "Cohort"];
const SAMPLE_ROWS: Row[] = [
  { "Full Name": "Amara Okafor", Email: "amara@mail.com", Course: "Full-Stack Web Dev", Score: "96%", Cohort: "Spring 2026" },
  { "Full Name": "Jonah Reyes", Email: "jonah@mail.com", Course: "Full-Stack Web Dev", Score: "88%", Cohort: "Spring 2026" },
  { "Full Name": "Priya Nair", Email: "priya@mail.com", Course: "Full-Stack Web Dev", Score: "92%", Cohort: "Spring 2026" },
  { "Full Name": "Diego Santos", Email: "diego@mail.com", Course: "Full-Stack Web Dev", Score: "79%", Cohort: "Spring 2026" },
  { "Full Name": "Mei Lin", Email: "mei@mail.com", Course: "Full-Stack Web Dev", Score: "94%", Cohort: "Spring 2026" },
  { "Full Name": "Omar Haddad", Email: "omar@mail.com", Course: "Full-Stack Web Dev", Score: "85%", Cohort: "Spring 2026" },
  { "Full Name": "Sofia Bauer", Email: "sofia@mail.com", Course: "Full-Stack Web Dev", Score: "91%", Cohort: "Spring 2026" },
  { "Full Name": "Liam Walsh", Email: "liam@mail.com", Course: "Full-Stack Web Dev", Score: "83%", Cohort: "Spring 2026" },
];

const MAP_FIELDS: { key: string; label: string; icon: IconName; required: boolean }[] = [
  { key: "recipientName", label: "Recipient name", icon: "user", required: true },
  { key: "eventName", label: "Event / course", icon: "doc", required: true },
  { key: "grade", label: "Grade / score", icon: "star", required: false },
  { key: "email", label: "Email (delivery)", icon: "mail", required: false },
];

function autoMap(columns: string[]): Record<string, string> {
  const find = (...needles: string[]) =>
    columns.find((c) => needles.some((n) => c.toLowerCase().includes(n))) || "";
  return {
    recipientName: find("name"),
    eventName: find("course", "event", "program"),
    grade: find("score", "grade", "mark"),
    email: find("email", "mail"),
  };
}

function Stepper({ step }: { step: number }) {
  const steps = ["Upload CSV", "Map columns", "Review & issue"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "contents" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 99, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13.5, transition: "all .3s", background: i < step ? "var(--green)" : i === step ? "var(--ink)" : "var(--canvas-2)", color: i <= step ? "#fff" : "var(--ink-4)" }}>
              {i < step ? <Icon name="check" size={16} /> : i + 1}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: i <= step ? "var(--ink)" : "var(--ink-4)" }}>{s}</span>
          </div>
          {i < 2 && <div style={{ flex: 1, height: 2, margin: "0 14px", background: i < step ? "var(--green)" : "var(--line-2)", transition: "background .3s" }} />}
        </div>
      ))}
    </div>
  );
}

export function UploadClient({ credits, initials }: { credits: number; initials: string }) {
  const router = useRouter();
  const { cert } = useCertDraft();
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [issuing, setIssuing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ingest = (cols: string[], data: Row[]) => {
    setColumns(cols);
    setRows(data);
    setMapping(autoMap(cols));
    setStep(1);
  };

  const parseFile = (file: File) => {
    setParsing(true);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setParsing(false);
        const cols = (res.meta.fields || []).filter(Boolean);
        const data = (res.data || []).filter((r) => Object.values(r).some((v) => v && String(v).trim()));
        if (!cols.length || !data.length) {
          setError("Could not read any rows from that CSV.");
          return;
        }
        ingest(cols, data);
      },
      error: () => {
        setParsing(false);
        setError("Failed to parse the file.");
      },
    });
  };

  const loadSample = () => {
    setParsing(true);
    setTimeout(() => {
      setParsing(false);
      ingest(SAMPLE_COLUMNS, SAMPLE_ROWS);
    }, 700);
  };

  const val = (r: Row, field: string) => (mapping[field] ? r[mapping[field]] || "" : "");
  const customCols = columns.filter((c) => !Object.values(mapping).includes(c));

  const previewCert: CertData = useMemo(() => {
    const r = rows[0] || {};
    return {
      ...cert,
      recipientName: val(r, "recipientName") || cert.recipientName,
      eventName: val(r, "eventName") || cert.eventName,
      grade: val(r, "grade") || cert.grade,
      customFields: [
        ...cert.customFields,
        ...customCols.map((c) => ({ key: c, value: r[c] || "" })),
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, mapping, cert]);

  const count = rows.length;
  const enough = credits >= count && count > 0;

  const issue = async () => {
    setError("");
    setIssuing(true);
    try {
      const res = await fetch("/api/certificates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: cert, mapping, customColumns: customCols, rows }),
      });
      const json = (await res.json()) as { issued?: number; error?: string };
      if (!res.ok) throw new Error(json.error || "Bulk issue failed");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <>
      <AppNav credits={credits} initials={initials} />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 22px 70px" }}>
        <div style={{ marginBottom: 22 }}>
          <button onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}><Icon name="arrowL" size={16} /> Dashboard</button>
          <h1 style={{ fontSize: 28, letterSpacing: "-0.03em" }}>Bulk issue certificates</h1>
          <p className="muted" style={{ marginTop: 6, fontSize: 15.5 }}>Upload a CSV of recipients, map the columns, and issue them all at once. The current customizer design is used as the template.</p>
        </div>

        <Stepper step={done ? 3 : step} />

        {error && step !== 2 && <div style={{ fontSize: 13.5, color: "var(--danger)", background: "var(--danger-tint)", padding: "10px 12px", borderRadius: 8, marginBottom: 16 }}>{error}</div>}

        {step === 0 && (
          <div className="card anim-fade-up" style={{ padding: 36 }}>
            <div
              onClick={() => !parsing && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
              style={{ position: "relative", overflow: "hidden", borderRadius: 18, border: `2px dashed ${dragging ? "var(--green)" : "var(--line-2)"}`, background: dragging ? "var(--green-tint)" : "var(--canvas)", padding: "56px 30px", textAlign: "center", cursor: "pointer", transition: "all .2s" }}
            >
              <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 22px" }}>
                {!parsing && [0, 1].map((i) => <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--green)", animation: `ring-pulse 2.4s ${i * 1.2}s ease-out infinite` }} />)}
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,var(--green),#3ddc9a)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "var(--sh-green)" }}>
                  {parsing ? <Icon name="settings" size={40} style={{ animation: "spin 1.2s linear infinite" }} /> : <Icon name="upload" size={40} />}
                </div>
              </div>
              <h3 style={{ fontSize: 21 }}>{parsing ? "Reading your file…" : "Drop your CSV here"}</h3>
              <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>{parsing ? "Parsing columns and rows" : "or click to browse · max 10,000 rows"}</p>
              {!parsing && <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={(e) => { e.stopPropagation(); loadSample(); }}><Icon name="doc" size={17} /> Use sample CSV</button>}
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="vh" onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
            </div>
            <div style={{ display: "flex", gap: 28, marginTop: 24, flexWrap: "wrap", justifyContent: "center", color: "var(--ink-3)", fontSize: 13.5 }}>
              {["Name column required", "Score & custom fields optional", "UTF-8 encoded"].map((t) => <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}><Icon name="check" size={16} style={{ color: "var(--green)" }} /> {t}</span>)}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="map-grid anim-fade-up" style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <h3 style={{ fontSize: 18 }}>Map your columns</h3>
                <span className="chip"><Icon name="check" size={14} /> {count} rows detected</span>
              </div>
              <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>Match each Provenly field to a column from your file. Unmapped columns are added as custom fields.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {MAP_FIELDS.map((f) => (
                  <div key={f.key} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 10, background: "var(--canvas)", border: "1px solid var(--line)" }}>
                      <Icon name={f.icon} size={17} style={{ color: "var(--green-700)" }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</span>
                      {f.required && <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--danger)" }}>REQ</span>}
                    </div>
                    <Icon name="arrow" size={18} style={{ color: "var(--ink-4)" }} />
                    <select className="select" value={mapping[f.key] || ""} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}>
                      <option value="">— Not mapped —</option>
                      {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setStep(0)}><Icon name="arrowL" size={16} /> Back</button>
                <button className="btn btn-primary" style={{ marginLeft: "auto" }} disabled={!mapping.recipientName} onClick={() => setStep(2)}>Review {count} certificates <Icon name="arrow" size={17} /></button>
              </div>
            </div>

            <div className="card" style={{ padding: 20, position: "sticky", top: 84, alignSelf: "start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--ink-2)", marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--green)" }} /> Live preview — row 1
              </div>
              <CertificateFrame cert={previewCert} verifyUrl={verifyUrl(cert.serial)} />
              <p className="muted" style={{ fontSize: 12.5, marginTop: 12, textAlign: "center" }}>Each row generates its own unique ID &amp; verify page.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="anim-fade-up">
            {!done ? (
              <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
                  <h3 style={{ fontSize: 17 }}>Review recipients</h3>
                  <span className="chip chip-ink">{count} certificates · {count} credits</span>
                </div>
                {!enough && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: "var(--danger-tint)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>
                    <Icon name="coins" size={16} /> You have {credits} credits but need {count}.
                    <Link href="/billing" className="tlink" style={{ marginLeft: "auto", color: "var(--danger)" }}>Top up →</Link>
                  </div>
                )}
                <div className="scroll" style={{ overflowX: "auto", maxHeight: 340, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                    <thead>
                      <tr style={{ position: "sticky", top: 0, background: "#fff", textAlign: "left", color: "var(--ink-3)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                        <th style={{ padding: "11px 18px" }}>#</th>
                        <th style={{ padding: "11px 18px" }}>Recipient</th>
                        <th style={{ padding: "11px 18px" }}>Course</th>
                        <th style={{ padding: "11px 18px" }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 200).map((r, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                          <td style={{ padding: "12px 18px", color: "var(--ink-4)", fontSize: 13 }}>{i + 1}</td>
                          <td style={{ padding: "12px 18px", fontWeight: 600, fontSize: 14 }}>{val(r, "recipientName")}</td>
                          <td style={{ padding: "12px 18px", fontSize: 14, color: "var(--ink-2)" }}>{val(r, "eventName")}</td>
                          <td style={{ padding: "12px 18px" }}>{val(r, "grade") && <span className="chip" style={{ height: 24 }}>{val(r, "grade")}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {error && <div style={{ fontSize: 13.5, color: "var(--danger)", padding: "12px 20px" }}>{error}</div>}
                <div style={{ display: "flex", gap: 10, padding: "16px 20px", borderTop: "1px solid var(--line)", alignItems: "center" }}>
                  <button className="btn btn-ghost" onClick={() => setStep(1)}><Icon name="arrowL" size={16} /> Back to mapping</button>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
                    {issuing && <span style={{ fontSize: 14, fontWeight: 600, color: "var(--green-700)" }}><Icon name="settings" size={15} style={{ animation: "spin 1s linear infinite", verticalAlign: "-3px" }} /> Sealing {count}…</span>}
                    <button className="btn btn-primary btn-lg" onClick={issue} disabled={issuing || !enough}><Icon name="shield" size={18} /> {issuing ? "Issuing…" : `Issue ${count} certificates`}</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card anim-pop" style={{ padding: "48px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <Confetti />
                <div style={{ position: "relative" }}>
                  <div style={{ margin: "0 auto 8px", width: 120 }}><Seal size={120} stamp drawCheck /></div>
                  <h2 style={{ fontSize: 28, letterSpacing: "-0.02em", marginTop: 10 }}>{count} certificates issued</h2>
                  <p className="muted" style={{ fontSize: 16, marginTop: 10, maxWidth: 440, marginInline: "auto" }}>Every certificate now has a unique ID and a public verification page.</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
                    <button className="btn btn-primary btn-lg" onClick={() => router.push("/dashboard")}><Icon name="grid" size={18} /> View dashboard</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
