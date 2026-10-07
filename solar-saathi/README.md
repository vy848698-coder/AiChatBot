# Solar Saathi (Clans Machina)

AI voice chatbot for rooftop solar in Odia, Hindi and English. The research and the full build plan are in [`../docs/01-research-and-build-plan.md`](../docs/01-research-and-build-plan.md).

> **Languages live: Hindi and English.** Odia is fully written (all copy, FAQ, voice set-up) but hidden from the language picker until the client asks for it. To bring it back, add `"or"` to `LIVE_LANGS` in `src/lib/i18n.ts`, then get the Odia text checked and pick an Odia voice.

## Run

```bash
npm install
cp .env.example .env.local   # optional: Azure/Sarvam key for an Odia voice
npm run dev                  # http://localhost:3005 · phones on the same Wi-Fi: http://<PC-LAN-IP>:3005
```

## What's built

The whole customer journey from the client brief (PDF §1–5), with Saathi (a 3D robot, 2D fallback without WebGL) speaking every step in Odia / Hindi / English:

The email is optional: **Skip this step** (email step) or **Skip email** (code step) goes straight to the review, where the email shows "Not given" with **+ Add**. The lead still reaches the owner: the server signs the checked mobile number as proof (`mobileCheck`), and reports say "Email: Not given (skipped)".

