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
