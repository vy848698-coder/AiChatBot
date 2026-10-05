// POST { stage: "plan" | "booked", lead, lang } → the lead to the owner, by
// WhatsApp (CallMeBot) and email (designed report, email/leadEmail.ts).
// Sent when the customer sees their plan, and again when they book.
// Only for verified customers (the server-signed emailProof must match), so
// nobody can use this to spam the owner's WhatsApp. Every field is checked
// against the allowed answers, and the plan is recalculated from the answers.

import { sendLeadEmail } from "@/lib/email/leadEmail";
import { mailMode } from "@/lib/email/mailer";
import { FLOW } from "@/lib/flowCopy";
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
  return {
    name: str(raw.name, 60),
    mobile,
    email: typeof raw.email === "string" ? raw.email.trim().toLowerCase().slice(0, 80) : "",
    // A "verified" flag counts only with the server's own signed proof.
    otpVerified: typeof raw.mobileProof === "string" && !!mobile && checkProof(`tel:${mobile}`, raw.mobileProof),
    emailVerified: true, // checked by the caller
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
  let body: { stage?: unknown; lead?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const raw = (body.lead && typeof body.lead === "object" ? body.lead : {}) as Record<string, unknown>;
  const stage = body.stage === "booked" ? "booked" : body.stage === "plan" ? "plan" : null;
  const lang: Lang = body.lang === "hi" || body.lang === "or" ? body.lang : "en";
  const lead = cleanLead(raw);

  if (!stage || !lead.name || !lead.mobile || !isEmail(lead.email)) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  if (typeof raw.emailProof !== "string" || !checkProof(`mail:${lead.email}`, raw.emailProof)) {
    return Response.json({ ok: false, error: "unverified" }, { status: 403 });
  }
  if (stage === "booked" && !lead.bookingId) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  // A journey sends 2 alerts (plan, booking), a few more if answers change.
  for (const [key, limit] of [[`lead|${clientIp(request)}`, 20], [`leadm|${lead.email}`, 8]] as const) {
    const r = rateLimit(key, limit, 3600_000);
    if (!r.ok) return Response.json({ ok: false, error: "limit" }, { status: 429 });
  }

  // Both channels at once; either one may be switched off.
  const text = whatsAppText(lead, lang, "team");
  const [wa, mail] = await Promise.all([
    alertsOn() ? sendOwnerAlert(text) : null,
    mailMode() !== "off" ? sendLeadEmail(lead, lang) : null,
  ]);
  if (!wa && process.env.NODE_ENV !== "production") console.log(`[whatsapp] alert not sent (CALLMEBOT_WHATSAPP not set):\n${text}\n`);
  if (mail && !mail.ok) console.error("[lead] email to owner failed:", mail.reason);

  const whatsapp = wa ? wa.sent > 0 : null; // null = channel off
  const email = mail ? mail.ok : null;
  const delivered = whatsapp === true || email === true;
  const anyOn = whatsapp !== null || email !== null;
  return Response.json({ ok: delivered || !anyOn, whatsapp, email }, { status: delivered || !anyOn ? 200 : 502 });
}
