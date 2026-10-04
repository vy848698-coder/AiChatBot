// Checks the code the user typed against the ticket from /api/email-otp/send.
// POST { email, code, ticket } →
//   { ok: true, proof }   proof: signed "this email is verified", kept with the lead
//   { ok: false, error: "wrong", triesLeft } | { ok: false, error: "expired" | "too_many" | "used" | "invalid" | "limit" }

import { proofFor, verifyTicket } from "@/lib/otp";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown; ticket?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const ticket = typeof body.ticket === "string" ? body.ticket : "";
  if (!email || !/^\d{6}$/.test(code) || !ticket || ticket.length > 2000) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Slows down guessing across many tickets from one device.
  const r = rateLimit(`verify|${clientIp(request)}`, 60, 3600_000);
  if (!r.ok) return Response.json({ ok: false, error: "limit", retryAfter: r.retryAfter }, { status: 429 });

  const result = await verifyTicket(ticket, `mail:${email}`, code);
  if (result.ok) return Response.json({ ok: true, proof: proofFor(`mail:${email}`) });
  return Response.json({ ok: false, error: result.reason, ...(result.reason === "wrong" ? { triesLeft: result.triesLeft } : {}) });
}
