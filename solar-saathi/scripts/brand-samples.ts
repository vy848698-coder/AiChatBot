// One-off: records "Clans Machina" spelled several ways with Saathi's own
// voices, so the client can pick the pronunciation that sounds right.
//   npx tsx scripts/brand-samples.ts <outDir>

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { voiceFor } from "../src/lib/tts/config";
import { synthesize } from "../src/lib/tts/engines";

const out = process.argv[2] ?? "brand-samples";
mkdirSync(out, { recursive: true });

const SAMPLES = {
  en: {
    "1-current-Clans-Machina": "Thank you for choosing Clans Machina.",
    "2-Clans-Masina": "Thank you for choosing Clans Masina.",
    "3-Clans-Mashina": "Thank you for choosing Clans Mashina.",
    "4-Clans-Mah-shee-nah": "Thank you for choosing Clans Mah-shee-nah.",
    "5-Clans-Mah-kee-nah": "Thank you for choosing Clans Mah-kee-nah.",
  },
  hi: {
    "1-current-Clans-Machina": "Clans Machina चुनने के लिए धन्यवाद।",
    "2-क्लैंस-मसीना": "क्लैंस मसीना चुनने के लिए धन्यवाद।",
    "3-क्लैंस-मशीना": "क्लैंस मशीना चुनने के लिए धन्यवाद।",
    "4-क्लान्स-मशीना": "क्लान्स मशीना चुनने के लिए धन्यवाद।",
  },
} as const;

async function run() {
  for (const [lang, lines] of Object.entries(SAMPLES) as [
    keyof typeof SAMPLES,
    Record<string, string>,
  ][]) {
    const choice = voiceFor(lang);
    if (!choice) throw new Error(`no voice for ${lang}`);
    for (const [name, text] of Object.entries(lines)) {
      const bytes = await synthesize({ ...choice, lang, text });
      writeFileSync(join(out, `${lang}-${name}.mp3`), bytes);
      console.log(
        `${lang} ${name}: ${Math.round(bytes.length / 1024)} KB (${choice.voice})`,
      );
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
