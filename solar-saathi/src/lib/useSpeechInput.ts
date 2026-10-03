"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { bcpOf, type Lang } from "./i18n";
import { voice } from "./voice";

// Minimal typing for the (still prefixed in Chrome/Safari) Web Speech API.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

export function useSpeechInput(lang: Lang) {
  const supported = useSyncExternalStore(noop, () => !!getCtor(), () => false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(
    (onText: (text: string, final: boolean) => void) => {
      const C = getCtor();
      if (!C) return;
      voice.stop(); // never record Saathi's own voice
      rec.current?.stop();
      const r = new C();
      r.lang = bcpOf(lang);
      r.interimResults = true;
      r.continuous = false;
      r.maxAlternatives = 1;
      r.onresult = (e) => {
        let text = "";
        let final = false;
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
          final = e.results[i].isFinal;
        }
        onText(text.trim(), final);
      };
      r.onend = () => setListening(false);
      r.onerror = () => setListening(false);
      try {
        r.start();
        rec.current = r;
        setListening(true);
      } catch {
        setListening(false);
      }
    },
    [lang],
  );

  return { supported, listening, start, stop };
}
