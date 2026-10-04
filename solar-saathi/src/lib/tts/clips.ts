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
