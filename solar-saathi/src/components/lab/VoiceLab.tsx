"use client";

// Voice Lab (/voice-lab): hear every free and paid voice in Odia, Hindi and
// English with Saathi's real lines, pick one per language, and check that the
// browser can understand each language from the mic. Nothing runs on this
// machine except the browser; all voices are made in the cloud.

import { useEffect, useRef, useState } from "react";
import { FLOW } from "@/lib/flowCopy";
import { LANGS, STRINGS, bcpOf, type Lang } from "@/lib/i18n";
import { spokenMobile, spokenRupees } from "@/lib/speech";
import { ENGINES, ENGINE_IDS, type Engine } from "@/lib/tts/catalog";

type Pick = { engine: Engine; voice: string; rate?: number };
type Picks = Partial<Record<Lang, Pick>>;

const PICKS_KEY = "voiceLab.picks";
const NAME: Record<Lang, string> = { en: "Rahul", hi: "राहुल", or: "ରାହୁଲ" };

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);

function samples(lang: Lang) {
  const s = STRINGS[lang];
  const f = FLOW[lang];
  const rs = (n: number) => spokenRupees(n, lang);
  return [
    { label: "Language chosen", text: s.langChosen },
    { label: "Ask name", text: s.chat.askName },
    { label: "OTP (digits)", text: fill(f.otp.ask, { mobile: spokenMobile("9876543210") }) },
    { label: "Bill question", text: f.bill.ask },
    {
      label: "Solar plan (numbers)",
      text: fill(f.result.say, {
        first: NAME[lang],
        kw: "3",
        cost: rs(180000),
        subsidy: rs(78000),
        invest: rs(102000),
        monthly: rs(2400),
        life: rs(720000),
      }),
    },
  ];
}

// What to read aloud in the mic test.
const READ_ALOUD: Record<Lang, string> = {
  or: "ମୋ ନାମ ରାହୁଲ ମହାନ୍ତି। ମୋ ମାସିକ ବିଜୁଳି ବିଲ୍ ଦୁଇ ହଜାର ଟଙ୍କା।",
  hi: "मेरा नाम राहुल है, और मेरा बिजली का बिल दो हज़ार रुपये आता है।",
  en: "My name is Rahul Mohanty and my PIN code is 7 5 1 0 2 4.",
};

function loadPicks(): Picks {
  try {
    return JSON.parse(localStorage.getItem(PICKS_KEY) ?? "{}") as Picks;
  } catch {
    return {};
  }
}

