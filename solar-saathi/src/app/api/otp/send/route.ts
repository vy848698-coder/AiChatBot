// Sends a mobile OTP. DEMO MODE for now: no SMS goes out and the code is
// OTP_DEMO_CODE (default 123456). Swap the body for MSG91 / Twilio Verify
// (DLT-registered template) when going live; the client stays the same.

export async function POST(request: Request) {
  const { mobile } = (await request.json().catch(() => ({}))) as { mobile?: string };
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return Response.json({ ok: false, error: "invalid_mobile" }, { status: 400 });
  }
  return Response.json({ ok: true, demo: true, resendAfter: 30 });
}
