"use client";
import { useEffect, useState } from "react";

type Bit = { left: number; delay: number; dur: number; color: string; size: number; rot: number };

export function Confetti({ n = 60 }: { n?: number }) {
  const [bits, setBits] = useState<Bit[]>([]);
  useEffect(() => {
    setBits(
      Array.from({ length: n }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.6 + Math.random() * 1.4,
        color: ["#0E9F6E", "#C79A3A", "#2E6FE6", "#3ddc9a", "#DB2777"][i % 5],
        size: 5 + Math.random() * 7,
        rot: Math.random() * 360,
      })),
    );
  }, [n]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: -16,
            left: b.left + "%",
            width: b.size,
            height: b.size * 1.4,
            background: b.color,
            borderRadius: 1,
            transform: `rotate(${b.rot}deg)`,
            animation: `confetti-fall ${b.dur}s ${b.delay}s cubic-bezier(.3,.6,.5,1) forwards`,
          }}
        />
      ))}
    </div>
  );
}

type CannonBit = { side: "l" | "r"; tx: number; ty: number; r: number; dur: number; delay: number; color: string; size: number };

/** One-shot burst fired from the bottom-left and bottom-right corners. */
export function ConfettiCannons({ n = 80 }: { n?: number }) {
  const [bits, setBits] = useState<CannonBit[]>([]);
  useEffect(() => {
    const colors = ["#0E9F6E", "#C79A3A", "#2E6FE6", "#3ddc9a", "#DB2777", "#fff"];
    setBits(
      Array.from({ length: n }, (_, i) => {
        const side: "l" | "r" = i % 2 === 0 ? "l" : "r";
        const spread = 60 + Math.random() * 360; // horizontal travel (inward)
        const up = 140 + Math.random() * 280; // peak height
        return {
          side,
          tx: side === "l" ? spread : -spread,
          ty: -up,
          r: Math.random() * 720 - 360,
          dur: 1.5 + Math.random() * 1.1,
          delay: Math.random() * 0.12,
          color: colors[i % colors.length],
          size: 6 + Math.random() * 7,
        };
      }),
    );
  }, [n]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: b.side === "l" ? 0 : "auto",
            right: b.side === "r" ? 0 : "auto",
            width: b.size,
            height: b.size * 1.4,
            background: b.color,
            borderRadius: 1,
            ["--tx" as string]: b.tx + "px",
            ["--ty" as string]: b.ty + "px",
            ["--r" as string]: b.r + "deg",
            animation: `cannon-burst ${b.dur}s ${b.delay}s cubic-bezier(.15,.7,.4,1) forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
