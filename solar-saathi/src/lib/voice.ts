// Saathi's voice. Speaks a line, reports how much of the *display* text has
// been spoken (for the typing bubble) and exposes a 0..1 `level` that the
// mascot's mouth and chest equalizer read every frame.
//
// Order of preference:
//   1. The cloud voice for the language (free Edge voices for English and
//      Hindi; Odia only once an Azure or Sarvam key is set). A line is spoken
//      sentence by sentence: fixed sentences come pre-recorded from
//      /voice/{lang}/{id}.mp3 (instant), the rest from /api/tts. The first
//      sentence starts as soon as it is ready while the others load, and the
//      silence around each clip is trimmed so sentences flow naturally.
//      Played through Web Audio, so `level` follows the real waveform.
//   2. The browser's speechSynthesis voice for the language.
//   3. Silent: same timing and mouth movement, text only.
//
// `spoken` lets callers say something different from what is shown, e.g. a
// mobile number shown as "+91 98765 43210" but read digit by digit.

import { audioCtx } from "./audio";
import { bcpOf, type Lang } from "./i18n";
import { clipId, speakable, splitSentences, type VoiceManifest } from "./tts/clips";

type Listener = () => void;

const PREFERRED = /natural|neural|online|google|heera|neerja|swara|kalpana|lekha|aditi|ananya/i;
const FETCH_TIMEOUT_MS = 12000;

// Pause between sentences, after trimming each clip's own silence.
const gapAfter = (sentence: string) => (sentence.endsWith("?") ? 0.34 : 0.26);

class Voice {
  level = 0;
  // Spectral balance of the voice right now (0..1 each), used for lip shapes:
  // low ≈ round vowels (o/u), mid ≈ open/wide vowels (a/e/i), high ≈ s/f/sh.
  bands = { low: 0, mid: 0, high: 0 };
  speaking = false;
  muted = false;
  cloud: Partial<Record<Lang, boolean>> | null = null; // per language; null until /api/tts has been probed

  private subs = new Set<Listener>();
  private token = 0;
  private burst = 0;
  private raf = 0;
  private voices: SpeechSynthesisVoice[] = [];
  private analyser: AnalyserNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private probing: Promise<void> | null = null;
  private recorded: Partial<Record<Lang, Set<string>>> = {}; // pre-recorded clip ids per language
  private bytes = new Map<string, Promise<ArrayBuffer>>();
  private buffers = new Map<string, Promise<AudioBuffer>>();
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

  // Ask the server once which languages have a cloud voice, and load the list
  // of pre-recorded sentences made with that same voice. Safe before any tap.
  probe() {
    this.probing ??= (async () => {
      try {
        const [tts, manifest] = await Promise.all([
          fetch("/api/tts").then(
            (r) => r.json() as Promise<{ langs?: Partial<Record<Lang, boolean>>; voices?: Partial<Record<Lang, string>> }>,
          ),
          fetch("/voice/manifest.json")
            .then((r) => (r.ok ? (r.json() as Promise<VoiceManifest>) : null))
            .catch(() => null),
        ]);
        this.cloud = tts.langs ?? {};
        for (const [lang, spec] of Object.entries(tts.voices ?? {}) as [Lang, string][]) {
          if (manifest?.voices[lang] === spec) this.recorded[lang] = new Set(manifest.clips[lang] ?? []);
        }
      } catch {
        this.cloud = {};
      }
    })();
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
    return !!this.cloud?.[lang] || !!this.pickVoice(lang);
  }

  // Get a line ready. Every sentence starts loading; resolves once the first
  // one can play (callers keep "typing…" up until then).
  async prepare(text: string, lang: Lang) {
    if (this.muted) return;
    await this.probe();
    if (!this.cloud?.[lang]) return;
    const loads = splitSentences(speakable(text, lang)).map((s) => (audioCtx() ? this.clip(s, lang) : this.fetchBytes(s, lang)));
    loads.forEach((p) => p.catch(() => {}));
    await loads[0]?.catch(() => {}); // speak() falls back to the browser voice
  }

  prefetch(text: string, lang: Lang) {
    void this.prepare(text, lang);
  }

  async speak(text: string, lang: Lang, onProgress?: (chars: number) => void, spoken?: string): Promise<void> {
    this.stop();
    const token = ++this.token;
    // The words actually voiced: brand names respelled so they sound right.
    const say = speakable(spoken ?? text, lang);

    if (!this.muted) {
      await this.probe();
      if (token !== this.token) return;
      const sentences = splitSentences(say);
      if (this.cloud?.[lang] && sentences.length && audioCtx()) {
        const clips = sentences.map((s) => this.clip(s, lang).catch(() => null));
        const first = await clips[0];
        if (token !== this.token) return;
        if (first) return this.playClips(sentences, clips, text, say, token, onProgress, estimateMs(text, lang) / 1000);
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
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* not started or already stopped */
      }
    }
    this.sources = [];
    this.analyser = null;
    if (this.speaking) {
      this.speaking = false;
      this.emit();
    }
  }

