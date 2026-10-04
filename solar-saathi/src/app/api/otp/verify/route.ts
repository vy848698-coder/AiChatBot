// Checks the SMS code the user typed against the ticket from /api/otp/send.
// POST { mobile, code, ticket } →
//   { ok: true, proof }   proof: signed "this mobile is verified", kept with the lead
//   { ok: false, error: "wrong", triesLeft } | { ok: false, error: "expired" | "too_many" | "used" | "invalid" | "unavailable" | "limit" }

import { proofFor, verifyTicket } from "@/lib/otp";
import { checkSmsCode } from "@/lib/phone/sms";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanMobile } from "@/lib/validate";

export async function POST(request: Request) {
  let body: { mobile?: unknown; code?: unknown; ticket?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const mobile = typeof body.mobile === "string" ? cleanMobile(body.mobile) : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const ticket = typeof body.ticket === "string" ? body.ticket : "";
  if (mobile.length !== 10 || !/^\d{6}$/.test(code) || !ticket || ticket.length > 2000) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Slows down guessing across many tickets from one device.
  const r = rateLimit(`smsverify|${clientIp(request)}`, 60, 3600_000);
  if (!r.ok) return Response.json({ ok: false, error: "limit", retryAfter: r.retryAfter }, { status: 429 });

  const subject = `tel:${mobile}`;
  const result = await verifyTicket(ticket, subject, code, (ref, c) => checkSmsCode(mobile, ref, c));
  if (result.ok) return Response.json({ ok: true, proof: proofFor(subject) });
  return Response.json(
    { ok: false, error: result.reason, ...(result.reason === "wrong" ? { triesLeft: result.triesLeft } : {}) },
    { status: result.reason === "unavailable" ? 503 : 200 },
  );
}
