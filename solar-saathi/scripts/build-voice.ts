// Pre-records every fixed sentence Saathi says, so the voice is instant and
// stays the same even if the voice service changes later.
//
//   npm run voice:build
//
// Writes public/voice/{lang}/{id}.mp3 and public/voice/manifest.json for each
// language that has a cloud voice (see src/lib/tts/config.ts). Sentences with
// a name or number ({first}, {mobile}…) are made live in the app instead.
// Re-run after changing any copy or voice; unchanged sentences are skipped
// and clips no longer used are deleted.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { faqSpoken } from "../src/lib/faq";
import { FLOW } from "../src/lib/flowCopy";
import { LANGS, STRINGS, WELCOME, type Lang } from "../src/lib/i18n";
import { clipId, splitSentences, type VoiceManifest } from "../src/lib/tts/clips";
import { specOf, voiceFor } from "../src/lib/tts/config";
import { synthesize } from "../src/lib/tts/engines";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: defaults apply */
}

const OUT = join(process.cwd(), "public", "voice");

const leaves = (o: unknown, out: string[] = []): string[] => {
  if (typeof o === "string") out.push(o);
  else if (o && typeof o === "object") Object.values(o).forEach((v) => leaves(v, out));
  return out;
};

// Spoken lines end in sentence punctuation; button labels and titles don't.
function sentencesFor(lang: Lang) {
  const lines = [...leaves(STRINGS[lang]), ...leaves(FLOW[lang]), ...faqSpoken(lang), ...(lang === "en" ? leaves(WELCOME) : [])];
  const out = new Set<string>();
  for (const line of lines) {
    if (!/[.!?।…]/.test(line)) continue;
    for (const s of splitSentences(line)) if (!s.includes("{") && /\p{L}{2}/u.test(s)) out.add(s);
  }
  return [...out];
}

async function run() {
  const manifest: VoiceManifest = { voices: {}, clips: {} };
  const old = existsSync(join(OUT, "manifest.json")) ? (JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8")) as VoiceManifest) : null;
  for (const { code: lang } of LANGS) {
    const choice = voiceFor(lang);
    if (!choice) {
      console.log(`${lang}: no cloud voice configured, skipped`);
      continue;
    }
    const spec = specOf(choice);
    const dir = join(OUT, lang);
    mkdirSync(dir, { recursive: true });
    // A different voice means every clip must be re-recorded.
    const sameVoice = old?.voices[lang] === spec;

    const sentences = sentencesFor(lang);
    const ids = new Map(sentences.map((s) => [clipId(s), s]));
    const todo = [...ids].filter(([id]) => !sameVoice || !existsSync(join(dir, `${id}.mp3`)));
    console.log(`${lang}: ${spec} · ${ids.size} sentences, ${todo.length} to record`);

    const failed: string[] = [];
    let done = 0;
    const worker = async () => {
      for (let job = todo.shift(); job; job = todo.shift()) {
        const [id, text] = job;
        try {
          const bytes = await synthesize({ ...choice, lang, text }).catch(() => synthesize({ ...choice, lang, text }));
          writeFileSync(join(dir, `${id}.mp3`), bytes);
        } catch (err) {
          failed.push(`${text}  (${(err as Error).message})`);
        }
        if (++done % 25 === 0) console.log(`  ${done} recorded`);
      }
    };
    await Promise.all([worker(), worker(), worker()]);

    for (const f of readdirSync(dir)) if (!ids.has(f.replace(/\.mp3$/, ""))) rmSync(join(dir, f));
    if (failed.length) {
      console.error(`${lang}: ${failed.length} failed (the app makes these live):\n  ${failed.join("\n  ")}`);
    }
    manifest.voices[lang] = spec;
    manifest.clips[lang] = [...ids.keys()].filter((id) => existsSync(join(dir, `${id}.mp3`))).sort();
  }
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest));
  console.log("manifest written:", Object.entries(manifest.clips).map(([l, c]) => `${l} ${c?.length}`).join(", "));
}

void run();
