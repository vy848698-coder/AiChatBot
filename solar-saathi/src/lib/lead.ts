import type { Category } from "./estimate";
import type { Lang } from "./i18n";

// Everything Saathi collects. Matches the client brief (PDF sections 1–3) and
// is what will be pushed to Zoho Bigin later.
export type Lead = {
  // 1. registration & verification
  name: string;
  mobile: string;
  email: string;
  otpVerified?: boolean;
  mobileProof?: string; // signed by the server when the SMS code matched
  emailVerified?: boolean;
  emailProof?: string; // signed by the server when the email code matched
  pin?: string;
  state?: string;
  district?: string;
  area?: string;
  // 2. qualification
  own?: "own" | "rented";
  ownerOk?: "yes" | "no";
  ptype?: "house" | "flat" | "commercial" | "industrial";
  roofType?: "own" | "society";
  bill?: number;
  roof?: number | null; // shadow-free sq ft; null = not sure
  goal?: "savings" | "subsidy" | "backup" | "independence";
  cuts?: "lt1" | "h1_3" | "h3_6" | "gt6";
  when?: "now" | "d15" | "d30" | "later";
  pay?: "full" | "bank" | "emi" | "guide";
  // 3. consultation
  consult?: "yes";
  mode?: "call" | "visit" | "online";
  date?: string; // YYYY-MM-DD
  slot?: "s1" | "s2" | "s3" | "s4";
  bookingId?: string;
  // 4. FAQ: questions asked (matched ones in English, others as typed), so
  // the sales team sees them without asking again (PDF §5).
  faq?: string[];
};

export const EMPTY_LEAD: Lead = { name: "", mobile: "", email: "" };

// Calculator category: a flat on the society roof counts as a housing society;
// shops and factories get no residential subsidy.
export function categoryOf(l: Lead): Category {
  if (l.ptype === "commercial" || l.ptype === "industrial") return "commercial";
  if (l.ptype === "flat" && l.roofType === "society") return "society";
  return "residential";
}

// CRM lead score (PDF section 6): Hot ≥ 70, Warm 40–69, Cold < 40.
export function scoreLead(l: Lead): { score: number; temperature: "Hot" | "Warm" | "Cold" } {
  let s = 0;
  if (l.otpVerified) s += 10;
  if (l.emailVerified) s += 5;
  if (l.own === "own") s += 15;
  else if (l.ownerOk === "yes") s += 5;
  if (l.ptype === "house" || l.ptype === "commercial" || l.ptype === "industrial") s += 10;
  else if (l.ptype === "flat") s += 5;
  if ((l.bill ?? 0) >= 10000) s += 20;
  else if ((l.bill ?? 0) >= 3000) s += 10;
  if (l.goal) s += 5;
  s += { now: 25, d15: 20, d30: 10, later: 0 }[l.when ?? "later"];
  s += { full: 15, bank: 10, emi: 10, guide: 5 }[l.pay ?? "guide"];
  if (l.bookingId) s += 15;
  const temperature = s >= 70 ? "Hot" : s >= 40 ? "Warm" : "Cold";
  return { score: s, temperature };
}

const KEY = "saathi:lead";

// Local only for now. Replaced by POST /api/lead (→ Zoho Bigin) later.
export function saveLead(lead: Lead, lang: Lang) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...lead, ...scoreLead(lead), lang, savedAt: new Date().toISOString() }));
  } catch {
    /* private mode: nothing to do */
  }
}
