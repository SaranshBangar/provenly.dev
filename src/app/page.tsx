"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Seal } from "@/components/Seal";
import { QRCode } from "@/components/QRCode";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.15 },
    );
    el.querySelectorAll(".reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "all .25s", background: scrolled ? "rgba(250,249,246,.85)" : "transparent", backdropFilter: scrolled ? "blur(14px)" : "none", borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent" }}>
      <div className="container" style={{ height: 70, display: "flex", alignItems: "center" }}>
        <Logo size={21} />
        <nav className="land-nav" style={{ display: "flex", gap: 28, marginLeft: 44 }}>
          {[["Features", "#features"], ["How it works", "#how"], ["Pricing", "#how"]].map(([x, h]) => (
            <a key={x} href={h} style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-2)" }}>{x}</a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-2)" }}>Log in</Link>
          <Link className="btn btn-primary btn-sm" href="/login">Start free <Icon name="arrow" size={16} /></Link>
        </div>
      </div>
    </header>
  );
}

function FloatingCert({ style, accent, title, name }: { style?: React.CSSProperties; accent: string; title: string; name: string }) {
  return (
    <div className="card" style={{ position: "absolute", width: 220, padding: 14, borderRadius: 14, ...style }}>
      <div style={{ height: 5, width: 54, borderRadius: 9, background: accent }} />
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", color: "var(--ink-4)", marginTop: 12 }}>CERTIFICATE OF</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 700, marginTop: 2 }}>{title}</div>
      <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: accent, marginTop: 14 }}>{name}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "var(--green-700)" }}><Icon name="check" size={13} /> Verified</div>
        <div style={{ width: 26, height: 26 }}><QRCode value={name} size={26} /></div>
      </div>
    </div>
  );
}

