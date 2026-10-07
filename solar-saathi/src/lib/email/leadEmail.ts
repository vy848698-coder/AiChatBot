// Server only: the lead report emailed to the owner, every time a customer
// sees their plan and again when they book. Same facts and order as the
// WhatsApp alert (leadMessage.ts), laid out for email apps: 600px table
// layout, inline styles, solid colours behind every gradient, no images, and
// a plain-text version alongside. Replying goes straight to the customer.
//
// Who receives it: LEAD_EMAIL_TO in .env.local / Vercel (comma-separated),
// otherwise Clans Machina's address below.

import { PHONE } from "../contact";
import { rupees } from "../estimate";
import type { Lang } from "../i18n";
import type { Lead } from "../lead";
import { leadReport, tempIcon, whatsAppText, type Row } from "../leadMessage";
import { sendMail, type SendResult } from "./mailer";

const DEFAULT_TO = "info@clansmachina.com";

export const leadEmailTo = () =>
  (process.env.LEAD_EMAIL_TO || DEFAULT_TO)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const FONT = "'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

const TEMP = {
  Hot: { bg: "#fff1ec", fg: "#c2410c", border: "#fdc4ad" },
  Warm: { bg: "#fff8e6", fg: "#a16207", border: "#f6dd9a" },
  Cold: { bg: "#eef5ff", fg: "#1d4ed8", border: "#bcd3fb" },
};

