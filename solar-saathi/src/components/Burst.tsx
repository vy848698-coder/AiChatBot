"use client";

import { motion } from "motion/react";

const COLORS = ["#3ecf8e", "#e8c468", "#4ea8de", "#b8f5d9", "#ffffff"];

// Deterministic confetti so every burst looks equally balanced.
const PARTS = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + (i % 2) * 0.2;
  const dist = 70 + ((i * 37) % 60);
  return {
    x: Math.cos(a) * dist,
    y: Math.sin(a) * dist - 20,
    r: ((i * 53) % 360) - 180,
    s: 6 + (i % 4) * 2,
    c: COLORS[i % COLORS.length],
    d: (i % 5) * 0.06,
  };
});

// Celebration burst; pass a new `fire` value (e.g. Date.now()) to trigger.
export function Burst({ fire }: { fire: number }) {
  if (!fire) return null;
  return (
    <div key={fire} aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      {PARTS.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[2px]"
          style={{ background: p.c, width: p.s, height: p.s * 0.55 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 40], opacity: [1, 1, 0], scale: 1, rotate: p.r }}
          transition={{ duration: 1.1 + p.d, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
