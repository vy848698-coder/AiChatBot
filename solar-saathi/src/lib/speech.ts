// Turns values into what Saathi should *say*, so the voice never reads a
// mobile number as "nine hundred eighty-seven crore…" or an email as a blur.

import { FLOW } from "./flowCopy";
import { STRINGS, type Lang } from "./i18n";

export const displayMobile = (m: string) => `+91 ${m.slice(0, 5)} ${m.slice(5)}`;

// "9876543210" → "9 8 7 6 5, 4 3 2 1 0" (digit by digit, with a pause).
export const spokenMobile = (m: string) => `${m.slice(0, 5).split("").join(" ")}, ${m.slice(5).split("").join(" ")}`;

// "rahul.k_91@gmail.com" → "rahul dot k underscore 9 1 at gmail dot com"
export function spokenEmail(email: string, lang: Lang) {
  const w = STRINGS[lang].chat.spoken;
  return email
    .trim()
    .toLowerCase()
    .replace(/@/g, ` ${w.at} `)
    .replace(/\./g, ` ${w.dot} `)
    .replace(/_/g, ` ${w.underscore} `)
    .replace(/-/g, ` ${w.dash} `)
    .replace(/\+/g, ` ${w.plus} `)
    .replace(/\d/g, (d) => ` ${d} `)
    .replace(/\s+/g, " ")
    .trim();
}

// ₹3,50,000 → "3 lakh 50 thousand rupees" (or the Hindi/Odia words), so the
// voice says amounts the Indian way instead of reading digits.
export function spokenRupees(n: number, lang: Lang) {
  const w = FLOW[lang].money;
  let v = Math.round(n / 100) * 100;
  const parts: string[] = [];
  const crore = Math.floor(v / 1e7);
  v %= 1e7;
  const lakh = Math.floor(v / 1e5);
  v %= 1e5;
  const thousand = Math.floor(v / 1e3);
  v %= 1e3;
  if (crore) parts.push(`${crore} ${w.crore}`);
  if (lakh) parts.push(`${lakh} ${w.lakh}`);
  if (thousand) parts.push(`${thousand} ${w.thousand}`);
  if (v) parts.push(String(v));
  return `${parts.join(" ") || "0"} ${w.rupees}`;
}