export function leadEmail(L: Lead, lang: Lang) {
  const r = leadReport(L, lang, "team");
  const booked = r.booking.length > 0;
  const t = TEMP[r.temperature];
  const place = [L.district, L.state].filter(Boolean).join(", ");
  const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  const title = booked ? "Consultation booked" : "New solar lead";
  const subject = booked
    ? `✅ Consultation booked: ${r.name} · ${r.booking[0]?.value}, ${r.booking[1]?.value.replace(/, \d{4}$/, "")}`
    : `${tempIcon(r.temperature)} New solar lead: ${r.name}${r.plan ? ` · ${r.plan.kw} kW` : ""}${L.district ? ` · ${L.district}` : ""} (${r.temperature})`;
  const preheader = `${r.temperature} lead (score ${r.score}) · ${r.name}${r.plan ? ` · ${r.plan.kw} kW plan` : ""}${place ? ` · ${place}` : ""}`;

  // One label/value line of a section.
  const row = (x: Row, last: boolean) => `
<tr>
<td valign="top" style="width:38%;padding:11px 12px 11px 0;${last ? "" : "border-bottom:1px solid #edf2ef;"}font-size:14px;color:#6b7c75;">${esc(x.label)}</td>
<td valign="top" style="padding:11px 0;${last ? "" : "border-bottom:1px solid #edf2ef;"}font-size:15px;font-weight:600;color:#10201a;word-break:break-word;">${esc(x.value)}${
    x.verified ? ` <span style="display:inline-block;margin-left:4px;background:#e4f8ee;color:#1b6b47;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700;white-space:nowrap;">✓ verified</span>` : ""
  }</td>
</tr>`;

  // A numbered section card.
  const section = (n: number, heading: string, body: string) => `
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:8px 28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:14px 0 6px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="middle"><div style="width:26px;height:26px;line-height:26px;border-radius:13px;background:#3ecf8e;color:#05140c;font-size:13px;font-weight:800;text-align:center;">${n}</div></td>
<td valign="middle" style="padding-left:10px;font-size:17px;font-weight:800;color:#10201a;">${esc(heading)}</td>
</tr></table>
</td></tr>
<tr><td>${body}</td></tr>
</table>
</td></tr>`;

  const table = (list: Row[]) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #e4f8ee;">${list.map((x, i) => row(x, i === list.length - 1)).join("")}</table>`;

  const tile = (label: string, value: string, color: string) => `
<td width="50%" valign="top" style="padding:5px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f9f6" style="background:#f4f9f6;border:1px solid #dcefe5;border-radius:14px;">
<tr><td style="padding:12px 14px;">
<div style="font-size:12px;font-weight:700;color:#6b7c75;text-transform:uppercase;letter-spacing:.5px;">${esc(label)}</div>
<div style="margin-top:4px;font-size:22px;line-height:1.2;font-weight:800;color:${color};white-space:nowrap;">${esc(value)}</div>
</td></tr>
</table>
</td>`;

  const button = (href: string, label: string, bg: string, fg: string) =>
    `<td style="padding:4px;"><a href="${href}" style="display:block;text-align:center;background:${bg};color:${fg};font-size:14px;font-weight:800;text-decoration:none;border-radius:12px;padding:12px 8px;white-space:nowrap;">${label}</a></td>`;

  const sections: string[] = [];
  let n = 0;
  if (r.customer.length) sections.push(section(++n, "Customer details", table(r.customer)));
  if (r.location.length) sections.push(section(++n, "Location", table(r.location)));
  if (r.home.length) sections.push(section(++n, "Home & requirements", table(r.home)));
  if (r.plan) sections.push(section(++n, "Solar plan (Saathi estimate)", table(r.plan.rows)));
  sections.push(
    section(
      ++n,
      "Consultation",
      booked
        ? table(r.booking)
        : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fff8e6" style="background:#fff8e6;border-radius:12px;"><tr><td style="padding:14px 16px;font-size:15px;line-height:1.5;color:#6b4e00;"><b>Not booked yet.</b> Call the customer to book the free consultation.</td></tr></table>`,
    ),
  );

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#e8efec;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#e8efec" style="background:#e8efec;">
<tr><td align="center" style="padding:24px 10px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${FONT};">

<!-- header -->
<tr><td bgcolor="#0b0f12" style="background-color:#0b0f12;background-image:linear-gradient(135deg,#0b0f12 0%,#10261e 55%,#1d4a35 100%);border-radius:22px 22px 0 0;padding:24px 28px 26px;">
<div style="font-size:15px;font-weight:800;color:#ffffff;">Solar Saathi <span style="font-size:13px;font-weight:600;color:#3ecf8e;">by Clans Machina</span></div>
<div style="margin-top:18px;font-size:13px;font-weight:700;letter-spacing:1px;color:#3ecf8e;text-transform:uppercase;">${booked ? "✅" : "☀️"} ${esc(title)}</div>
<div style="margin-top:6px;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">${esc(r.name)}</div>
${place ? `<div style="margin-top:6px;font-size:16px;color:#b8f5d9;">📍 ${esc([L.area, place].filter(Boolean).join(", "))}</div>` : ""}
${
  booked // the first thing the owner needs on a booking: what, when
    ? `<div style="margin-top:14px;background:#163d2c;border:1px solid #2f6b4f;border-radius:12px;padding:10px 14px;font-size:15px;font-weight:700;line-height:1.45;color:#ffffff;">📅 ${esc(r.booking.slice(0, 3).map((x) => x.value).join(" · "))}</div>`
    : ""
}
<div style="margin-top:16px;">
<span style="display:inline-block;background:${t.bg};color:${t.fg};border:1px solid ${t.border};border-radius:999px;padding:6px 14px;font-size:14px;font-weight:800;">${tempIcon(r.temperature)} ${r.temperature} lead · score ${r.score}</span>
<span style="display:inline-block;margin-left:6px;color:#9fb5ab;font-size:13px;">${esc(when)}</span>
</div>
</td></tr>

<!-- quick actions -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:20px 24px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
${button(`tel:+91${r.mobile}`, "📞 Call", "#22b574", "#05140c")}
${button(`https://wa.me/91${r.mobile}`, "💬 WhatsApp", "#25d366", "#062b14")}
${r.email ? button(`mailto:${r.email}`, "✉️ Email", "#eef3f1", "#10201a") : ""}
</tr></table>
</td></tr>

${
  r.plan
    ? `<!-- key numbers -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:10px 23px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>${tile("System size", `${r.plan.kw} kW`, "#10201a")}${tile("Govt subsidy", r.plan.subsidy ? rupees(r.plan.subsidy) : "None", "#1b8a5a")}</tr>
<tr>${tile("Customer invests", rupees(r.plan.investment), "#b7791f")}${tile("Monthly saving", rupees(r.plan.monthlySaving), "#1b8a5a")}</tr>
</table>
</td></tr>`
    : ""
}

${sections.join("")}

<!-- footer -->
<tr><td bgcolor="#f4f7f6" style="background:#f4f7f6;border-radius:0 0 22px 22px;padding:18px 28px;font-size:13px;line-height:1.6;color:#6b7c75;">
Sent automatically by Solar Saathi ${booked ? "when the customer booked a consultation" : "when the customer saw their solar plan"}. The customer chatted in ${esc(r.langName)}.<br>
Plan figures come from the Clans Machina calculator; the final price follows the site survey.<br>
${r.email ? "Reply to this email to write to the customer directly. · " : ""}Office: <a href="tel:${PHONE.tel}" style="color:#1fa971;text-decoration:none;">${PHONE.show}</a>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  // Plain text: the WhatsApp alert without its *bold* markers.
  const text = whatsAppText(L, lang, "team").replace(/\*/g, "");
  return { subject, html, text };
}

export async function sendLeadEmail(L: Lead, lang: Lang): Promise<SendResult> {
  return sendMail({ to: leadEmailTo(), replyTo: L.email || undefined, ...leadEmail(L, lang) });
}
