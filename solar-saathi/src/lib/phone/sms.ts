// Server only: sends and checks the mobile OTP over SMS.
//
// Provider: Message Central VerifyNow (https://www.messagecentral.com): no DLT
// registration needed, free test credits, then about ₹0.10 per OTP. It
// generates the code, sends the SMS and checks it; we keep its verification
// id inside our signed ticket (lib/otp.ts), so tries, expiry and replays are
// still enforced on our side. Set in .env.local:
//   MC_CUSTOMER_ID=C-XXXXXXXX   MC_PASSWORD=<account password>   MC_EMAIL=<account email, optional>
// With nothing set, no SMS goes out and development shows the code on screen.

// MC_BASE_URL only for tests against a stand-in server.
const BASE = process.env.MC_BASE_URL || "https://cpaas.messagecentral.com";
const TIMEOUT_MS = 12_000;
const TOKEN_TTL_MS = 12 * 3600_000;

// The SMS code costs money per message, so it's off unless switched on with
// NEXT_PUBLIC_SMS_OTP=on (the page reads the same switch to show the code step).
// Off: the number is only checked (lib/phone/check.ts), no SMS is sent.
export const smsOtpOn = () => process.env.NEXT_PUBLIC_SMS_OTP === "on";

export type SmsMode = "messagecentral" | "off";
export const smsMode = (): SmsMode => (process.env.MC_CUSTOMER_ID && process.env.MC_PASSWORD ? "messagecentral" : "off");

type Token = { token: string; at: number; key: string };
const g = globalThis as { __saathiMcToken?: Token };

async function authToken(force = false) {
  const customerId = process.env.MC_CUSTOMER_ID!;
  const key = `${customerId}|${process.env.MC_PASSWORD}`;
  const cached = g.__saathiMcToken;
  if (!force && cached?.key === key && Date.now() - cached.at < TOKEN_TTL_MS) return cached.token;
  const q = new URLSearchParams({
    customerId,
    key: Buffer.from(process.env.MC_PASSWORD!).toString("base64"),
    scope: "NEW",
    country: "91",
  });
  if (process.env.MC_EMAIL) q.set("email", process.env.MC_EMAIL);
  const res = await fetch(`${BASE}/auth/v1/authentication/token?${q}`, { headers: { accept: "*/*" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  // A refusal still comes back as HTTP 200, with the reason in the body,
  // e.g. { status: 400, error: "customerId is invalid" }.
  const j = (await res.json().catch(() => ({}))) as { token?: string; status?: number; message?: string; error?: string };
  if (!j.token) {
    const why = j.error ?? j.message ?? "no token in reply";
    throw Object.assign(new Error(`login refused (${j.status ?? res.status}): ${why}. Check MC_CUSTOMER_ID (starts with C-) and MC_PASSWORD`), { code: "ECONFIG" });
  }
  g.__saathiMcToken = { token: j.token, at: Date.now(), key };
  return j.token;
}

type McResponse = { responseCode?: number | string; message?: string; data?: { verificationId?: string | number; verificationStatus?: string; errorMessage?: string | null } };

// Calls the API; on an auth failure gets a fresh token and tries once more.
async function call(method: "GET" | "POST", path: string, params: Record<string, string>): Promise<McResponse> {
  const q = new URLSearchParams({ customerId: process.env.MC_CUSTOMER_ID!, ...params });
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${BASE}${path}?${q}`, {
      method,
      headers: { accept: "*/*", authToken: await authToken(attempt > 0) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if ((res.status === 401 || res.status === 403) && attempt === 0) continue;
    return (await res.json().catch(() => ({}))) as McResponse;
  }
  throw new Error("auth failed twice");
}

export type SmsSend = { ok: true; ref: string } | { ok: false; reason: "wait" | "limit" | "invalid" | "config" | "unavailable" };

export async function sendSmsCode(mobile: string): Promise<SmsSend> {
  try {
    const r = await call("POST", "/verification/v3/send", { countryCode: "91", flowType: "SMS", mobileNumber: mobile, otpLength: "6" });
    const code = Number(r.responseCode);
    if (code === 200 && r.data?.verificationId) return { ok: true, ref: String(r.data.verificationId) };
    console.error("[sms] send refused:", code, [r.message, r.data?.errorMessage].filter(Boolean).join(" · "));
    if (code === 401) console.error("[sms] Message Central accepted the login but refused the token: the account isn't enabled for the API yet (check the dashboard / contact their support)");
    if (code === 506) return { ok: false, reason: "wait" }; // a code was just sent to this number
    if (code === 800) return { ok: false, reason: "limit" }; // too many codes for this number
    if (code === 511 || code === 400) return { ok: false, reason: "invalid" };
    if (code === 501) return { ok: false, reason: "config" }; // wrong customer id
    return { ok: false, reason: "unavailable" };
  } catch (err) {
    console.error("[sms] send failed:", (err as Error).message);
    return { ok: false, reason: (err as { code?: string }).code === "ECONFIG" ? "config" : "unavailable" };
  }
}

export async function checkSmsCode(mobile: string, ref: string, code: string): Promise<"ok" | "wrong" | "expired" | "error"> {
  try {
    const r = await call("GET", "/verification/v3/validateOtp", { countryCode: "91", mobileNumber: mobile, verificationId: ref, code, flowType: "SMS" });
    const rc = Number(r.responseCode);
    if (r.data?.verificationStatus === "VERIFICATION_COMPLETED" || rc === 703) return "ok"; // 703: already verified (double tap)
    if (rc === 702) return "wrong";
    if (rc === 705 || rc === 505) return "expired"; // 505: unknown verification id (e.g. replaced by a newer code)
    console.error("[sms] check refused:", rc, r.message, r.data?.errorMessage);
    return rc === 700 ? "wrong" : "error";
  } catch (err) {
    console.error("[sms] check failed:", (err as Error).message);
    return "error";
  }
}
