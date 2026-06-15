import { Seal } from "./Seal";

export function Logo({ light = false, size = 22 }: { light?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <Seal size={size + 8} stamp={false} drawCheck={false} />
      <span style={{ fontWeight: 800, fontSize: size, letterSpacing: "-0.03em", color: light ? "#fff" : "var(--ink)" }}>
        Proven<span style={{ color: "var(--green)" }}>ly</span>
      </span>
    </div>
  );
}
