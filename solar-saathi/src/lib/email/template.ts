// The verification email, in the user's language. Built for email apps, not
// browsers: 600px table layout, inline styles, solid colours behind every
// gradient (Outlook ignores gradients), no images (often blocked), and a plain
// text version alongside. Phone numbers match the expert sheet in the app.

import { PHONE, TOLL_FREE } from "../contact";
import type { Lang } from "../i18n";

type Copy = {
  subject: string; preheader: string; title: string; subtitle: string; hello: string; intro: string;
  codeLabel: string; valid: string; safety: string; subsidy: string; nextTitle: string; steps: [string, string, string];
  questions: string; call: string; tollFree: string; visit: string; ignore: string; why: string; team: string;
};

const COPY: Record<Lang, Copy> = {
  en: {
    subject: "{code} is your Solar Saathi verification code",
    preheader: "Use this code to verify your email. It is valid for 10 minutes.",
    title: "Verify your email",
    subtitle: "One quick step to unlock your personal solar plan.",
    hello: "Namaste {name},",
    intro: "Thank you for planning rooftop solar with us! Enter this code in Solar Saathi to verify your email:",
    codeLabel: "YOUR VERIFICATION CODE",
    valid: "Valid for 10 minutes",
    safety: "Never share this code with anyone. Clans Machina will never ask for it on a call.",
    subsidy: "Homes in Odisha can get up to ₹1,38,000 in solar subsidy.",
    nextTitle: "What happens next",
    steps: ["Enter the code and verify your email", "See your personal solar plan: savings, subsidy and payback", "Book a free consultation with our solar expert"],
    questions: "Questions? We're happy to help.",
    call: "Call",
    tollFree: "Toll-free",
    visit: "Visit clansmachina.com",
    ignore: "If you didn't request this code, you can safely ignore this email.",
    why: "You're receiving this because this email was entered on Solar Saathi by Clans Machina.",
    team: "Team Clans Machina",
  },
  hi: {
    subject: "{code} आपका Solar Saathi वेरिफ़िकेशन कोड है",
    preheader: "अपनी ईमेल वेरिफ़ाई करने के लिए यह कोड डालिए। यह 10 मिनट तक मान्य है।",
    title: "अपनी ईमेल वेरिफ़ाई करें",
    subtitle: "बस एक छोटा-सा स्टेप, और आपका पर्सनल सोलर प्लान तैयार।",
    hello: "नमस्ते {name},",
    intro: "हमारे साथ रूफ़टॉप सोलर प्लान करने के लिए धन्यवाद! अपनी ईमेल वेरिफ़ाई करने के लिए Solar Saathi में यह कोड डालिए:",
    codeLabel: "आपका वेरिफ़िकेशन कोड",
    valid: "10 मिनट तक मान्य",
    safety: "यह कोड किसी के साथ शेयर न करें। Clans Machina कभी भी कॉल पर यह कोड नहीं माँगेगा।",
    subsidy: "ओडिशा में घरों को ₹1,38,000 तक की सोलर सब्सिडी मिल सकती है।",
    nextTitle: "आगे क्या होगा",
    steps: ["कोड डालिए और अपनी ईमेल वेरिफ़ाई कीजिए", "अपना पर्सनल सोलर प्लान देखिए: बचत, सब्सिडी और लागत वसूली", "हमारे सोलर एक्सपर्ट के साथ फ़्री कंसल्टेशन बुक कीजिए"],
    questions: "कोई सवाल? हम मदद के लिए हाज़िर हैं।",
    call: "कॉल करें",
    tollFree: "टोल-फ़्री",
    visit: "clansmachina.com देखें",
    ignore: "अगर आपने यह कोड नहीं माँगा था, तो इस ईमेल को अनदेखा कर दीजिए।",
    why: "आपको यह ईमेल इसलिए मिली क्योंकि Clans Machina के Solar Saathi पर यह ईमेल आईडी डाली गई थी।",
    team: "टीम Clans Machina",
  },
  or: {
    subject: "{code} ଆପଣଙ୍କ Solar Saathi ଯାଞ୍ଚ କୋଡ",
    preheader: "ଆପଣଙ୍କ ଇମେଲ ଯାଞ୍ଚ ପାଇଁ ଏହି କୋଡ ଦିଅନ୍ତୁ। ଏହା 10 ମିନିଟ ପର୍ଯ୍ୟନ୍ତ ବୈଧ।",
    title: "ଆପଣଙ୍କ ଇମେଲ ଯାଞ୍ଚ କରନ୍ତୁ",
    subtitle: "ମାତ୍ର ଗୋଟିଏ ଛୋଟ ପଦକ୍ଷେପ, ଏବଂ ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ସୋଲାର ପ୍ଲାନ ପ୍ରସ୍ତୁତ।",
    hello: "ନମସ୍କାର {name},",
    intro: "ଆମ ସହ ରୁଫଟପ ସୋଲାର ଯୋଜନା କରିଥିବାରୁ ଧନ୍ୟବାଦ! ଆପଣଙ୍କ ଇମେଲ ଯାଞ୍ଚ ପାଇଁ Solar Saathi ରେ ଏହି କୋଡ ଦିଅନ୍ତୁ:",
    codeLabel: "ଆପଣଙ୍କ ଯାଞ୍ଚ କୋଡ",
    valid: "10 ମିନିଟ ପର୍ଯ୍ୟନ୍ତ ବୈଧ",
    safety: "ଏହି କୋଡ କାହା ସହ ସେୟାର କରନ୍ତୁ ନାହିଁ। Clans Machina କେବେ ବି କଲରେ ଏହି କୋଡ ମାଗିବ ନାହିଁ।",
    subsidy: "ଓଡ଼ିଶାରେ ଘରଗୁଡ଼ିକ ₹1,38,000 ପର୍ଯ୍ୟନ୍ତ ସୋଲାର ସବସିଡି ପାଇପାରିବେ।",
    nextTitle: "ଏହା ପରେ କ'ଣ ହେବ",
    steps: ["କୋଡ ଦିଅନ୍ତୁ ଏବଂ ଆପଣଙ୍କ ଇମେଲ ଯାଞ୍ଚ କରନ୍ତୁ", "ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ସୋଲାର ପ୍ଲାନ ଦେଖନ୍ତୁ: ସଞ୍ଚୟ, ସବସିଡି ଓ ଖର୍ଚ୍ଚ ଫେରସ୍ତ", "ଆମ ସୋଲାର ବିଶେଷଜ୍ଞଙ୍କ ସହ ମାଗଣା ପରାମର୍ଶ ବୁକ କରନ୍ତୁ"],
    questions: "କିଛି ପ୍ରଶ୍ନ ଅଛି? ଆମେ ସାହାଯ୍ୟ ପାଇଁ ପ୍ରସ୍ତୁତ।",
    call: "କଲ କରନ୍ତୁ",
    tollFree: "ଟୋଲ-ଫ୍ରି",
    visit: "clansmachina.com ଦେଖନ୍ତୁ",
    ignore: "ଯଦି ଆପଣ ଏହି କୋଡ ମାଗି ନାହାନ୍ତି, ତେବେ ଏହି ଇମେଲକୁ ଅଣଦେଖା କରନ୍ତୁ।",
    why: "Clans Machina ର Solar Saathi ରେ ଏହି ଇମେଲ ଆଇଡି ଦିଆଯାଇଥିବାରୁ ଆପଣ ଏହା ପାଇଛନ୍ତି।",
    team: "ଟିମ Clans Machina",
  },
};

