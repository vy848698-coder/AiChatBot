// Saathi speaks sentence by sentence. Fixed sentences are pre-recorded once
// (npm run voice:build → public/voice/{lang}/{id}.mp3), so they play
// instantly and never change; only sentences with a name or a number are
// made live. Both the app and the build script use these two functions, so
// they must stay free of imports.

// "Thank you, Rahul! Please enter your PIN." → ["Thank you, Rahul!", "Please enter your PIN."]
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?।])\s+(?=\S)/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

// How the voice should say words it gets wrong. Only the audio uses this; the
// screen keeps the real spelling. The client asked for "Clans Machina" to be
// said "Clans Masina" (Oct 2026). Change a spelling here, then run
// `npm run voice:build` so the pre-recorded clips are made again.
// (SAY_AS itself is below the Odia word lists it uses.)

// Odia reads a final consonant with its built-in "o" ("ବିଲ" → "bilo",
// "ପ୍ଲାନ" → "plano"); a halant (୍) ends the word cleanly ("bil", "plan").
// Asked for by the client (Nov 2026) after listening to before/after samples.
//
// NATIVE: Odia words, fixed as whole words only.
// LOAN: English words written in Odia letters, fixed as whole words and also
// before a case ending (ସିଷ୍ଟମର → ସିଷ୍ଟମ୍‌ର "system-ro", ପ୍ଲାନରେ → ପ୍ଲାନ୍‌ରେ).
// Never inside a longer word, so ବିଲମ୍ବ or ଯାଞ୍ଚିତ are left alone.
const NATIVE = ["ବହୁତ", "ଧନ୍ୟବାଦ", "ଯାଞ୍ଚ", "ଠିକ", "ବିଦ୍ୟୁତ"];
const LOAN = [
  // asked for by name
  "ଇମେଲ", "ପିନ", "କୋଡ", "ସେଭ", "ବିଲ", "ସାଇଟ", "ପ୍ଲାନ", "ବୁକ", "ଟିମ",
  // solar and money
  "ସୋଲାର", "ସିଷ୍ଟମ", "ସାଇଜ", "ପାୱାର", "ବ୍ୟାକଅପ", "ଗ୍ରିଡ", "ଅନଗ୍ରିଡ", "ଅଫଗ୍ରିଡ", "ହାଇବ୍ରିଡ",
  "ଅନ", "ଅଫ", "ନେଟ", "ମିଟର", "ୟୁନିଟ", "କିଲୋୱାଟ", "ପ୍ୟାନେଲ", "ଇନଭର୍ଟର", "ରୁଫଟପ", "ଫ୍ଲାଟ",
  "ବର୍ଗଫୁଟ", "କିଲୋମିଟର", "ଡିସକମ", "କ୍ରେଡିଟ", "ବ୍ୟାଙ୍କ", "ଲୋନ", "ପେମେଣ୍ଟ", "ଡାଉନ", "କୋଟେସନ",
  "ରିଟର୍ଣ୍ଣ", "ପିଏମ", "ପୋର୍ଟାଲ", "ଭେଣ୍ଡର", "ବ୍ରାଣ୍ଡ", "ଟପକନ", "ପର୍କ", "ସେଲ", "ସ୍ମାର୍ଟ", "ମନିଟର",
  "ପରଫର୍ମାନ୍ସ", "ପ୍ରଡକ୍ଟ", "ଷ୍ଟ୍ରକଚର", "ଟିୟର", "ଲିକ", "ଲିକେଜ", "ଟ୍ରିପ", "ସୁଇଚ", "ଏରର", "ଆଲର୍ଟ",
  "ବ୍ରସ", "କଟ", "ସର୍ଭିସ", "ଡିଜାଇନ", "ଇନଷ୍ଟଲେସନ", "ରିପୋର୍ଟ", "ଟେଷ୍ଟ", "ମୋଡ", "ସେଟ", "ସେଟଲ",
  "ସେଣ୍ଟ୍ରାଲ", "ସାଉଦର୍ନ", "ୱେଷ୍ଟର୍ନ", "ନର୍ଦର୍ନ", "କନଜ୍ୟୁମର", "କମନ", "ଆପାର୍ଟମେଣ୍ଟ", "ଅଫିସ",
  // contact and documents
  "ମୋବାଇଲ", "ନମ୍ବର", "ଫୋନ", "କଲ", "କଲବ୍ୟାକ", "ଚାଟ", "ଟୋଲ", "ଆପ", "ଅନଲାଇନ", "ଲାଇଭ", "ଫର୍ମ",
  "କାର୍ଡ", "ପାସବୁକ", "ପାସପୋର୍ଟ", "ଡକ୍ୟୁମେଣ୍ଟ", "ମିନିଟ", "ସେକେଣ୍ଡ", "ଇଣ୍ଟରନେଟ", "ଇନବକ୍ସ",
  "ସ୍ପାମ", "ପ୍ରମୋସନ", "ଫୋଲ୍ଡର", "ସ୍ଲାଇଡର", "ଟାପ",
  // how an email ID is read aloud
  "ଆଟ", "ଡଟ", "ଅଣ୍ଡରସ୍କୋର", "ଡ୍ୟାସ", "ପ୍ଲସ",
];
const ODIA = "\\u0B00-\\u0B7F\\u200C\\u200D";
const CASE_ENDING = "ର|ରେ|କୁ|ରୁ";

function odiaHalant(): [RegExp, string][] {
  const word = (w: string, end = "") => new RegExp(`(?<![${ODIA}])${w}${end}(?![${ODIA}])`, "gu");
  return [
    ...[...NATIVE, ...LOAN].map((w): [RegExp, string] => [word(w), `${w}୍`]),
    ...LOAN.map((w): [RegExp, string] => [word(w, `(${CASE_ENDING})`), `${w}୍‌$1`]),
    [word("ସବସିଡି"), "ସବ୍‌ସିଡି"],
  ];
}

const SAY_AS: Record<string, [RegExp, string][]> = {
  en: [[/\bClans\s+Machina\b/gi, "Clans Masina"]],
  hi: [[/\bClans\s+Machina\b/gi, "क्लैंस मसीना"]],
  or: [[/\bClans\s+Machina\b/gi, "କ୍ଲାନ୍ସ ମସିନା"], ...odiaHalant()],
};

export function speakable(text: string, lang: string): string {
  return (SAY_AS[lang] ?? []).reduce((t, [from, to]) => t.replace(from, to), text);
}

// Stable short id for a sentence (53-bit cyrb53 hash, hex).
export function clipId(sentence: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < sentence.length; i++) {
    const c = sentence.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

export type VoiceManifest = {
  voices: Partial<Record<string, string>>; // lang → "engine:voice:rate" the clips were made with
  clips: Partial<Record<string, string[]>>; // lang → clip ids
};
