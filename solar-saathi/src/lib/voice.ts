// Saathi's voice. Speaks a line, reports how much of the *display* text has
// been spoken (for the typing bubble) and exposes a 0..1 `level` that the
// mascot's mouth and chest equalizer read every frame.
//
// Order of preference:
//   1. Sarvam AI (Bulbul v3) through /api/tts: natural Odia/Hindi/English.
//      Played through Web Audio, so `level` follows the real waveform.
//   2. The browser's speechSynthesis voice for the language.
//   3. Silent: same timing and mouth movement, text only.
//
// `spoken` lets callers say something different from what is shown, e.g. a
// mobile number shown as "+91 98765 43210" but read digit by digit.

import { audioCtx } from "./audio";
import { bcpOf, type Lang } from "./i18n";

type Listener = () => void;

const PREFERRED = /natural|neural|online|google|heera|neerja|swara|kalpana|lekha|aditi|ananya/i;

class Voice {
  level = 0;
  // Spectral balance of the voice right now (0..1 each), used for lip shapes:
  // low ≈ round vowels (o/u), mid ≈ open/wide vowels (a/e/i), high ≈ s/f/sh.
  bands = { low: 0, mid: 0, high: 0 };
  speaking = false;
  muted = false;
  cloud: boolean | null = null; // null until /api/tts has been probed

  private subs = new Set<Listener>();
  private token = 0;
  private burst = 0;
  private raf = 0;
  private voices: SpeechSynthesisVoice[] = [];
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private probing: Promise<void> | null = null;
  private bytes = new Map<string, Promise<ArrayBuffer>>();
  private buffers = new Map<string, AudioBuffer>();
  private wave = new Float32Array(1024);
  private freq = new Uint8Array(512);

  constructor() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => (this.voices = window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
  }

  subscribe = (fn: Listener) => {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  };

  private emit() {
    this.subs.forEach((fn) => fn());
  }

