# Solar Saathi (Clans Machina)

AI voice chatbot for rooftop solar in Odia, Hindi and English. The research and the full build plan are in [`../docs/01-research-and-build-plan.md`](../docs/01-research-and-build-plan.md).

## Run

```bash
npm install
cp .env.example .env.local   # add SARVAM_API_KEY for natural Odia/Hindi/English voice
npm run dev                  # http://localhost:3005 · phones on the same Wi-Fi: http://<PC-LAN-IP>:3005
```

## What's built

The whole customer journey from the client brief (PDF §1–3, §5), with Saathi (a 3D robot, 2D fallback without WebGL) speaking every step in Odia / Hindi / English:

| Section | Steps (follow-ups only when they apply) |
|---|---|
| Welcome | Fly-in, silent hello (aloud after first tap), language choice |
| 1 · About you | Name → mobile → **OTP** (demo code `123456`, resend timer, change number) → email → review (edit any field) |
| 2 · Location | PIN code → state & district **auto-filled from India Post** (editable) → area (chips from the PIN, or typed) |
| 3 · Your home | Own/rented (→ owner's permission) · property type (flat → own terrace or society roof) · monthly bill slider ₹500–₹10,000 (or exact amount above) · roof space (or "not sure") · goal (backup → daily power cuts) · install timing · payment |
| 4 · Your plan | Client's calculator (`lib/estimate.ts`, same numbers as clansmachina.com): kW, panels, cost, central + Odisha subsidy, investment, monthly & 25-year savings, payback, EMI (bank/EMI), CO₂ |
| 5 · Book | Free consultation? → phone / site visit / online → date (Mon–Sat) → time slot → confirmation (booking ID, district team) — or "Not now" → plan saved |
| Always | **Talk to an Expert** (call, WhatsApp with the customer's details, callback, toll-free) · Back = previous question with its answer cleared |

Every answer is saved as one lead (`lib/lead.ts`) with a **Hot / Warm / Cold** score, ready for Zoho Bigin.

### Demo / not live yet
- OTP: `/api/otp/send|verify` accept `123456` (`OTP_DEMO_CODE`). Swap in MSG91 / Twilio Verify with a DLT template.
- WhatsApp/SMS booking confirmation and Zoho Bigin sync are shown to the user but not sent yet.
- PIN lookup uses the public India Post API (`/api/pincode`); if it is down the user picks state/district by hand.

## Voice

| Situation | What plays |
|---|---|
| `SARVAM_API_KEY` set | Sarvam **Bulbul v3** via `/api/tts` (Odia `od-IN`, Hindi, English). The mascot's mouth follows the real audio. Server and browser both cache lines. |
| No key | The browser's built-in voice (usually no Odia) |
| No voice / muted | Text types out with the same timing; a one-time note explains why there's no sound |

`/api/tts` caps each request at 600 characters. Add rate limiting before going public.

## Structure

| Path | What |
|---|---|
| `src/components/SaathiApp.tsx` | Screen flow, language, mute, reset-on-back |
| `src/components/screens/WelcomeScreen.tsx` + `welcome/SolarScene.tsx` | First page and the animated SVG scene (timeline in `globals.css`, `.scene-*`) |
| `src/components/screens/ChatScreen.tsx` | The "About you" chat: questions, validation, read-back, confirm card, composer |
| `src/components/chat/Assistant.tsx` | Saathi header (mobile) / side panel with checklist (desktop) |
| `src/components/mascot/Mascot.tsx` | SVG mascot: lip-sync, blink, gaze, moods |
| `src/lib/voice.ts` · `src/app/api/tts/route.ts` | Voice engine and the Sarvam proxy |
| `src/lib/speech.ts` | How numbers and emails are spoken |
| `src/lib/i18n.ts` | All copy. **Hindi and Odia need a native-speaker review** |
