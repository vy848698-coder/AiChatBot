// Server only: sends the verification email over SMTP.
//
// Works with any SMTP service; set in .env.local:
//   Gmail (free, 500 recipients/day): SMTP_USER=you@gmail.com, SMTP_PASS=<16-char app password>
//   Others (Brevo, Zoho, Resend, Outlook…): also SMTP_HOST and SMTP_PORT.
//   EMAIL_FROM (optional): "Solar Saathi <you@gmail.com>"
// Dev only: EMAIL_TEST=ethereal sends to a throwaway test inbox and logs a
// link to view the message. With nothing set, no email goes out and the code
// is shown on screen in development (never in production).

import nodemailer, { type Transporter } from "nodemailer";
import type { Lang } from "../i18n";
import { codeEmail } from "./template";

export type MailMode = "smtp" | "ethereal" | "off";

export function mailMode(): MailMode {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  if (process.env.EMAIL_TEST === "ethereal" && process.env.NODE_ENV !== "production") return "ethereal";
  return "off";
}

type Cached = { transport: Transporter; from: string; key: string };
const g = globalThis as { __saathiMail?: Cached };

async function transport(): Promise<Cached> {
  const mode = mailMode();
  const key = `${mode}|${process.env.SMTP_HOST}|${process.env.SMTP_USER}`;
  if (g.__saathiMail?.key === key) return g.__saathiMail;

  const timeouts = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };
  let made: Cached;
  if (mode === "smtp") {
    const user = process.env.SMTP_USER!;
    const gmail = /@(gmail|googlemail)\.com$/i.test(user);
    const host = process.env.SMTP_HOST || (gmail ? "smtp.gmail.com" : "");
    if (!host) throw Object.assign(new Error("SMTP_HOST is not set"), { code: "ECONFIG" });
    const port = Number(process.env.SMTP_PORT || 465);
    made = {
      key,
      from: process.env.EMAIL_FROM || `"Solar Saathi · Clans Machina" <${user}>`,
      transport: nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // 587 upgrades with STARTTLS
        auth: { user, pass: process.env.SMTP_PASS!.replace(/\s+/g, "") }, // Google shows app passwords with spaces
        pool: true,
        maxConnections: 2,
        ...timeouts,
      }),
    };
  } else {
    const acc = await nodemailer.createTestAccount();
    made = {
      key,
      from: `"Solar Saathi (test)" <${acc.user}>`,
      transport: nodemailer.createTransport({ host: acc.smtp.host, port: acc.smtp.port, secure: acc.smtp.secure, auth: { user: acc.user, pass: acc.pass }, ...timeouts }),
    };
  }
  g.__saathiMail = made;
  return made;
}

export type SendResult = { ok: true; preview?: string } | { ok: false; reason: "rejected" | "config" | "unavailable" };

export async function sendCodeEmail(to: string, code: string, lang: Lang, name: string): Promise<SendResult> {
  const mail = codeEmail(code, lang, name);
  try {
    const { transport: t, from } = await transport();
    const info = await t.sendMail({
      from,
      to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      headers: { "X-Entity-Ref-ID": `${Date.now()}` }, // stops Gmail threading every code into one conversation
    });
    if (info.rejected?.length) return { ok: false, reason: "rejected" };
    const preview = mailMode() === "ethereal" ? nodemailer.getTestMessageUrl(info) || undefined : undefined;
    if (preview) console.log(`[email] test message for ${to}: ${preview}`);
    return { ok: true, preview };
  } catch (err) {
    const e = err as { code?: string; responseCode?: number; command?: string; message?: string };
    console.error("[email] send failed:", e.code, e.responseCode, e.command, e.message?.slice(0, 200));
    // The server refused this recipient (at RCPT TO): the address doesn't exist
    // or can't receive mail. Other 5xx errors, e.g. Gmail's "550 5.4.5 daily
    // sending limit exceeded", are our problem, not a wrong email.
    const quota = /5\.4\.5|limit|quota/i.test(e.message ?? "");
    if (!quota && (e.code === "EENVELOPE" || e.command === "RCPT TO")) return { ok: false, reason: "rejected" };
    if (e.code === "EAUTH" || e.code === "ECONFIG") return { ok: false, reason: "config" };
    g.__saathiMail = undefined; // reconnect next time
    return { ok: false, reason: "unavailable" };
  }
}