export default function VoiceLab() {
  const [lang, setLang] = useState<Lang>("or");
  const [text, setText] = useState(() => samples("or")[0].text);
  const [rate, setRate] = useState(0);
  const [ready, setReady] = useState<Partial<Record<Engine, boolean>>>({});
  const [picks, setPicks] = useState<Picks>(loadPicks);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/voice-lab")
      .then((r) => r.json())
      .then((j: { engines?: Record<Engine, { ready: boolean }> }) =>
        setReady(Object.fromEntries(Object.entries(j.engines ?? {}).map(([k, v]) => [k, v.ready]))),
      )
      .catch(() => setReady({}));
  }, []);

  const chooseLang = (l: Lang) => {
    setLang(l);
    setText(samples(l)[0].text);
  };

  const onAudio = (a: HTMLAudioElement) => {
    audio.current = a;
  };

  const stopAll = () => {
    audio.current?.pause();
    window.speechSynthesis?.cancel();
  };

  const pick = (p: Pick) => {
    const next = { ...picks, [lang]: p };
    setPicks(next);
    try {
      localStorage.setItem(PICKS_KEY, JSON.stringify(next));
    } catch {
      /* picks just won't be remembered */
    }
  };

  const engines = ENGINE_IDS.filter((e) => ENGINES[e].voices[lang]?.length);
  const missing = ENGINE_IDS.filter((e) => !ENGINES[e].voices[lang]?.length);

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 pb-24 pt-8">
      <h1 className="font-display text-3xl font-semibold">
        <span className="text-gradient">Voice Lab</span>
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        Step 1 of the voice work. Hear each voice say Saathi&apos;s real lines, pick the best one per language, then
        check that the mic understands you. Use Chrome or Edge.
      </p>

      <div className="sticky top-0 z-10 -mx-4 mt-6 flex gap-2 bg-night/90 px-4 py-3 backdrop-blur">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => chooseLang(l.code)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              lang === l.code ? "btn-primary" : "glass text-ink-2"
            }`}
          >
            {l.native} {picks[l.code] ? "✓" : ""}
          </button>
        ))}
      </div>

      <section className="mt-4">
        <h2 className="font-display text-xl font-semibold">1 · Hear Saathi</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {samples(lang).map((s) => (
            <button
              key={s.label}
              onClick={() => setText(s.text)}
              className={`rounded-full px-3 py-1 text-xs ${text === s.text ? "bg-brand/25 text-mint" : "glass text-ink-2"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={600}
          className="glass mt-3 w-full rounded-2xl p-3 text-base outline-none focus:border-brand/60"
        />
        <label className="mt-2 flex items-center gap-3 text-sm text-ink-2">
          Speed
          <input
            type="range"
            min={-30}
            max={30}
            step={5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-40 accent-brand"
          />
          <span className="w-12 tabular-nums">{rate > 0 ? `+${rate}` : rate}%</span>
        </label>

        <div className="mt-4 grid gap-3">
          {engines.map((e) => (
            <EngineCard
              key={`${e}-${lang}`}
              engine={e}
              lang={lang}
              text={text}
              rate={rate}
              ready={ready[e]}
              picked={picks[lang]?.engine === e ? picks[lang]!.voice : null}
              onPick={(voice) => pick({ engine: e, voice, rate })}
              onAudio={onAudio}
              stopAll={stopAll}
            />
          ))}
          <BrowserVoiceCard lang={lang} text={text} stopAll={stopAll} />
          {missing.map((e) => (
            <p key={e} className="px-1 text-xs text-ink-3">
              {ENGINES[e].name}: no {LANGS.find((l) => l.code === lang)!.english} voice.
            </p>
          ))}
        </div>
      </section>

      <MicTest key={lang} lang={lang} stopAll={stopAll} />

      <section className="glass mt-8 rounded-2xl p-4">
        <h2 className="font-display text-lg font-semibold">Your picks</h2>
        <p className="mt-1 text-xs text-ink-3">Saathi already uses Prabhat (English) and Madhur (Hindi) at +30%. To change a voice, paste its line into .env.local and restart the dev server.</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-3 text-sm text-mint">
          {LANGS.map((l) => {
            const p = picks[l.code];
            const r = p?.rate ? `:${p.rate > 0 ? "+" : ""}${p.rate}` : "";
            return `TTS_${l.code.toUpperCase()}=${p ? `${p.engine}:${p.voice}${r}` : "   # not picked yet"}`;
          }).join("\n")}
        </pre>
      </section>
    </main>
  );
}

type CardProps = {
  engine: Engine;
  lang: Lang;
  text: string;
  rate: number;
  ready: boolean | undefined;
  picked: string | null;
  onPick: (voice: string) => void;
  onAudio: (a: HTMLAudioElement) => void;
  stopAll: () => void;
};

