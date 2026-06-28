"use client";
import { useRef } from "react";
import type { CertElement } from "@/db/schema";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type Props = {
  elements: CertElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (els: CertElement[]) => void;
};

type Drag = { id: string; mode: "move" | "resize"; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number };

/**
 * Transparent interaction layer drawn over the certificate preview. The actual
 * element visuals are rendered by CertificateFrame at the same percentage
 * coordinates; this layer only provides drag-to-move and resize handles so the
 * editor and the issued certificate always stay in sync.
 */
export function CertElementsLayer({ elements, selectedId, onSelect, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const patch = (id: string, p: Partial<CertElement>) =>
    onChange(elements.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const start = (e: React.PointerEvent, el: CertElement, mode: Drag["mode"]) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(el.id);
    drag.current = { id: el.id, mode, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = ref.current;
    if (!d || !box) return;
    const r = box.getBoundingClientRect();
    const dx = ((e.clientX - d.sx) / r.width) * 100;
    const dy = ((e.clientY - d.sy) / r.height) * 100;
    if (d.mode === "move") {
      patch(d.id, { x: clamp(d.ox + dx, 0, 98), y: clamp(d.oy + dy, 0, 98) });
    } else {
      patch(d.id, { w: clamp(d.ow + dx, 3, 100), h: clamp(d.oh + dy, 3, 100) });
    }
  };

  const end = () => {
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      onClick={() => onSelect(null)}
      style={{ position: "absolute", inset: 0, zIndex: 6 }}
    >
      {elements.map((el) => {
        const sel = el.id === selectedId;
        return (
          <div
            key={el.id}
            onPointerDown={(e) => start(e, el, "move")}
            style={{
              position: "absolute",
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              transform: `rotate(${el.rot || 0}deg)`,
              border: sel ? "1.5px solid var(--green)" : "1px solid transparent",
              boxShadow: sel ? "0 0 0 1px rgba(255,255,255,.6)" : "none",
              cursor: "move",
              touchAction: "none",
            }}
          >
            {sel && (
              <span
                onPointerDown={(e) => start(e, el, "resize")}
                style={{ position: "absolute", right: -7, bottom: -7, width: 14, height: 14, borderRadius: 4, background: "var(--green)", border: "2px solid #fff", cursor: "nwse-resize", touchAction: "none" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
