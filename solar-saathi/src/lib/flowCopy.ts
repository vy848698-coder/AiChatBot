// Copy for the full journey after "About you": OTP, location, home questions,
// solar plan, consultation booking and the expert sheet.
// Every line Saathi speaks is written to be heard: short sentences, numbers
// in words where they are read aloud, and a warm reaction to every answer.
// Hindi is conversational Hinglish. Odia is a first draft: get it checked by
// a native speaker.

import type { Lang } from "./i18n";

type Opts<K extends string> = Record<K, string>;

export type FlowCopy = {
  sections: [string, string, string, string, string];
  next: string;
  netErr: string;
  otp: {
    ask: string; verifiedThenEmail: string; savedThenEmail: string; checking: string; wrong: string; tooMany: string; resent: string; resend: string; resendIn: string;
    change: string; dev: string; expired: string; sending: string; hint: string; label: string; verify: string; verified: string;
  };
  mobErr: { invalid: string; wait: string; limit: string; unavailable: string };
  emailOtp: {
    ask: string; sending: string; wrong: string; expired: string; tooMany: string; resent: string; spam: string; change: string;
    dev: string; label: string;
  };
  emailErr: { noDomain: string; disposable: string; rejected: string; wait: string; limit: string; unavailable: string };
  pin: { ask: string; label: string; placeholder: string; invalid: string; looking: string; found: string; notFound: string };
  region: { state: string; district: string; chooseState: string; chooseDistrict: string; err: string; confirm: string };
  area: { ask: string; askPlain: string; label: string; placeholder: string; err: string };
  own: { ask: string; opts: Opts<"own" | "rented"> };
  ownerOk: { ask: string; opts: Opts<"yes" | "no"> };
  ptype: { ask: string; opts: Opts<"house" | "flat" | "commercial" | "industrial"> };
  roofType: { ask: string; opts: Opts<"own" | "society"> };
  bill: { ask: string; label: string; above: string; perMonth: string; exactAsk: string; exactPlaceholder: string; exactErr: string };
  roof: { ask: string; label: string; unsure: string; sqft: string };
  goal: { ask: string; opts: Opts<"savings" | "subsidy" | "backup" | "independence"> };
  cuts: { ask: string; opts: Opts<"lt1" | "h1_3" | "h3_6" | "gt6"> };
  when: { ask: string; opts: Opts<"now" | "d15" | "d30" | "later"> };
  pay: { ask: string; opts: Opts<"full" | "bank" | "emi" | "guide"> };
  // Saathi's reaction to an answer, said just before the next question.
  react: {
    emailVerified: string;
    own: string; ownerYes: string; ownerNo: string;
    house: string; flat: string; commercial: string; industrial: string;
    roofOwn: string; roofSociety: string;
    billHigh: string; billLow: string; roofKnown: string; roofUnsure: string;
    savings: string; subsidyOdisha: string; subsidyOther: string; subsidyNone: string; backup: string; independence: string;
    cuts: string; now: string; soon: string; later: string;
    payFull: string; payLoan: string; payGuide: string;
  };
  calc: { title: string; sub: string; say: string };
  result: {
    say: string; sayNoSub: string; caption: string; title: string; kw: string; panels: string; cost: string; subsidy: string;
    central: string; state: string; youPay: string; monthly: string; life: string; payback: string; years: string;
    co2: string; trees: string; emi: string; emiLine: string; noSubsidy: string; ownerNote: string; roofNote: string;
    note: string; cta: string; faq: string; faqSub: string; wa: string; waSub: string; next: string;
  };
  mode: { ask: string; opts: Opts<"call" | "visit" | "online"> };
  date: { ask: string; today: string; tomorrow: string };
  slot: { ask: string; opts: Opts<"s1" | "s2" | "s3" | "s4"> };
  booked: { say: string; title: string; team: string; sent: string; ref: string; thanks: string };
  expert: {
    button: string; title: string; sub: string; call: string; whatsapp: string; callback: string;
    callbackDone: string; hours: string; tollFree: string;
  };
  money: { lakh: string; thousand: string; crore: string; rupees: string };
};

