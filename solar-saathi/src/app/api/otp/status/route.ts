// GET /api/otp/status: is this deployment set up to send real codes?
// Open it in a browser after changing Vercel settings. Shows only whether
// each setting is present, never its value.

import { mailMode } from "@/lib/email/mailer";
import { smsMode, smsOtpOn } from "@/lib/phone/sms";
import { alertsOn } from "@/lib/whatsappAlert";

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
    // ownerWhatsApp: lead alerts to the owner (CALLMEBOT_WHATSAPP); optional, so not in `missing`.
    { ready: missing.length === 0, mobileOtp, sms, email, otpSecret: secret, ownerWhatsApp: alertsOn(), missing },
    { headers: { "Cache-Control": "no-store" } },
  );
}
