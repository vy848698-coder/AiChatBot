// Verifies a mobile OTP. DEMO MODE: accepts OTP_DEMO_CODE (default 123456).

export async function POST(request: Request) {
  const { mobile, code } = (await request.json().catch(() => ({}))) as { mobile?: string; code?: string };
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile) || !code || !/^\d{6}$/.test(code)) {
    return Response.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  const expected = process.env.OTP_DEMO_CODE || "123456";
  return Response.json({ ok: code === expected });
}