export const FLOW: Record<Lang, FlowCopy> = {
  en: {
    sections: ["About you", "Location", "Your home", "Your plan", "Book"],
    next: "Next",
    netErr: "Sorry, I couldn't connect just now. Please check your internet and try again.",
    otp: {
      ask: "Thank you! I've sent a 6-digit code to {mobile}. Please enter it to verify your number.",
      verifiedThenEmail: "Perfect, your number is verified! Lastly, please share your email ID. I'll send your personal solar report there.",
      // When the SMS code is switched off (NEXT_PUBLIC_SMS_OTP): number checked, not verified.
      savedThenEmail: "Thank you, your number is saved! Lastly, please share your email ID. I'll send your personal solar report there.",
      checking: "Checking the number…",
      wrong: "Hmm, that code doesn't match. Please check the SMS and try again.",
      tooMany: "That code didn't match a few times, so I've sent you a fresh one. Please enter the new code.",
      resent: "Done! I've sent a new code to your number.",
      resend: "Resend code",
      resendIn: "Resend in {s}s",
      change: "Change number",
      dev: "Test mode (SMS not set up yet): code {code}",
      expired: "That code has expired, so I've sent you a new one. Please enter the new code.",
      sending: "Sending the code…",
      hint: "The SMS can take up to a minute to arrive.",
      label: "Verification code",
      verify: "Verify",
      verified: "Verified",
    },
    mobErr: {
      invalid: "This doesn't look like a real mobile number. Please enter your own 10-digit mobile number.",
      wait: "Please wait {s} seconds before asking for a new code.",
      limit: "Too many codes were requested for this number. Please try again in a little while, or talk to our expert.",
      unavailable: "Sorry, I couldn't send the SMS just now. Please try again in a minute.",
    },
    emailOtp: {
      ask: "Perfect! I've sent a 6-digit code to {email}. Please check your inbox and enter it here.",
      sending: "Sending the code…",
      wrong: "That code doesn't match. Please check the email and try again.",
      expired: "That code has expired, so I've sent you a new one. Please enter the new code.",
      tooMany: "That code didn't match a few times, so I've sent a fresh one to your email.",
      resent: "Done! I've sent a new code to your email.",
      spam: "Can't find it? Check your Spam or Promotions folder.",
      change: "Change email",
      dev: "Test mode (email not set up yet): code {code}",
      label: "Email code",
    },
    emailErr: {
      noDomain: "This email address is wrong. The part after @ doesn't exist. Please enter the correct email.",
      disposable: "A temporary email can't receive your solar report. Please enter your personal email.",
      rejected: "This email address is wrong, it can't receive mail. Please enter the correct email.",
      wait: "Please wait {s} seconds before asking for a new code.",
      limit: "Too many codes were requested for this email. Please try again in a little while, or talk to our expert.",
      unavailable: "Sorry, I couldn't send the email just now. Please try again in a minute.",
    },
    pin: {
      ask: "Thank you, {first}! Now let's find your location. Please enter your 6-digit PIN code.",
      label: "PIN code",
      placeholder: "6-digit PIN code",
      invalid: "That doesn't look like a valid PIN code. It has 6 digits, and can't start with 0 or 9.",
      looking: "Finding your area…",
      found: "Got it! You're in {district} district, {state}. Please confirm, or change it if needed.",
      notFound: "I couldn't find this PIN code automatically. No problem, please choose your state and district.",
    },
    region: {
      state: "State",
      district: "District",
      chooseState: "Select state",
      chooseDistrict: "Select district",
      err: "Please choose your state and district.",
      confirm: "Confirm",
    },
    area: {
      ask: "Thank you. Which area or locality do you live in? Tap one below, or type it.",
      askPlain: "Thank you. Which area or locality do you live in?",
      label: "Area / locality",
      placeholder: "e.g. Patia, Bhubaneswar",
      err: "Please type the name of your area or locality.",
    },
    own: {
      ask: "Thank you, your location is saved! Now, a few quick questions about your home. Is it your own house, or rented?",
      opts: { own: "My own house", rented: "Rented" },
    },
    ownerOk: {
      ask: "For solar on a rented house, the owner's permission is needed. Do you have the owner's permission?",
      opts: { yes: "Yes, I have permission", no: "No / Not sure" },
    },
    ptype: {
      ask: "What type of property is it?",
      opts: { house: "Independent house", flat: "Flat / Apartment", commercial: "Commercial", industrial: "Industrial" },
    },
    roofType: {
      ask: "Will the panels go on your own terrace, or on the society's common roof?",
      opts: { own: "My own terrace", society: "Society common roof" },
    },
    bill: {
      ask: "What is your average monthly electricity bill? Just move the slider.",
      label: "Monthly bill",
      above: "Above ₹10,000",
      perMonth: "/month",
      exactAsk: "Please type your average monthly bill amount.",
      exactPlaceholder: "Amount in ₹",
      exactErr: "Please enter an amount between 10 thousand and 10 lakh rupees.",
    },
    roof: {
      ask: "Roughly how much shadow-free roof space do you have? If you're not sure, that's okay.",
      label: "Roof space",
      unsure: "Not sure",
      sqft: "sq ft",
    },
    goal: {
      ask: "What matters most to you with solar?",
      opts: { savings: "Save on bills", subsidy: "Get the subsidy", backup: "Power backup", independence: "Make my own power" },
    },
    cuts: {
      ask: "How many hours of power cuts do you usually get in a day?",
      opts: { lt1: "Under 1 hour", h1_3: "1–3 hours", h3_6: "3–6 hours", gt6: "Over 6 hours" },
    },
    when: {
      ask: "When would you like to install solar?",
      opts: { now: "Immediately", d15: "Within 15 days", d30: "Within 30 days", later: "Later" },
    },
    pay: {
      ask: "How would you like to pay?",
      opts: { full: "Full payment", bank: "Bank loan", emi: "EMI", guide: "Need guidance" },
    },
    react: {
      emailVerified: "Great, your email is verified!",
      own: "Wonderful! Owning your home makes solar simple.",
      ownerYes: "Great, that makes things easy.",
      ownerNo: "No problem. Our team can guide you on getting the owner's consent.",
      house: "Perfect! An independent house is ideal for rooftop solar.",
      flat: "Got it.",
      commercial: "Great! Businesses use most of their power during the day, so solar saves them a lot.",
      industrial: "Excellent! Factories see some of the biggest savings from solar.",
      roofOwn: "Great, your own terrace keeps it simple.",
      roofSociety: "Good choice. A society rooftop can cut the common electricity bill for everyone.",
      billHigh: "Thank you. That's a good amount to save on, and solar can bring it down sharply.",
      billLow: "Thank you. Solar can bring your bill down even further.",
      roofKnown: "Thank you, that helps me size your system.",
      roofUnsure: "No problem. Our team will measure it during the free site survey.",
      savings: "Smart choice! Lower bills is what most families want from solar.",
      subsidyOdisha: "Great choice! In Odisha, you can get up to 1 lakh 38 thousand rupees as subsidy.",
      subsidyOther: "Great choice! Under PM Surya Ghar, you can get up to 78 thousand rupees as subsidy.",
      subsidyNone: "Got it. The home subsidy doesn't cover businesses, but solar still saves a lot.",
      backup: "I understand, power cuts are really frustrating.",
      independence: "Love it! Making your own power is a great feeling.",
      cuts: "Thank you. Our expert will suggest the right backup for you.",
      now: "Excellent! The sooner you start, the sooner you save.",
      soon: "Great timing.",
      later: "No problem, there's no rush. Your plan will be ready whenever you are.",
      payFull: "Great.",
      payLoan: "Good choice. I'll show you the EMI in your plan.",
      payGuide: "Sure, our expert will explain every option.",
    },
    calc: {
      title: "Designing your solar plan…",
      sub: "Checking generation, subsidy and savings for {district}",
      say: "Thank you, {first}! Give me a moment while I design your solar plan.",
    },
    result: {
      say: "{first}, here's some great news! A {kw} kilowatt system is right for you. It costs about {cost}, and the government gives you {subsidy} back as subsidy. So you invest only {invest}. You'll save about {monthly} every month. That's {life} over 25 years! And your system pays for itself in about {payback} years.",
      sayNoSub: "{first}, here's your solar plan! A {kw} kilowatt system is right for you. It costs about {cost}. You'll save about {monthly} every month. That's {life} over 25 years! And your system pays for itself in about {payback} years.",
      caption: "{first}, here's your solar plan!",
      title: "Your solar plan",
      kw: "System size",
      panels: "{n} panels",
      cost: "Total cost",
      subsidy: "Govt subsidy",
      central: "Central (PM Surya Ghar)",
      state: "Odisha state top-up",
      youPay: "You invest",
      monthly: "Monthly saving",
      life: "25-year savings",
      payback: "Payback",
      years: "{n} years",
      co2: "CO₂ saved",
      trees: "≈ {n} trees a year",
      emi: "EMI",
      emiLine: "{amount}/month · {years} years · {rate}% p.a.",
      noSubsidy: "Commercial and industrial properties are not eligible for the residential subsidy.",
      ownerNote: "The owner's written consent will be needed before installation.",
      roofNote: "Sized to your roof space. A bigger roof could fit {ideal} kW.",
      note: "Estimate from the Clans Machina calculator. Final price after a free site survey.",
      cta: "Book my free consultation",
      // Second path on the plan: clear doubts in the FAQ first, then book.
      faq: "Have questions? Ask Saathi first",
      faqSub: "Subsidy, loans, savings, installation…",
      // Third path: talk to the team first (WhatsApp opens with the plan typed in).
      wa: "Talk to us on WhatsApp",
      waSub: "Your plan is shared, no need to repeat anything",
      next: "Book your free consultation now, ask me any question, or talk to our team on WhatsApp.",
    },
    mode: {
      ask: "Wonderful! How would you like to meet our solar expert? It's completely free.",
      opts: { call: "Phone call", visit: "Site visit", online: "Online video call" },
    },
    date: { ask: "Great. Which date suits you?", today: "Today", tomorrow: "Tomorrow" },
    slot: {
      ask: "And what time works best for you?",
      opts: { s1: "10 AM – 12 PM", s2: "12 PM – 2 PM", s3: "2 PM – 4 PM", s4: "4 PM – 6 PM" },
    },
    booked: {
      say: "Congratulations, {first}! Your free {mode} is booked for {date}, {slot}. Our {district} team will contact you before that. Thank you for trusting Clans Machina. Get ready to save with the sun!",
      title: "Consultation booked!",
      team: "Our {district} team will contact you",
      sent: "Our team will confirm on {mobile}",
      ref: "Booking ID",
      thanks: "Thank you for choosing Clans Machina",
    },
    expert: {
      button: "Talk to an expert",
      title: "Talk to a solar expert",
      sub: "Our team already has your details, so you won't need to repeat anything.",
      call: "Call now",
      whatsapp: "WhatsApp chat",
      callback: "Request a callback",
      callbackDone: "Done! We'll call you back shortly.",
      hours: "Mon–Sat, 9 AM – 7 PM",
      tollFree: "Toll-free",
    },
    money: { lakh: "lakh", thousand: "thousand", crore: "crore", rupees: "rupees" },
  },
  hi: {
    sections: ["आपके बारे में", "लोकेशन", "आपका घर", "आपका प्लान", "बुकिंग"],
    next: "आगे बढ़ें",
    netErr: "माफ़ कीजिए, अभी कनेक्ट नहीं हो पाया। कृपया इंटरनेट चेक करके फिर से कोशिश कीजिए।",
    otp: {
      ask: "धन्यवाद! मैंने {mobile} पर 6 अंकों का कोड भेजा है। नंबर वेरिफ़ाई करने के लिए वह कोड डालिए।",
      verifiedThenEmail: "बहुत बढ़िया, आपका नंबर वेरिफ़ाई हो गया! आख़िर में, अपनी ईमेल आईडी बताइए। मैं आपकी सोलर रिपोर्ट वहीं भेजूँगा।",
      savedThenEmail: "धन्यवाद, आपका नंबर सेव हो गया! आख़िर में, अपनी ईमेल आईडी बताइए। मैं आपकी सोलर रिपोर्ट वहीं भेजूँगा।",
      checking: "नंबर चेक कर रहा हूँ…",
      wrong: "यह कोड मैच नहीं हुआ। कृपया SMS चेक करके फिर से डालिए।",
      tooMany: "कोड कुछ बार मैच नहीं हुआ, इसलिए मैंने आपको नया कोड भेज दिया है। कृपया नया कोड डालिए।",
      resent: "हो गया! मैंने आपके नंबर पर नया कोड भेज दिया है।",
      resend: "कोड दोबारा भेजें",
      resendIn: "{s} सेकंड में दोबारा भेजें",
      change: "नंबर बदलें",
      dev: "टेस्ट मोड (SMS अभी सेट नहीं है): कोड {code}",
      expired: "यह कोड एक्सपायर हो गया था, इसलिए मैंने नया कोड भेज दिया है। कृपया नया कोड डालिए।",
      sending: "कोड भेज रहा हूँ…",
      hint: "SMS आने में एक मिनट तक लग सकता है।",
      label: "वेरिफ़िकेशन कोड",
      verify: "वेरिफ़ाई करें",
      verified: "वेरिफ़ाइड",
    },
    mobErr: {
      invalid: "यह नंबर असली मोबाइल नंबर नहीं लग रहा। कृपया अपना 10 अंकों का मोबाइल नंबर डालिए।",
      wait: "कृपया नया कोड माँगने से पहले {s} सेकंड रुकिए।",
      limit: "इस नंबर के लिए बहुत सारे कोड माँगे जा चुके हैं। कृपया थोड़ी देर बाद कोशिश कीजिए, या हमारे एक्सपर्ट से बात कीजिए।",
      unavailable: "माफ़ कीजिए, अभी SMS नहीं भेज पाया। कृपया एक मिनट बाद फिर से कोशिश कीजिए।",
    },
    emailOtp: {
      ask: "बढ़िया! मैंने {email} पर 6 अंकों का कोड भेजा है। अपना इनबॉक्स चेक करके वह कोड यहाँ डालिए।",
      sending: "कोड भेज रहा हूँ…",
      wrong: "यह कोड मैच नहीं हुआ। कृपया ईमेल चेक करके फिर से डालिए।",
      expired: "यह कोड एक्सपायर हो गया था, इसलिए मैंने नया कोड भेज दिया है। कृपया नया कोड डालिए।",
      tooMany: "कोड कुछ बार मैच नहीं हुआ, इसलिए मैंने आपकी ईमेल पर नया कोड भेज दिया है।",
      resent: "हो गया! मैंने आपकी ईमेल पर नया कोड भेज दिया है।",
      spam: "ईमेल नहीं मिली? स्पैम या प्रमोशन्स फ़ोल्डर भी चेक कीजिए।",
      change: "ईमेल बदलें",
      dev: "टेस्ट मोड (ईमेल अभी सेट नहीं है): कोड {code}",
      label: "ईमेल कोड",
    },
    emailErr: {
      noDomain: "यह ईमेल आईडी गलत है, @ के बाद वाला हिस्सा मौजूद नहीं है। कृपया सही ईमेल डालिए।",
      disposable: "टेम्परेरी ईमेल पर आपकी सोलर रिपोर्ट नहीं जा सकती। कृपया अपनी पर्सनल ईमेल डालिए।",
      rejected: "यह ईमेल आईडी गलत है, इस पर ईमेल नहीं जा सकती। कृपया सही ईमेल डालिए।",
      wait: "कृपया नया कोड माँगने से पहले {s} सेकंड रुकिए।",
      limit: "इस ईमेल के लिए बहुत सारे कोड माँगे जा चुके हैं। कृपया थोड़ी देर बाद कोशिश कीजिए, या हमारे एक्सपर्ट से बात कीजिए।",
      unavailable: "माफ़ कीजिए, अभी ईमेल नहीं भेज पाया। कृपया एक मिनट बाद फिर से कोशिश कीजिए।",
    },
    pin: {
      ask: "धन्यवाद, {first}! अब आपकी लोकेशन जानते हैं। अपना 6 अंकों का पिन कोड डालिए।",
      label: "पिन कोड",
      placeholder: "6 अंकों का पिन कोड",
      invalid: "यह पिन कोड सही नहीं लग रहा। पिन कोड में 6 अंक होते हैं, और यह 0 या 9 से शुरू नहीं होता।",
      looking: "आपका इलाका ढूँढ रहा हूँ…",
      found: "मिल गया! आप {state} के {district} ज़िले में हैं। कृपया कन्फ़र्म कीजिए, या ज़रूरत हो तो बदल दीजिए।",
      notFound: "यह पिन कोड अपने आप नहीं मिला। कोई बात नहीं, अपना राज्य और ज़िला चुन लीजिए।",
    },
    region: {
      state: "राज्य",
      district: "ज़िला",
      chooseState: "राज्य चुनें",
      chooseDistrict: "ज़िला चुनें",
      err: "कृपया अपना राज्य और ज़िला चुनिए।",
      confirm: "कन्फ़र्म करें",
    },
    area: {
      ask: "धन्यवाद। आप किस इलाके में रहते हैं? नीचे से चुनिए, या लिख दीजिए।",
      askPlain: "धन्यवाद। आप किस इलाके में रहते हैं?",
      label: "इलाका / मोहल्ला",
      placeholder: "जैसे: पटिया, भुवनेश्वर",
      err: "कृपया अपने इलाके या मोहल्ले का नाम लिखिए।",
    },
    own: {
      ask: "धन्यवाद, आपकी लोकेशन सेव हो गई! अब आपके घर के बारे में कुछ छोटे सवाल। क्या यह आपका अपना घर है, या किराए का?",
      opts: { own: "मेरा अपना घर", rented: "किराए का" },
    },
    ownerOk: {
      ask: "किराए के घर पर सोलर लगाने के लिए मकान मालिक की अनुमति ज़रूरी है। क्या आपके पास मालिक की अनुमति है?",
      opts: { yes: "हाँ, अनुमति है", no: "नहीं / पक्का नहीं" },
    },
    ptype: {
      ask: "यह किस तरह की प्रॉपर्टी है?",
      opts: { house: "इंडिपेंडेंट मकान", flat: "फ़्लैट / अपार्टमेंट", commercial: "कमर्शियल", industrial: "इंडस्ट्रियल" },
    },
    roofType: {
      ask: "पैनल आपकी अपनी छत पर लगेंगे, या सोसाइटी की कॉमन छत पर?",
      opts: { own: "मेरी अपनी छत", society: "सोसाइटी की कॉमन छत" },
    },
    bill: {
      ask: "आपका हर महीने का बिजली बिल औसतन कितना आता है? बस स्लाइडर खिसकाइए।",
      label: "महीने का बिल",
      above: "₹10,000 से ज़्यादा",
      perMonth: "/महीना",
      exactAsk: "कृपया अपना औसत मासिक बिल लिखिए।",
      exactPlaceholder: "रकम ₹ में",
      exactErr: "कृपया 10 हज़ार से 10 लाख रुपये के बीच की रकम डालिए।",
    },
    roof: {
      ask: "आपकी छत पर लगभग कितनी जगह है जहाँ छाँव नहीं पड़ती? पक्का पता न हो, तो कोई बात नहीं।",
      label: "छत की जगह",
      unsure: "पता नहीं",
      sqft: "वर्ग फ़ुट",
    },
    goal: {
      ask: "सोलर से आपके लिए सबसे ज़रूरी क्या है?",
      opts: { savings: "बिल में बचत", subsidy: "सब्सिडी पाना", backup: "पावर बैकअप", independence: "अपनी बिजली ख़ुद बनाना" },
    },
    cuts: {
      ask: "आपके यहाँ रोज़ लगभग कितने घंटे बिजली कटती है?",
      opts: { lt1: "1 घंटे से कम", h1_3: "1–3 घंटे", h3_6: "3–6 घंटे", gt6: "6 घंटे से ज़्यादा" },
    },
    when: {
      ask: "आप सोलर कब लगवाना चाहेंगे?",
      opts: { now: "तुरंत", d15: "15 दिनों में", d30: "30 दिनों में", later: "बाद में" },
    },
    pay: {
      ask: "आप पेमेंट कैसे करना चाहेंगे?",
      opts: { full: "पूरा पेमेंट", bank: "बैंक लोन", emi: "EMI", guide: "सलाह चाहिए" },
    },
    react: {
      emailVerified: "बढ़िया, आपकी ईमेल वेरिफ़ाई हो गई!",
      own: "बहुत बढ़िया! अपने घर पर सोलर लगाना बहुत आसान है।",
      ownerYes: "बढ़िया, फिर तो काम आसान है।",
      ownerNo: "कोई बात नहीं। मालिक की सहमति लेने में हमारी टीम आपकी मदद करेगी।",
      house: "परफ़ेक्ट! इंडिपेंडेंट मकान रूफ़टॉप सोलर के लिए सबसे अच्छा होता है।",
      flat: "ठीक है।",
      commercial: "बढ़िया! बिज़नेस में दिन में ज़्यादा बिजली लगती है, इसलिए सोलर से बहुत बचत होती है।",
      industrial: "शानदार! फ़ैक्ट्रियों को सोलर से सबसे ज़्यादा बचत होती है।",
      roofOwn: "बढ़िया, अपनी छत हो तो सब आसान रहता है।",
      roofSociety: "अच्छा है। सोसाइटी की छत पर सोलर से सबका कॉमन बिजली बिल कम होता है।",
      billHigh: "धन्यवाद। इतने बिल पर सोलर से अच्छी-ख़ासी बचत हो सकती है।",
      billLow: "धन्यवाद। सोलर से आपका बिल और भी कम हो सकता है।",
      roofKnown: "धन्यवाद, इससे मैं आपके सिस्टम का सही साइज़ तय कर पाऊँगा।",
      roofUnsure: "कोई बात नहीं। फ़्री साइट सर्वे में हमारी टीम इसे नाप लेगी।",
      savings: "समझदारी भरा फ़ैसला! ज़्यादातर परिवार बिल में बचत के लिए ही सोलर लगाते हैं।",
      subsidyOdisha: "बढ़िया! ओडिशा में आपको 1 लाख 38 हज़ार रुपये तक की सब्सिडी मिल सकती है।",
      subsidyOther: "बढ़िया! पीएम सूर्य घर योजना में आपको 78 हज़ार रुपये तक की सब्सिडी मिल सकती है।",
      subsidyNone: "समझ गया। घरेलू सब्सिडी बिज़नेस पर लागू नहीं होती, लेकिन सोलर से फिर भी बहुत बचत होती है।",
      backup: "मैं समझता हूँ, बिजली कटौती सच में बहुत परेशान करती है।",
      independence: "वाह! अपनी बिजली ख़ुद बनाने का मज़ा ही कुछ और है।",
      cuts: "धन्यवाद। हमारे एक्सपर्ट आपके लिए सही बैकअप सुझाएँगे।",
      now: "शानदार! जितनी जल्दी शुरू करेंगे, उतनी जल्दी बचत शुरू होगी।",
      soon: "बढ़िया टाइमिंग।",
      later: "कोई जल्दी नहीं। जब आप तैयार हों, आपका प्लान तैयार रहेगा।",
      payFull: "बढ़िया।",
      payLoan: "अच्छा विकल्प। मैं आपके प्लान में EMI भी दिखाऊँगा।",
      payGuide: "ज़रूर, हमारे एक्सपर्ट आपको हर विकल्प समझाएँगे।",
    },
    calc: {
      title: "आपका सोलर प्लान बना रहा हूँ…",
      sub: "{district} के लिए बिजली उत्पादन, सब्सिडी और बचत देख रहा हूँ",
      say: "धन्यवाद, {first}! बस एक पल, मैं आपका सोलर प्लान तैयार कर रहा हूँ।",
    },
    result: {
      say: "{first}, आपके लिए बहुत अच्छी ख़बर है! आपके लिए {kw} किलोवाट का सिस्टम सबसे सही रहेगा। इसकी कुल लागत लगभग {cost} है, और सरकार आपको {subsidy} की सब्सिडी वापस देती है। यानी आपका निवेश सिर्फ़ {invest} होगा। हर महीने लगभग {monthly} की बचत होगी। यानी 25 साल में {life} की बचत! और आपका सिस्टम लगभग {payback} साल में अपनी पूरी लागत वसूल कर लेगा।",
      sayNoSub: "{first}, यह रहा आपका सोलर प्लान! आपके लिए {kw} किलोवाट का सिस्टम सबसे सही रहेगा। इसकी कुल लागत लगभग {cost} है। हर महीने लगभग {monthly} की बचत होगी। यानी 25 साल में {life} की बचत! और आपका सिस्टम लगभग {payback} साल में अपनी पूरी लागत वसूल कर लेगा।",
      caption: "{first}, यह रहा आपका सोलर प्लान!",
      title: "आपका सोलर प्लान",
      kw: "सिस्टम साइज़",
      panels: "{n} पैनल",
      cost: "कुल लागत",
      subsidy: "सरकारी सब्सिडी",
      central: "केंद्र (पीएम सूर्य घर)",
      state: "ओडिशा राज्य अतिरिक्त",
      youPay: "आपका निवेश",
      monthly: "हर महीने की बचत",
      life: "25 साल की बचत",
      payback: "लागत वसूली",
      years: "{n} साल",
      co2: "बचाया गया CO₂",
      trees: "≈ {n} पेड़ हर साल",
      emi: "EMI",
      emiLine: "{amount}/महीना · {years} साल · {rate}% सालाना",
      noSubsidy: "कमर्शियल और इंडस्ट्रियल प्रॉपर्टी पर घरेलू सब्सिडी नहीं मिलती।",
      ownerNote: "इंस्टॉलेशन से पहले मकान मालिक की लिखित सहमति ज़रूरी होगी।",
      roofNote: "आपकी छत की जगह के हिसाब से साइज़ तय किया गया है। बड़ी छत पर {ideal} kW लग सकता है।",
      note: "यह Clans Machina कैलकुलेटर का अनुमान है। फ़ाइनल कीमत फ़्री साइट सर्वे के बाद।",
      cta: "मेरा फ़्री कंसल्टेशन बुक करें",
      faq: "सवाल हैं? पहले Saathi से पूछें",
      faqSub: "सब्सिडी, लोन, बचत, इंस्टॉलेशन…",
      wa: "WhatsApp पर बात करें",
      waSub: "आपका प्लान साथ जाएगा, कुछ दोबारा बताने की ज़रूरत नहीं",
      next: "अभी अपना फ़्री कंसल्टेशन बुक कीजिए, मुझसे कोई भी सवाल पूछिए, या WhatsApp पर हमारी टीम से बात कीजिए।",
    },
    mode: {
      ask: "बहुत बढ़िया! आप हमारे सोलर एक्सपर्ट से कैसे मिलना चाहेंगे? यह बिल्कुल फ़्री है।",
      opts: { call: "फ़ोन कॉल", visit: "साइट विज़िट", online: "ऑनलाइन वीडियो कॉल" },
    },
    date: { ask: "बढ़िया। आपके लिए कौन-सी तारीख़ ठीक रहेगी?", today: "आज", tomorrow: "कल" },
    slot: {
      ask: "और कौन-सा समय आपके लिए सही रहेगा?",
      opts: { s1: "सुबह 10 – दोपहर 12", s2: "दोपहर 12 – 2", s3: "दोपहर 2 – 4", s4: "शाम 4 – 6" },
    },
    booked: {
      say: "बधाई हो, {first}! आपकी फ़्री {mode} {date}, {slot} के लिए बुक हो गई है। हमारी {district} टीम उससे पहले आपसे संपर्क करेगी। Clans Machina पर भरोसा करने के लिए धन्यवाद। अब सूरज से बचत के लिए तैयार हो जाइए!",
      title: "कंसल्टेशन बुक हो गया!",
      team: "हमारी {district} टीम आपसे संपर्क करेगी",
      sent: "हमारी टीम {mobile} पर कन्फ़र्म करेगी",
      ref: "बुकिंग आईडी",
      thanks: "Clans Machina चुनने के लिए धन्यवाद",
    },
    expert: {
      button: "एक्सपर्ट से बात करें",
      title: "सोलर एक्सपर्ट से बात करें",
      sub: "हमारी टीम के पास आपकी जानकारी पहले से है, आपको कुछ दोबारा बताने की ज़रूरत नहीं।",
      call: "अभी कॉल करें",
      whatsapp: "WhatsApp चैट",
      callback: "कॉलबैक मँगवाएँ",
      callbackDone: "हो गया! हम जल्द ही आपको कॉल करेंगे।",
      hours: "सोम–शनि, सुबह 9 – शाम 7",
      tollFree: "टोल-फ़्री",
    },
    money: { lakh: "लाख", thousand: "हज़ार", crore: "करोड़", rupees: "रुपये" },
  },
  or: {
    sections: ["ଆପଣଙ୍କ ବିଷୟରେ", "ଠିକଣା", "ଆପଣଙ୍କ ଘର", "ଆପଣଙ୍କ ପ୍ଲାନ", "ବୁକିଂ"],
    next: "ଆଗକୁ",
    netErr: "କ୍ଷମା କରିବେ, ଏବେ ସଂଯୋଗ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ଇଣ୍ଟରନେଟ ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    otp: {
      ask: "ଧନ୍ୟବାଦ। ମୁଁ {mobile} କୁ 6 ଅଙ୍କର ଏକ କୋଡ ପଠାଇଛି। ଆପଣଙ୍କ ନମ୍ବର ଯାଞ୍ଚ ପାଇଁ ସେହି କୋଡ ଦିଅନ୍ତୁ।",
      verifiedThenEmail: "ଆପଣଙ୍କ ନମ୍ବର ଯାଞ୍ଚ ହୋଇଗଲା। ଶେଷରେ, ଆପଣଙ୍କ ଇମେଲ ଆଇଡି ଦିଅନ୍ତୁ। ମୁଁ ସେଠାକୁ ଆପଣଙ୍କ ସୋଲାର ରିପୋର୍ଟ ପଠାଇବି।",
      savedThenEmail: "ଧନ୍ୟବାଦ, ଆପଣଙ୍କ ନମ୍ବର ସେଭ ହୋଇଗଲା। ଶେଷରେ, ଆପଣଙ୍କ ଇମେଲ ଆଇଡି ଦିଅନ୍ତୁ। ମୁଁ ସେଠାକୁ ଆପଣଙ୍କ ସୋଲାର ରିପୋର୍ଟ ପଠାଇବି।",
      checking: "ନମ୍ବର ଯାଞ୍ଚ କରୁଛି…",
      wrong: "ଏହି କୋଡ ଠିକ ନୁହେଁ। ଦୟାକରି ଯାଞ୍ଚ କରି ପୁଣି ଦିଅନ୍ତୁ।",
      tooMany: "କୋଡ କିଛି ଥର ମେଳ ଖାଇଲା ନାହିଁ, ତେଣୁ ମୁଁ ଆପଣଙ୍କୁ ନୂଆ କୋଡ ପଠାଇଦେଲି। ଦୟାକରି ନୂଆ କୋଡ ଦିଅନ୍ତୁ।",
      resent: "ମୁଁ ଆପଣଙ୍କ ନମ୍ବରକୁ ନୂଆ କୋଡ ପଠାଇଦେଲି।",
      resend: "କୋଡ ପୁଣି ପଠାନ୍ତୁ",
      resendIn: "{s} ସେକେଣ୍ଡରେ ପୁଣି ପଠାନ୍ତୁ",
      change: "ନମ୍ବର ବଦଳାନ୍ତୁ",
      dev: "ଟେଷ୍ଟ ମୋଡ (SMS ଏପର୍ଯ୍ୟନ୍ତ ସେଟ ହୋଇନାହିଁ): କୋଡ {code}",
      expired: "ଏହି କୋଡର ସମୟ ସରିଗଲା, ତେଣୁ ମୁଁ ନୂଆ କୋଡ ପଠାଇଦେଲି। ଦୟାକରି ନୂଆ କୋଡ ଦିଅନ୍ତୁ।",
      sending: "କୋଡ ପଠାଉଛି…",
      hint: "SMS ଆସିବାକୁ ଏକ ମିନିଟ ପର୍ଯ୍ୟନ୍ତ ଲାଗିପାରେ।",
      label: "ଯାଞ୍ଚ କୋଡ",
      verify: "ଯାଞ୍ଚ କରନ୍ତୁ",
      verified: "ଯାଞ୍ଚିତ",
    },
    mobErr: {
      invalid: "ଏହା ପ୍ରକୃତ ମୋବାଇଲ ନମ୍ବର ପରି ଲାଗୁନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ 10 ଅଙ୍କର ମୋବାଇଲ ନମ୍ବର ଦିଅନ୍ତୁ।",
      wait: "ନୂଆ କୋଡ ମାଗିବା ପୂର୍ବରୁ ଦୟାକରି {s} ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।",
      limit: "ଏହି ନମ୍ବର ପାଇଁ ବହୁତ କୋଡ ମଗାଯାଇଛି। ଦୟାକରି କିଛି ସମୟ ପରେ ଚେଷ୍ଟା କରନ୍ତୁ, କିମ୍ବା ଆମ ବିଶେଷଜ୍ଞଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।",
      unavailable: "କ୍ଷମା କରିବେ, ଏବେ SMS ପଠାଇପାରିଲି ନାହିଁ। ଦୟାକରି ଏକ ମିନିଟ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    },
    emailOtp: {
      ask: "ବଢ଼ିଆ! ମୁଁ {email} କୁ 6 ଅଙ୍କର ଏକ କୋଡ ପଠାଇଛି। ଆପଣଙ୍କ ଇନବକ୍ସ ଦେଖି ସେହି କୋଡ ଏଠାରେ ଦିଅନ୍ତୁ।",
      sending: "କୋଡ ପଠାଉଛି…",
      wrong: "ଏହି କୋଡ ମେଳ ଖାଉନାହିଁ। ଦୟାକରି ଇମେଲ ଦେଖି ପୁଣି ଦିଅନ୍ତୁ।",
      expired: "ଏହି କୋଡର ସମୟ ସରିଗଲା, ତେଣୁ ମୁଁ ନୂଆ କୋଡ ପଠାଇଦେଲି। ଦୟାକରି ନୂଆ କୋଡ ଦିଅନ୍ତୁ।",
      tooMany: "କୋଡ କିଛି ଥର ମେଳ ଖାଇଲା ନାହିଁ, ତେଣୁ ମୁଁ ଆପଣଙ୍କ ଇମେଲକୁ ନୂଆ କୋଡ ପଠାଇଦେଲି।",
      resent: "ହୋଇଗଲା! ମୁଁ ଆପଣଙ୍କ ଇମେଲକୁ ନୂଆ କୋଡ ପଠାଇଦେଲି।",
      spam: "ଇମେଲ ମିଳିଲା ନାହିଁ? ସ୍ପାମ କିମ୍ବା ପ୍ରମୋସନ ଫୋଲ୍ଡର ମଧ୍ୟ ଦେଖନ୍ତୁ।",
      change: "ଇମେଲ ବଦଳାନ୍ତୁ",
      dev: "ଟେଷ୍ଟ ମୋଡ (ଇମେଲ ଏପର୍ଯ୍ୟନ୍ତ ସେଟ ହୋଇନାହିଁ): କୋଡ {code}",
      label: "ଇମେଲ କୋଡ",
    },
    emailErr: {
      noDomain: "ଏହି ଇମେଲ ଆଇଡି ଭୁଲ, @ ପରର ଅଂଶ ନାହିଁ। ଦୟାକରି ଠିକ ଇମେଲ ଦିଅନ୍ତୁ।",
      disposable: "ଅସ୍ଥାୟୀ ଇମେଲରେ ଆପଣଙ୍କ ସୋଲାର ରିପୋର୍ଟ ଯାଇପାରିବ ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ନିଜ ଇମେଲ ଦିଅନ୍ତୁ।",
      rejected: "ଏହି ଇମେଲ ଆଇଡି ଭୁଲ, ଏଥିକୁ ଇମେଲ ଯାଇପାରିବ ନାହିଁ। ଦୟାକରି ଠିକ ଇମେଲ ଦିଅନ୍ତୁ।",
      wait: "ନୂଆ କୋଡ ମାଗିବା ପୂର୍ବରୁ ଦୟାକରି {s} ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।",
      limit: "ଏହି ଇମେଲ ପାଇଁ ବହୁତ କୋଡ ମଗାଯାଇଛି। ଦୟାକରି କିଛି ସମୟ ପରେ ଚେଷ୍ଟା କରନ୍ତୁ, କିମ୍ବା ଆମ ବିଶେଷଜ୍ଞଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।",
      unavailable: "କ୍ଷମା କରିବେ, ଏବେ ଇମେଲ ପଠାଇପାରିଲି ନାହିଁ। ଦୟାକରି ଏକ ମିନିଟ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    },
    pin: {
      ask: "ବହୁତ ଭଲ, {first}! ଏବେ ଆପଣଙ୍କ ଠିକଣା ଜାଣିବା। ଆପଣଙ୍କ 6 ଅଙ୍କର ପିନ କୋଡ ଦିଅନ୍ତୁ।",
      label: "ପିନ କୋଡ",
      placeholder: "6 ଅଙ୍କର ପିନ କୋଡ",
      invalid: "ପିନ କୋଡରେ 6ଟି ଅଙ୍କ ଥାଏ ଏବଂ ଏହା 0 କିମ୍ବା 9 ରୁ ଆରମ୍ଭ ହୁଏ ନାହିଁ। ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ।",
      looking: "ଆପଣଙ୍କ ଅଞ୍ଚଳ ଖୋଜୁଛି…",
      found: "ମୁଁ {state} ର {district} ଜିଲ୍ଲା ପାଇଲି। ଦୟାକରି ନିଶ୍ଚିତ କରନ୍ତୁ, କିମ୍ବା ଦରକାର ହେଲେ ବଦଳାନ୍ତୁ।",
      notFound: "ଏହି ପିନ କୋଡ ସ୍ୱୟଂଚାଳିତ ଭାବେ ମିଳିଲା ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ରାଜ୍ୟ ଓ ଜିଲ୍ଲା ବାଛନ୍ତୁ।",
    },
    region: {
      state: "ରାଜ୍ୟ",
      district: "ଜିଲ୍ଲା",
      chooseState: "ରାଜ୍ୟ ବାଛନ୍ତୁ",
      chooseDistrict: "ଜିଲ୍ଲା ବାଛନ୍ତୁ",
      err: "ଦୟାକରି ଆପଣଙ୍କ ରାଜ୍ୟ ଓ ଜିଲ୍ଲା ବାଛନ୍ତୁ।",
      confirm: "ନିଶ୍ଚିତ କରନ୍ତୁ",
    },
    area: {
      ask: "ଧନ୍ୟବାଦ। ଆପଣ କେଉଁ ଅଞ୍ଚଳ ବା ପଡ଼ାରେ ରହନ୍ତି? ତଳୁ ବାଛନ୍ତୁ, କିମ୍ବା ଲେଖନ୍ତୁ।",
      askPlain: "ଧନ୍ୟବାଦ। ଆପଣ କେଉଁ ଅଞ୍ଚଳ ବା ପଡ଼ାରେ ରହନ୍ତି?",
      label: "ଅଞ୍ଚଳ / ପଡ଼ା",
      placeholder: "ଯେପରି: ପାଟିଆ, ଭୁବନେଶ୍ୱର",
      err: "ଦୟାକରି ଆପଣଙ୍କ ଅଞ୍ଚଳ ବା ପଡ଼ାର ନାମ ଲେଖନ୍ତୁ।",
    },
    own: {
      ask: "ଧନ୍ୟବାଦ, ଆପଣଙ୍କ ଠିକଣା ସେଭ ହୋଇଗଲା। ଏବେ ଆପଣଙ୍କ ଘର ବିଷୟରେ କିଛି ଛୋଟ ପ୍ରଶ୍ନ। ଏହା ଆପଣଙ୍କ ନିଜ ଘର, ନା ଭଡ଼ା ଘର?",
      opts: { own: "ମୋର ନିଜ ଘର", rented: "ଭଡ଼ା ଘର" },
    },
    ownerOk: {
      ask: "ଭଡ଼ା ଘରେ ରୁଫଟପ ସୋଲାର ପାଇଁ ଘର ମାଲିକଙ୍କ ଅନୁମତି ଦରକାର। ଆପଣଙ୍କ ପାଖରେ ମାଲିକଙ୍କ ଅନୁମତି ଅଛି କି?",
      opts: { yes: "ହଁ, ଅନୁମତି ଅଛି", no: "ନାହିଁ / ନିଶ୍ଚିତ ନୁହେଁ" },
    },
    ptype: {
      ask: "ଏହା କେଉଁ ପ୍ରକାରର ସମ୍ପତ୍ତି?",
      opts: { house: "ସ୍ୱତନ୍ତ୍ର ଘର", flat: "ଫ୍ଲାଟ / ଆପାର୍ଟମେଣ୍ଟ", commercial: "ବାଣିଜ୍ୟିକ", industrial: "ଶିଳ୍ପ" },
    },
    roofType: {
      ask: "ପ୍ୟାନେଲ ଆପଣଙ୍କ ନିଜ ଛାତରେ ଲାଗିବ, ନା ସୋସାଇଟିର ସାଧାରଣ ଛାତରେ?",
      opts: { own: "ମୋର ନିଜ ଛାତ", society: "ସୋସାଇଟିର ସାଧାରଣ ଛାତ" },
    },
    bill: {
      ask: "ଆପଣଙ୍କ ହାରାହାରି ମାସିକ ବିଦ୍ୟୁତ ବିଲ କେତେ? ସ୍ଲାଇଡର ଘୁଞ୍ଚାଇ ବାଛନ୍ତୁ।",
      label: "ମାସିକ ବିଲ",
      above: "₹10,000 ରୁ ଅଧିକ",
      perMonth: "/ମାସ",
      exactAsk: "ଦୟାକରି ଆପଣଙ୍କ ହାରାହାରି ମାସିକ ବିଲ ରାଶି ଲେଖନ୍ତୁ।",
      exactPlaceholder: "ରାଶି ₹ ରେ",
      exactErr: "ଦୟାକରି 10 ହଜାରରୁ 10 ଲକ୍ଷ ଟଙ୍କା ମଧ୍ୟରେ ରାଶି ଦିଅନ୍ତୁ।",
    },
    roof: {
      ask: "ଆପଣଙ୍କ ଛାତରେ ପ୍ରାୟ କେତେ ଛାଇମୁକ୍ତ ସ୍ଥାନ ଅଛି? ନିଶ୍ଚିତ ନ ଜାଣିଲେ କିଛି ଅସୁବିଧା ନାହିଁ।",
      label: "ଛାତର ସ୍ଥାନ",
      unsure: "ଜାଣେ ନାହିଁ",
      sqft: "ବର୍ଗଫୁଟ",
    },
    goal: {
      ask: "ସୋଲାର ଲଗାଇବାର ଆପଣଙ୍କ ମୁଖ୍ୟ ଉଦ୍ଦେଶ୍ୟ କ'ଣ?",
      opts: { savings: "ବିଲରେ ସଞ୍ଚୟ", subsidy: "ସବସିଡି ପାଇବା", backup: "ପାୱାର ବ୍ୟାକଅପ", independence: "ବିଦ୍ୟୁତରେ ଆତ୍ମନିର୍ଭରତା" },
    },
    cuts: {
      ask: "ଆପଣଙ୍କ ଅଞ୍ଚଳରେ ଦିନକୁ ପ୍ରାୟ କେତେ ଘଣ୍ଟା ବିଦ୍ୟୁତ କଟେ?",
      opts: { lt1: "1 ଘଣ୍ଟାରୁ କମ", h1_3: "1–3 ଘଣ୍ଟା", h3_6: "3–6 ଘଣ୍ଟା", gt6: "6 ଘଣ୍ଟାରୁ ଅଧିକ" },
    },
    when: {
      ask: "ଆପଣ କେବେ ସୋଲାର ଲଗାଇବାକୁ ଚାହୁଁଛନ୍ତି?",
      opts: { now: "ତୁରନ୍ତ", d15: "15 ଦିନ ଭିତରେ", d30: "30 ଦିନ ଭିତରେ", later: "ପରେ" },
    },
    pay: {
      ask: "ଆପଣ କିପରି ଦେୟ ଦେବାକୁ ଚାହିଁବେ?",
      opts: { full: "ପୂର୍ଣ୍ଣ ଦେୟ", bank: "ବ୍ୟାଙ୍କ ଋଣ", emi: "EMI", guide: "ପରାମର୍ଶ ଦରକାର" },
    },
    react: {
      emailVerified: "ବଢ଼ିଆ, ଆପଣଙ୍କ ଇମେଲ ଯାଞ୍ଚ ହୋଇଗଲା!",
      own: "ବହୁତ ଭଲ! ନିଜ ଘରେ ସୋଲାର ଲଗାଇବା ବହୁତ ସହଜ।",
      ownerYes: "ବଢ଼ିଆ, ତେବେ କାମ ସହଜ।",
      ownerNo: "କିଛି ଅସୁବିଧା ନାହିଁ। ମାଲିକଙ୍କ ସମ୍ମତି ପାଇବାରେ ଆମ ଟିମ ସାହାଯ୍ୟ କରିବ।",
      house: "ଚମତ୍କାର! ସ୍ୱତନ୍ତ୍ର ଘର ରୁଫଟପ ସୋଲାର ପାଇଁ ସବୁଠୁ ଉପଯୁକ୍ତ।",
      flat: "ଠିକ ଅଛି।",
      commercial: "ବଢ଼ିଆ! ବ୍ୟବସାୟରେ ଦିନରେ ଅଧିକ ବିଜୁଳି ଲାଗେ, ତେଣୁ ସୋଲାରରୁ ବହୁତ ସଞ୍ଚୟ ହୁଏ।",
      industrial: "ଚମତ୍କାର! କାରଖାନାଗୁଡ଼ିକ ସୋଲାରରୁ ସବୁଠୁ ଅଧିକ ସଞ୍ଚୟ କରନ୍ତି।",
      roofOwn: "ବଢ଼ିଆ, ନିଜ ଛାତ ଥିଲେ ସବୁ ସହଜ।",
      roofSociety: "ଭଲ କଥା। ସୋସାଇଟି ଛାତରେ ସୋଲାର ସମସ୍ତଙ୍କ କମନ ବିଜୁଳି ବିଲ କମାଏ।",
      billHigh: "ଧନ୍ୟବାଦ। ଏତିକି ବିଲରେ ସୋଲାରରୁ ଭଲ ସଞ୍ଚୟ ହୋଇପାରିବ।",
      billLow: "ଧନ୍ୟବାଦ। ସୋଲାର ଆପଣଙ୍କ ବିଲ ଆହୁରି କମାଇପାରିବ।",
      roofKnown: "ଧନ୍ୟବାଦ, ଏହାଦ୍ୱାରା ମୁଁ ଆପଣଙ୍କ ସିଷ୍ଟମର ଠିକ ସାଇଜ ସ୍ଥିର କରିପାରିବି।",
      roofUnsure: "କିଛି ଅସୁବିଧା ନାହିଁ। ମାଗଣା ସାଇଟ ସର୍ଭେରେ ଆମ ଟିମ ଏହା ମାପିବ।",
      savings: "ବୁଦ୍ଧିମାନ ନିଷ୍ପତ୍ତି! ଅଧିକାଂଶ ପରିବାର ବିଲ ସଞ୍ଚୟ ପାଇଁ ହିଁ ସୋଲାର ଲଗାନ୍ତି।",
      subsidyOdisha: "ବଢ଼ିଆ! ଓଡ଼ିଶାରେ ଆପଣ 1 ଲକ୍ଷ 38 ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ସବସିଡି ପାଇପାରିବେ।",
      subsidyOther: "ବଢ଼ିଆ! ପିଏମ ସୂର୍ଯ୍ୟ ଘର ଯୋଜନାରେ ଆପଣ 78 ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ସବସିଡି ପାଇପାରିବେ।",
      subsidyNone: "ବୁଝିଗଲି। ଘରୋଇ ସବସିଡି ବ୍ୟବସାୟ ପାଇଁ ନୁହେଁ, କିନ୍ତୁ ସୋଲାରରୁ ତଥାପି ବହୁତ ସଞ୍ଚୟ ହୁଏ।",
      backup: "ମୁଁ ବୁଝିପାରୁଛି, ବିଜୁଳି କଟ ସତରେ ହଇରାଣ କରେ।",
      independence: "ବାଃ! ନିଜ ବିଜୁଳି ନିଜେ ତିଆରି କରିବାର ମଜା ଅଲଗା।",
      cuts: "ଧନ୍ୟବାଦ। ଆମ ବିଶେଷଜ୍ଞ ଆପଣଙ୍କ ପାଇଁ ଠିକ ବ୍ୟାକଅପ ପରାମର୍ଶ ଦେବେ।",
      now: "ଚମତ୍କାର! ଯେତେ ଶୀଘ୍ର ଆରମ୍ଭ, ସେତେ ଶୀଘ୍ର ସଞ୍ଚୟ।",
      soon: "ବଢ଼ିଆ ସମୟ।",
      later: "କିଛି ତରବର ନାହିଁ। ଆପଣ ପ୍ରସ୍ତୁତ ହେଲେ ଆପଣଙ୍କ ପ୍ଲାନ ପ୍ରସ୍ତୁତ ରହିବ।",
      payFull: "ବଢ଼ିଆ।",
      payLoan: "ଭଲ ବିକଳ୍ପ। ମୁଁ ଆପଣଙ୍କ ପ୍ଲାନରେ EMI ମଧ୍ୟ ଦେଖାଇବି।",
      payGuide: "ନିଶ୍ଚୟ, ଆମ ବିଶେଷଜ୍ଞ ଆପଣଙ୍କୁ ପ୍ରତ୍ୟେକ ବିକଳ୍ପ ବୁଝାଇବେ।",
    },
    calc: {
      title: "ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ ପ୍ରସ୍ତୁତ କରୁଛି…",
      sub: "{district} ପାଇଁ ଉତ୍ପାଦନ, ସବସିଡି ଓ ସଞ୍ଚୟ ହିସାବ କରୁଛି",
      say: "ଧନ୍ୟବାଦ, {first}! ଟିକେ ଅପେକ୍ଷା କରନ୍ତୁ, ମୁଁ ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ ତିଆରି କରୁଛି।",
    },
    result: {
      say: "{first}, ଏହା ହେଉଛି ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ! ମୋ ପରାମର୍ଶ ହେଉଛି {kw} କିଲୋୱାଟ ସିଷ୍ଟମ। ଏହାର ମୋଟ ଖର୍ଚ୍ଚ ପ୍ରାୟ {cost}, ଏବଂ ଆପଣ {subsidy} ସବସିଡି ପାଇପାରିବେ। ଆପଣଙ୍କ ନିବେଶ ପ୍ରାୟ {invest} ହେବ, ଏବଂ ପ୍ରତି ମାସରେ ପ୍ରାୟ {monthly} ସଞ୍ଚୟ ହେବ। ଅର୍ଥାତ 25 ବର୍ଷରେ ପ୍ରାୟ {life} ସଞ୍ଚୟ! ଆଉ ଆପଣଙ୍କ ସିଷ୍ଟମ ପ୍ରାୟ {payback} ବର୍ଷରେ ନିଜ ଖର୍ଚ୍ଚ ଉଠାଇନେବ।",
      sayNoSub: "{first}, ଏହା ହେଉଛି ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ! ମୋ ପରାମର୍ଶ ହେଉଛି {kw} କିଲୋୱାଟ ସିଷ୍ଟମ। ଏହାର ମୋଟ ଖର୍ଚ୍ଚ ପ୍ରାୟ {cost}। ପ୍ରତି ମାସରେ ପ୍ରାୟ {monthly} ସଞ୍ଚୟ ହେବ, ଏବଂ 25 ବର୍ଷରେ ପ୍ରାୟ {life}! ଆଉ ଆପଣଙ୍କ ସିଷ୍ଟମ ପ୍ରାୟ {payback} ବର୍ଷରେ ନିଜ ଖର୍ଚ୍ଚ ଉଠାଇନେବ।",
      caption: "{first}, ଏହା ହେଉଛି ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ!",
      title: "ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ",
      kw: "ସିଷ୍ଟମ ଆକାର",
      panels: "{n}ଟି ପ୍ୟାନେଲ",
      cost: "ମୋଟ ଖର୍ଚ୍ଚ",
      subsidy: "ସରକାରୀ ସବସିଡି",
      central: "କେନ୍ଦ୍ର (ପିଏମ ସୂର୍ଯ୍ୟ ଘର)",
      state: "ଓଡ଼ିଶା ରାଜ୍ୟ ଅତିରିକ୍ତ",
      youPay: "ଆପଣଙ୍କ ନିବେଶ",
      monthly: "ମାସିକ ସଞ୍ଚୟ",
      life: "25 ବର୍ଷର ସଞ୍ଚୟ",
      payback: "ଖର୍ଚ୍ଚ ଫେରସ୍ତ",
      years: "{n} ବର୍ଷ",
      co2: "ସଞ୍ଚିତ CO₂",
      trees: "≈ ବର୍ଷକୁ {n}ଟି ଗଛ",
      emi: "EMI",
      emiLine: "{amount}/ମାସ · {years} ବର୍ଷ · ବାର୍ଷିକ {rate}%",
      noSubsidy: "ବାଣିଜ୍ୟିକ ଓ ଶିଳ୍ପ ସମ୍ପତ୍ତିରେ ଘରୋଇ ସବସିଡି ମିଳେ ନାହିଁ।",
      ownerNote: "ଇନଷ୍ଟଲେସନ ପୂର୍ବରୁ ଘର ମାଲିକଙ୍କ ଲିଖିତ ସମ୍ମତି ଦରକାର ହେବ।",
      roofNote: "ଆପଣଙ୍କ ଛାତର ସ୍ଥାନ ଅନୁସାରେ ଆକାର ସ୍ଥିର କରାଯାଇଛି। ବଡ଼ ଛାତରେ {ideal} kW ଲାଗିପାରିବ।",
      note: "ଏହା Clans Machina କାଲକୁଲେଟରର ଆକଳନ। ମାଗଣା ସାଇଟ ସର୍ଭେ ପରେ ଚୂଡ଼ାନ୍ତ ମୂଲ୍ୟ।",
      cta: "ମୋର ମାଗଣା ପରାମର୍ଶ ବୁକ କରନ୍ତୁ",
      faq: "ପ୍ରଶ୍ନ ଅଛି? ପ୍ରଥମେ Saathi ଙ୍କୁ ପଚାରନ୍ତୁ",
      faqSub: "ସବସିଡି, ଋଣ, ସଞ୍ଚୟ, ଲଗାଇବା…",
      wa: "WhatsApp ରେ କଥା ହୁଅନ୍ତୁ",
      waSub: "ଆପଣଙ୍କ ପ୍ଲାନ ସହିତ ଯିବ, କିଛି ପୁଣି କହିବା ଦରକାର ନାହିଁ",
      next: "ଏବେ ଆପଣଙ୍କ ମାଗଣା ପରାମର୍ଶ ବୁକ କରନ୍ତୁ, ମୋତେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ, କିମ୍ବା WhatsApp ରେ ଆମ ଟିମ ସହ କଥା ହୁଅନ୍ତୁ।",
    },
    mode: {
      ask: "ବହୁତ ଭଲ! ଆପଣ ଆମ ସୋଲାର ବିଶେଷଜ୍ଞଙ୍କ ସହ କିପରି କଥା ହେବାକୁ ଚାହିଁବେ? ଏହା ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା।",
      opts: { call: "ଫୋନ କଲ", visit: "ସାଇଟ ପରିଦର୍ଶନ", online: "ଅନଲାଇନ ଭିଡିଓ କଲ" },
    },
    date: { ask: "ବଢ଼ିଆ। ଆପଣଙ୍କ ପାଇଁ କେଉଁ ତାରିଖ ସୁବିଧାଜନକ?", today: "ଆଜି", tomorrow: "କାଲି" },
    slot: {
      ask: "ଏବଂ କେଉଁ ସମୟ ଆପଣଙ୍କ ପାଇଁ ଠିକ?",
      opts: { s1: "ସକାଳ 10 – ମଧ୍ୟାହ୍ନ 12", s2: "ମଧ୍ୟାହ୍ନ 12 – 2", s3: "ଅପରାହ୍ନ 2 – 4", s4: "ସନ୍ଧ୍ୟା 4 – 6" },
    },
    booked: {
      say: "ଅଭିନନ୍ଦନ, {first}! ଆପଣଙ୍କ ମାଗଣା {mode} {date}, {slot} ପାଇଁ ବୁକ ହୋଇଗଲା। ଆମ {district} ଟିମ ତା' ପୂର୍ବରୁ ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବେ। Clans Machina ଉପରେ ଭରସା କରିଥିବାରୁ ଧନ୍ୟବାଦ!",
      title: "ପରାମର୍ଶ ବୁକ ହୋଇଗଲା!",
      team: "ଆମ {district} ଟିମ ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବେ",
      sent: "ଆମ ଟିମ {mobile} ରେ ନିଶ୍ଚିତ କରିବେ",
      ref: "ବୁକିଂ ଆଇଡି",
      thanks: "Clans Machina ବାଛିଥିବାରୁ ଧନ୍ୟବାଦ",
    },
    expert: {
      button: "ବିଶେଷଜ୍ଞଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ",
      title: "ସୋଲାର ବିଶେଷଜ୍ଞଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ",
      sub: "ଆମ ଟିମ ପାଖରେ ଆପଣଙ୍କ ସୂଚନା ପୂର୍ବରୁ ଅଛି, ଆପଣଙ୍କୁ କିଛି ପୁଣି କହିବାକୁ ପଡ଼ିବ ନାହିଁ।",
      call: "ଏବେ କଲ କରନ୍ତୁ",
      whatsapp: "WhatsApp ଚାଟ",
      callback: "କଲବ୍ୟାକ ଅନୁରୋଧ",
      callbackDone: "ହୋଇଗଲା! ଆମେ ଶୀଘ୍ର ଆପଣଙ୍କୁ କଲ କରିବୁ।",
      hours: "ସୋମ–ଶନି, ସକାଳ 9 – ସନ୍ଧ୍ୟା 7",
      tollFree: "ଟୋଲ-ଫ୍ରି",
    },
    money: { lakh: "ଲକ୍ଷ", thousand: "ହଜାର", crore: "କୋଟି", rupees: "ଟଙ୍କା" },
  },
};
