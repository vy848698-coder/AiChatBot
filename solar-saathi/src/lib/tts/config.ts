// Server only: which engine, voice and speed Saathi uses for each language.
//
// Set in .env.local as TTS_EN / TTS_HI / TTS_OR = "engine:voice[:rate]",
// e.g. TTS_HI=edge:hi-IN-MadhurNeural:+30 (the Voice Lab prints these lines).
// Without them: English and Hindi use the free Edge voices picked in the lab;
// Odia uses Azure or Sarvam if a key is set, otherwise the browser's voice.

import type { Lang } from "../i18n";
import { findVoice, type Engine } from "./catalog";
import { engineReady } from "./engines";

export type VoiceChoice = { engine: Engine; voice: string; rate: number };

// "edge:hi-IN-MadhurNeural:30": identifies a voice, so pre-recorded clips
// made with a different voice or speed are never mixed in.
export const specOf = (c: VoiceChoice) => `${c.engine}:${c.voice}:${c.rate}`;

const DEFAULTS: Record<Lang, string[]> = {
  en: ["edge:en-IN-PrabhatNeural:+30"],
  hi: ["edge:hi-IN-MadhurNeural:+30"],
  or: ["azure:or-IN-SukantNeural", `sarvam:${process.env.SARVAM_SPEAKER || "shubh"}`],
};

function parse(spec: string, lang: Lang): VoiceChoice | null {
  const [engine, voice, rate = "0"] = spec.trim().split(":");
  const r = Number(rate);
  if (!findVoice(engine as Engine, lang, voice) || !Number.isFinite(r)) return null;
  return { engine: engine as Engine, voice, rate: Math.max(-30, Math.min(30, r)) };
}

const warned = new Set<string>();

export function voiceFor(lang: Lang): VoiceChoice | null {
  const own = process.env[`TTS_${lang.toUpperCase()}`]?.trim();
  if (own) {
    const choice = parse(own, lang);
    if (choice && engineReady(choice.engine)) return choice;
    if (!warned.has(lang)) {
      warned.add(lang);
      console.warn(`[tts] TTS_${lang.toUpperCase()}="${own}" is not usable (unknown voice or missing key); using the default`);
    }
  }
  for (const spec of DEFAULTS[lang]) {
    const choice = parse(spec, lang);
    if (choice && engineReady(choice.engine)) return choice;
  }
  return null;
}
