// Server only: a copy of each lead to the Aivoryx CRM's inbound lead webhook,
// sent with the owner's email and the database save (api/lead). Best-effort:
// never throws, and a slow or failing CRM only shows up in the server log.
//
// CRM_WEBHOOK_URL + CRM_WEBHOOK_SECRET (sent as "Authorization: Bearer …").
// Either one empty: nothing is sent.
//
// The CRM maps full_name, phone_number, email_address, city, state,
// postal_code and country itself, and keeps any other key as an extra field.
// A journey is sent twice (plan, then booking); the CRM dedupes on its side,
// and journey_id/stage let it tell the two apart.

import { FLOW } from "./flowCopy";
import { LANGS, type Lang } from "./i18n";
import { scoreLead, type Lead } from "./lead";

const O = FLOW.en;
const TIMEOUT_MS = 5_000;

type CrmMeta = { lang: Lang; stage: "plan" | "booked"; journey: string | null };

function payload(L: Lead, { lang, stage, journey }: CrmMeta) {
  const { score, temperature } = scoreLead(L);
  const booked = !!(L.bookingId && L.mode && L.date && L.slot);
  const fields: Record<string, string | number | null | undefined> = {
    full_name: L.name,
    phone_number: `+91${L.mobile}`,
    email_address: L.email, // empty when skipped or not verified
    city: L.district || L.area,
    state: L.state,
    postal_code: L.pin,
    country: "India",
    area: L.area,
    district: L.district,
    source: "Solar Saathi chatbot",
    service: "Rooftop solar",
    stage,
    journey_id: journey,
    language: LANGS.find((l) => l.code === lang)?.english,
    monthly_bill: L.bill,
    property_type: L.ptype && O.ptype.opts[L.ptype],
    ownership: L.own && (L.own === "own" ? "Own property" : "Rented"),
    install_when: L.when && O.when.opts[L.when],
    payment: L.pay && O.pay.opts[L.pay],
    main_goal: L.goal && O.goal.opts[L.goal],
    consultation: booked ? O.mode.opts[L.mode!] : undefined,
    consult_date: booked ? L.date : undefined,
    consult_time: booked ? O.slot.opts[L.slot!] : undefined,
    booking_id: booked ? L.bookingId : undefined,
    score,
    temperature,
  };
  // Flat JSON with no empty values.
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== ""));
}

export async function postToCrm(lead: Lead, meta: CrmMeta): Promise<void> {
  const url = process.env.CRM_WEBHOOK_URL;
  const secret = process.env.CRM_WEBHOOK_SECRET;
  if (!url || !secret) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload(lead, meta)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => null)) as { accepted?: boolean } | null;
    if (!res.ok || !body?.accepted) console.error(`[crm] lead not accepted (${meta.stage}): HTTP ${res.status}`);
  } catch (err) {
    console.error(`[crm] lead not sent (${meta.stage}):`, err instanceof Error ? err.message : String(err));
  }
}
