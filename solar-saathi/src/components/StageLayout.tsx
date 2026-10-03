"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion } from "motion/react";
import { Burst } from "./Burst";
import type { MascotMood } from "./mascot/Mascot";
import { Saathi } from "./mascot/Saathi";
import { TypedText } from "./SpeechBubble";

const mq = "(min-width: 1024px)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(mq);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
export const useDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(mq).matches, () => false);

// Phone: Saathi in close-up (face and mouth large) on top, his words in a
// bubble right under him, then a compact card. Desktop: Saathi full-body on
// the left, words + card on the right. `tall` = long content (results), so
// Saathi gives up some height and the content scrolls.
export function StageLayout({
  mood,
  burst = 0,
  tall = false,
  caption,
  children,
}: {
  mood: MascotMood;
  burst?: number;
  tall?: boolean;
  caption: ReactNode;
  children: ReactNode;
}) {
  const desktop = useDesktop();
  return (
    <div className="mx-auto flex h-full w-full max-w-[1140px] flex-col lg:grid lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10 lg:px-8">
      <div className={`relative ${tall ? "h-[27dvh] min-h-[150px] flex-none" : "min-h-[190px] flex-1"} lg:h-full lg:min-h-0`}>
        {desktop && (
          <span
            aria-hidden
            className="absolute bottom-[6%] left-1/2 h-12 w-[min(62%,330px)] -translate-x-1/2 rounded-[50%] border border-brand/30 bg-[radial-gradient(ellipse,rgba(62,207,142,.35),rgba(62,207,142,.08)_55%,transparent_72%)] shadow-[0_0_40px_rgba(62,207,142,.25)]"
          />
        )}
        <div className="absolute inset-0 flex items-end justify-center lg:top-[3%] lg:bottom-[7%]">
          <motion.div
            className="relative h-full max-w-full"
            style={{ aspectRatio: desktop ? "24 / 29" : "1 / 1" }}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          >
            <Saathi mood={mood} framing={desktop ? "full" : "bust"} className="h-full w-full" />
            <Burst fire={burst} />
          </motion.div>
        </div>
      </div>

      <div
        className={`relative z-10 flex flex-col gap-2.5 px-4 pb-[max(14px,env(safe-area-inset-bottom))] lg:max-h-full lg:gap-3 lg:overflow-y-auto lg:p-0 lg:py-4 ${
          tall ? "min-h-0 flex-1 overflow-y-auto" : "shrink-0"
        }`}
      >
        {caption}
        {children}
      </div>
    </div>
  );
}

// What Saathi is saying: a bubble pointing up at him (phone) or left (desktop).
export function Caption({
  text,
  shown,
  preparing,
  speaking,
  note,
  lang,
}: {
  text: string;
  shown: number;
  preparing: boolean;
  speaking: boolean;
  note?: string | null;
  lang: string;
}) {
  return (
    <div
      lang={lang}
      aria-live="polite"
      className="relative mx-auto w-full max-w-[480px] rounded-[22px] border border-white/12 bg-[#101a20]/92 px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,.4)] backdrop-blur lg:mx-0 lg:px-6 lg:py-5"
    >
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 -ml-2 h-4 w-4 rotate-45 border-t border-l border-white/12 bg-[#101a20] lg:top-8 lg:-left-2 lg:ml-0 lg:border-t-0 lg:border-b"
      />
      <p className="relative min-h-[44px] text-[16px] leading-snug font-semibold text-white lg:min-h-[56px] lg:text-[20px]">
        {preparing || !text ? (
          <span className="flex h-[22px] items-center gap-1.5 lg:h-[28px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-mint/80" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        ) : (
          <TypedText text={text} shown={shown} typing={speaking} reserve={false} />
        )}
      </p>
      {note && <p className="relative mt-1 text-[11.5px] text-ink-3">{note}</p>}
    </div>
  );
}

// The answer card under the caption.
export function AnswerCard({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="mx-auto w-full max-w-[480px] rounded-[24px] border border-white/12 bg-[#0d151a]/92 p-4 shadow-[0_24px_70px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl lg:mx-0 lg:p-6"
    >
      {label && <p className="mb-2.5 text-[11.5px] font-bold tracking-[.12em] text-gold uppercase">{label}</p>}
      {children}
    </motion.div>
  );
}
