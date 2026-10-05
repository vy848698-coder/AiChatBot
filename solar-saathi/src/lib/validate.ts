// Checks for everything the user types or says. Each returns a clear yes/no;
// the flow turns a "no" into a spoken, specific error.

// Accepts pasted forms like "+91 98765 43210", "098765 43210" or "919876543210".
export function cleanMobile(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return d.slice(0, 10);
}

export const isMobile = (v: string) => /^[6-9]\d{9}$/.test(v);

// Placeholder-style numbers people type to get past a form. Real "fancy"
// numbers (98 7777 7777) are allowed; the SMS code is the final proof.
export function isFakeMobile(v: string) {
  if (/^(\d)\1{9}$/.test(v)) return true; // 9999999999
  if (new Set(v).size <= 2 && /(\d)\1{7}/.test(v)) return true; // 7000000000, 9000000009
  const up = "01234567890123456789";
  const down = "98765432109876543210";
  if (up.includes(v) || down.includes(v)) return true; // 9876543210, 6789012345
  return v.includes("123456789") || v.includes("987654321"); // 9123456789
}

// Names may be typed (or dictated) in Latin, Odia or Devanagari script.
// Real-name limits: 2–40 characters, up to 4 words of up to 20 letters each.
export const NAME_MAX = 40;
const NAME_WORDS = 4;
const WORD_MAX = 20;

// What's wrong with a name, or null if it's fine:
// "chars": not just letters; "long": too long / too many words;
// "junk": keyboard mash ("aaa", "yadavbbb", "xyzq", "bcdfgh").
export function nameProblem(v: string): "chars" | "long" | "junk" | null {
  const s = v.trim();
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(s)) return "chars";
  const words = s.split(/\s+/);
  if (s.length > NAME_MAX || words.length > NAME_WORDS || words.some((w) => w.replace(/[.'-]/g, "").length > WORD_MAX)) return "long";
  if (s.replace(/[^\p{L}]/gu, "").length < 2) return "junk";
  if (/(\p{L})\1\1/u.test(s.toLowerCase())) return "junk"; // same letter 3 times: "aaa", "bbb"
  // English letters only: a word of 3+ letters with no vowel (a e i o u; Indian
  // names never rely on "y" alone), or 5 consonants in a row.
  for (const w of words.map((x) => x.toLowerCase().replace(/[.'-]/g, ""))) {
    if (!/^[a-z]+$/.test(w)) continue; // Indic scripts: the checks above are enough
    if (w.length >= 3 && !/[aeiou]/.test(w)) return "junk";
    if (/[bcdfghjklmnpqrstvwxz]{5}/.test(w)) return "junk";
  }
  return null;
}

export const isName = (v: string) => nameProblem(v) === null;

// "  rahul   MOHANTY. " → "Rahul Mohanty". Mixed-case (McDonald) and
// Indic-script names are kept as typed.
export function tidyName(v: string) {
  return v
    .trim()
    .replace(/[.,।!?]+$/u, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (/^[a-z.'-]+$/.test(w) || /^[A-Z'-]{3,}$/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

const EMAIL =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9_-])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

export const isEmail = (v: string) => {
  const s = v.trim().toLowerCase();
  return s.length <= 254 && !s.includes("..") && EMAIL.test(s);
};

// Common mistyped domains → the likely intended one ("gmial.com" → "gmail.com").
const MAIL_DOMAINS = ["gmail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com", "rediffmail.com", "icloud.com"];
// Real providers that sit close to a big one; never "correct" these.
const REAL_DOMAINS = new Set([...MAIL_DOMAINS, "mail.com", "ymail.com", "email.com", "gmx.com", "live.com", "msn.com", "aol.com", "zoho.com", "zohomail.in", "proton.me", "protonmail.com", "yandex.com", "rocketmail.com"]);

export function emailTypo(email: string): string | null {
  const s = email.trim().toLowerCase();
  const at = s.lastIndexOf("@");
  if (at < 1) return null;
  const domain = s.slice(at + 1);
  if (REAL_DOMAINS.has(domain)) return null;
  let best: string | null = null;
  let bestD = 3;
  for (const d of MAIL_DOMAINS) {
    const dist = editDistance(domain, d);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best && bestD <= 2 ? `${s.slice(0, at)}@${best}` : null;
}

function editDistance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

// Indian PIN codes: 6 digits, first digit 1–8 (9 is the Army Post Office).
export const isPin = (v: string) => /^[1-8]\d{5}$/.test(v);

// An area or locality name: at least two letters, no links or emails.
export function isArea(v: string) {
  const s = v.trim();
  return s.length <= 80 && s.replace(/[^\p{L}]/gu, "").length >= 2 && !/[@/\\<>{}]|https?:|www\./i.test(s);
}

// Monthly bill typed by hand (the slider covers up to ₹10,000).
export const BILL_EXACT = { min: 10001, max: 1000000 };
export const isExactBill = (n: number) => Number.isInteger(n) && n >= BILL_EXACT.min && n <= BILL_EXACT.max;

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
