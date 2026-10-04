// Server only: turns text into MP3 bytes with one of the voice engines in
// ./catalog.ts. Keys are read from .env.local and never reach the browser.

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import type { Lang } from "../i18n";
import type { Engine } from "./catalog";

export type SynthRequest = {
  engine: Engine;
  voice: string;
  lang: Lang;
  text: string;
  rate?: number; // speed change in percent, -30..30
};

const BCP: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", or: "or-IN" };
const TIMEOUT_MS = 15000;

export function engineReady(engine: Engine) {
  if (engine === "edge") return true;
  if (engine === "azure") return !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
  return !!process.env.SARVAM_API_KEY;
}

export function synthesize(req: SynthRequest): Promise<Buffer> {
  // Edge drops a connection now and then, so one retry before giving up.
  if (req.engine === "edge") return edgeSlot(() => edge(req).catch(() => edge(req)));
  if (req.engine === "azure") return azure(req);
  return sarvam(req);
}

// The app prefetches several lines at once; Edge refuses too many parallel
// connections, so at most EDGE_MAX run together and the rest wait their turn.
const EDGE_MAX = 3;
let edgeActive = 0;
const edgeQueue: (() => void)[] = [];

async function edgeSlot<T>(fn: () => Promise<T>) {
  if (edgeActive < EDGE_MAX) edgeActive++;
  else await new Promise<void>((resolve) => edgeQueue.push(resolve)); // slot handed over below
  try {
    return await fn();
  } finally {
    const next = edgeQueue.shift();
    if (next) next();
    else edgeActive--;
  }
}

// Microsoft Edge's read-aloud service: the same neural voices as Azure, free
// and without a key. Unofficial, so it can change without notice.
async function edge({ voice, text, rate = 0 }: SynthRequest) {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeXml(text), { rate: percent(rate) });
    const read = (async () => {
      const chunks: Buffer[] = [];
      for await (const c of audioStream) chunks.push(c as Buffer);
      return Buffer.concat(chunks);
    })();
    const bytes = await withTimeout(read, "Edge voice timed out");
    if (!bytes.length) throw new Error("Edge returned no audio");
    return bytes;
  } finally {
    tts.close();
  }
}

// Azure Speech REST API. The free (F0) tier covers 5 lakh characters a month
// and is the only free source of Microsoft's Odia voices.
async function azure({ voice, lang, text, rate = 0 }: SynthRequest) {
  const key = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${BCP[lang]}">` +
    `<voice name="${voice}"><prosody rate="${percent(rate)}">${escapeXml(text)}</prosody></voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "solar-saathi",
    },
    body: ssml,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Azure ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

// Sarvam AI Bulbul v3: natural Odia/Hindi/English, paid per character.
async function sarvam({ voice, lang, text, rate = 0 }: SynthRequest) {
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY! },
    body: JSON.stringify({
      text,
      language_code: lang === "or" ? "od-IN" : BCP[lang],
      speaker: voice,
      model: "bulbul:v3",
      pace: 1 + rate / 100,
      speech_sample_rate: 24000,
      output_audio_codec: "mp3",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Sarvam ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = (await res.json()) as { audios?: string[] };
  const parts = (data.audios ?? []).map((b64) => Buffer.from(b64, "base64"));
  if (!parts.length) throw new Error("Sarvam returned no audio");
  return Buffer.concat(parts); // MP3 frames concatenate cleanly
}

const percent = (n: number) => `${n >= 0 ? "+" : ""}${Math.round(n)}%`;

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function withTimeout<T>(p: Promise<T>, message: string) {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error(message)), TIMEOUT_MS))),
  ]).finally(() => clearTimeout(timer));
}
