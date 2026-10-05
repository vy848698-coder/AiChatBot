// Server only: verification codes for email and mobile.
//
// The code is never stored or sent back in readable form. The server hands
// the browser a signed ticket { id, subject, expiry, hash(code) } (or, when an
// SMS provider generates and checks the code itself, the provider's reference
// instead of the hash). To verify, the browser returns the ticket with the
// code the user typed; the server checks the signature, the subject, the
// expiry and then the code. Tries per ticket are counted (max 5) and a used
// ticket can't be replayed. Subjects are "mail:<email>" or "tel:<mobile>", so
// an email code can never verify a phone number or the other way round.

import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_TTL_MS = 10 * 60_000;
export const MAX_TRIES = 5;

// Kept on globalThis so the dev server's hot reload doesn't wipe it.
type Store = { secret: string | null; tries: Map<string, { n: number; exp: number }>; used: Map<string, number> };
const store: Store = ((globalThis as { __saathiOtp?: Store }).__saathiOtp ??= { secret: null, tries: new Map(), used: new Map() });
const { tries, used } = store; // used: ticket id → expiry

// Read on first use (not at import), so a build without the env var still works.
function getSecret() {
  if (store.secret) return store.secret;
  const s = process.env.OTP_SECRET;
  if (s && s.length >= 32) return (store.secret = s);
  if (process.env.NODE_ENV === "production") throw new Error("OTP_SECRET (32+ characters) must be set in production");
  // Dev: a random secret per server start (codes sent before a restart stop working).
  return (store.secret = randomBytes(32).toString("hex"));
}

// Checked before any code is sent, so a missing secret never leaves the user
// with an SMS or email that the app can't then verify.
export function secretReady() {
  try {
    getSecret();
    return true;
  } catch {
    console.error("[otp] OTP_SECRET is not set (needs 32+ random characters): no codes can be sent");
    return false;
  }
}

const sign = (data: string) => createHmac("sha256", getSecret()).update(data).digest("base64url");
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

type Payload = { id: string; s: string; x: number; h?: string; r?: string };

// 6 digits from a cryptographically secure source ("000000"–"999999").
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

// `code`: our own code (stored as a hash). `ref`: the provider's reference
// when the provider made the code and will check it.
export function issueTicket(subject: string, code: string | null, ref?: string) {
  const id = randomBytes(12).toString("base64url");
  const p: Payload = { id, s: subject, x: Date.now() + CODE_TTL_MS };
  if (code) p.h = sign(`code|${id}|${subject}|${code}`);
  if (ref) p.r = ref;
  const body = b64(p);
  return `${body}.${sign(`ticket|${body}`)}`;
}

function sweep() {
  const now = Date.now();
  for (const [k, v] of tries) if (v.exp < now) tries.delete(k);
  for (const [k, exp] of used) if (exp < now) used.delete(k);
}

export type RemoteCheck = (ref: string, code: string) => Promise<"ok" | "wrong" | "expired" | "error">;

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "used" | "too_many" | "unavailable" }
  | { ok: false; reason: "wrong"; triesLeft: number };

export async function verifyTicket(ticket: string, subject: string, code: string, remote?: RemoteCheck): Promise<VerifyResult> {
  const [body, mac] = ticket.split(".");
  if (!body || !mac || !same(mac, sign(`ticket|${body}`))) return { ok: false, reason: "invalid" };
  let p: Payload;
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (p.s !== subject) return { ok: false, reason: "invalid" };
  if (Date.now() > p.x) return { ok: false, reason: "expired" };
  if (used.has(p.id)) return { ok: false, reason: "used" };

  sweep();
  const t = tries.get(p.id) ?? { n: 0, exp: p.x };
  if (t.n >= MAX_TRIES) return { ok: false, reason: "too_many" };

  let verdict: "ok" | "wrong" | "expired" | "error";
  if (p.h) verdict = same(p.h, sign(`code|${p.id}|${subject}|${code}`)) ? "ok" : "wrong";
  else if (p.r && remote) verdict = await remote(p.r, code);
  else return { ok: false, reason: "invalid" };

  if (verdict === "error") return { ok: false, reason: "unavailable" }; // provider down: not the user's fault, no try used
  if (verdict === "expired") return { ok: false, reason: "expired" };
  if (verdict === "wrong") {
    t.n++;
    tries.set(p.id, t);
    return t.n >= MAX_TRIES ? { ok: false, reason: "too_many" } : { ok: false, reason: "wrong", triesLeft: MAX_TRIES - t.n };
  }
  used.set(p.id, p.x);
  tries.delete(p.id);
  return { ok: true };
}

// Proof that this email or mobile was verified, kept with the lead so the CRM
// step can trust it without asking again.
export function proofFor(subject: string) {
  const at = Date.now();
  return `${at}.${sign(`verified|${subject}|${at}`)}`;
}

export function checkProof(subject: string, proof: string) {
  const [at, mac] = proof.split(".");
  return !!at && !!mac && same(mac, sign(`verified|${subject}|${at}`));
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
