// Everything the customer answered in Solar Saathi (FAQ questions are left
// out), in fixed sections: customer → location → home → plan → booking.
// leadReport() builds it once; the WhatsApp texts here and the owner's email
// (email/leadEmail.ts) both draw from it, so they always show the same facts
// in the same order. Steps not reached yet are simply left out.
//
// Two voices:
// - "customer": what the customer sends when they tap WhatsApp.
// - "team": the owner's alerts (WhatsApp + email), with the lead score.
// Always English, for the sales team.

import { CALC, computeEstimate, emi, rupees, rupeesShort } from "./estimate";
import { FLOW } from "./flowCopy";
import { LANGS, type Lang } from "./i18n";
import { categoryOf, scoreLead, type Lead } from "./lead";
import { HOME_STATE } from "./regions";
import { displayMobile } from "./speech";

const O = FLOW.en; // option labels
type Audience = "customer" | "team";

export type Row = { label: string; value: string; verified?: boolean };

export type LeadReport = {
  name: string;
  mobile: string; // 10 digits
  email: string;
  langName: string;
  score: number;
  temperature: "Hot" | "Warm" | "Cold";
  customer: Row[];
  location: Row[];
  home: Row[];
  // Headline figures for the email tiles, plus every plan line.
  plan: { kw: number; investment: number; subsidy: number; monthlySaving: number; rows: Row[] } | null;
  booking: Row[]; // empty = not booked yet
};

const rows = (list: (Row | false | undefined | "")[]) => list.filter(Boolean) as Row[];

export function leadReport(L: Lead, lang: Lang, audience: Audience = "team"): LeadReport {
  const team = audience === "team";
  const { score, temperature } = scoreLead(L);
  const langName = LANGS.find((l) => l.code === lang)?.english ?? "English";

  const customer = rows([
    L.name && { label: "Name", value: L.name },
    L.mobile && { label: "Mobile", value: displayMobile(L.mobile), verified: !!L.otpVerified },
    L.email ? { label: "Email", value: L.email, verified: !!L.emailVerified } : team && { label: "Email", value: "Not given (skipped)" },
    team && { label: "Language", value: langName },
  ]);

  const location = rows([
    L.area && { label: "Area", value: L.area },
    L.district && { label: "District", value: L.district },
    L.state && { label: "State", value: L.state },
    L.pin && { label: "PIN code", value: L.pin },
  ]);

  const home = rows([
    // "Own property", not the button's "My own house" (it may be a shop or factory).
    L.own && { label: "Ownership", value: L.own === "own" ? "Own property" : "Rented" },
    L.own === "rented" && L.ownerOk && { label: "Owner's permission", value: O.ownerOk.opts[L.ownerOk] },
    L.ptype && { label: "Property", value: O.ptype.opts[L.ptype] },
    L.roofType && { label: "Panels on", value: O.roofType.opts[L.roofType] },
    L.bill != null && { label: "Monthly bill", value: rupees(L.bill) },
    L.roof !== undefined && { label: "Roof space", value: L.roof == null ? "Not sure" : `${L.roof.toLocaleString("en-IN")} sq ft` },
    L.goal && { label: "Main goal", value: O.goal.opts[L.goal] },
    L.cuts && { label: "Power cuts", value: `${O.cuts.opts[L.cuts]} a day` },
    L.when && { label: "Install", value: O.when.opts[L.when] },
    L.pay && { label: "Payment", value: O.pay.opts[L.pay] },
  ]);

  let plan: LeadReport["plan"] = null;
  if (L.bill && L.ptype && L.pay) {
    const e = computeEstimate(L.bill, L.roof ?? null, categoryOf(L), L.state === HOME_STATE);
    const loan = (L.pay === "bank" || L.pay === "emi") && e.investment > 0;
    plan = {
      kw: e.kw,
      investment: e.investment,
      subsidy: e.subsidy,
      monthlySaving: e.monthlySaving,
      rows: rows([
        { label: "System", value: `${e.kw} kW (${e.panels} panels)` },
        { label: "Total cost", value: rupees(e.cost) },
        {
          label: "Govt subsidy",
          value: e.subsidy ? `${rupees(e.subsidy)}${e.subsidyState ? ` (${rupees(e.subsidyCentral)} + ${rupees(e.subsidyState)})` : ""}` : "Not eligible (business)",
        },
        { label: team ? "Customer invests" : "I invest", value: rupees(e.investment) },
        { label: "Monthly saving", value: rupees(e.monthlySaving) },
        { label: "25-year savings", value: rupeesShort(e.savings25) },
        { label: "Payback", value: `${e.paybackYears.toFixed(1)} years` },
        loan && { label: "EMI", value: `${rupees(emi(e.investment, 5))}/month (5 years, ${CALC.emiRate}%)` },
        { label: "CO₂ saved", value: `${Math.round(e.co2TonnesLife)} tonnes in 25 years` },
      ]),
    };
  }

  const booking =
    L.bookingId && L.mode && L.date && L.slot
      ? rows([
          { label: "Consultation", value: O.mode.opts[L.mode] },
          { label: "Date", value: new Date(`${L.date}T00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
          { label: "Time", value: O.slot.opts[L.slot] },
          { label: "Booking ID", value: L.bookingId },
          team && L.district && { label: "Team", value: `${L.district} district` },
        ])
      : [];

  return { name: L.name, mobile: L.mobile, email: L.email, langName, score, temperature, customer, location, home, plan, booking };
}

export const tempIcon = (t: LeadReport["temperature"]) => (t === "Hot" ? "🔥" : t === "Warm" ? "🌤️" : "❄️");

// ── WhatsApp text ───────────────────────────────────────────────────────
const TITLES = {
  customer: { customer: "👤 My details", home: "🏠 My home", plan: "⚡ My solar plan (Saathi estimate)" },
  team: { customer: "👤 Customer", home: "🏠 Home", plan: "⚡ Solar plan (Saathi estimate)" },
};

function block(title: string, list: Row[]) {
  return list.length ? [`*${title}*`, ...list.map((r) => `${r.label}: ${r.value}${r.verified ? " ✓ verified" : ""}`)].join("\n") : "";
}

export function whatsAppText(L: Lead, lang: Lang, audience: Audience = "customer"): string {
  const r = leadReport(L, lang, audience);
  const t = TITLES[audience];
  const sections = [
    block(t.customer, [...r.customer, ...(audience === "team" && r.mobile ? [{ label: "Chat", value: `https://wa.me/91${r.mobile}` }] : [])]),
    block("📍 Location", r.location),
    block(t.home, r.home),
    r.plan ? block(t.plan, r.plan.rows) : "",
    block("📅 Free consultation booked", r.booking),
  ];

  if (audience === "team") {
    const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    return [
      `☀️ *${r.booking.length ? "Consultation booked" : "New solar lead"}* · Solar Saathi\n${tempIcon(r.temperature)} *${r.temperature}* lead (score ${r.score}) · ${when}`,
      ...sections,
      !r.booking.length && r.plan ? "📅 Not booked yet: call to book the free consultation." : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const ask = r.booking.length ? "See you then! 🙏" : r.plan ? "I'd like to book a free consultation. 🙏" : "I'd like to know more about rooftop solar. 🙏";
  return ["Hi Clans Machina! 👋 Here are my details from Solar Saathi.", ...sections, `${ask}\n_(Chatted with Saathi in ${r.langName})_`]
    .filter(Boolean)
    .join("\n\n");
}
