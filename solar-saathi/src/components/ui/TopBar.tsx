"use client";

import { motion } from "motion/react";
import { STRINGS, type Lang } from "@/lib/i18n";
import { IconBack, IconHeadset, IconMute, IconSound } from "./icons";

const roundBtn =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-black/25 text-white/90 backdrop-blur transition hover:bg-white/10 active:scale-95";

// Back · section name with a 5-part progress bar · expert · sound.
// `title` (the FAQ) replaces the section name and shows the journey as done.
export function TopBar({
  lang,
  sections,
  section,
  progress,
  title,
  muted,
  expertLabel,
  onBack,
  onMute,
  onExpert,
}: {
  lang: Lang;
  sections: string[];
  section: number;
  progress: number; // 0..1 inside the current section
  title?: string;
  muted: boolean;
  expertLabel: string;
  onBack: () => void;
  onMute: () => void;
  onExpert: () => void;
}) {
  const t = STRINGS[lang];
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-30 mx-auto flex w-full max-w-[1140px] items-center gap-2.5 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-1 lg:px-8 lg:pt-5"
    >
      <button className={roundBtn} onClick={onBack} aria-label={t.aria.back}>
        <IconBack className="h-5 w-5" />
      </button>
      <div className="mx-auto min-w-0 flex-1 text-center lg:max-w-[420px]" lang={lang}>
        <p className="truncate text-[13px] font-semibold text-white/90">
          {title ?? (
            <>
              {sections[section]} <span className="font-normal text-ink-3">· {section + 1}/{sections.length}</span>
            </>
          )}
        </p>
        <div className="mt-1.5 grid grid-cols-5 gap-1">
          {sections.map((_, i) => (
            <div key={i} className="h-1.5 overflow-hidden rounded-full bg-white/12">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand to-mint shadow-[0_0_8px_rgba(62,207,142,.7)]"
                initial={false}
                animate={{ width: `${(title || i < section ? 1 : i === section ? Math.max(progress, 0.06) : 0) * 100}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
            </div>
          ))}
        </div>
      </div>
      <button className={roundBtn} onClick={onExpert} aria-label={expertLabel} title={expertLabel}>
        <IconHeadset className="h-5 w-5 text-mint" />
      </button>
      <button className={roundBtn} onClick={onMute} aria-label={muted ? t.aria.unmute : t.aria.mute} aria-pressed={muted}>
        {muted ? <IconMute className="h-5 w-5 text-white/60" /> : <IconSound className="h-5 w-5" />}
      </button>
    </motion.header>
  );
}