function EngineCard({ engine, lang, text, rate, ready, picked, onPick, onAudio, stopAll }: CardProps) {
  const info = ENGINES[engine];
  const voices = info.voices[lang]!;
  const [voice, setVoice] = useState(picked ?? voices[0].id);
  const [state, setState] = useState<{ busy: boolean; ms?: number; error?: string }>({ busy: false });

  const play = async () => {
    stopAll();
    setState({ busy: true });
    try {
      const res = await fetch("/api/voice-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine, voice, lang, text, rate }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${res.status}`);
      const ms = Number(res.headers.get("X-Synth-Ms")) || undefined;
      const a = new Audio(URL.createObjectURL(await res.blob()));
      onAudio(a);
      await a.play();
      setState({ busy: false, ms });
    } catch (err) {
      setState({ busy: false, error: (err as Error).message });
    }
  };

  return (
    <div className={`glass rounded-2xl p-4 ${picked ? "border-brand/60" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{info.name}</h3>
        <span className="text-xs text-ink-3">{info.cost}</span>
      </div>
      {ready === false ? (
        <p className="mt-2 text-sm text-gold">Not set up. Add {info.needs} to .env.local and restart the dev server.</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="glass rounded-xl px-3 py-2 text-sm outline-none"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id} className="bg-night">
                {v.label} ({v.male ? "male" : "female"})
              </option>
            ))}
          </select>
          <button onClick={play} disabled={state.busy || !text.trim()} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {state.busy ? "Making…" : "▶ Play"}
          </button>
          <button
            onClick={() => onPick(voice)}
            className={`rounded-xl px-3 py-2 text-sm ${picked === voice ? "bg-brand/25 text-mint" : "glass text-ink-2"}`}
          >
            {picked === voice ? "✓ Picked" : "Pick this"}
          </button>
          {state.ms != null && <span className="text-xs text-ink-3">ready in {(state.ms / 1000).toFixed(1)} s</span>}
        </div>
      )}
      {state.error && <p className="mt-2 break-words text-sm text-danger">{state.error}</p>}
    </div>
  );
}

// The voices installed on this computer/browser, for comparison. On Windows
// there is usually no Odia voice at all, which is why the cloud engines exist.
function BrowserVoiceCard({ lang, text, stopAll }: { lang: Lang; text: string; stopAll: () => void }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [id, setId] = useState("");

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const want = bcpOf(lang).toLowerCase();
    const load = () => {
      const list = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(want.slice(0, 2)));
      setVoices(list);
      setId((cur) => (list.some((v) => v.voiceURI === cur) ? cur : (list[0]?.voiceURI ?? "")));
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [lang]);

  const play = () => {
    stopAll();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.voiceURI === id);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">This browser&apos;s own voice</h3>
        <span className="text-xs text-ink-3">Free, offline fallback</span>
      </div>
      {voices.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={id} onChange={(e) => setId(e.target.value)} className="glass rounded-xl px-3 py-2 text-sm outline-none">
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI} className="bg-night">
                {v.name} · {v.lang}
              </option>
            ))}
          </select>
          <button onClick={play} disabled={!text.trim()} className="glass rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">
            ▶ Play
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-3">No {LANGS.find((l) => l.code === lang)!.english} voice installed in this browser.</p>
      )}
    </div>
  );
}

// ── Mic test: can the browser's free speech recognition understand you? ──

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

const MIC_ERRORS: Record<string, string> = {
  "language-not-supported": "This browser can't understand this language.",
  "not-allowed": "Microphone permission is blocked. Allow it from the lock icon in the address bar.",
  "no-speech": "Didn't hear anything. Try again, a little closer to the mic.",
  "audio-capture":
    "Can't reach the microphone. On Windows, check Settings → Privacy → Microphone: \"Allow apps to access your microphone\" must be On. Then restart the browser.",
  network: "The speech service couldn't be reached. It needs internet.",
};

function MicTest({ lang, stopAll }: { lang: Lang; stopAll: () => void }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState("");
  const rec = useRef<Recognition | null>(null);
  const Ctor = (() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  })();
  const supported = !!Ctor;

  // Keyed by language in the parent, so a language switch remounts this.
  useEffect(() => () => rec.current?.stop(), []);

  const toggle = () => {
    if (listening) return rec.current?.stop();
    const C = Ctor;
    if (!C) return;
    stopAll();
    const r = new C();
    r.lang = bcpOf(lang);
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
        if (e.results[i].isFinal) setConfidence(e.results[i][0].confidence);
      }
      setHeard(t.trim());
    };
    r.onerror = (e) => setError(MIC_ERRORS[e.error] ?? `Error: ${e.error}`);
    r.onend = () => setListening(false);
    setHeard("");
    setError("");
    setConfidence(null);
    try {
      r.start();
      rec.current = r;
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">2 · Saathi hears you</h2>
      <p className="mt-1 text-sm text-ink-2">Tap the mic and read this line aloud:</p>
      <p className="glass mt-2 rounded-2xl p-3 text-lg">{READ_ALOUD[lang]}</p>
      {supported ? (
        <button
          onClick={toggle}
          className={`mt-3 rounded-full px-5 py-3 text-sm font-semibold ${listening ? "bg-danger text-night" : "btn-primary"}`}
        >
          {listening ? "■ Stop" : "🎤 Start listening"}
        </button>
      ) : (
        <p className="mt-3 text-sm text-gold">This browser has no speech recognition. Open the page in Chrome or Edge.</p>
      )}
      <div className="glass mt-3 min-h-16 rounded-2xl p-3">
        <p className="text-xs text-ink-3">
          Heard{confidence != null && confidence > 0 ? ` · confidence ${Math.round(confidence * 100)}%` : ""}
        </p>
        <p className="mt-1 text-lg">{heard || (listening ? "Listening…" : "—")}</p>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}
