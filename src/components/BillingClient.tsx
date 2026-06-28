"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { AppNav } from "./AppNav";
import { Seal } from "./Seal";

const MIN = 50;
const QUICK = [50, 200, 500, 1000];

export type TopUp = { id: string; amountInr: number; credits: number; status: "created" | "paid" | "failed"; date: string };

declare global {
  interface Window {
    Cashfree?: (opts: { mode: string }) => { checkout: (o: { paymentSessionId: string; redirectTarget?: string }) => void };
  }
}

function loadCashfreeSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Cashfree"));
    document.body.appendChild(s);
  });
}

const STATUS_STYLE: Record<TopUp["status"], { label: string; bg: string; fg: string }> = {
  paid: { label: "Paid", bg: "var(--green-tint)", fg: "var(--green-700)" },
  created: { label: "Pending", bg: "var(--gold-tint)", fg: "#8a6a1e" },
  failed: { label: "Failed", bg: "var(--danger-tint)", fg: "var(--danger)" },
};

export function BillingClient({
  credits,
  initials,
  plan,
  configured,
  status,
  topUps,
}: {
  credits: number;
  initials: string;
  plan: "free" | "pro";
  configured: boolean;
  status: "success" | "error" | null;
  topUps: TopUp[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const valid = Number.isFinite(amount) && amount >= MIN;

  const pay = async () => {
    setError("");
    if (!valid) {
      setError(`Minimum top-up is ₹${MIN}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.floor(amount) }),
      });
      const json = (await res.json()) as {
        mode?: string;
        mockUrl?: string;
        paymentSessionId?: string;
        cashfreeMode?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Could not start payment");

      if (json.mode === "mock" && json.mockUrl) {
        window.location.href = json.mockUrl;
        return;
      }
      if (json.mode === "cashfree" && json.paymentSessionId) {
        await loadCashfreeSdk();
        const cf = window.Cashfree?.({ mode: json.cashfreeMode || "sandbox" });
        cf?.checkout({ paymentSessionId: json.paymentSessionId, redirectTarget: "_self" });
        return;
      }
      throw new Error("Unexpected response");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed to start");
      setLoading(false);
    }
  };

  return (
    <>
      <AppNav credits={credits} initials={initials} />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 22px 70px" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}
        >
          <Icon name="arrowL" size={16} /> Dashboard
        </button>
        <h1 style={{ fontSize: 30, letterSpacing: "-0.03em" }}>Buy certificate credits</h1>
        <p className="muted" style={{ marginTop: 6, fontSize: 15.5 }}>
          Top up any amount, <strong>₹1 = 1 credit</strong>. Each issued certificate uses one credit. Verifying is always free, forever.
        </p>

        {status === "success" && (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              marginTop: 18,
              background: "var(--green-tint)",
              borderColor: "var(--green)",
            }}
          >
            <Icon name="check" size={20} style={{ color: "var(--green-700)" }} />{" "}
            <span style={{ fontWeight: 600, color: "var(--green-700)" }}>Payment successful, credits added to your account.</span>
          </div>
        )}
        {status === "error" && (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              marginTop: 18,
              background: "var(--danger-tint)",
              borderColor: "var(--danger)",
            }}
          >
            <Icon name="x" size={20} style={{ color: "var(--danger)" }} />{" "}
            <span style={{ fontWeight: 600, color: "var(--danger)" }}>Payment could not be completed. No credits were added.</span>
          </div>
        )}

        <div className="prev-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginTop: 24, alignItems: "start" }}>
          <div className="card" style={{ padding: 26 }}>
            <div className="eyebrow">Top up</div>
            <h2 style={{ fontSize: 20, marginTop: 4, marginBottom: 18 }}>How many credits?</h2>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 99,
                    fontSize: 14,
                    fontWeight: 700,
                    border: `1.5px solid ${amount === q ? "var(--green)" : "var(--line-2)"}`,
                    background: amount === q ? "var(--green-tint)" : "#fff",
                    color: amount === q ? "var(--green-700)" : "var(--ink-2)",
                  }}
                >
                  ₹{q}
                </button>
              ))}
            </div>

            <div className="field">
              <label>Amount (INR)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--ink-3)" }}>
                  ₹
                </span>
                <input
                  className="input"
                  type="number"
                  min={MIN}
                  value={Number.isFinite(amount) ? amount : ""}
                  onChange={(e) => setAmount(parseInt(e.target.value, 10))}
                  style={{ paddingLeft: 30, height: 52, fontSize: 18, fontWeight: 700 }}
                />
              </div>
              <p className="muted" style={{ fontSize: 12.5 }}>
                Minimum ₹{MIN}. You&apos;ll receive <strong>{valid ? amount : 0}</strong> credits.
              </p>
            </div>

            {error && (
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--danger)",
                  background: "var(--danger-tint)",
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginTop: 6,
                }}
              >
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 18 }} onClick={pay} disabled={loading || !valid}>
              <Icon name="coins" size={18} /> {loading ? "Starting…" : `Pay ₹${valid ? amount : MIN}`}
            </button>
            {!configured && (
              <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>
                Demo mode, Cashfree keys not set, so payment is simulated and credits are added instantly.
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20, background: "linear-gradient(135deg,#0F1B2D,#1d2f48)", color: "#fff", border: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Seal size={40} drawCheck={false} />
                <span style={{ fontWeight: 700 }}>{plan === "pro" ? "Pro plan" : "Free plan"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 30, fontWeight: 800 }}>{credits}</span>
                <span style={{ color: "rgba(255,255,255,.6)", fontSize: 14 }}>credits remaining</span>
              </div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              {["₹1 = 1 certificate credit", "Credits never expire", "Verification is always free", "Shared across all your organizations"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", fontSize: 13.5, fontWeight: 500 }}>
                  <Icon name="check" size={16} style={{ color: "var(--green)" }} /> {t}
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-block" onClick={() => setShowHistory(true)}>
              <Icon name="rows" size={16} /> View past top-ups
            </button>
          </div>
        </div>
      </div>

      {showHistory && (
        <div
          onClick={() => setShowHistory(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,27,45,.45)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "100%", maxWidth: 520, maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18 }}>Past top-ups</h2>
                <p className="muted" style={{ fontSize: 13 }}>Your credit purchase history.</p>
              </div>
              <button onClick={() => setShowHistory(false)} style={{ color: "var(--ink-4)" }}><Icon name="x" size={20} /></button>
            </div>
            <div className="scroll" style={{ overflowY: "auto" }}>
              {topUps.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "var(--ink-4)", fontSize: 14 }}>No top-ups yet. Your purchases will show up here.</div>
              ) : (
                topUps.map((t) => {
                  const st = STATUS_STYLE[t.status];
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--gold-tint)", color: "#8a6a1e", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name="coins" size={19} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>₹{t.amountInr.toLocaleString("en-IN")}</div>
                        <div className="muted" style={{ fontSize: 12.5 }}>{t.date} · {t.credits} credits</div>
                      </div>
                      <span className="chip" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
