// GET /api/otp/status: is this deployment set up to send real codes and to
// save leads? Open it in a browser after changing Vercel settings. Shows only
// whether each setting is present (and whether the database answers), never a value.

import { mailMode } from "@/lib/email/mailer";
import { dbReady } from "@/lib/leadStore";
import { smsMode, smsOtpOn } from "@/lib/phone/sms";
import { alertsOn } from "@/lib/whatsappAlert";

export const dynamic = "force-dynamic";

export async function GET() {
  const secret = (process.env.OTP_SECRET ?? "").length >= 32;
  const mobileOtp = smsOtpOn(); // off: number checked only, no SMS
  const sms = mobileOtp ? smsMode() : "off (number check only)";
  const email = mailMode();
  const database = (await dbReady()) ? "ok" : "error"; // the saathi_leads table, created if missing
  const missing = [
    ...(sms === "off" ? ["MC_CUSTOMER_ID", "MC_PASSWORD"] : []), // only when NEXT_PUBLIC_SMS_OTP=on
    ...(email === "off" ? ["SMTP_USER", "SMTP_PASS"] : []),
    ...(secret ? [] : ["OTP_SECRET (32+ characters)"]),
    ...(database === "ok" ? [] : ["database (MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE)"]),
  ];
  return Response.json(
    // ownerWhatsApp: lead alerts to the owner (CALLMEBOT_WHATSAPP); optional, so not in `missing`.
    // leadEmailTo: false = lead emails go to the default address in email/leadEmail.ts.
    {
      ready: missing.length === 0,
      mobileOtp,
      sms,
      email,
      otpSecret: secret,
      database,
      leadEmailTo: !!process.env.LEAD_EMAIL_TO,
      ownerWhatsApp: alertsOn(),
      missing,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