| Section | Steps (follow-ups only when they apply) |
|---|---|
| Welcome | Fly-in, silent hello (aloud after first tap), language choice |
| 1 · About you | Name → mobile (real-number check) → **SMS code** (6 digits, resend timer, change number) → email (typo check: "did you mean …@gmail.com?") → **email code** (6 digits emailed, 10 min) → review (edit any field) |
| 2 · Location | PIN code → state & district **auto-filled from India Post** (editable) → area (chips from the PIN, or typed) |
| 3 · Your home | Own/rented (→ owner's permission) · property type (flat → own terrace or society roof) · monthly bill slider ₹500–₹10,000 (or exact amount above) · roof space (or "not sure") · goal (backup → daily power cuts) · install timing · payment |
| 4 · Your plan | Client's calculator (`lib/estimate.ts`, same numbers as clansmachina.com): kW, panels, cost, central + Odisha subsidy, investment, monthly & 25-year savings, payback, EMI (bank/EMI), CO₂ |
| 5 · Book | "Book my free consultation" on the plan → phone / site visit / online → date (Mon–Sat) → time slot → confirmation (booking ID, district team) — or **"Have questions? Ask Saathi first"** → the FAQ, which has its own "Book my free consultation" button (Back from booking returns to the FAQ) |
| 6 · FAQ | From the plan (before booking) or after the booking (**"Have more questions?"**): **Ask Saathi · Solar FAQ**, Call, WhatsApp, Callback. The FAQ has the PDF's 7 topics (basics, subsidy, savings, finance, installation, net metering, warranty & care) with 38 questions. Saathi **speaks each answer**, and the card shows one **key fact** (e.g. "Up to ₹1,38,000 in Odisha") plus related questions. Customers can also **type or speak their own question** in any of the 3 languages. If nothing matches, Saathi says so and offers the expert |
| Always | **Talk to an Expert** (call, WhatsApp with the customer's details, callback, toll-free) · Back = previous question with its answer cleared |

Saathi reacts to every answer before the next question (e.g. the subsidy goal → "In Odisha you can get up to ₹1,38,000"), using only figures from the client's calculator.

**Input checks** (`lib/validate.ts`): names (letters only, no "aaaa"), mobile (10 digits, starts 6–9, rejects 9999999999 / 9876543210), email (strict format + common domain typos), PIN (6 digits, starts 1–8), area (real words), exact bill (₹10,001–₹10,00,000). Each failure gets a specific spoken message.

Every answer is saved as one lead (`lib/lead.ts`) with a **Hot / Warm / Cold** score, ready for Zoho Bigin. FAQ questions asked are saved on the lead (`faq`) and go into the WhatsApp message, so the agent doesn't have to ask again.

## Lead data on WhatsApp

Everything the customer answers (details, location, home, plan, booking; not the FAQ) is saved on their device as they go (`lib/lead.ts`) and reaches WhatsApp two ways (`lib/leadMessage.ts` builds one report that every message is drawn from):

| Way | When | Setting |
|---|---|---|
| **Customer taps WhatsApp** (after booking, or Talk to an expert) | Their WhatsApp opens with all their details typed in; they tap Send | `WHATSAPP_NUMBER` in `src/lib/contact.ts` (your number to test, then the client's) |
| **Owner email** (automatic, free via the Gmail SMTP above) | Same two moments, as a designed report: Hot/Warm/Cold, one-tap Call / WhatsApp / Email, key numbers, then numbered sections (customer → location → home → plan → consultation). Replying writes to the customer | `LEAD_EMAIL_TO` in `.env.local` / Vercel, or the default address in `src/lib/email/leadEmail.ts` |
| **Owner alert** (automatic, free via CallMeBot) | When the plan is shown ("New solar lead", Hot/Warm/Cold, tap-to-chat link) and when they book ("Consultation booked") | `CALLMEBOT_WHATSAPP=91XXXXXXXXXX:APIKEY` in `.env.local` / Vercel (see `.env.example`) |

Alerts go only for customers whose email was verified (server-signed proof), every field is checked and the plan is recalculated on the server (`api/lead`), so the endpoint can't be used to spam the owner. Without `CALLMEBOT_WHATSAPP`, development prints the alert in the terminal instead. When the client moves to the WhatsApp Business API, only `lib/whatsappAlert.ts` changes.

## FAQ assistant

All content is in `src/lib/faq.ts`, separate from the screens so it can later move to the admin-editable knowledge base. Sources: the client's own site (`/faq.html` and the on-grid / off-grid / hybrid guides) first, then PM Surya Ghar, Odisha (OREDA top-up ₹25k / ₹50k / ₹60k) and TP Odisha DISCOMs. Figures match the calculator. **Checked Oct 2026: recheck subsidy and loan figures when the schemes change.**

- **Edit an answer:** change `a` (spoken, numbers in words) and `k` (the key fact) in all three languages, then run `npm run voice:build`.
- **A question didn't match:** add it to `scripts/check-faq.ts`, add keywords to that item in `ITEMS` (`"a+b"` means both words must appear), then run `npm run faq:check` until it passes.
- Matching is local keyword scoring (no AI cost, works offline). A cloud model can replace `matchFaq` later for open-ended questions.

### Demo / not live yet
- SMS code: sent for real once `MC_CUSTOMER_ID` / `MC_PASSWORD` are set (see below); without them, development shows the code on screen.
- WhatsApp/SMS booking confirmation and Zoho Bigin sync are not built yet (the copy only says "our team will confirm").
- Email code: sent for real once `SMTP_USER` / `SMTP_PASS` are set (see below); without them, development shows the code on screen.
- PIN lookup uses the public India Post API (`/api/pincode`); if it is down the user picks state/district by hand.

## Mobile verification (SMS)

> **Currently OFF** (Oct 2026, waiting for the client's decision because SMS is paid). The number is still checked on the server (rules below), then the user goes straight to the email step, and Saathi says "your number is saved", not "verified". All the SMS code is kept: set `NEXT_PUBLIC_SMS_OTP=on` (plus the `MC_` keys) and redeploy to turn it back on.

Before any SMS: the number must be 10 digits starting 6–9, not a placeholder (9999999999, 9876543210, 9123456789, 7000000000…), and a mobile number under India's numbering plan (libphonenumber). Then a 6-digit code is texted and must be typed back. Same rules as the email code: 10 minutes, 5 tries (then a fresh code), resend after 30 s, max 5 per number per hour, 20 per device per hour, and a server-signed `mobileProof` on the lead.

**Sending:** Message Central VerifyNow: no DLT registration, no monthly fee, free signup credits, then ₹0.20 per OTP (only if you top up). Message Central generates the code (valid about 60 s) and checks it; we never see or store it. Sign up at <https://www.messagecentral.com>, then in `.env.local`:

```
MC_CUSTOMER_ID=C-XXXXXXXX
MC_PASSWORD=<your Message Central password>
```

Code: `src/lib/phone/`, `src/lib/otp.ts` (shared with email) and `src/app/api/otp/`.

**On Vercel** (Project → Settings → Environment Variables, then Redeploy):

| Variable | Value |
|---|---|
| `MC_CUSTOMER_ID` | from Message Central (C-…) |
| `MC_PASSWORD` | your Message Central login password |
| `OTP_SECRET` | 32+ random characters, **required**: without it no SMS or email code is sent |
| `SMTP_USER` / `SMTP_PASS` | the Gmail + app password, for the email code step |

Then open `https://<your-app>.vercel.app/api/otp/status`. It must say `"ready": true`; otherwise `missing` lists what's not set (values are never shown).

Automated tests send the header `x-saathi-test: 1`, which (in development only) shows codes on screen instead of sending real SMS/email.

## Email verification

After the email is typed, the server checks the address before sending anything: format, throwaway inboxes (mailinator…) and whether the domain exists and accepts mail (DNS MX lookup, with public-DNS and DNS-over-HTTPS fallbacks). Wrong addresses get an instant spoken message. Then a 6-digit code is emailed (branded, in the user's language) and must be typed back.

| Rule | Value |
|---|---|
| Code | 6 random digits (crypto), valid 10 minutes, never stored or sent back in readable form |
| Tries | 5 per code; then a fresh code is sent automatically (also when expired) |
| Resend | after 30 s; max 5 codes per email per hour, 20 per device per hour |
| Proof | a server-signed `emailProof` is saved with the lead for the CRM step |

**Sending (free):** Gmail, 500 recipients/day. On the Gmail account, turn on 2-Step Verification, create an App Password at <https://myaccount.google.com/apppasswords>, then in `.env.local`:

```
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
OTP_SECRET=<32+ random characters, required in production>
```

Any other SMTP service (Brevo 300/day, Zoho, Resend…) works with `SMTP_HOST` / `SMTP_PORT` too; use one with the client's own domain (SPF/DKIM set up) for the best inbox placement. Code: `src/lib/email/` and `src/app/api/email-otp/`.

## Voice

| Language | Voice |
|---|---|
| English | Microsoft **Prabhat** (en-IN, male), +30% speed: free, no key |
| Hindi | Microsoft **Madhur** (hi-IN, male), +30% speed: free, no key |
| Odia | Azure Speech free tier (`or-IN-SukantNeural`) or Sarvam, once a key is in `.env.local`; until then the browser voice or text only |

Change a voice with `TTS_EN` / `TTS_HI` / `TTS_OR` in `.env.local` (`/voice-lab` lets you hear them all and prints the line).

**Pre-recorded voice.** Saathi speaks sentence by sentence. Every fixed sentence is recorded once into `public/voice/{lang}/*.mp3` (+ `manifest.json`), so it plays instantly and stays the same even if the free service changes. Only sentences with a name, number or email are made live by `/api/tts`, and the app loads those ahead (while the user types or reads). **After changing any copy or voice, run:**

```bash
npm run voice:build   # records only new/changed sentences, deletes unused ones
```

Silence around each clip is trimmed and sentences are joined with short natural pauses; the mascot's mouth follows the real audio. If the cloud voice fails, the browser voice takes over, then text only.

`/api/tts` caps each request at 600 characters. Add rate limiting before going public.

## Structure

| Path | What |
|---|---|
| `src/components/SaathiApp.tsx` | Screen flow, language, mute, reset-on-back |
| `src/components/screens/WelcomeScreen.tsx` + `welcome/SolarScene.tsx` | First page and the animated SVG scene (timeline in `globals.css`, `.scene-*`) |
| `src/components/screens/ChatScreen.tsx` | The "About you" chat: questions, validation, read-back, confirm card, composer |
| `src/components/chat/Assistant.tsx` | Saathi header (mobile) / side panel with checklist (desktop) |
| `src/components/mascot/Mascot.tsx` | SVG mascot: lip-sync, blink, gaze, moods |
| `src/lib/voice.ts` · `src/app/api/tts/route.ts` | Voice engine (sentence clips, trimming, lip-sync) and the TTS proxy |
| `src/lib/tts/` · `scripts/build-voice.ts` | Voice catalog, engines (Edge / Azure / Sarvam), per-language choice, clip ids, recorder |
| `src/lib/validate.ts` | Every input check |
| `src/lib/speech.ts` | How numbers and emails are spoken |
| `src/lib/i18n.ts` · `src/lib/flowCopy.ts` · `src/lib/faq.ts` | All copy (faq.ts = FAQ content + matcher). **Odia needs a native-speaker review** |
| `src/components/flow/Faq.tsx` | FAQ screens: topics, questions, answer + key fact, ask bar with mic |
