// Sends a 6-digit code to the user's mobile by SMS.
// POST { mobile } →
//   { ok: true, ticket, resendAfter, expiresIn, devCode? }
//   { ok: true, checked: true }   SMS code switched off: the number passed the checks, no SMS sent
//   { ok: false, error: "invalid" | "fake" | "wait" | "limit" | "unavailable", retryAfter? }
// The number is checked first (format, placeholders, India's numbering plan).
// The ticket is signed; it holds a hash of our code, or the SMS provider's
// reference when the provider made the code.

import { CODE_TTL_MS, issueTicket, newCode, proofFor, secretReady } from "@/lib/otp";
import { checkMobile } from "@/lib/phone/check";
import { sendSmsCode, smsMode, smsOtpOn } from "@/lib/phone/sms";
import { clientIp, isTestRequest, rateLimit, undoHit } from "@/lib/rateLimit";
import { cleanMobile } from "@/lib/validate";

const RESEND_AFTER_S = 30;
// A rejected number is a normal answer (200 with ok: false); only broken
// requests, rate limits and outages use error statuses.
const fail = (error: string, status = 200, extra: object = {}) => Response.json({ ok: false, error, ...extra }, { status });

export async function POST(request: Request) {
  let body: { mobile?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("invalid", 400);
  }
  const mobile = typeof body.mobile === "string" ? cleanMobile(body.mobile) : "";

  const check = checkMobile(mobile);
  if (!check.ok) return fail(check.reason);

  // SMS code switched off: the checks above are the whole step.
  if (!smsOtpOn()) {
    const r = rateLimit(`mobchk|${clientIp(request)}`, 60, 3600_000);
    if (!r.ok) return fail("limit", 429, { retryAfter: r.retryAfter });
    // Signed "this number passed our checks": lets the lead reach the owner
    // even if the customer skips the email (api/lead accepts it as proof).
    return Response.json({ ok: true, checked: true, proof: secretReady() ? proofFor(`chk:tel:${mobile}`) : undefined });
  }

  if (!secretReady()) return fail("unavailable", 503);

  // One code per 30 s and 5 per hour for a number; 20 per hour per device.
  const ip = clientIp(request);
  const keys = [`sms30|${mobile}`, `smsh|${mobile}`, `smsip|${ip}`];
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

  const subject = `tel:${mobile}`;
  if (isTestRequest(request) || smsMode() === "off") {
    if (process.env.NODE_ENV === "production") {
      console.error("[sms] no SMS provider configured: set MC_CUSTOMER_ID and MC_PASSWORD");
      keys.forEach(undoHit);
      return fail("unavailable", 503);
    }
    const code = newCode();
    console.log(`[sms] SMS not configured (dev): code for ${mobile} is ${code}`);
    return Response.json({ ok: true, ticket: issueTicket(subject, code), resendAfter: RESEND_AFTER_S, expiresIn: CODE_TTL_MS / 1000, devCode: code });
  }

  const sent = await sendSmsCode(mobile);
  if (!sent.ok) {
    keys.forEach(undoHit); // our failure shouldn't use up their attempts
    if (sent.reason === "wait") return fail("wait", 429, { retryAfter: RESEND_AFTER_S });
    if (sent.reason === "limit") return fail("limit", 429);
    if (sent.reason === "invalid") return fail("invalid");
    return fail("unavailable", 503);
  }
  return Response.json({ ok: true, ticket: issueTicket(subject, null, sent.ref), resendAfter: RESEND_AFTER_S, expiresIn: CODE_TTL_MS / 1000 });
}