  // One sentence's MP3: the pre-recorded file when there is one, else /api/tts.
  private fetchBytes(sentence: string, lang: Lang) {
    const key = `${lang}|${sentence}`;
    let p = this.bytes.get(key);
    if (!p) {
      const id = clipId(sentence);
      const live = () =>
        fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sentence, lang }),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        }).then((res) => {
          if (!res.ok) throw new Error(`tts ${res.status}`);
          return res.arrayBuffer();
        });
      p = this.recorded[lang]?.has(id)
        ? fetch(`/voice/${lang}/${id}.mp3`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
            .then((res) => (res.ok ? res.arrayBuffer() : live()))
            .catch(live)
        : live();
      p.catch(() => this.bytes.delete(key)); // allow a retry later
      this.bytes.set(key, p);
    }
    return p;
  }

  // Decoded, silence-trimmed clip for one sentence (cached).
  private clip(sentence: string, lang: Lang) {
    const key = `${lang}|${sentence}`;
    let p = this.buffers.get(key);
    if (!p) {
      const ctx = audioCtx();
      if (!ctx) return Promise.reject(new Error("audio locked"));
      // decodeAudioData detaches its input, so decode a copy of the cached bytes.
      p = this.fetchBytes(sentence, lang)
        .then((b) => ctx.decodeAudioData(b.slice(0)))
        .then((buf) => trimSilence(ctx, buf));
      p.catch(() => this.buffers.delete(key));
      this.buffers.set(key, p);
    }
    return p;
  }

  // Plays the sentences back to back on the audio clock. Each one is queued
  // as soon as it has loaded; a sentence that fails to load is skipped.
  // `textSec`: natural reading time of the shown text. When the voice says
  // more than is shown (a short caption over a long spoken summary), the
  // caption types at its own pace instead of crawling for the whole line.
  private playClips(
    sentences: string[],
    clips: Promise<AudioBuffer | null>[],
    text: string,
    say: string,
    token: number,
    onProgress?: (n: number) => void,
    textSec = Infinity,
  ) {
    const ctx = audioCtx()!;
    void ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.35;
    analyser.connect(ctx.destination);
    this.analyser = analyser;
    this.sources = [];
    this.speaking = true;
    this.emit();
    this.loop();

    const total = sentences.reduce((n, s) => n + s.length, 0) || 1;
    const sameText = text === say;
    const timeline: { start: number; end: number; c0: number; c1: number }[] = [];
    let cursor = ctx.currentTime + 0.03;
    let queued = false; // every sentence has been placed on the timeline (or skipped)

    void (async () => {
      let chars = 0;
      for (let i = 0; i < sentences.length; i++) {
        const buf = await clips[i];
        if (token !== this.token) return;
        const c0 = chars;
        chars += sentences[i].length;
        if (!buf) continue;
        const start = Math.max(cursor, ctx.currentTime + 0.03);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(analyser);
        src.start(start);
        this.sources.push(src);
        timeline.push({ start, end: start + buf.duration, c0, c1: chars });
        cursor = start + buf.duration + gapAfter(sentences[i]);
      }
      queued = true;
    })();

    return new Promise<void>((resolve) => {
      const w0 = performance.now();
      let lastClock = ctx.currentTime;
      let stalledSince = 0;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (token === this.token) {
          this.speaking = false;
          this.analyser = null;
          this.sources = [];
          onProgress?.(text.length);
          this.emit();
        }
        resolve();
      };
      const tick = () => {
        if (done) return;
        if (token !== this.token) return finish();
        const now = ctx.currentTime;
        let said = 0;
        for (const s of timeline) {
          if (now >= s.end) said = s.c1;
          else if (now > s.start) said = s.c0 + ((s.c1 - s.c0) * (now - s.start)) / (s.end - s.start);
        }
        const p = sameText ? said / total : (performance.now() - w0) / 1000 / textSec;
        onProgress?.(Math.floor(Math.min(1, p) * text.length));
        const last = timeline[timeline.length - 1];
        if (queued && (!last || now >= last.end)) return finish();
        // If the device pauses audio (app switch, Bluetooth change) the clock
        // stops; don't hang the conversation on it.
        if (now !== lastClock) {
          lastClock = now;
          stalledSince = 0;
        } else if (!stalledSince) stalledSince = performance.now();
        else if (performance.now() - stalledSince > 3000) return finish();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
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

// Cuts the silence a TTS clip carries at both ends (keeps a few ms so
// consonants aren't clipped). Pauses between sentences are added on playback.
function trimSilence(ctx: BaseAudioContext, buf: AudioBuffer) {
  const data = buf.getChannelData(0);
  const floor = 0.012;
  let a = 0;
  let b = data.length - 1;
  while (a < b && Math.abs(data[a]) < floor) a++;
  while (b > a && Math.abs(data[b]) < floor) b--;
  a = Math.max(0, a - Math.round(buf.sampleRate * 0.03));
  b = Math.min(data.length - 1, b + Math.round(buf.sampleRate * 0.09));
  if (b - a < buf.sampleRate * 0.1) return buf; // nearly silent: leave as is
  const out = ctx.createBuffer(buf.numberOfChannels, b - a + 1, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) out.copyToChannel(buf.getChannelData(ch).subarray(a, b + 1), ch);
  return out;
}

// Rough speaking time; Indic scripts pack more sound per character.
function estimateMs(text: string, lang: Lang) {
  const perChar = lang === "en" ? 64 : 80;
  return Math.max(900, text.length * perChar + 250);
}

export const voice = new Voice();