  // Call inside the first tap: iOS only lets speech start from a user gesture.
  unlock() {
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* no browser speech */
    }
    void this.probe();
  }

  // Ask the server once whether Sarvam is configured. Safe before any tap.
  probe() {
    this.probing ??= fetch("/api/tts")
      .then((r) => r.json())
      .then((j: { enabled?: boolean }) => void (this.cloud = !!j.enabled))
      .catch(() => void (this.cloud = false));
    return this.probing;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (m) this.stop();
  }

  pickVoice(lang: Lang): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    if (!this.voices.length) this.voices = window.speechSynthesis.getVoices();
    const want = bcpOf(lang).toLowerCase();
    const norm = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
    let pool = this.voices.filter((v) => norm(v) === want);
    if (!pool.length) pool = this.voices.filter((v) => norm(v).startsWith(lang + "-"));
    if (!pool.length && lang === "en") pool = this.voices.filter((v) => norm(v).startsWith("en"));
    if (!pool.length) return null;
    return [...pool].sort((a, b) => score(b) - score(a))[0];
  }

  hasVoice(lang: Lang) {
    return this.cloud === true || !!this.pickVoice(lang);
  }

  // Get a line's audio ready (download, and decode once audio is unlocked).
  // Resolves either way; callers use it to keep "typing…" up until then.
  async prepare(text: string, lang: Lang) {
    if (this.muted) return;
    await this.probe();
    if (!this.cloud) return;
    try {
      if (audioCtx()) await this.cloudBuffer(text, lang);
      else await this.fetchBytes(text, lang);
    } catch {
      /* speak() falls back to the browser voice */
    }
  }

  prefetch(text: string, lang: Lang) {
    void this.prepare(text, lang);
  }

  async speak(text: string, lang: Lang, onProgress?: (chars: number) => void, spoken?: string): Promise<void> {
    this.stop();
    const token = ++this.token;
    const say = spoken ?? text;

    if (!this.muted) {
      await this.probe();
      if (token !== this.token) return;
      if (this.cloud) {
        const buf = await this.cloudBuffer(say, lang).catch(() => null);
        if (token !== this.token) return;
        if (buf && audioCtx()) return this.playBuffer(buf, text, token, onProgress, estimateMs(text, lang) / 1000);
      }
    }
    return this.speakBrowser(text, say, lang, token, onProgress);
  }

  // Talk without sound: mouth, gestures and typing, no audio. Used before the
  // first tap, when browsers don't allow any sound yet.
  mime(text: string, lang: Lang, onProgress?: (chars: number) => void) {
    this.stop();
    return this.speakBrowser(text, text, lang, ++this.token, onProgress, true);
  }

  stop() {
    this.token++;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    this.source = null;
    this.analyser = null;
    if (this.speaking) {
      this.speaking = false;
      this.emit();
    }
  }

  private fetchBytes(text: string, lang: Lang) {
    const key = `${lang}|${text}`;
    let p = this.bytes.get(key);
    if (!p) {
      p = fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      }).then((res) => {
        if (!res.ok) throw new Error(`tts ${res.status}`);
        return res.arrayBuffer();
      });
      p.catch(() => this.bytes.delete(key)); // allow a retry later
      this.bytes.set(key, p);
    }
    return p;
  }

  private async cloudBuffer(text: string, lang: Lang) {
    const key = `${lang}|${text}`;
    const hit = this.buffers.get(key);
    if (hit) return hit;
    const ctx = audioCtx();
    if (!ctx) return null;
    // decodeAudioData detaches its input, so decode a copy of the cached bytes.
    const buf = await ctx.decodeAudioData((await this.fetchBytes(text, lang)).slice(0));
    this.buffers.set(key, buf);
    return buf;
  }

  // `textSec`: natural reading time of the shown text. When the voice says
  // more than is shown (e.g. a short caption over a long spoken summary),
  // the caption types at its own pace instead of crawling for the whole clip.
  private playBuffer(buf: AudioBuffer, text: string, token: number, onProgress?: (n: number) => void, textSec = Infinity) {
    const ctx = audioCtx()!;
    void ctx.resume();
    const src = ctx.createBufferSource();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.35;
    src.buffer = buf;
    src.connect(analyser).connect(ctx.destination);
    this.source = src;
    this.analyser = analyser;
    this.speaking = true;
    this.emit();
    this.loop();

    return new Promise<void>((resolve) => {
      const t0 = ctx.currentTime;
      const w0 = performance.now();
      const dur = Math.max(buf.duration - 0.15, 0.3);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (token === this.token) {
          this.speaking = false;
          this.analyser = null;
          this.source = null;
          onProgress?.(text.length);
          this.emit();
        }
        resolve();
      };
      const tick = () => {
        if (done) return;
        if (token !== this.token) return finish();
        // Follow the audio clock, with wall-clock time as a backstop: if the
        // device pauses audio (app switch, Bluetooth change) the words still
        // finish typing and the conversation moves on.
        const span = Math.min(dur, textSec);
        const pAudio = (ctx.currentTime - t0) / span;
        const pWall = ((performance.now() - w0) / 1000 / span) * 0.92;
        const p = Math.min(1, Math.max(pAudio, pWall));
        onProgress?.(Math.floor(p * text.length));
        if ((performance.now() - w0) / 1000 >= dur * 1.25) return finish();
        requestAnimationFrame(tick);
      };
      src.onended = finish;
      src.start();
      requestAnimationFrame(tick);
      setTimeout(finish, (dur * 1.5 + 2) * 1000);
    });
  }

  private speakBrowser(text: string, say: string, lang: Lang, token: number, onProgress?: (n: number) => void, silent = false) {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    const v = silent || this.muted || !synth ? null : this.pickVoice(lang);
    const est = estimateMs(say, lang);
    this.speaking = true;
    this.emit();
    this.loop();

    return new Promise<void>((resolve) => {
      let shown = 0;
      let done = false;
      const t0 = performance.now();
      const show = (n: number) => {
        if (n > shown) {
          shown = Math.min(text.length, n);
          onProgress?.(shown);
        }
      };
      const finish = () => {
        if (done) return;
        done = true;
        if (token === this.token) {
          this.speaking = false;
          onProgress?.(text.length);
          this.emit();
        }
        resolve();
      };
      // Time-based typing. With a real voice it runs a little slow and the
      // voice's word-boundary events pull it forward.
      const tick = () => {
        if (done) return;
        if (token !== this.token) return finish();
        const p = (performance.now() - t0) / (v ? est * 1.15 : est);
        show(Math.floor(Math.min(1, p) * text.length));
        if (!v && p >= 1) finish();
        else requestAnimationFrame(tick);
      };

      if (v && synth) {
        const u = new SpeechSynthesisUtterance(say);
        u.voice = v;
        u.lang = v.lang;
        u.rate = lang === "en" ? 1.0 : 0.95;
        u.pitch = 1.05;
        u.onboundary = (e) => {
          this.burst = 1;
          // Map the position in the spoken text back onto the display text.
          show(Math.round(((e.charIndex + (e.charLength || 0)) / say.length) * text.length));
        };
        u.onend = finish;
        u.onerror = finish;
        // Chrome drops an utterance queued in the same tick as cancel().
        setTimeout(() => token === this.token && synth.speak(u), 40);
        setTimeout(finish, est * 2.5 + 3000); // safety net if onend never fires
      }
      requestAnimationFrame(tick);
    });
  }

  // Mouth level: the real waveform when we have audio, otherwise a believable
  // envelope (~5 syllables a second, phrase swells, kicks on word boundaries).
  private loop() {
    if (this.raf) return;
    const frame = (now: number) => {
      let target = 0;
      let low = 0;
      let mid = 0;
      let high = 0;
      if (this.speaking && this.analyser) {
        this.analyser.getFloatTimeDomainData(this.wave);
        let sum = 0;
        for (let i = 0; i < this.wave.length; i++) sum += this.wave[i] * this.wave[i];
        target = Math.min(1, Math.sqrt(sum / this.wave.length) * 5.5);
        // Energy in three speech bands → which mouth shape fits this sound.
        this.analyser.getByteFrequencyData(this.freq);
        const hz = this.analyser.context.sampleRate / this.analyser.fftSize;
        const band = (a: number, b: number) => {
          const i0 = Math.max(1, Math.floor(a / hz));
          const i1 = Math.min(this.freq.length - 1, Math.ceil(b / hz));
          let e = 0;
          for (let i = i0; i <= i1; i++) e += this.freq[i];
          return e / ((i1 - i0 + 1) * 255);
        };
        low = band(150, 700);
        mid = band(700, 2200);
        high = band(3000, 8000) * 1.8;
      } else if (this.speaking) {
        const t = now / 1000;
        const syl = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 5.1);
        const phrase = 0.65 + 0.35 * Math.sin(t * Math.PI * 2 * 1.3 + 1);
        const jitter = 0.85 + Math.random() * 0.3;
        target = Math.min(1, (0.18 + 0.82 * syl * phrase) * jitter);
        // No audio to analyse: drift between vowel shapes at syllable pace.
        const v = 0.5 + 0.5 * Math.sin(t * 7.3 + Math.sin(t * 2.1) * 2);
        low = 0.25 + 0.35 * v;
        mid = 0.25 + 0.35 * (1 - v);
        high = Math.max(0, Math.sin(t * 3.1)) * 0.25;
      }
      const b = this.bands;
      b.low += (low - b.low) * 0.4;
      b.mid += (mid - b.mid) * 0.4;
      b.high += (high - b.high) * 0.4;
      this.burst *= 0.88;
      const goal = Math.max(target, this.burst * 0.9);
      this.level += (goal - this.level) * (goal > this.level ? 0.45 : 0.25);
      if (!this.speaking && this.level < 0.01) {
        this.level = 0;
        this.raf = 0;
        return;
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
}

function score(v: SpeechSynthesisVoice) {
  return (PREFERRED.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
}

// Rough speaking time; Indic scripts pack more sound per character.
function estimateMs(text: string, lang: Lang) {
  const perChar = lang === "en" ? 64 : 80;
  return Math.max(900, text.length * perChar + 250);
}

export const voice = new Voice();
