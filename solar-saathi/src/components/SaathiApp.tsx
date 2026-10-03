"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { tryStartAudio, unlockAudio } from "@/lib/audio";
import { LANGS, STRINGS, WELCOME, type Lang } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { voice } from "@/lib/voice";
import { WelcomeScene } from "./welcome/WelcomeScene";
import type { MascotMood } from "./mascot/Mascot";
import type { Bubble } from "./SpeechBubble";
import { FlowScreen, type Speak } from "./screens/FlowScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

type Screen = "welcome" | "flow";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SaathiApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [started, setStarted] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [picked, setPicked] = useState<Lang | null>(null);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [muted, setMuted] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [flowKey, setFlowKey] = useState(0);
  const [needsTap, setNeedsTap] = useState(false); // sound blocked until the first tap
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const notedLangs = useRef(new Set<Lang>());

  const speaking = useSyncExternalStore(voice.subscribe, () => voice.speaking, () => false);

  // Tell the user once per language when the device can't speak it.
  const checkVoice = useCallback((l: Lang) => {
    if (voice.muted || voice.hasVoice(l) || notedLangs.current.has(l)) return;
    notedLangs.current.add(l);
    setVoiceNote(STRINGS[l].voiceMissing);
  }, []);

  const speakIn = useCallback(
    (l: Lang, text: string, opts: Parameters<Speak>[1] = {}) => {
      checkVoice(l);
      return voice.speak(text, l, opts.onProgress, opts.spoken);
    },
    [checkVoice],
  );
  const speak: Speak = useCallback((text, opts) => speakIn(lang, text, opts), [speakIn, lang]);

  // Welcome-page bubble: types along with the voice.
  const sayOnWelcome = useCallback(
    (text: string, l: Lang) => {
      const key = performance.now();
      setBubble({ key, text, shown: 0, lang: l });
      return speakIn(l, text, { onProgress: (shown) => setBubble((b) => (b && b.key === key ? { ...b, shown } : b)) });
    },
    [speakIn],
  );

  const flashMood = useCallback((m: MascotMood, ms: number) => {
    clearTimeout(moodTimer.current);
    setMood(m);
    moodTimer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  useEffect(() => {
    document.documentElement.lang = picked ?? "en";
  }, [picked]);

  // Preload the greeting and the language replies while the sunrise plays.
  useEffect(() => {
    voice.prefetch(WELCOME.intro, "en");
    voice.prefetch(WELCOME.greet, "en");
    LANGS.forEach((l) => voice.prefetch(STRINGS[l.code].langChosen, l.code));
  }, []);

  // Saathi lands, waves and says hello. Aloud if the browser allows sound
  // without a tap; otherwise he mouths it and the first tap anywhere makes
  // him say it aloud from the start.
  useEffect(() => {
    let cancelled = false;
    const wave = setTimeout(() => flashMood("wave", 2400), 1900);
    const hello = setTimeout(async () => {
      const canPlay = await tryStartAudio();
      if (cancelled) return;
      if (canPlay) {
        voice.unlock();
        void sayOnWelcome(WELCOME.intro, "en");
        return;
      }
      setNeedsTap(true);
      const key = performance.now();
      setBubble({ key, text: WELCOME.intro, shown: 0, lang: "en" });
      void voice.mime(WELCOME.intro, "en", (shown) => setBubble((b) => (b && b.key === key ? { ...b, shown } : b)));
    }, 2600);
    return () => {
      cancelled = true;
      clearTimeout(wave);
      clearTimeout(hello);
    };
  }, [flashMood, sayOnWelcome]);

  // First tap anywhere: unlock sound and let Saathi say his hello aloud.
  // (A tap on "Meet Solar Saathi" goes straight to the greeting instead.)
  useEffect(() => {
    if (!needsTap) return;
    const onFirstTap = (e: Event) => {
      setNeedsTap(false);
      unlockAudio();
      voice.unlock();
      if ((e.target as Element | null)?.closest?.("[data-start]")) return;
      flashMood("wave", 1800);
      void sayOnWelcome(WELCOME.intro, "en");
    };
    addEventListener("pointerdown", onFirstTap, { capture: true, once: true });
    addEventListener("keydown", onFirstTap, { capture: true, once: true });
    return () => {
      removeEventListener("pointerdown", onFirstTap, { capture: true });
      removeEventListener("keydown", onFirstTap, { capture: true });
    };
  }, [needsTap, flashMood, sayOnWelcome]);

  useEffect(() => {
    const onHide = () => document.hidden && voice.stop();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const go = (s: Screen) => {
    voice.stop();
    clearTimeout(moodTimer.current);
    setMood("idle");
    setBubble(null);
    setVoiceNote(null);
    setScreen(s);
  };

  const start = () => {
    setNeedsTap(false);
    unlockAudio(); // inside the tap, so iOS allows sound
    voice.unlock();
    sfx.start();
    setStarted(true);
    flashMood("wave", 2300);
    setTimeout(() => void sayOnWelcome(WELCOME.greet, "en"), 450);
  };

  const pick = async (l: Lang) => {
    sfx.select();
    setPicked(l);
    setLang(l);
    flashMood("happy", 1800);
    voice.prefetch(STRINGS[l].chat.askName, l);
    await Promise.all([Promise.race([sayOnWelcome(STRINGS[l].langChosen, l), wait(5000)]), wait(1300)]);
    setFlowKey((k) => k + 1); // a fresh journey every time
    go("flow");
  };

  // Back from the first question returns to the language choice.
  const exitFlow = () => {
    setPicked(null);
    go("welcome");
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    voice.setMuted(m);
    sfx.setMuted(m);
    if (m) {
      setBubble((b) => (b ? { ...b, shown: b.text.length } : b));
      setVoiceNote(null);
    }
  };


  return (
    <main className="relative min-h-dvh overflow-x-hidden">

      <AnimatePresence mode="wait">
        {screen === "welcome" ? (
          <motion.div key="welcome" className="relative z-10" exit={{ opacity: 0, transition: { duration: 0.25 } }}>
            <WelcomeScreen
              started={started}
              picked={picked}
              mood={mood}
              bubble={bubble}
              speaking={speaking}
              voiceNote={voiceNote}
              muted={muted}
              hearHint={needsTap && !started}
              onStart={start}
              onPick={pick}
              onMute={toggleMute}
            />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex h-dvh flex-col"
          >
            <WelcomeScene focus calm />
            <FlowScreen
              key={flowKey}
              lang={lang}
              speak={speak}
              mood={mood}
              setMood={setMood}
              voiceNote={voiceNote}
              muted={muted}
              onMute={toggleMute}
              onExit={exitFlow}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
