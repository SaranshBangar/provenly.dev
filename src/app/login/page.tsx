"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Seal } from "@/components/Seal";
import { signIn, signUp } from "@/lib/auth-client";

function FieldIcon({
  icon, label, placeholder, type = "text", pw, value, onChange,
}: {
  icon: IconName; label: string; placeholder: string; type?: string; pw?: boolean;
  value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}><Icon name={icon} size={18} /></span>
        <input className="input" type={pw && show ? "text" : type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={{ paddingLeft: 40, paddingRight: pw ? 40 : 13 }} required />
        {pw && (
          <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}>
            <Icon name="eye" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (signup) {
        const res = await signUp.email({ email, password, name: name || "My Organization" });
        if (res.error) throw new Error(res.error.message || "Sign up failed");
      } else {
        const res = await signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "Invalid email or password");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError("");
    try {
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch {
      setError("Google sign-in is not configured.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="auth-grid">
      <div className="auth-brand" style={{ position: "relative", background: "var(--ink)", color: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", padding: "44px 52px" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 80% 10%, rgba(14,159,110,.35), transparent 55%), radial-gradient(60% 50% at 10% 90%, rgba(199,154,58,.22), transparent 55%)" }} />
        <Link href="/" style={{ position: "relative", alignSelf: "flex-start" }}><Logo light size={21} /></Link>
        <div style={{ position: "relative", margin: "auto 0", maxWidth: 420 }}>
          <div style={{ marginBottom: 30, position: "relative" }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ position: "absolute", marginLeft: 26, marginTop: 26, width: 104, height: 104, borderRadius: "50%", border: "2px solid rgba(14,159,110,.5)", animation: `ring-pulse 2.8s ${i * 1.4}s ease-out infinite` }} />
            ))}
            <Seal size={156} drawCheck />
          </div>
          <h2 style={{ fontSize: 34, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Every certificate,<br />provably real.</h2>
          <p style={{ marginTop: 16, fontSize: 16.5, color: "rgba(255,255,255,.7)", lineHeight: 1.55 }}>Join thousands of educators, creators and event teams issuing tamper-proof certificates with instant public verification.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
            {["Tamper-proof", "QR verify pages", "Bulk CSV issuing"].map((t) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 600, padding: "7px 13px", borderRadius: 99, background: "rgba(255,255,255,.1)" }}>
                <Icon name="check" size={15} style={{ color: "#3ddc9a" }} /> {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", fontSize: 13.5, color: "rgba(255,255,255,.5)" }}>Data encrypted at rest · Verification always free</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px", background: "var(--canvas)" }}>
        <div style={{ width: "100%", maxWidth: 380, animation: "fade-up .5s both" }}>
          <div className="auth-brand-mini" style={{ display: "none", marginBottom: 24 }}><Logo size={21} /></div>
          <div style={{ display: "inline-flex", padding: 4, background: "var(--canvas-2)", borderRadius: 11, marginBottom: 26 }}>
            {([["signup", "Sign up"], ["login", "Log in"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => { setMode(k); setError(""); }} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 14.5, fontWeight: 700, color: mode === k ? "var(--ink)" : "var(--ink-3)", background: mode === k ? "#fff" : "transparent", boxShadow: mode === k ? "var(--sh-1)" : "none", transition: "all .18s" }}>{l}</button>
            ))}
          </div>
          <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>{signup ? "Create your account" : "Welcome back"}</h1>
          <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>{signup ? "Start with 5 free certificate credits." : "Log in to manage your certificates."}</p>

          <button className="btn btn-ghost btn-block" style={{ marginTop: 24, height: 48 }} onClick={google} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 01-2.2 3.3v2.7h3.6c2.1-2 3.2-4.9 3.2-8.1z" /><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.7l-3.6-2.7c-1 .7-2.3 1-3.6 1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0012 23z" /><path fill="#FBBC05" d="M6 14.2a6.6 6.6 0 010-4.2V7.2H2.3a11 11 0 000 9.8L6 14.2z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 002.3 7.2L6 10c.9-2.6 3.2-4.6 6-4.6z" /></svg>
            Continue with Google
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0", color: "var(--ink-4)", fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} /> or <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {signup && <FieldIcon icon="user" label="Organization name" placeholder="Acme Academy" value={name} onChange={setName} />}
            <FieldIcon icon="mail" label="Work email" placeholder="you@academy.edu" type="email" value={email} onChange={setEmail} />
            <FieldIcon icon="lock" label="Password" placeholder="••••••••" type="password" pw value={password} onChange={setPassword} />
            {error && (
              <div style={{ fontSize: 13.5, color: "var(--danger)", background: "var(--danger-tint)", padding: "9px 12px", borderRadius: 8 }}>{error}</div>
            )}
            <button type="submit" className="btn btn-primary btn-block" style={{ height: 48, marginTop: 4 }} disabled={loading}>
              {loading ? "Please wait…" : signup ? "Create account" : "Log in"} {!loading && <Icon name="arrow" size={17} />}
            </button>
          </form>
          <p className="muted" style={{ fontSize: 13, textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
            {signup ? (
              <>By signing up you agree to our <span className="tlink">Terms</span> &amp; <span className="tlink">Privacy Policy</span>.</>
            ) : (
              <>New here? <button onClick={() => setMode("signup")} className="tlink">Create an account</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
