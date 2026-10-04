// Saathi's voice. Each language uses the engine and voice from lib/tts/config
// (free Edge voices for English and Hindi by default). Keys stay on the server.
// GET  → { langs: { en: true, … }, voices: { en: "edge:…:30", … } }:
//        which languages have a cloud voice, and which voice that is.
// POST { text, lang } → audio/mpeg

import { LANGS, type Lang } from "@/lib/i18n";
import { specOf, voiceFor } from "@/lib/tts/config";
import { synthesize } from "@/lib/tts/engines";

const MAX_CHARS = 600; // our lines are short; caps cost if the endpoint is abused

// Scripted lines repeat across users, so cache the audio in memory.
const cache = new Map<string, ArrayBuffer>();
const CACHE_LIMIT = 400;

export async function GET() {
  const choices = LANGS.map((l) => [l.code, voiceFor(l.code)] as const);
  return Response.json({
    langs: Object.fromEntries(choices.map(([l, c]) => [l, !!c])),
    voices: Object.fromEntries(choices.filter(([, c]) => c).map(([l, c]) => [l, specOf(c!)])),
  });
}

export async function POST(request: Request) {
  let body: { text?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const lang = LANGS.find((l) => l.code === body.lang)?.code as Lang | undefined;
  if (!text || text.length > MAX_CHARS || !lang) {
    return Response.json({ error: "text (≤600 chars) and lang (en|hi|or) are required" }, { status: 400 });
  }

  const choice = voiceFor(lang);
  if (!choice) return Response.json({ error: `No cloud voice for ${lang}` }, { status: 503 });

  const cacheKey = `${choice.engine}|${choice.voice}|${choice.rate}|${text}`;
  const hit = cache.get(cacheKey);
  if (hit) return audio(hit);

  let joined: Buffer;
  try {
    joined = await synthesize({ ...choice, lang, text });
  } catch (err) {
    console.error("[tts]", choice.engine, choice.voice, (err as Error).message);
    return Response.json({ error: "Voice service failed" }, { status: 502 });
  }
  const bytes = joined.buffer.slice(joined.byteOffset, joined.byteOffset + joined.byteLength) as ArrayBuffer;

  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey, bytes);
  return audio(bytes);
}

function audio(bytes: ArrayBuffer) {
  return new Response(bytes, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}
