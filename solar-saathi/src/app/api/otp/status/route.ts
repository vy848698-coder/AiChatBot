// GET /api/otp/status: is this deployment set up to send real codes?
// Open it in a browser after changing Vercel settings. Shows only whether
// each setting is present, never its value.

import { mailMode } from "@/lib/email/mailer";
import { smsMode, smsOtpOn } from "@/lib/phone/sms";

export const dynamic = "force-dynamic";

export function GET() {
  const secret = (process.env.OTP_SECRET ?? "").length >= 32;
  const mobileOtp = smsOtpOn(); // off: number checked only, no SMS
  const sms = mobileOtp ? smsMode() : "off (number check only)";
  const email = mailMode();
  const missing = [
    ...(sms === "off" ? ["MC_CUSTOMER_ID", "MC_PASSWORD"] : []), // only when NEXT_PUBLIC_SMS_OTP=on
    ...(email === "off" ? ["SMTP_USER", "SMTP_PASS"] : []),
    ...(secret ? [] : ["OTP_SECRET (32+ characters)"]),
  ];
  return Response.json(
    { ready: missing.length === 0, mobileOtp, sms, email, otpSecret: secret, missing },
    { headers: { "Cache-Control": "no-store" } },
  );
}
