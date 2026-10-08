// Server only: every lead in the `saathi_leads` table of the Clans Machina
// database, saved at the same moment as the owner's email (api/lead).
// One row per journey: the "plan" send creates it, the "booked" send fills in
// the consultation on the same row. Answers are stored as the English labels
// the sales team sees in the email, and the plan figures are recalculated
// from the answers exactly as the email does.
// The table is created on first use; the same SQL is in scripts/saathi-leads.sql.

import { db } from "./db";
import { computeEstimate } from "./estimate";
import { FLOW } from "./flowCopy";
import { LANGS, type Lang } from "./i18n";
import { categoryOf, scoreLead, type Lead } from "./lead";
import { HOME_STATE } from "./regions";

const O = FLOW.en;

export const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS saathi_leads (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  journey_id       VARCHAR(32)   NULL,                -- one chat with Saathi
  stage            VARCHAR(10)   NOT NULL,            -- plan | booked
  name             VARCHAR(120)  NOT NULL,
  mobile           VARCHAR(15)   NOT NULL,
  mobile_verified  TINYINT(1)    NOT NULL DEFAULT 0,  -- 1 = SMS code matched
  email            VARCHAR(150)  NOT NULL DEFAULT '', -- empty = skipped
  email_verified   TINYINT(1)    NOT NULL DEFAULT 0,
  language         VARCHAR(20)   NOT NULL DEFAULT '',
  pin_code         VARCHAR(6)    NOT NULL DEFAULT '',
  area             VARCHAR(120)  NOT NULL DEFAULT '',
  district         VARCHAR(80)   NOT NULL DEFAULT '',
  state            VARCHAR(80)   NOT NULL DEFAULT '',
  ownership        VARCHAR(30)   NOT NULL DEFAULT '',
  owner_permission VARCHAR(40)   NOT NULL DEFAULT '',
  property_type    VARCHAR(40)   NOT NULL DEFAULT '',
  panels_on        VARCHAR(40)   NOT NULL DEFAULT '',
  monthly_bill     INT           NULL,                -- rupees
  roof_space       VARCHAR(30)   NOT NULL DEFAULT '', -- "1,200 sq ft" or "Not sure"
  main_goal        VARCHAR(40)   NOT NULL DEFAULT '',
  power_cuts       VARCHAR(30)   NOT NULL DEFAULT '',
  install_when     VARCHAR(30)   NOT NULL DEFAULT '',
  payment          VARCHAR(30)   NOT NULL DEFAULT '',
  system_kw        DECIMAL(6,2)  NULL,
  panels           INT           NULL,
  total_cost       INT           NULL,                -- rupees
  subsidy          INT           NULL,
  investment       INT           NULL,
  monthly_saving   INT           NULL,
  savings_25y      INT           NULL,
  payback_years    DECIMAL(4,1)  NULL,
  consultation     VARCHAR(30)   NOT NULL DEFAULT '', -- Phone call | Site visit | Online video call
  consult_date     DATE          NULL,
  consult_time     VARCHAR(30)   NOT NULL DEFAULT '',
  booking_id       VARCHAR(12)   NOT NULL DEFAULT '',
  score            INT           NOT NULL DEFAULT 0,
  temperature      VARCHAR(10)   NOT NULL DEFAULT '', -- Hot | Warm | Cold
  status           VARCHAR(20)   NOT NULL DEFAULT 'New',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_journey (journey_id),
  KEY idx_mobile (mobile),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

// Kept on a later send so a re-sent plan never wipes a booking.
const BOOKING = ["consultation", "consult_date", "consult_time", "booking_id"];
// Never touched after the first save (status is the sales team's).
const FIXED = ["journey_id", "created_at", "status"];

let tableReady: Promise<unknown> | null = null;

function row(L: Lead, lang: Lang, stage: "plan" | "booked", journey: string | null) {
  const { score, temperature } = scoreLead(L);
  const e = L.bill && L.ptype && L.pay ? computeEstimate(L.bill, L.roof ?? null, categoryOf(L), L.state === HOME_STATE) : null;
  const booked = !!(L.bookingId && L.mode && L.date && L.slot);
  return {
    journey_id: journey,
    stage,
    name: L.name,
    mobile: L.mobile,
    mobile_verified: L.otpVerified ? 1 : 0,
    email: L.email,
    email_verified: L.emailVerified ? 1 : 0,
    language: LANGS.find((l) => l.code === lang)?.english ?? "English",
    pin_code: L.pin ?? "",
    area: L.area ?? "",
    district: L.district ?? "",
    state: L.state ?? "",
    ownership: L.own ? (L.own === "own" ? "Own property" : "Rented") : "",
    owner_permission: L.own === "rented" && L.ownerOk ? O.ownerOk.opts[L.ownerOk] : "",
    property_type: L.ptype ? O.ptype.opts[L.ptype] : "",
    panels_on: L.roofType ? O.roofType.opts[L.roofType] : "",
    monthly_bill: L.bill ?? null,
    roof_space: L.roof === undefined ? "" : L.roof === null ? "Not sure" : `${L.roof.toLocaleString("en-IN")} sq ft`,
    main_goal: L.goal ? O.goal.opts[L.goal] : "",
    power_cuts: L.cuts ? O.cuts.opts[L.cuts] : "",
    install_when: L.when ? O.when.opts[L.when] : "",
    payment: L.pay ? O.pay.opts[L.pay] : "",
    system_kw: e?.kw ?? null,
    panels: e?.panels ?? null,
    total_cost: e ? Math.round(e.cost) : null,
    subsidy: e ? Math.round(e.subsidy) : null,
    investment: e ? Math.round(e.investment) : null,
    monthly_saving: e ? Math.round(e.monthlySaving) : null,
    savings_25y: e ? Math.round(e.savings25) : null,
    payback_years: e ? Math.round(e.paybackYears * 10) / 10 : null,
    consultation: booked ? O.mode.opts[L.mode!] : "",
    consult_date: booked ? L.date! : null,
    consult_time: booked ? O.slot.opts[L.slot!] : "",
    booking_id: booked ? L.bookingId! : "",
    score,
    temperature,
  };
}

export async function saveLeadRow(
  L: Lead,
  lang: Lang,
  stage: "plan" | "booked",
  journey: string | null,
): Promise<{ ok: true; id: number } | { ok: false; reason: string }> {
  try {
    const pool = db();
    tableReady ??= pool.query(CREATE_TABLE).catch((err) => {
      tableReady = null; // try again on the next lead
      throw err;
    });
    await tableReady;

    const r = row(L, lang, stage, journey);
    const cols = Object.keys(r);
    const updates = cols
      .filter((c) => !FIXED.includes(c))
      .map((c) =>
        c === "stage"
          ? "stage = IF(stage = 'booked', 'booked', VALUES(stage))"
          : BOOKING.includes(c)
            ? `${c} = IF(VALUES(booking_id) = '', ${c}, VALUES(${c}))`
            : `${c} = VALUES(${c})`,
      );
    // LAST_INSERT_ID(id) makes insertId the row's id on an update too.
    const sql = `INSERT INTO saathi_leads (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), ${updates.join(", ")}`;
    const [res] = await pool.execute(sql, Object.values(r));
    return { ok: true, id: (res as { insertId: number }).insertId };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
