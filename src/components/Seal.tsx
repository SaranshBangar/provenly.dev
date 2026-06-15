import type { CSSProperties } from "react";

let sealCounter = 0;

export type SealGlyph = "check" | "star";

export function Seal({
  size = 88,
  color = "var(--green)",
  ring = "var(--gold)",
  label = "VERIFIED",
  stamp = false,
  drawCheck = true,
  glyph = "check",
}: {
  size?: number | string;
  color?: string;
  ring?: string;
  label?: string;
  stamp?: boolean;
  drawCheck?: boolean;
  glyph?: SealGlyph;
}) {
  const teeth = 44;
  const R = 50;
  const cx = 50;
  const cy = 50;
  let scallop = "";
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const r = R - (i % 2 === 0 ? 0 : 3.4);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    scallop += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  scallop += "Z";

  // Stable-enough unique id; identical geometry means collisions still render fine.
  const arcId = "arc" + (typeof size === "number" ? Math.round(size) : 0) + "_" + (++sealCounter % 9999);

  const wrapStyle: CSSProperties = {
    animation: stamp ? "sealdrop .7s cubic-bezier(.2,.8,.3,1.1) both" : "none",
    filter: "drop-shadow(0 4px 10px rgba(15,27,45,.18))",
    display: "block",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={wrapStyle}>
      <defs>
        <path id={arcId} d="M50 50 m -37 0 a 37 37 0 1 1 74 0" fill="none" />
        <radialGradient id={"sg" + arcId} cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".28" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={scallop} fill={ring} />
      <circle cx="50" cy="50" r="42" fill={color} />
      <circle cx="50" cy="50" r="42" fill={"url(#sg" + arcId + ")"} />
      <circle cx="50" cy="50" r="35.5" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.1" />
      <text fontFamily="var(--mono)" fontSize="7.4" fontWeight="600" fill="#fff" letterSpacing="2.2">
        <textPath href={"#" + arcId} startOffset="50%" textAnchor="middle">
          {label} · PROVENLY ·{" "}
        </textPath>
      </text>
      {glyph === "check" ? (
        <polyline
          points="37 51 46 60 64 40"
          fill="none"
          stroke="#fff"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={drawCheck ? { strokeDasharray: 60, strokeDashoffset: 60, animation: "draw .5s .35s ease forwards" } : {}}
        />
      ) : (
        <polygon points="50 34 53.7 45.4 65.7 45.4 56 52.5 59.7 63.9 50 56.8 40.3 63.9 44 52.5 34.3 45.4 46.3 45.4" fill="#fff" />
      )}
    </svg>
  );
}
