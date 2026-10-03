"use client";

import { motion } from "motion/react";
import type { Lang } from "@/lib/i18n";

export type Bubble = { key: number; text: string; shown: number; lang: Lang };

// Snap the reveal point to a grapheme boundary so Odia/Devanagari conjuncts
// never render half-built while typing.
export function snapGrapheme(text: string, n: number) {
  if (n >= text.length) return text.length;
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let end = 0;
    for (const { index } of seg.segment(text)) {
      if (index > n) break;
      end = index;
    }
    return end;
  } catch {
    return n;
  }
}

// Text that types along with Saathi's voice. The unrevealed part is kept
// (invisible) so the bubble never changes size while typing.
export function TypedText({
  text,
  shown,
  typing,
  reserve = true,
}: {
  text: string;
  shown: number;
  typing: boolean;
  reserve?: boolean; // keep the final size from the start (fixed bubbles)
}) {
  const cut = snapGrapheme(text, shown);
  return (
    <>
      <span>{text.slice(0, cut)}</span>
      {typing && cut < text.length && <span className="caret" />}
      {reserve && <span className="opacity-0">{text.slice(cut)}</span>}
    </>
  );
}

const TAIL = {
  top: "-top-[7px] left-1/2 -ml-[7px] border-l border-t",
  left: "top-6 -left-[7px] border-b border-l",
  "bottom-right": "-bottom-[7px] right-[18%] border-r border-b",
  adaptive:
    "-bottom-[7px] left-1/2 -ml-[7px] border-r border-b lg:top-7 lg:bottom-auto lg:-left-[7px] lg:ml-0 lg:border-r-0 lg:border-l",
};

export function SpeechBubble({
  bubble,
  speaking,
  tail,
  note,
  className = "",
}: {
  bubble: Bubble;
  speaking: boolean;
  tail: keyof typeof TAIL;
  note?: string | null;
  className?: string;
}) {
  return (
    <motion.div
      key={bubble.key}
      lang={bubble.lang}
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      style={{ transformOrigin: tail === "bottom-right" || tail === "adaptive" ? "50% 100%" : tail === "left" ? "0% 30%" : "50% 0%" }}
      className={`relative rounded-3xl border border-white/12 bg-[#141d22]/95 px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur ${className}`}
      aria-live="polite"
    >
      <span aria-hidden className={`absolute h-3.5 w-3.5 rotate-45 border-white/12 bg-[#141d22] ${TAIL[tail]}`} />
      <p className="relative text-[15px] leading-snug font-medium text-white/95 sm:text-base">
        <TypedText text={bubble.text} shown={bubble.shown} typing={speaking} />
      </p>
      {note && <p className="relative mt-1.5 text-[11.5px] leading-tight text-ink-3">{note}</p>}
    </motion.div>
  );
}
