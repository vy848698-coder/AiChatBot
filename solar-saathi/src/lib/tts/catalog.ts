// Every voice Saathi can speak with, per engine and language. Safe to import
// on the client (no keys here); the server code lives in ./engines.ts.
//
// The script is written in a male voice (Hindi "करूँगा"), so male voices come
// first. Female voices are listed for comparison only.

import type { Lang } from "../i18n";

export type Engine = "edge" | "azure" | "sarvam";
export type VoiceOption = { id: string; label: string; male: boolean };

type EngineInfo = {
  name: string;
  cost: string;
  needs: string | null; // env vars to set, or null when it works without setup
  voices: Partial<Record<Lang, VoiceOption[]>>;
};

const MS_EN = [
  { id: "en-IN-PrabhatNeural", label: "Prabhat", male: true },
  { id: "en-IN-NeerjaNeural", label: "Neerja", male: false },
];
const MS_HI = [
  { id: "hi-IN-MadhurNeural", label: "Madhur", male: true },
  { id: "hi-IN-SwaraNeural", label: "Swara", male: false },
];
const SARVAM = [
  { id: "shubh", label: "Shubh", male: true },
  { id: "aditya", label: "Aditya", male: true },
  { id: "kabir", label: "Kabir", male: true },
  { id: "priya", label: "Priya", male: false },
];

export const ENGINES: Record<Engine, EngineInfo> = {
  edge: {
    name: "Microsoft Edge voices",
    cost: "Free, no sign-up",
    needs: null,
    voices: { en: MS_EN, hi: MS_HI }, // Edge's free list has no Odia voice
  },
  azure: {
    name: "Azure Speech",
    cost: "Free tier: 5 lakh characters / month",
    needs: "AZURE_SPEECH_KEY + AZURE_SPEECH_REGION",
    voices: {
      en: MS_EN,
      hi: MS_HI,
      or: [
        { id: "or-IN-SukantNeural", label: "Sukant", male: true },
        { id: "or-IN-SubhasiniNeural", label: "Subhasini", male: false },
      ],
    },
  },
  sarvam: {
    name: "Sarvam Bulbul v3",
    cost: "Uses Sarvam credits",
    needs: "SARVAM_API_KEY",
    voices: { en: SARVAM, hi: SARVAM, or: SARVAM },
  },
};

export const ENGINE_IDS = Object.keys(ENGINES) as Engine[];

export const findVoice = (engine: Engine, lang: Lang, id: string) =>
  ENGINES[engine]?.voices[lang]?.find((v) => v.id === id) ?? null;
