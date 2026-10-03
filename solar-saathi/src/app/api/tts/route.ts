// Saathi's voice via Sarvam AI text-to-speech (Bulbul v3).
// The API key stays on the server (.env.local → SARVAM_API_KEY).
// GET  → { enabled } so the client knows whether to use it.
// POST { text, lang } → audio/mpeg

const SARVAM_URL = "https://api.sarvam.ai/text-to-speech";
const LANG_CODE: Record<string, string> = { en: "en-IN", hi: "hi-IN", or: "od-IN" };
const MAX_CHARS = 600; // our lines are short; caps cost if the endpoint is abused

// Scripted lines repeat across users, so cache the audio in memory.
const cache = new Map<string, ArrayBuffer>();
const CACHE_LIMIT = 400;

export async function GET() {
  return Response.json({ enabled: !!process.env.SARVAM_API_KEY });
}

export async function POST(request: Request) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return Response.json({ error: "Sarvam is not configured" }, { status: 503 });

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const lang = typeof body.lang === "string" ? LANG_CODE[body.lang] : undefined;
  if (!text || text.length > MAX_CHARS || !lang) {
    return Response.json({ error: "text (≤600 chars) and lang (en|hi|or) are required" }, { status: 400 });
  }

  const speaker = process.env.SARVAM_SPEAKER || "shubh";
  const cacheKey = `${lang}|${speaker}|${text}`;
  const hit = cache.get(cacheKey);
  if (hit) return audio(hit);

  const res = await fetch(SARVAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": key },
    body: JSON.stringify({
      text,
      language_code: lang,
      speaker,
      model: "bulbul:v3",
      pace: 1.0,
      speech_sample_rate: 24000,
      output_audio_codec: "mp3",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[tts] Sarvam error", res.status, detail.slice(0, 300));
    return Response.json({ error: "Voice service failed" }, { status: 502 });
  }

  const data = (await res.json()) as { audios?: string[] };
  const parts = (data.audios ?? []).map((b64) => Buffer.from(b64, "base64"));
  if (!parts.length) return Response.json({ error: "No audio returned" }, { status: 502 });
  const joined = Buffer.concat(parts); // MP3 frames concatenate cleanly
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
