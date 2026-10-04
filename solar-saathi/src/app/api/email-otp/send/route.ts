// Sends a 6-digit code to the user's email.
// POST { email, lang, name } →
//   { ok: true, ticket, resendAfter, expiresIn, devCode? }
//   { ok: false, error: "invalid" | "no_domain" | "disposable" | "rejected" | "wait" | "limit" | "unavailable", retryAfter? }
// The ticket is signed and holds only a hash of the code; the browser sends
// it back with the typed code to /api/email-otp/verify.

import { checkEmail } from "@/lib/email/domain";
import { mailMode, sendCodeEmail } from "@/lib/email/mailer";
import { CODE_TTL_MS, issueTicket, newCode } from "@/lib/otp";
import type { Lang } from "@/lib/i18n";
import { clientIp, isTestRequest, rateLimit, undoHit } from "@/lib/rateLimit";

const RESEND_AFTER_S = 30;
// A rejected address is a normal answer (200 with ok: false); only broken
// requests, rate limits and outages use error statuses.
const fail = (error: string, status = 200, extra: object = {}) => Response.json({ ok: false, error, ...extra }, { status });

export async function POST(request: Request) {
  let body: { email?: unknown; lang?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("invalid", 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const lang: Lang = body.lang === "hi" || body.lang === "or" ? body.lang : "en";
  const name = typeof body.name === "string" ? body.name.slice(0, 60) : "";

  // Can this address receive mail at all? (format, throwaway inbox, domain)
  const check = await checkEmail(email);
  if (!check.ok) return fail(check.reason);

  // One code per 30 s and 5 per hour for an address; 20 per hour per device.
  const ip = clientIp(request);
  const keys = [`em30|${email}`, `emh|${email}`, `ip|${ip}`];
  const cool = rateLimit(keys[0], 1, RESEND_AFTER_S * 1000);
  if (!cool.ok) return fail("wait", 429, { retryAfter: cool.retryAfter });
  for (const [key, limit] of [[keys[1], 5], [keys[2], 20]] as const) {
    const r = rateLimit(key, limit, 3600_000);
    if (!r.ok) {
      undoHit(keys[0]);
      if (key === keys[2]) undoHit(keys[1]);
      return fail("limit", 429, { retryAfter: r.retryAfter });
    }
  }

  const code = newCode();
  const mode = isTestRequest(request) ? "off" : mailMode();
  if (mode === "off") {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] no SMTP configured: set SMTP_USER and SMTP_PASS");
      keys.forEach(undoHit);
      return fail("unavailable", 503);
    }
    console.log(`[email] SMTP not configured (dev): code for ${email} is ${code}`);
  } else {
    const sent = await sendCodeEmail(email, code, lang, name);
    if (!sent.ok) {
      keys.forEach(undoHit); // our failure shouldn't use up their attempts
      return sent.reason === "rejected" ? fail("rejected") : fail("unavailable", 503);
    }
  }

  return Response.json({
    ok: true,
    ticket: issueTicket(`mail:${email}`, code),
    resendAfter: RESEND_AFTER_S,
    expiresIn: CODE_TTL_MS / 1000,
    ...(mode === "off" ? { devCode: code } : {}),
  });
}
