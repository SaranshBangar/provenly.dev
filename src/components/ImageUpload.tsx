"use client";
import { useRef, useState } from "react";
import { Icon } from "./Icon";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  round,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  hint?: string;
  round?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    // Show local preview immediately.
    let dataUrl = "";
    try {
      dataUrl = await readAsDataUrl(file);
      onChange(dataUrl);
    } catch {
      /* ignore */
    }
    // Try to persist to R2; fall back to the inline data URL.
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/assets", { method: "POST", body: fd });
      if (res.ok) {
        const json = (await res.json()) as { url?: string };
        if (json.url) onChange(json.url);
      }
    } catch {
      /* keep data url */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
        style={{ display: "flex", alignItems: "center", gap: 13, padding: 12, border: "1.5px dashed var(--line-2)", borderRadius: 11, cursor: "pointer", transition: "border-color .15s", background: "var(--canvas)" }}
      >
        <div style={{ width: 48, height: 48, borderRadius: round ? 99 : 9, background: "#fff", border: "1px solid var(--line)", display: "grid", placeItems: "center", overflow: "hidden", flex: "0 0 auto" }}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <Icon name="image" size={20} style={{ color: "var(--ink-4)" }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)" }}>{busy ? "Uploading…" : value ? "Replace image" : "Upload or drag image"}</div>
          <div className="muted" style={{ fontSize: 12 }}>{hint || "PNG, JPG or SVG"}</div>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            style={{ color: "var(--ink-4)", padding: 6 }}
          >
            <Icon name="trash" size={17} />
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="vh" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
