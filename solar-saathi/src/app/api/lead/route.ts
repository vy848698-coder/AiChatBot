// POST { stage: "plan" | "booked", lead, lang, journey } → the lead to the
// owner, by WhatsApp (CallMeBot) and email (designed report, email/leadEmail.ts),
// and saved in the Clans Machina database at the same moment (leadStore.ts;
// `journey` keeps one chat on one row).
// Sent when the customer sees their plan, and again when they book.
// Only with a proof this server signed during the journey (verified email, or
// the checked mobile when the email was skipped), so nobody can use this to
// spam the owner's WhatsApp or inbox. Every field is checked
// against the allowed answers, and the plan is recalculated from the answers.

import { sendLeadEmail } from "@/lib/email/leadEmail";
import { mailMode } from "@/lib/email/mailer";
import { FLOW } from "@/lib/flowCopy";
import { saveLeadRow } from "@/lib/leadStore";
import type { Lang } from "@/lib/i18n";
import type { Lead } from "@/lib/lead";
import { whatsAppText } from "@/lib/leadMessage";
import { checkProof } from "@/lib/otp";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { REGIONS } from "@/lib/regions";
import { isEmail } from "@/lib/validate";
import { alertsOn, sendOwnerAlert } from "@/lib/whatsappAlert";

const O = FLOW.en;
const str = (v: unknown, max: number) =>
  typeof v === "string"
    ? v.replace(/[\u0000-\u001f\u007f*_~`]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) // no line breaks or WhatsApp formatting
    : "";
const pick = <K extends string>(v: unknown, opts: Record<K, string>) => (typeof v === "string" && v in opts ? (v as K) : undefined);
const num = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? Math.round(v) : undefined);

// Only known fields, in allowed shapes; anything else is dropped.
function cleanLead(raw: Record<string, unknown>): Lead {
  const mobile = typeof raw.mobile === "string" && /^[6-9]\d{9}$/.test(raw.mobile) ? raw.mobile : "";
  const state = typeof raw.state === "string" && raw.state in REGIONS ? raw.state : undefined;
  const district = state && typeof raw.district === "string" && REGIONS[state].includes(raw.district) ? raw.district : undefined;
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase().slice(0, 80) : "";
  return {
    name: str(raw.name, 60),
    mobile,
    email: isEmail(email) ? email : "", // may be empty: the customer skipped it
    // A "verified" flag counts only with the server's own signed proof.
    otpVerified: typeof raw.mobileProof === "string" && !!mobile && checkProof(`tel:${mobile}`, raw.mobileProof),
    emailVerified: typeof raw.emailProof === "string" && isEmail(email) && checkProof(`mail:${email}`, raw.emailProof),
    pin: typeof raw.pin === "string" && /^[1-8]\d{5}$/.test(raw.pin) ? raw.pin : undefined,
    state,
    district,
    area: str(raw.area, 80) || undefined,
    own: pick(raw.own, O.own.opts),
    ownerOk: pick(raw.ownerOk, O.ownerOk.opts),
    ptype: pick(raw.ptype, O.ptype.opts),
    roofType: pick(raw.roofType, O.roofType.opts),
    bill: num(raw.bill, 100, 1_000_000),
    roof: raw.roof === null ? null : num(raw.roof, 50, 100_000),
    goal: pick(raw.goal, O.goal.opts),
    cuts: pick(raw.cuts, O.cuts.opts),
    when: pick(raw.when, O.when.opts),
    pay: pick(raw.pay, O.pay.opts),
    mode: pick(raw.mode, O.mode.opts),
    date: typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : undefined,
    slot: pick(raw.slot, O.slot.opts),
    bookingId: typeof raw.bookingId === "string" && /^CM-[A-Z0-9]{6}$/.test(raw.bookingId) ? raw.bookingId : undefined,
  };
}

export async function POST(request: Request) {
  let body: { stage?: unknown; lead?: unknown; lang?: unknown; journey?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const raw = (body.lead && typeof body.lead === "object" ? body.lead : {}) as Record<string, unknown>;
  const stage = body.stage === "booked" ? "booked" : body.stage === "plan" ? "plan" : null;
  const lang: Lang = body.lang === "hi" || body.lang === "or" ? body.lang : "en";
  const lead = cleanLead(raw);
  const journey = typeof body.journey === "string" && /^[a-z0-9]{12,32}$/.test(body.journey) ? body.journey : null;

  if (!stage || !lead.name || !lead.mobile) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  // Proof the customer really went through Saathi (signed by this server): a
  // verified email, a verified mobile, or a mobile that passed our checks
  // (customers who skipped the email).
  const mobileChecked = typeof raw.mobileCheck === "string" && checkProof(`chk:tel:${lead.mobile}`, raw.mobileCheck);
  if (!lead.emailVerified && !lead.otpVerified && !mobileChecked) {
    console.warn(`[lead] refused (${stage}): no signed proof for ${lead.mobile}, so no email, WhatsApp or database row. Is OTP_SECRET set?`);
    return Response.json({ ok: false, error: "unverified" }, { status: 403 });
  }
  if (!lead.emailVerified) lead.email = ""; // an unverified address isn't passed on as theirs
  if (stage === "booked" && !lead.bookingId) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  // A journey sends 2 alerts (plan, booking), a few more if answers change.
  for (const [key, limit] of [[`lead|${clientIp(request)}`, 20], [`leadm|${lead.mobile}`, 8]] as const) {
    const r = rateLimit(key, limit, 3600_000);
    if (!r.ok) return Response.json({ ok: false, error: "limit" }, { status: 429 });
  }

  // Both channels and the database at once; either channel may be switched off.
  const text = whatsAppText(lead, lang, "team");
  const [wa, mail, saved] = await Promise.all([
    alertsOn() ? sendOwnerAlert(text) : null,
    mailMode() !== "off" ? sendLeadEmail(lead, lang) : null,
    saveLeadRow(lead, lang, stage, journey),
  ]);
  if (!saved.ok) console.error("[lead] saving to the database failed:", saved.reason);
  if (!wa && process.env.NODE_ENV !== "production") console.log(`[whatsapp] alert not sent (CALLMEBOT_WHATSAPP not set):\n${text}\n`);
  if (mail && !mail.ok) console.error("[lead] email to owner failed:", mail.reason);

  const whatsapp = wa ? wa.sent > 0 : null; // null = channel off
  const email = mail ? mail.ok : null;
  const delivered = whatsapp === true || email === true;
  const anyOn = whatsapp !== null || email !== null;
  return Response.json({ ok: delivered || !anyOn, whatsapp, email, saved: saved.ok }, { status: delivered || !anyOn ? 200 : 502 });
}