export default function Landing() {
  const revRef = useReveal();
  const router = useRouter();
  return (
    <div ref={revRef} style={{ background: "var(--canvas)", overflow: "hidden" }}>
      <LandingNav />

      <section style={{ position: "relative", paddingTop: 150, paddingBottom: 90 }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, var(--green-tint) 0%, transparent 70%)", filter: "blur(8px)" }} />
        <div style={{ position: "absolute", top: 200, left: -120, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, var(--gold-tint) 0%, transparent 70%)", opacity: 0.7 }} />
        <div className="container hero-grid" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 50, alignItems: "center" }}>
          <div>
            <div className="chip" style={{ animation: "fade-up .6s both" }}><Icon name="shield" size={15} /> Tamper-proof by design</div>
            <h1 style={{ fontSize: "clamp(40px, 5.4vw, 66px)", lineHeight: 1.02, marginTop: 20, letterSpacing: "-0.035em", animation: "fade-up .6s .05s both" }}>
              Certificates people<br />can actually{" "}
              <span style={{ color: "var(--green)", position: "relative" }}>
                trust
                <svg viewBox="0 0 200 14" style={{ position: "absolute", left: 0, bottom: -6, width: "100%" }}>
                  <path d="M2 9 Q60 2 110 7 T198 6" fill="none" stroke="var(--gold)" strokeWidth="3.5" strokeLinecap="round" style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: "draw 1s .6s ease forwards" }} />
                </svg>
              </span>
              .
            </h1>
            <p style={{ fontSize: 19, color: "var(--ink-3)", marginTop: 24, maxWidth: 480, lineHeight: 1.55, animation: "fade-up .6s .1s both" }}>
              Design beautiful certificates, issue them in bulk, and give every recipient a public verification page. One scan proves it&apos;s real — forever.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", animation: "fade-up .6s .15s both" }}>
              <Link className="btn btn-primary btn-lg" href="/login">Start issuing free <Icon name="arrow" size={18} /></Link>
              <Link className="btn btn-ghost btn-lg" href="/verify/demo"><Icon name="shield" size={18} /> See a verified cert</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 36, color: "var(--ink-3)", fontSize: 14, fontWeight: 600, flexWrap: "wrap", animation: "fade-up .6s .2s both" }}>
              {["No credit card", "5 free credits", "Public verify links"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}><Icon name="check" size={16} style={{ color: "var(--green)" }} /> {t}</span>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", height: 460, animation: "fade-up .7s .15s both" }}>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <div style={{ position: "relative" }}>
                {[0, 1].map((i) => (
                  <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--green)", animation: `ring-pulse 2.6s ${i * 1.3}s ease-out infinite` }} />
                ))}
                <div style={{ animation: "sealdrop 1s .3s cubic-bezier(.2,.8,.3,1.1) both" }}>
                  <Seal size={190} label="VERIFIED" drawCheck />
                </div>
              </div>
            </div>
            <div style={{ animation: "floaty 6s ease-in-out infinite" }}>
              <FloatingCert accent="var(--green)" title="Completion" name="Amara Okafor" style={{ top: 10, left: -10, transform: "rotate(-7deg)" }} />
            </div>
            <div style={{ animation: "floaty 7s ease-in-out .8s infinite" }}>
              <FloatingCert accent="var(--gold)" title="Achievement" name="Jonah Reyes" style={{ bottom: 16, right: -16, transform: "rotate(6deg)" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 30 }}>
        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 22 }}>Issued by bootcamps, schools, creators &amp; event teams</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", opacity: 0.55 }}>
          {["Meridian Academy", "CodeCraft", "NorthLake University", "CreatorHub", "SkillForge"].map((n) => (
            <span key={n} style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-.02em", color: "var(--ink-2)" }}>{n}</span>
          ))}
        </div>
      </section>

      <section id="features" className="container" style={{ paddingTop: 90, paddingBottom: 40 }}>
        <div className="reveal" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 56px" }}>
          <div className="eyebrow">Why Provenly</div>
          <h2 style={{ fontSize: "clamp(30px,4vw,44px)", marginTop: 12, letterSpacing: "-0.03em" }}>Trust, built into every certificate</h2>
        </div>
        <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {[
            { icon: "shield" as const, color: "var(--green)", tint: "var(--green-tint)", t: "Tamper-proof records", d: "Every certificate is sealed with a unique ID. Any change breaks the record — so a verified cert is provably authentic." },
            { icon: "globe" as const, color: "var(--blue)", tint: "var(--blue-tint)", t: "Instant public verification", d: "Each cert gets a shareable verify page and QR code. Anyone can confirm it's real in one tap — no account needed." },
            { icon: "bolt" as const, color: "#8a6a1e", tint: "var(--gold-tint)", t: "Issue thousands at once", d: "Upload a CSV, map your columns, and bulk-issue personalized certificates in minutes — not days." },
          ].map((f, i) => (
            <div key={i} className="reveal card" style={{ padding: 28, transitionDelay: i * 0.08 + "s" }}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: f.tint, color: f.color, display: "grid", placeItems: "center" }}><Icon name={f.icon} size={26} /></div>
              <h3 style={{ fontSize: 21, marginTop: 18 }}>{f.t}</h3>
              <p style={{ color: "var(--ink-3)", marginTop: 10, fontSize: 15.5, lineHeight: 1.55 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="container" style={{ paddingTop: 70, paddingBottom: 60 }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 50 }}>
          <div className="eyebrow">How it works</div>
          <h2 style={{ fontSize: "clamp(30px,4vw,44px)", marginTop: 12, letterSpacing: "-0.03em" }}>From design to verified in three steps</h2>
        </div>
        <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {[
            { n: "01", t: "Design it", d: "Use the customizer — logo, signatures, seal, colors, fonts, custom fields. Live preview as you go." },
            { n: "02", t: "Issue it", d: "Send one or upload a CSV to issue thousands. Each recipient gets a unique ID and QR." },
            { n: "03", t: "Prove it", d: "Recipients share their verify link. One scan shows a Verified ✓ by Provenly badge." },
          ].map((s, i) => (
            <div key={i} className="reveal" style={{ position: "relative", padding: "30px 26px", borderRadius: 18, background: i === 2 ? "var(--ink)" : "#fff", color: i === 2 ? "#fff" : "var(--ink)", border: i === 2 ? "none" : "1px solid var(--line)", transitionDelay: i * 0.08 + "s" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600, color: i === 2 ? "var(--green)" : "var(--green-700)" }}>{s.n}</div>
              <h3 style={{ fontSize: 23, marginTop: 14 }}>{s.t}</h3>
              <p style={{ marginTop: 10, fontSize: 15.5, lineHeight: 1.55, color: i === 2 ? "rgba(255,255,255,.7)" : "var(--ink-3)" }}>{s.d}</p>
              {i === 2 && <div style={{ marginTop: 18 }}><Seal size={56} drawCheck={false} /></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 100 }}>
        <div className="reveal" style={{ position: "relative", overflow: "hidden", borderRadius: 28, background: "linear-gradient(120deg, #0d8a60, #0E9F6E 60%, #14b67e)", padding: "64px 40px", textAlign: "center", color: "#fff", boxShadow: "var(--sh-3)" }}>
          <div style={{ position: "absolute", top: -40, right: 40, opacity: 0.18 }}><Seal size={180} color="#fff" ring="#fff" drawCheck={false} /></div>
          <h2 style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.03em", position: "relative" }}>Start issuing certificates people trust</h2>
          <p style={{ fontSize: 18, marginTop: 16, opacity: 0.92, position: "relative" }}>Your first 5 certificates are on us. No card required.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, position: "relative", flexWrap: "wrap" }}>
            <button className="btn btn-lg" onClick={() => router.push("/login")} style={{ background: "#fff", color: "var(--green-700)" }}>Create free account <Icon name="arrow" size={18} /></button>
            <button className="btn btn-lg" onClick={() => router.push("/login")} style={{ background: "rgba(255,255,255,.16)", color: "#fff", backdropFilter: "blur(4px)" }}>Try the customizer</button>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Logo size={19} />
          <p style={{ color: "var(--ink-4)", fontSize: 14 }}>© 2026 Provenly · Verifiable certificates for everyone</p>
        </div>
      </footer>
    </div>
  );
}
