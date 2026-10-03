# Clans Solar Saathi: Research & Build Plan

**Client:** Clans Machina (https://clansmachina.com) · **Product:** Solar Saathi, an AI voice chatbot for rooftop solar (Odia / Hindi / English)
**Inputs:** client requirement PDF (`Clans Solar Saathi – AI Voice Chatbot.pdf`) + reference experience `https://xr.flamapp.com/?ad=dPNGtGRwUHDG`
**Date:** 2 Oct 2026

---

## 0. The client: Clans Machina (clansmachina.com)

| | |
|---|---|
| Business | Premium rooftop solar for Residential (on-grid / off-grid / hybrid), Commercial, Housing Society; also EV chargers and Solar AMC |
| HQ | DCB-221, DLF Cyber City, Bhubaneswar, Odisha |
| Odisha service districts | Khordha (Bhubaneswar), Cuttack, Jajpur, Kendrapara, Jagatsinghpur, Baleswar, Ganjam, Bhadrak, Mayurbhanj, Kendujhar · plus 29+ cities across India |
| Credentials | MNRE-approved PM Surya Ghar vendor, ALMM modules, ISO 9001, BIS components, 4.8★ Google (1000+ reviews), 1,000+ installs |
| Promises to reuse in the bot | "Cut your bill to near zero in 18 days" · 0–18 days from survey to commissioning · money-back savings commitment · 25-yr performance warranty · 170 km/h storm-proof structure · EMI 5.5–9% |
| Contacts (for Talk to Expert) | +91 91241 65341 · Toll-free 1800 891 3731 · WhatsApp · info@clansmachina.com |
| Existing site tools | `calculator.html` (the "FRD" calculator, see §3), a basic "Solar Helper" chatbot, an FAQ page. **Solar Saathi replaces/upgrades the Solar Helper.** |
| Brand tokens (from their `styles.css`) | Dark base `#111518` / `#191d21` · primary **green `#3ecf8e`** (glow `rgba(62,207,142,.28)`) · blue `#4ea8de` · gold `#e8c468` · glass cards `rgba(255,255,255,.05)` with `rgba(255,255,255,.1)` borders · fonts **Inter** (body) + **Space Grotesk** (display) · radius 14px |

**Design consequence:** use the Flam *layout and motion* (mascot on top, glass card, step bar, pill buttons, count-up results) but in **Clans' palette**: dark glass with green glow, gold for the money figures, Space Grotesk headings. The sun-orange of the reference becomes Clans green + gold accents.

---

## 1. What the reference link actually is (teardown)

The link is the **PM Surya Ghar (MNRE) solar-estimate ad built by Flam** (`xr.flamapp.com`). I downloaded and read its source. It is not a chatbot. It is a **guided form with a talking mascot**, and that's what makes it feel personal.

### 1.1 The user journey

| # | Screen | What happens |
|---|---|---|
| 0 | **Onboarding card** | Blurred room background, bottom sheet "Ready to Play? / Unlock the next level experience" with a **Play** button. The tap is needed so the browser allows sound. |
| 1 | **AR intro + language pick** | Rear **camera opens** (`getUserMedia({video:{facingMode:'environment'}})`). A mascot video floats over the live camera feed ("airboard"). It reacts to phone tilt (`deviceorientation`), and you can pinch or drag it. The mascot asks for a language, which branches the video into the Hindi or English track. A "Calculate" tap opens the form. |
| 2 | **About you** (step 1/3) | Name + 10-digit mobile. A progress bar at the top shows *About you · Location · Consumption*. |
| 3 | **Location** (2/3) | State dropdown, then a dependent District dropdown (`districts.json`). |
| 4 | **Consumption** (3/3) | Two styled **sliders**: monthly bill ₹500–₹10,000 and sanctioned load 1–10 kW, each with a floating value bubble. |
| 5 | **Calculating** | The modal hides and a **spinning sun SVG** shows "Sizing your system… Checking solar generation & subsidies for {state}". It stays up for at least 1.6 s even if the API is faster. |
| 6 | **Results** | "Hi **{FirstName}**! Here's your solar plan estimate". Tiles show capacity (kW), total cost, Govt subsidy, "Bank loan <6% interest", and a large **Total lifetime savings** figure. Numbers **count up** with an ease-out animation in Indian format (₹5.68L / ₹1.21Cr). |
| 7 | **Nearby vendors** | Cards with vendor name, district, ★ rating, and **Call now** (`tel:`) / **WhatsApp Us** (`wa.me/91…`) buttons. |

### 1.2 Why it feels personal (the techniques)

1. **A different mascot clip plays on every screen**, with a **voice-over in the chosen language** that tells the user what to do on that screen. There are 5 screens × 2 languages, so 10 clips. Clips are transparent-background video (Flam's own `.vrt` format rendered in WebGL) plus separate `.m4a` audio.
2. **The user's name comes back** on the results screen ("Hi Rahul!").
3. **Glassmorphism UI**: a dark translucent card (`backdrop-filter: blur(36px)`) over the camera, orange/yellow solar palette, large rounded pill buttons, and white input fields with circular icons.
4. **Micro-animations**: slide-up sheets, a stepper bar that fills in, slider value bubbles, the rotating sun loader, count-up numbers.
5. **Content lives in config, not code**. Each campaign has a JSON manifest that lists the clips per screen per language, plus an `i18n.json` with copy for 12 Indian languages, **Odia (`or`) included**. Changing a clip or a line of copy needs no deploy.

### 1.3 Engineering lessons from their code (we should copy these)

- **Unlock audio on the first tap.** Mobile browsers (iOS especially) block sound until the user taps. They create one `AudioContext` inside the Play tap, play a 1-sample silent buffer, and reuse that context everywhere. Without this, the first voice line plays muted on iPhones.
- **Download each voice clip fully before playing it**, otherwise the first clip starts silent.
- **Capture the lead on every "Continue"**, not only at the end, so people who drop off halfway are still saved. They match records on name + mobile, so one session updates one record.
- **Keep PII out of analytics.** They track funnel events (`form_step_shown`, `form_validation_error`, `estimate_shown`, `vendor_contact`…) but send only "filled: true, length: 10" for name and phone, never the values.
- **Phone links:** use `<a href="tel:+91…" target="_top">`. A scripted `window.open` fails on iOS. WhatsApp links need the `91` prefix.
- **Don't auto-focus inputs.** It pops the mobile keyboard over the mascot.
- **Back** returns to the previous screen and **✕** restarts the experience.
- **Use the previous month's bill** in the estimate request. The current month over-sizes the system.

### 1.4 What the client wants *beyond* the reference

The Flam ad is a 3-step calculator. The PDF asks for much more:

| Reference has | Client PDF additionally needs |
|---|---|
| Hindi/English | **Odia** + Hindi + English, **voice in and voice out** |
| Pre-recorded clips only | **Natural-language AI conversation** (FAQ by voice, free questions) |
| Name + mobile | + **OTP verification**, email, district, location, **PIN code** |
| Bill + load sliders | **6 qualification questions with conditional follow-ups** |
| Estimate + vendor list | Estimate + **free consultation booking** (call / site visit / online, calendar, WhatsApp/SMS confirmation, district team assignment) |
| None | Permanent **Talk to an Expert** button (live call, WhatsApp, callback) with full chat history handed to the agent |
| Flam's lead API | **Zoho Bigin CRM**: contacts, pipeline records, Hot/Warm/Cold scoring, district assignment, WhatsApp follow-ups |
| None | **Electricity bill upload** (photo/PDF → AI reads units and amount) |
| None | **Admin dashboard** + **editable AI knowledge base** |

**Product idea:** keep the Flam look (mascot, glass cards, step bar, animations), but turn the form into a **conversational "chat-board"**. The mascot speaks each question, a chat bubble shows the text, answers come from big tappable chips, inputs or the mic, and the mascot reacts (nods, celebrates, thinks).

---

## 2. Recommended architecture

### 2.1 Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript + Tailwind CSS** | Mobile-first, fast, SEO for the landing page; the same app serves the admin dashboard |
| Animation | **Motion (Framer Motion)** for UI transitions; **Rive** for the mascot | Rive characters run a **state machine** (idle / talking / listening / thinking / celebrating / pointing) and can **lip-sync to live audio**. Pre-rendered videos can't, and FAQ answers are dynamic, so we need this. |
| Optional AR mode | Camera feed + mascot overlay (the Flam "airboard") | Offer it as a "View in AR" toggle, not the default. A camera permission prompt on the first screen costs conversions. |
| State / forms | Zustand (flow state) + react-hook-form + zod (validation) | |
| Backend | Next.js API routes (or a separate NestJS service if the team prefers) | |
| Database | **PostgreSQL** (Supabase or Neon, Mumbai region) + Prisma; **pgvector** for the knowledge base | Data stays in India (DPDP Act 2023) |
| Cache / rate limit | Redis (Upstash) | OTP throttling, session cache |
| Speech-to-text / Text-to-speech | **Sarvam AI** (STT + Bulbul v3 TTS) | Strong **Odia**, Hindi, English and code-mixed speech; streaming STT under 250 ms. Browser Web Speech API does **not** handle Odia reliably. |
| AI brain | **Claude** (`claude-haiku-4-5` for fast replies, `claude-sonnet-5-5` for hard ones) with RAG over the knowledge base | Answers only from the client's approved content; replies in the user's language |
| OTP / SMS | MSG91 or Twilio Verify (India) | **DLT registration is mandatory in India and takes days. Start now.** |
| WhatsApp | WhatsApp Business Platform through a provider (Gupshup / Interakt / AiSensy / Meta Cloud API) | Message templates need Meta approval in advance |
| CRM | **Zoho Bigin API v2** (`zohoapis.in/bigin/v2`, OAuth2 refresh token) | Note: "Deals" are called **Pipelines** in v2 |
| Analytics | PostHog | Funnel and drop-off per step |
| Hosting | Vercel + Supabase (Mumbai), or AWS `ap-south-1` | |

### 2.2 The single most important design decision: a **conversation flow engine driven by JSON**

Do **not** hard-code the questions in components. Define the whole conversation as data (like Flam's manifest), so:
- conditional follow-ups are rules, not if-statements scattered through the UI,
- the client's team can change wording, options or order from the admin panel,
- every node has text **and pre-generated audio** in 3 languages.

```jsonc
// flow.json (sketch)
{
  "start": "welcome",
  "nodes": {
    "welcome":   { "type": "language", "say": "welcome.greet", "mascot": "wave", "next": "ask_name" },
    "ask_name":  { "type": "input", "field": "name", "say": "reg.ask_name", "voice": true, "next": "ask_mobile" },
    "ask_mobile":{ "type": "otp", "field": "mobile", "say": "reg.ask_mobile", "next": "ask_email" },
    "q_owner":   { "type": "choice", "field": "ownership", "say": "q.owner",
                   "options": ["own", "rented"],
                   "next": [ { "if": "ownership == 'rented'", "go": "q_landlord_consent" },
                             { "go": "q_property_type" } ] },
    "q_bill":    { "type": "slider", "field": "bill", "min": 500, "max": 10000, "step": 100,
                   "extraOption": { "label": "q.bill_above_10k", "go": "q_bill_exact" },
                   "next": "q_objective" }
  }
}
```

Each node also has: `mascot` state, `progressStep` (for the top bar), `crmField` mapping, and `score` weights.

### 2.3 Voice pipeline

```
Scripted lines (90% of the speech) ──► pre-generated TTS audio per language, stored on CDN, cached
                                        → zero latency, zero per-user cost, consistent voice

User speaks ──► mic (MediaRecorder / AudioWorklet + voice-activity detection)
            ──► Sarvam streaming STT (lang hint = chosen language, code-mix allowed)
            ──► intent: answer to the current question? (e.g. "rented", "around 3000")
                  yes → fill the field, advance the flow
                  no  → FAQ / free question → Claude + RAG → reply text
            ──► Sarvam TTS (live) ──► audio played through Web Audio
                                   ──► analyser node drives the mascot's mouth (Rive input)
```

Rules: always show the text bubble too (accessibility, noisy places, muted phones). The mic is push-to-talk, with an optional auto-listen mode. Barge-in: if the user taps the mic, stop speaking immediately.

---

## 3. Solar calculator logic (port the client's existing "FRD" engine exactly)

The PDF says *"Our answer will be like our Solar Calculator result."* Their site already runs that calculator: `clansmachina.com/js/calculator-data.js` (constants) + `js/solar-engine.js` (pure function `computeEstimate`). **We port it 1:1 into `lib/calculator.ts`**, keep its constants in an admin-editable config, and unit-test it against their worked example, so the bot and the website can never show different numbers.

**Constants (their values):**

| Constant | Value |
|---|---|
| Tariff | ₹5 / unit |
| Days per month | 30 |
| Generation | 4 units / kW / day |
| Roof needed | 100 sq ft / kW |
| Cost | ₹70,000 / kW (flat) |
| System life | 25 years (flat savings: no escalation or degradation) |
| CO₂ factor | 0.82 kg / unit |
| Panel size | 540 Wp (only for the "panels required" count) |
| Future expansion | 0% (optional 10–20%) |
| EMI | 6.5% p.a. fixed; tenures 3 / 5 / 7 / 10 years; shown only for Bank Loan |
| Subsidy (central + Odisha) | 1 kW: 30,000 + 25,000 · 2 kW: 60,000 + 50,000 · 3 kW+: 78,000 + 60,000 (= **₹1,38,000**) |
| Eligibility | Home ✔ · Housing Society ✔ · Commercial ✘ · **state top-up only if the state = Odisha** |

**Formula (from `solar-engine.js`):**
```
monthlyUnits  = bill / 5                       // or units read from an uploaded bill
dailyUnits    = monthlyUnits / 30
idealKw       = max(1, ceil(dailyUnits / 4))   // whole kW, rounded UP
roofMaxKw     = floor(roofSqft / 100)          // if roof area is asked
recommendedKw = max(1, min(idealKw, roofMaxKw))   → roof-shortfall notice if capped
monthlyGen    = kW × 4 × 30
panels        = ceil(kW / 0.54)
cost          = kW × 70,000
subsidy       = table above (0 for Commercial; state part 0 outside Odisha)
investment    = max(cost − subsidy, 0)
monthlySaving = monthlyGen × 5 ; annual = ×12 ; savings25 = annual × 25
payback       = investment / annualSaving
CO₂           = monthlyGen × 0.82 kg (monthly / yearly / 25-yr tonnes)
EMI           = P·r(1+r)^n / ((1+r)^n − 1), r = 6.5%/12
```
**Acceptance test (their FRD example):** ₹3,000 bill → 600 units → **5 kW** → cost ₹3,50,000 − subsidy ₹1,38,000 → investment **₹2,12,000** · saving ₹3,000/mo · ₹36,000/yr · **₹9,00,000 over 25 yrs** · CO₂ ≈ 148 t.

**Mapping our questions to their inputs:** Q2 property type → `residential | commercial | industrial (=Housing Society)`; the PDF also lists "Industrial", which we treat like Commercial (no subsidy). Confirm this with the client. Q3 bill → `bill`; the "Above ₹10,000" option opens an exact-amount input. We add one optional question, **roof area**, because their engine uses it.

Results screen (our upgraded version): capacity + panels · total cost · central and state subsidy · **you invest** · monthly saving · payback years · **25-year savings (count-up)** · EMI (if finance) · CO₂ / trees. Then the CTA "Book FREE consultation" and a **PDF report download**, which their calculator already generates with html2pdf.

---

## 4. Conversation design: all modules

### Module 1: Welcome, Registration & Verification (**first build step, details in §6**)

### Module 2: Qualification Q&A (with conditional follow-ups)

| # | Question | Options | Conditional follow-up |
|---|---|---|---|
| Q1 | Own house or rented? | Own · Rented | **Rented →** "Do you have the owner's permission?" + explain that the subsidy needs the electricity connection in the applicant's name. If not eligible, mark the lead but continue (they may still buy without subsidy). |
| Q2 | Property type | Independent House · Flat · Commercial · Industrial | **Flat →** "Individual flat roof or society (RWA) roof?" → Housing Society subsidy route · **Commercial/Industrial →** sanctioned load, no subsidy (per their calculator), tax-benefit info |
| Q3 | Average monthly bill | **Slider ₹500–₹10,000** · "Above ₹10,000" chip | **Above 10k →** exact amount input + offer **bill upload**. Optionally ask sanctioned load (slider 1–10 kW like the reference). |
| Q4 | Primary objective | Bill Savings · Subsidy · Backup · Energy Independence | **Backup →** "How many hours of power cut per day?" → suggest a **hybrid system with battery** |
| Q5 | Installation timeline | Immediately · Within 15 days · Within 30 days · Later | **Later →** "Shall we remind you in a month?" (nurture flag) |
| Q6 | Payment preference | Full Payment · Bank Finance · EMI · Need Guidance | **Finance/EMI →** show the EMI on results · **Guidance →** flag for the expert |
| + | Shadow-free roof area | slider in sq ft (100 sq ft per kW) + "Don't know" | Caps the kW like their calculator; "Don't know" = uncapped, the site survey confirms |

Then: **calculating animation → personalised result → "Book your FREE consultation?"**

### Module 3: Free consultation booking
Yes / Not now → mode (Phone call · Site visit · Online) → **calendar date strip + time-slot chips** (slots come from the district team's availability) → confirm card → WhatsApp + SMS confirmation sent → Bigin record assigned to the district sales owner → reminder 24 h and 1 h before.

### Module 4: Solar Saathi FAQ assistant
- Topic cards (Solar Basics · Subsidy · Savings · Pricing & Finance · Installation · Net Metering · Warranty & Maintenance), each with 4–6 suggested questions as chips.
- **Free voice or text questions anytime** (mic is always available). Answers come from the knowledge base via RAG, are spoken by the mascot, and show the source article. If confidence is low, Saathi says "Let me connect you to an expert".
- Guardrails: no invented prices or subsidy figures. Numbers come from config, not the model.

### Module 5: Talk to an Expert (sticky button on every screen)
Live call (`tel:` during working hours) · WhatsApp chat (`wa.me` with a prefilled summary) · Request callback (pick a slot). The full transcript and qualification summary are attached to the Bigin record, so the agent sees everything before calling.

### Module 6: CRM & automation (Zoho Bigin)
On OTP verify → upsert **Contact** (match by mobile). On qualification → create/update a **Pipeline** record (stage "New Lead" → "Qualified" → "Consultation Booked" → …) with all answers, the estimate, the score and the transcript link as a note. Owner = the district's sales executive (district → owner table in admin). WhatsApp templates sent on booking, reminder and no-show.

**Lead score (example, editable):** OTP verified +10 · Own house +15 · Independent house +10 · Bill ≥ ₹3k +10 / ≥ ₹10k +20 · Timeline: immediate +25 / 15 d +20 / 30 d +10 · Payment: full +15 / finance or EMI +10 · Consultation booked +15 → **Hot ≥ 70 · Warm 40–69 · Cold < 40**.

### Module 7: Admin dashboard
Leads table with filters (district / score / status), conversation viewer (transcript + audio), appointments calendar, funnel analytics (drop-off per step), **knowledge-base editor** (articles in 3 languages; saving re-indexes embeddings), **flow and copy editor**, calculator constants, district→owner mapping, slot availability.

---

## 5. Roadmap (phases)

| Phase | Scope | Output |
|---|---|---|
| **0. Discovery & assets** (now) | Client inputs (§7), mascot character design brief, script writing in 3 languages, accounts (Sarvam, SMS + DLT, WhatsApp provider, Bigin API client, domain) | Signed-off scripts, brand kit, credentials |
| **1. Foundation + Module 1** | Repo, design system, mascot placeholder, audio unlock, language select, registration, OTP, location/PIN | Working link: welcome → verified user |
| **2. Qualification + calculator** | Flow engine, 6 questions + follow-ups, calculator, calculating loader, results screen | Full estimate journey |
| **3. Booking** | Calendar slots, confirmation via WhatsApp/SMS | End-to-end lead → appointment |
| **4. Voice AI + FAQ** | STT/TTS pipeline, intent handling, RAG knowledge base, lip-synced mascot | Natural voice conversation |
| **5. Expert handoff + bill upload** | Sticky expert button, callback, transcript handoff; bill OCR (Claude vision) | |
| **6. CRM & automation** | Bigin sync, scoring, district assignment, WhatsApp follow-ups | |
| **7. Admin dashboard** | Leads, conversations, appointments, KB/flow/config editors | |
| **8. Hardening & launch** | Low-end Android testing, 3G performance, accessibility, security audit, DPDP consent, load test | Production launch |

---

## 6. STEP 1 in detail: what to build first

### 6.1 Screens & interaction (Module 1)

```
[S0 Splash]  Animated sun rising over a rooftop + Clans logo
             "Tap to meet Solar Saathi"  ← this tap unlocks audio (critical)
      │
[S1 Welcome] Mascot waves in (spring animation) and greets in all three languages:
             "Namaskar! Main Solar Saathi hoon…"
             3 big glass cards:  ଓଡ଼ିଆ  |  हिन्दी  |  English      (or just say it)
      │      → choice sets the language for UI text + voice, saved in localStorage
[S2 Name]    Saathi: "What should I call you?"   [ input + 🎤 ]
             → "Lovely to meet you, Rahul!" (name in the bubble, mascot nods)
[S3 Mobile]  Saathi: "Your mobile number, so our team can reach you"
             +91 prefix, numeric keypad, 10-digit check (starts 6–9)
             → [Send OTP]
[S4 OTP]     6 boxes, auto-fill via WebOTP (Android) / autocomplete="one-time-code" (iOS)
             30 s resend timer, 3 attempts, alternate "Send on WhatsApp"
             success → confetti burst + mascot thumbs-up + "Verified ✓"
[S5 Email]   Optional-looking but asked ("for your solar report")  ← confirm with client if mandatory
[S6 Location] State (default Odisha) → District (Clans' 10 service districts first, all others below),
             searchable → Location/area text
             [📍 Use my location] (geolocation → reverse geocode → prefill)
             PIN code (6 digits) → validate with India Post PIN data → auto-check the district matches
      │
→ Hand-off to Module 2 ("Great Rahul, now 6 quick questions to design your solar plan")
```

Layout (mobile, top to bottom): **top bar** (back · progress stepper *Register · Your Home · Your Plan · Book* · ✕ / language switch) → **mascot stage** (~40% of the height) with the **speech bubble** → **answer zone** (chips / input / slider) → **footer** (Continue + 🎤 mic) → floating **"Talk to an Expert"** pill.

### 6.2 Animation spec

| Element | Animation |
|---|---|
| Screen change | Card slides up and fades (300 ms, spring), old content slides out left |
| Speech bubble | Text **types in** in sync with the voice; bubble scales in from the mascot's mouth |
| Answer chips | Stagger in (40 ms each); tap → pulse + check icon |
| Progress bar | Width tween + glow (as in the reference) |
| Mascot (Rive states) | `idle` (breathing/blinking) · `wave` · `talk` (mouth driven by audio level) · `listen` (hand to ear, while the mic is on) · `think` (while the AI is answering) · `nod` · `celebrate` (OTP verified, results) · `point` (toward the input) |
| Mic | Pulsing rings scale with the live input volume |
| Background | Slow-moving gradient sky + subtle floating light particles; dark/glass card UI like the reference |
| Reduced motion | Respect `prefers-reduced-motion` |

### 6.3 Folder structure to scaffold

```
solar-saathi/
  app/
    (chat)/page.tsx            ← the customer experience
    admin/…                    ← dashboard (later)
    api/otp/send|verify, api/lead, api/geo/pin, api/tts, api/stt, api/chat
  components/
    mascot/Mascot.tsx          ← Rive wrapper + state API: mascot.say(), mascot.set('celebrate')
    chat/SpeechBubble.tsx, AnswerChips.tsx, MicButton.tsx, Stepper.tsx, ExpertButton.tsx
    steps/Language.tsx, Name.tsx, Mobile.tsx, Otp.tsx, Email.tsx, Location.tsx
  flow/flow.json               ← conversation graph (§2.2)
  i18n/en.json, hi.json, or.json
  public/audio/{lang}/{lineId}.mp3   ← pre-generated voice lines
  public/rive/saathi.riv
  lib/audio-unlock.ts, flow-engine.ts, calculator.ts, scoring.ts, bigin.ts
  prisma/schema.prisma         ← Lead, Session, Message, Appointment, KbArticle, Config
```

### 6.4 Voice script for Module 1 (English master; Hindi and Odia to be translated **and checked by a native speaker**)

| Line ID | English | Hindi |
|---|---|---|
| welcome.greet | Namaskar! I'm Solar Saathi, your solar friend from Clans. Which language would you like to talk in? | नमस्कार! मैं सोलर साथी हूँ, Clans से आपका सोलर दोस्त। आप किस भाषा में बात करना चाहेंगे? |
| reg.ask_name | Great! What should I call you? | बढ़िया! मैं आपको किस नाम से बुलाऊँ? |
| reg.nice_to_meet | Lovely to meet you, {name}! | आपसे मिलकर बहुत अच्छा लगा, {name}! |
| reg.ask_mobile | Please share your mobile number. I'll send a code to verify it. | अपना मोबाइल नंबर बताइए, मैं वेरिफाई करने के लिए एक कोड भेजूँगा। |
| reg.ask_otp | Enter the 6-digit code I just sent. | अभी भेजा गया 6 अंकों का कोड डालिए। |
| reg.verified | Verified! Thank you. | वेरिफाई हो गया! धन्यवाद। |
| reg.ask_email | Your email, so I can send your solar report. | आपका ईमेल, ताकि मैं आपकी सोलर रिपोर्ट भेज सकूँ। |
| reg.ask_location | Which district do you live in? You can also share your location. | आप किस ज़िले में रहते हैं? आप अपनी लोकेशन भी शेयर कर सकते हैं। |
| reg.ask_pin | And your PIN code? | और आपका पिन कोड? |
| reg.done | Perfect, {name}! Now just 6 quick questions to design your solar plan. | बहुत बढ़िया, {name}! अब बस 6 छोटे सवाल, आपका सोलर प्लान बनाने के लिए। |

> Names inside lines (`{name}`) can't be pre-recorded. Either use live TTS for those lines only, or record the line without the name and show the name in the bubble.

### 6.5 Data captured in Module 1

```ts
Lead {
  id, sessionId, language: 'or'|'hi'|'en',
  name, mobile, mobileVerified: boolean, otpVerifiedAt,
  email, district, location, pincode, lat?, lng?,
  consent: { privacy: true, whatsapp: boolean, at },   // DPDP Act: explicit consent checkbox
  source: { utm_source, utm_campaign, ad },             // know which ad brought them
  createdAt, updatedAt
}
```
Save after each step (abandonment recovery, as in the reference). Create the Bigin contact only after the OTP is verified.

### 6.6 Definition of done for Step 1

- [ ] Works on Android Chrome (low-end device + 3G throttle) and iPhone Safari, with no horizontal scroll
- [ ] The first voice line plays **with sound** on iOS after the start tap
- [ ] All Module 1 text and voice in Odia, Hindi and English; language switchable anytime
- [ ] Name and district can be given by voice
- [ ] OTP: send, auto-fill, resend timer, rate limit (max 3 sends per 15 min per number and per IP), expiry 5 min, hashed in DB
- [ ] PIN validated, district auto-checked
- [ ] Lead saved progressively; analytics funnel events without PII
- [ ] First load < 2.5 s on 4G; the mascot file is lazy-loaded with a placeholder

---

## 7. What we need from the client (send this list now)

1. **Brand kit:** logo files (SVG). Colours and fonts we take from their site (§0). Do they already have a mascot/character, or should we design "Saathi" (look, gender, attire such as Odia-cultural touches)?
2. **Voice:** a professional recorded voice artist vs AI voice (Sarvam Bulbul); male/female preference.
3. Confirm we reuse the **website calculator constants as-is** (₹70k/kW, ₹5/unit, 6.5% EMI…) and how "Industrial" maps (their site has Home / Commercial / Housing Society). Panel/inverter brands and warranty terms for FAQ answers.
4. Out-of-area leads (outside the 10 districts / outside Odisha): accept and route to whom?
5. **FAQ content** for the 7 topics (or approval for us to draft it from MNRE/OREDA sources).
6. **District → sales executive mapping**, working hours, consultation slot capacity per district.
7. **Zoho Bigin:** admin access to create an API client; pipeline stages; custom fields they want.
8. **SMS:** DLT-registered entity ID + sender ID (or we register through the SMS provider). **WhatsApp Business** number + Meta Business verification.
9. Is **email mandatory**? Is the **PIN** mandatory? **Odisha only**, or all-India later?
10. Domain / sub-domain for the link (e.g. `saathi.clansmachina.com`), and whether they want the **AR camera mode** like the reference.
11. Privacy policy URL and data-retention policy.

---

## 8. Sources

- Client website and calculator (source read directly): https://clansmachina.com · `/calculator.html`, `/js/calculator-data.js`, `/js/solar-engine.js`, `/css/styles.css`
- Reference experience (source read directly): https://xr.flamapp.com/?ad=dPNGtGRwUHDG (`/unit.html`, `/campaigns/dPNGtGRwUHDG.json`, `/i18n.json`)
- PM Surya Ghar subsidy structure: https://coinswitch.co/switch/personal-finance/pm-surya-ghar-subsidy/ · https://quickestimate.co/blog/pm-surya-ghar-faq
- Odisha state top-up (OASBY): https://www.energetica-india.net/news/odisha-allocates-inr-495-cr-for-pm-surya-ghar-top-up-inr-4505-cr-for-energy-sector-in-fy26-27-budget · https://www.mercomindia.com/odisha-extends-state-support-of-up-to-%E2%82%B94-95-billion-for-pm-surya-ghar-program
- Sarvam AI Odia STT/TTS: https://www.sarvam.ai/apis/speech-to-text/odia · https://www.sarvam.ai/apis/text-to-speech/odia · https://docs.sarvam.ai/api-reference-docs/getting-started/models
- Zoho Bigin API v2: https://help.zoho.com/portal/en/community/topic/introducing-bigin-api-version-2-0
- Transparent video (if pre-rendered mascot clips are used): https://jakearchibald.com/2024/video-with-transparency/ · https://rotato.app/blog/transparent-videos-for-the-web
- Rive for interactive talking mascots: https://dev.to/uianimation/-why-rive-animations-convert-better-than-lottie-for-interactive-mascots-2nkd
