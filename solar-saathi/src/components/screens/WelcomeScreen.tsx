"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LANGS, WELCOME, type Lang } from "@/lib/i18n";
import type { MascotMood } from "../mascot/Mascot";
import { Saathi } from "../mascot/Saathi";
import { SpeechBubble, type Bubble } from "../SpeechBubble";
import { WelcomeScene } from "../welcome/WelcomeScene";
import { IconCheck, IconMute, IconSound } from "../ui/icons";

// First page, kept deliberately simple: the landscape, Saathi and one button.
// Saathi flies in, waves and says hello (silently, with text: browsers allow
// no sound before a tap). On tap he steps forward, the scene dims, he greets
// the user aloud and the three language choices appear.
export function WelcomeScreen({
  started,
  picked,
  mood,
  bubble,
  speaking,
  voiceNote,
  muted,
  hearHint,
  onStart,
  onPick,
  onMute,
}: {
  started: boolean;
  picked: Lang | null;
  mood: MascotMood;
  bubble: Bubble | null;
  speaking: boolean;
  voiceNote: string | null;
  muted: boolean;
  hearHint: boolean;
  onStart: () => void;
  onPick: (l: Lang) => void;
  onMute: () => void;
}) {
  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={{ "--mw": "min(80vw, 360px, 46dvh)", "--mb": "112px" } as CSSProperties}
    >
      <WelcomeScene focus={started} />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-end px-5 pt-[max(16px,env(safe-area-inset-top))] lg:px-10 lg:pt-7">
        {started && (
          <button
            onClick={onMute}
            aria-label={muted ? "Turn voice on" : "Mute voice"}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/30 text-white/85 backdrop-blur"
          >
            {muted ? <IconMute className="h-5 w-5" /> : <IconSound className="h-5 w-5" />}
          </button>
        )}
      </header>

      {/* sound is blocked until the first tap: invite one */}
      <AnimatePresence>
        {hearHint && (
          <motion.div
            key="hear"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none absolute inset-x-0 top-[max(18px,env(safe-area-inset-top))] z-40 flex justify-center lg:top-7"
          >
            <span className="flex items-center gap-2 rounded-full border border-brand/40 bg-[#0d151a]/85 py-2 pr-4 pl-2 text-[13.5px] font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,.4)] backdrop-blur">
              <span className="relative grid h-7 w-7 place-items-center rounded-full bg-brand text-night">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand/60" />
                <IconSound className="relative h-4 w-4" />
              </span>
              Tap anywhere to hear Saathi
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saathi */}
      <motion.div
        className="absolute bottom-[var(--mb)] left-1/2 z-20 w-[var(--mw)] -translate-x-1/2 lg:bottom-[11%] lg:w-[min(30vw,420px,58dvh)]"
        style={{ transformOrigin: "50% 100%" }}
        initial={{ opacity: 0, scale: 0.18, y: "-60%" }}
        animate={{ opacity: 1, scale: started ? 1.1 : 1, y: 0 }}
        transition={started ? { type: "spring", stiffness: 120, damping: 16 } : { delay: 0.6, type: "spring", stiffness: 70, damping: 13 }}
      >
        <Saathi mood={mood} />
      </motion.div>

      {/* speech bubble: above Saathi on phones, beside him on desktop */}
      <AnimatePresence>
        {bubble && (
          <div
            key="bubble"
            className="absolute inset-x-4 bottom-[calc(var(--mb)_+_var(--mw)_*_1.3)] z-30 flex justify-center lg:inset-x-auto lg:top-[20%] lg:bottom-auto lg:left-[calc(50%_+_min(14vw,200px))] lg:w-[min(30vw,400px)]"
          >
            <SpeechBubble key={bubble.key} bubble={bubble} speaking={speaking} tail="adaptive" note={voiceNote} className="w-full max-w-[400px]" />
          </div>
        )}
      </AnimatePresence>

      {/* the one action */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-[max(22px,env(safe-area-inset-bottom))] lg:pb-10">
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
              transition={{ delay: 1.6, type: "spring", stiffness: 160, damping: 18 }}
              className="relative mx-auto w-full max-w-[360px]"
            >
              <span aria-hidden className="pulse-ring absolute inset-0 rounded-full border-2 border-brand/60" />
              <button
                data-start
                onClick={onStart}
                className="btn-primary relative flex h-[60px] w-full items-center justify-center gap-3 rounded-full text-[18px] font-bold"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-night/90 text-brand">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor">
                    <path d="M8 5.5v13l10.5-6.5z" />
                  </svg>
                </span>
                {WELCOME.cta}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="langs"
              role="radiogroup"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
              className="mx-auto grid w-full max-w-[440px] grid-cols-3 gap-2.5"
            >
              {LANGS.map((l) => {
                const active = picked === l.code;
                return (
                  <motion.button
                    key={l.code}
                    role="radio"
                    aria-checked={active}
                    disabled={picked !== null}
                    onClick={() => onPick(l.code)}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    animate={{ opacity: picked && !active ? 0.4 : 1, scale: active ? 1.05 : 1 }}
                    whileTap={picked ? undefined : { scale: 0.95 }}
                    className={`relative flex h-[68px] flex-col items-center justify-center rounded-2xl border backdrop-blur-md transition-colors ${
                      active ? "border-brand bg-brand/20" : "border-white/15 bg-[#0d1418]/75 hover:border-gold/50"
                    }`}
                  >
                    <span lang={l.code} className="text-[19px] leading-tight font-bold">
                      {l.native}
                    </span>
                    <span className="mt-0.5 text-[11px] text-ink-3">{l.english}</span>
                    {active && (
                      <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-night">
                        <IconCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
