"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

// Custom replacements for window.alert / confirm / prompt — Promise-based so
// callers can `await dialog.confirm(...)` exactly like the native API.

type AlertOpts = { title?: string; confirmLabel?: string };
type ConfirmOpts = { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type PromptOpts = { title?: string; placeholder?: string; confirmLabel?: string };

type DialogApi = {
  alert: (message: string, opts?: AlertOpts) => Promise<void>;
  confirm: (message: string, opts?: ConfirmOpts) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, opts?: PromptOpts) => Promise<string | null>;
  toast: (message: string) => void;
};

const Ctx = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDialog must be used within <DialogProvider>");
  return ctx;
}

type Kind = "alert" | "confirm" | "prompt";
type Active = {
  kind: Kind;
  message: string;
  title?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  placeholder?: string;
  resolve: (v: unknown) => void;
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);
  const [input, setInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback((value: unknown) => {
    setActive((a) => {
      a?.resolve(value);
      return null;
    });
  }, []);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const alert = useCallback(
    (message: string, opts?: AlertOpts) =>
      new Promise<void>((resolve) =>
        setActive({ kind: "alert", message, title: opts?.title, confirmLabel: opts?.confirmLabel || "OK", cancelLabel: "", danger: false, resolve: () => resolve() }),
      ),
    [],
  );

  const confirm = useCallback(
    (message: string, opts?: ConfirmOpts) =>
      new Promise<boolean>((resolve) =>
        setActive({ kind: "confirm", message, title: opts?.title, confirmLabel: opts?.confirmLabel || "Confirm", cancelLabel: opts?.cancelLabel || "Cancel", danger: !!opts?.danger, resolve: (v) => resolve(!!v) }),
      ),
    [],
  );

  const prompt = useCallback(
    (message: string, defaultValue = "", opts?: PromptOpts) =>
      new Promise<string | null>((resolve) => {
        setInput(defaultValue);
        setActive({ kind: "prompt", message, title: opts?.title, confirmLabel: opts?.confirmLabel || "Save", cancelLabel: "Cancel", danger: false, placeholder: opts?.placeholder, resolve: (v) => resolve(v as string | null) });
      }),
    [],
  );

  const onConfirm = () => {
    if (!active) return;
    if (active.kind === "prompt") close(input.trim() ? input.trim() : null);
    else if (active.kind === "confirm") close(true);
    else close(undefined);
  };
  const onCancel = () => {
    if (!active) return;
    close(active.kind === "prompt" ? null : active.kind === "confirm" ? false : undefined);
  };

  return (
    <Ctx.Provider value={{ alert, confirm, prompt, toast }}>
      {children}

      {active && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,27,45,.45)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 20, animation: "pop-in .15s ease both" }}
        >
          <div role="dialog" aria-modal="true" className="card" style={{ width: "100%", maxWidth: 420, padding: "22px 22px 20px", boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>
            {active.title && <h3 style={{ fontSize: 17, marginBottom: 8 }}>{active.title}</h3>}
            <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{active.message}</p>

            {active.kind === "prompt" && (
              <input
                className="input"
                autoFocus
                value={input}
                placeholder={active.placeholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); if (e.key === "Escape") onCancel(); }}
                style={{ marginTop: 14, height: 44 }}
              />
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              {active.cancelLabel && (
                <button className="btn btn-ghost" onClick={onCancel}>{active.cancelLabel}</button>
              )}
              <button
                autoFocus={active.kind !== "prompt"}
                className="btn btn-primary"
                onClick={onConfirm}
                style={active.danger ? { background: "var(--danger)", borderColor: "var(--danger)" } : undefined}
              >
                {active.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={{ position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 210, background: "var(--ink)", color: "#fff", padding: "12px 18px", borderRadius: 11, fontSize: 14, fontWeight: 600, boxShadow: "0 14px 40px rgba(0,0,0,.3)", animation: "pop-in .18s ease both", maxWidth: "90vw" }}>
          {toastMsg}
        </div>
      )}
    </Ctx.Provider>
  );
}
