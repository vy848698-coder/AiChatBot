// Voice Lab backend: try any engine + voice in any language.
// GET  → { engines: { edge: { ready }, azure: { ready }, sarvam: { ready } } }
// POST { engine, voice, lang, text, rate } → audio/mpeg (X-Synth-Ms: time taken)
// Off in production unless VOICE_LAB=1, so it can't be used to spend credits.

import type { Lang } from "@/lib/i18n";
import { ENGINE_IDS, findVoice, type Engine } from "@/lib/tts/catalog";
import { engineReady, synthesize } from "@/lib/tts/engines";

const MAX_CHARS = 600;
const open = () => process.env.NODE_ENV !== "production" || process.env.VOICE_LAB === "1";
const closed = () => Response.json({ error: "Voice Lab is off" }, { status: 404 });

export async function GET() {
  if (!open()) return closed();
  const engines = Object.fromEntries(ENGINE_IDS.map((e) => [e, { ready: engineReady(e) }]));
  return Response.json({ engines });
}

export async function POST(request: Request) {
  if (!open()) return closed();

  let body: { engine?: unknown; voice?: unknown; lang?: unknown; text?: unknown; rate?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const engine = body.engine as Engine;
  const lang = body.lang as Lang;
  const voice = typeof body.voice === "string" ? body.voice : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const rate = typeof body.rate === "number" ? Math.max(-30, Math.min(30, body.rate)) : 0;

  if (!ENGINE_IDS.includes(engine) || !findVoice(engine, lang, voice)) {
    return Response.json({ error: "Unknown engine, language or voice" }, { status: 400 });
  }
  if (!text || text.length > MAX_CHARS) {
    return Response.json({ error: `Text must be 1–${MAX_CHARS} characters` }, { status: 400 });
  }
  if (!engineReady(engine)) {
    return Response.json({ error: "This engine has no key in .env.local" }, { status: 503 });
  }

  const t0 = Date.now();
  try {
    const bytes = await synthesize({ engine, voice, lang, text, rate });
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": "audio/mpeg", "X-Synth-Ms": String(Date.now() - t0) },
    });
  } catch (err) {
    console.error("[voice-lab]", engine, voice, (err as Error).message);
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