const SITE = "https://clansmachina.com";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);

export function codeEmail(code: string, lang: Lang, name: string) {
  const c = COPY[lang];
  const who = name.trim().split(/\s+/)[0] || (lang === "hi" ? "जी" : lang === "or" ? "ଆଜ୍ଞା" : "there");
  const subject = fill(c.subject, { code });
  const hello = fill(c.hello, { name: who });
  const font = "'Segoe UI',Roboto,'Helvetica Neue','Noto Sans','Noto Sans Devanagari','Noto Sans Oriya',Arial,sans-serif";

  const step = (n: number, text: string) => `
<tr><td style="padding:0 0 12px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="width:34px;"><div style="width:28px;height:28px;line-height:28px;border-radius:14px;background:#3ecf8e;color:#05140c;font-size:14px;font-weight:800;text-align:center;">${n}</div></td>
<td valign="middle" style="padding-left:10px;font-size:16px;line-height:1.45;color:#22332c;">${esc(text)}</td>
</tr></table>
</td></tr>`;

  const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#e8efec;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(c.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#e8efec" style="background:#e8efec;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${font};">

<!-- hero -->
<tr><td bgcolor="#0b0f12" style="background-color:#0b0f12;background-image:linear-gradient(135deg,#0b0f12 0%,#10261e 55%,#1d4a35 100%);border-radius:24px 24px 0 0;padding:28px 32px 34px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:22px;font-weight:800;color:#ffffff;">Solar Saathi <span style="font-size:14px;font-weight:600;color:#3ecf8e;">by Clans Machina</span></td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr>
<td valign="middle" style="width:84px;">
<div style="width:72px;height:72px;line-height:72px;border-radius:36px;background-color:#ffc94d;background-image:radial-gradient(circle at 35% 35%,#fff3c4 0%,#ffcf5a 45%,#ff9b3d 100%);text-align:center;font-size:38px;box-shadow:0 0 0 8px rgba(255,201,77,.18);">☀️</div>
</td>
<td valign="middle" style="padding-left:16px;">
<div style="font-size:30px;line-height:1.2;font-weight:800;color:#ffffff;">${esc(c.title)}</div>
<div style="margin-top:8px;font-size:17px;line-height:1.45;color:#b8f5d9;">${esc(c.subtitle)}</div>
</td>
</tr></table>
</td></tr>

<!-- body -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:34px 32px 8px;">
<div style="font-size:19px;font-weight:700;color:#10201a;">${esc(hello)}</div>
<div style="margin-top:10px;font-size:17px;line-height:1.6;color:#33443d;">${esc(c.intro)}</div>
</td></tr>

<!-- code -->
<tr><td bgcolor="#ffffff" align="center" style="background:#ffffff;padding:22px 32px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#effcf5" style="background-color:#effcf5;background-image:linear-gradient(180deg,#f3fdf8,#e4f8ee);border:2px dashed #3ecf8e;border-radius:20px;">
<tr><td align="center" style="padding:22px 16px 24px;">
<div style="font-size:13px;font-weight:700;${lang === "en" ? "letter-spacing:2px;" : ""}color:#1fa971;">${esc(c.codeLabel)}</div>
<div style="margin-top:10px;font-size:50px;line-height:1;font-weight:800;letter-spacing:14px;padding-left:14px;color:#0b4d31;font-family:'Courier New',Consolas,monospace;">${code}</div>
<div style="margin-top:16px;"><span style="display:inline-block;background:#ffffff;border:1px solid #bfeed6;border-radius:999px;padding:7px 16px;font-size:14px;font-weight:600;color:#1b6b47;">⏱ ${esc(c.valid)}</span></div>
</td></tr>
</table>
</td></tr>

<!-- safety -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:16px 32px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fff8e6" style="background:#fff8e6;border-radius:14px;">
<tr><td style="padding:14px 16px;font-size:15px;line-height:1.5;color:#6b4e00;">🔒 ${esc(c.safety)}</td></tr>
</table>
</td></tr>

<!-- subsidy hook -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:22px 32px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0f2b20" style="background-color:#0f2b20;background-image:linear-gradient(120deg,#0f2b20,#17432f);border-radius:16px;">
<tr><td style="padding:18px 20px;font-size:17px;line-height:1.45;font-weight:700;color:#ffffff;">💰 <span style="color:#ffd36b;">${esc(c.subsidy)}</span></td></tr>
</table>
</td></tr>

<!-- next steps -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:26px 32px 8px;">
<div style="font-size:18px;font-weight:800;color:#10201a;padding-bottom:14px;">${esc(c.nextTitle)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${c.steps.map((s, i) => step(i + 1, s)).join("")}</table>
</td></tr>

<!-- help -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:14px 32px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3ebe7;">
<tr><td style="padding-top:22px;font-size:16px;line-height:1.6;color:#33443d;">
<div style="font-weight:700;color:#10201a;">${esc(c.questions)}</div>
<div style="margin-top:6px;">📞 ${esc(c.call)}: <a href="tel:${PHONE.tel}" style="color:#1fa971;font-weight:700;text-decoration:none;white-space:nowrap;">${PHONE.show}</a>
&nbsp;·&nbsp; ${esc(c.tollFree)}: <a href="tel:${TOLL_FREE.tel}" style="color:#1fa971;font-weight:700;text-decoration:none;white-space:nowrap;">${TOLL_FREE.show}</a></div>
</td></tr>
<tr><td style="padding-top:20px;">
<a href="${SITE}" style="display:inline-block;background:#22b574;background-image:linear-gradient(180deg,#5ae3a6,#22b574);color:#05140c;font-size:16px;font-weight:800;text-decoration:none;border-radius:14px;padding:14px 26px;">${esc(c.visit)} →</a>
</td></tr>
<tr><td style="padding-top:24px;font-size:16px;font-weight:700;color:#10201a;">${esc(c.team)} ☀️</td></tr>
</table>
</td></tr>

<!-- footer -->
<tr><td bgcolor="#f4f7f6" style="background:#f4f7f6;border-radius:0 0 24px 24px;padding:20px 32px;font-size:13px;line-height:1.6;color:#6b7c75;">
${esc(c.ignore)}<br>${esc(c.why)}<br>
<span style="color:#8a9a93;">Clans Machina · Bhubaneswar, Odisha · <a href="${SITE}" style="color:#1fa971;">clansmachina.com</a></span>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    hello,
    "",
    c.intro,
    "",
    `${c.codeLabel}: ${code}`,
    `(${c.valid})`,
    "",
    c.safety,
    "",
    c.subsidy,
    "",
    `${c.nextTitle}:`,
    ...c.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    c.questions,
    `${c.call}: ${PHONE.show} · ${c.tollFree}: ${TOLL_FREE.show}`,
    SITE,
    "",
    c.team,
    "",
    c.ignore,
    c.why,
  ].join("\n");
  return { subject, html, text };
}
