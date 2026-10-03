// Copy for the full journey after "About you": OTP, location, home questions,
// solar plan, consultation booking and the expert sheet.
// Hindi and Odia are first drafts: get them checked by a native speaker.

import type { Lang } from "./i18n";

type Opts<K extends string> = Record<K, string>;

export type FlowCopy = {
  sections: [string, string, string, string, string];
  acks: string[];
  next: string;
  otp: {
    ask: string; verifiedThenEmail: string; wrong: string; resent: string; resend: string; resendIn: string;
    change: string; demo: string; label: string; verify: string; verified: string;
  };
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
  calc: { title: string; sub: string };
  result: {
    say: string; sayNoSub: string; caption: string; title: string; kw: string; panels: string; cost: string; subsidy: string;
    central: string; state: string; youPay: string; monthly: string; life: string; payback: string; years: string;
    co2: string; trees: string; emi: string; emiLine: string; noSubsidy: string; ownerNote: string; roofNote: string;
    note: string; cta: string;
  };
  consult: { ask: string; opts: Opts<"yes" | "no"> };
  mode: { ask: string; opts: Opts<"call" | "visit" | "online"> };
  date: { ask: string; today: string; tomorrow: string };
  slot: { ask: string; opts: Opts<"s1" | "s2" | "s3" | "s4"> };
  booked: { say: string; title: string; team: string; sent: string; ref: string; thanks: string };
  skip: { say: string; title: string };
  expert: {
    button: string; title: string; sub: string; call: string; whatsapp: string; callback: string;
    callbackDone: string; hours: string; tollFree: string;
  };
  money: { lakh: string; thousand: string; crore: string; rupees: string };
};

export const FLOW: Record<Lang, FlowCopy> = {
  en: {
    sections: ["About you", "Location", "Your home", "Your plan", "Book"],
    acks: ["Got it.", "Great.", "Okay.", "Perfect.", "Noted."],
    next: "Next",
    otp: {
      ask: "Thank you. I have sent a 6-digit code to {mobile}. Please enter it to verify your number.",
      verifiedThenEmail: "Your number is verified. Lastly, please enter your email ID. I will send your solar report there.",
      wrong: "That code is not correct. Please check and try again.",
      resent: "I have sent a new code to your number.",
      resend: "Resend code",
      resendIn: "Resend in {s}s",
      change: "Change number",
      demo: "Demo mode: use code 123456",
      label: "Verification code",
      verify: "Verify",
      verified: "Verified",
    },
    pin: {
      ask: "Great, {first}! Now let's find your location. Please enter your 6-digit PIN code.",
      label: "PIN code",
      placeholder: "6-digit PIN code",
      invalid: "A PIN code has 6 digits and does not start with 0. Please check it.",
      looking: "Finding your area…",
      found: "I found {district} district in {state}. Please confirm, or change it if needed.",
      notFound: "I could not find this PIN code automatically. Please choose your state and district.",
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
      ask: "Which area or locality do you live in? Tap one below, or type it.",
      askPlain: "Which area or locality do you live in?",
      label: "Area / locality",
      placeholder: "e.g. Patia, Bhubaneswar",
      err: "Please enter your area or locality.",
    },
    own: {
      ask: "Thank you, I have saved your location. Now a few quick questions about your home. Is this your own house, or a rented property?",
      opts: { own: "My own house", rented: "Rented" },
    },
    ownerOk: {
      ask: "For rooftop solar on a rented house, the owner's permission is needed. Do you have the owner's permission?",
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
      ask: "What is your average monthly electricity bill? Move the slider to set it.",
      label: "Monthly bill",
      above: "Above ₹10,000",
      perMonth: "/month",
      exactAsk: "Please enter your average monthly bill amount.",
      exactPlaceholder: "Amount in ₹",
      exactErr: "Please enter an amount above ₹10,000.",
    },
    roof: {
      ask: "Roughly how much shadow-free roof space do you have? If you are not sure, that's okay.",
      label: "Roof space",
      unsure: "Not sure",
      sqft: "sq ft",
    },
    goal: {
      ask: "What is your main goal with solar?",
      opts: { savings: "Save on bills", subsidy: "Get the subsidy", backup: "Power backup", independence: "Energy independence" },
    },
    cuts: {
      ask: "How many hours of power cuts do you usually have in a day?",
      opts: { lt1: "Under 1 hour", h1_3: "1–3 hours", h3_6: "3–6 hours", gt6: "Over 6 hours" },
    },
    when: {
      ask: "When are you planning to install solar?",
      opts: { now: "Immediately", d15: "Within 15 days", d30: "Within 30 days", later: "Later" },
    },
    pay: {
      ask: "How would you like to pay?",
      opts: { full: "Full payment", bank: "Bank finance", emi: "EMI", guide: "Need guidance" },
    },
    calc: { title: "Designing your solar plan…", sub: "Checking generation, subsidy and savings for {district}" },
    result: {
      say: "Here is your solar plan, {first}! I recommend a {kw} kilowatt system. It costs about {cost}, and you can get a subsidy of {subsidy}. You will invest about {invest}, and save about {monthly} every month. That is about {life} over 25 years!",
      sayNoSub: "Here is your solar plan, {first}! I recommend a {kw} kilowatt system. It costs about {cost}. You will save about {monthly} every month, and about {life} over 25 years!",
      caption: "Here is your solar plan, {first}!",
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
    },
    consult: {
      ask: "Would you like a free consultation with our solar expert? It takes just a minute to book.",
      opts: { yes: "Yes, book it", no: "Not now" },
    },
    mode: {
      ask: "How would you like your free consultation?",
      opts: { call: "Phone call", visit: "Site visit", online: "Online video call" },
    },
    date: { ask: "Please pick a convenient date.", today: "Today", tomorrow: "Tomorrow" },
    slot: {
      ask: "And a convenient time?",
      opts: { s1: "10 AM – 12 PM", s2: "12 PM – 2 PM", s3: "2 PM – 4 PM", s4: "4 PM – 6 PM" },
    },
    booked: {
      say: "Wonderful, {first}! Your free {mode} is booked for {date}, {slot}. Our {district} team will contact you. I have sent the confirmation on WhatsApp and SMS.",
      title: "Consultation booked!",
      team: "Our {district} team will contact you",
      sent: "Confirmation sent on WhatsApp & SMS to {mobile}",
      ref: "Booking ID",
      thanks: "Thank you for choosing Clans Machina",
    },
    skip: {
      say: "No problem, {first}. I have saved your solar plan, and our team will share it with you on WhatsApp. You can talk to an expert anytime.",
      title: "Your plan is saved",
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
    acks: ["ठीक है।", "बढ़िया।", "समझ गया।", "बहुत अच्छा।", "नोट कर लिया।"],
    next: "आगे बढ़ें",
    otp: {
      ask: "धन्यवाद। मैंने {mobile} पर 6 अंकों का कोड भेजा है। अपना नंबर वेरिफाई करने के लिए वह कोड डालिए।",
      verifiedThenEmail: "आपका नंबर वेरिफाई हो गया। आख़िर में, अपनी ईमेल आईडी डालिए। मैं आपकी सोलर रिपोर्ट वहीं भेजूँगा।",
      wrong: "यह कोड सही नहीं है। कृपया जाँच कर फिर से डालें।",
      resent: "मैंने आपके नंबर पर नया कोड भेज दिया है।",
      resend: "कोड दोबारा भेजें",
      resendIn: "{s} सेकंड में दोबारा भेजें",
      change: "नंबर बदलें",
      demo: "डेमो मोड: कोड 123456 डालें",
      label: "वेरिफिकेशन कोड",
      verify: "वेरिफाई करें",
      verified: "वेरिफाइड",
    },
    pin: {
      ask: "बहुत बढ़िया, {first}! अब आपकी लोकेशन जानते हैं। अपना 6 अंकों का पिन कोड डालिए।",
      label: "पिन कोड",
      placeholder: "6 अंकों का पिन कोड",
      invalid: "पिन कोड में 6 अंक होते हैं और यह 0 से शुरू नहीं होता। कृपया जाँच लें।",
      looking: "आपका इलाका ढूँढ रहा हूँ…",
      found: "मुझे {state} में {district} ज़िला मिला। कृपया पुष्टि करें, या ज़रूरत हो तो बदलें।",
      notFound: "यह पिन कोड अपने आप नहीं मिला। कृपया अपना राज्य और ज़िला चुनें।",
    },
    region: {
      state: "राज्य",
      district: "ज़िला",
      chooseState: "राज्य चुनें",
      chooseDistrict: "ज़िला चुनें",
      err: "कृपया अपना राज्य और ज़िला चुनें।",
      confirm: "पुष्टि करें",
    },
    area: {
      ask: "आप किस इलाके या मोहल्ले में रहते हैं? नीचे से चुनें, या लिखें।",
      askPlain: "आप किस इलाके या मोहल्ले में रहते हैं?",
      label: "इलाका / मोहल्ला",
      placeholder: "जैसे: पटिया, भुवनेश्वर",
      err: "कृपया अपना इलाका या मोहल्ला लिखें।",
    },
    own: {
      ask: "धन्यवाद, आपकी लोकेशन सेव हो गई। अब आपके घर के बारे में कुछ छोटे सवाल। क्या यह आपका अपना घर है, या किराए का?",
      opts: { own: "मेरा अपना घर", rented: "किराए का" },
    },
    ownerOk: {
      ask: "किराए के घर पर रूफटॉप सोलर के लिए मकान मालिक की अनुमति ज़रूरी है। क्या आपके पास मालिक की अनुमति है?",
      opts: { yes: "हाँ, अनुमति है", no: "नहीं / पक्का नहीं" },
    },
    ptype: {
      ask: "यह किस तरह की प्रॉपर्टी है?",
      opts: { house: "स्वतंत्र मकान", flat: "फ़्लैट / अपार्टमेंट", commercial: "कमर्शियल", industrial: "इंडस्ट्रियल" },
    },
    roofType: {
      ask: "पैनल आपकी अपनी छत पर लगेंगे, या सोसाइटी की कॉमन छत पर?",
      opts: { own: "मेरी अपनी छत", society: "सोसाइटी की कॉमन छत" },
    },
    bill: {
      ask: "आपका औसत मासिक बिजली बिल कितना है? स्लाइडर से चुनें।",
      label: "मासिक बिल",
      above: "₹10,000 से ज़्यादा",
      perMonth: "/महीना",
      exactAsk: "कृपया अपना औसत मासिक बिल लिखें।",
      exactPlaceholder: "रकम ₹ में",
      exactErr: "कृपया ₹10,000 से ज़्यादा रकम डालें।",
    },
    roof: {
      ask: "आपकी छत पर लगभग कितनी जगह है जहाँ छाया नहीं पड़ती? पक्का पता न हो तो कोई बात नहीं।",
      label: "छत की जगह",
      unsure: "पता नहीं",
      sqft: "वर्ग फ़ुट",
    },
    goal: {
      ask: "सोलर लगाने का आपका मुख्य मक़सद क्या है?",
      opts: { savings: "बिल में बचत", subsidy: "सब्सिडी पाना", backup: "पावर बैकअप", independence: "बिजली में आत्मनिर्भरता" },
    },
    cuts: {
      ask: "आपके यहाँ रोज़ लगभग कितने घंटे बिजली कटती है?",
      opts: { lt1: "1 घंटे से कम", h1_3: "1–3 घंटे", h3_6: "3–6 घंटे", gt6: "6 घंटे से ज़्यादा" },
    },
    when: {
      ask: "आप सोलर कब लगवाना चाहते हैं?",
      opts: { now: "तुरंत", d15: "15 दिनों में", d30: "30 दिनों में", later: "बाद में" },
    },
    pay: {
      ask: "आप भुगतान कैसे करना चाहेंगे?",
      opts: { full: "पूरा भुगतान", bank: "बैंक लोन", emi: "EMI", guide: "सलाह चाहिए" },
    },
    calc: { title: "आपका सोलर प्लान बना रहा हूँ…", sub: "{district} के लिए उत्पादन, सब्सिडी और बचत देख रहा हूँ" },
    result: {
      say: "{first}, यह रहा आपका सोलर प्लान! मेरी सलाह है {kw} किलोवाट का सिस्टम। इसकी कुल लागत लगभग {cost} है, और आपको {subsidy} की सब्सिडी मिल सकती है। आपका निवेश लगभग {invest} होगा, और हर महीने लगभग {monthly} की बचत होगी। यानी 25 साल में लगभग {life} की बचत!",
      sayNoSub: "{first}, यह रहा आपका सोलर प्लान! मेरी सलाह है {kw} किलोवाट का सिस्टम। इसकी कुल लागत लगभग {cost} है। हर महीने लगभग {monthly} की बचत होगी, और 25 साल में लगभग {life} की!",
      caption: "{first}, यह रहा आपका सोलर प्लान!",
      title: "आपका सोलर प्लान",
      kw: "सिस्टम साइज़",
      panels: "{n} पैनल",
      cost: "कुल लागत",
      subsidy: "सरकारी सब्सिडी",
      central: "केंद्र (पीएम सूर्य घर)",
      state: "ओडिशा राज्य अतिरिक्त",
      youPay: "आपका निवेश",
      monthly: "मासिक बचत",
      life: "25 साल की बचत",
      payback: "लागत वसूली",
      years: "{n} साल",
      co2: "बचाया गया CO₂",
      trees: "≈ {n} पेड़ प्रति साल",
      emi: "EMI",
      emiLine: "{amount}/महीना · {years} साल · {rate}% सालाना",
      noSubsidy: "कमर्शियल और इंडस्ट्रियल प्रॉपर्टी पर घरेलू सब्सिडी नहीं मिलती।",
      ownerNote: "इंस्टॉलेशन से पहले मकान मालिक की लिखित सहमति ज़रूरी होगी।",
      roofNote: "आपकी छत की जगह के हिसाब से साइज़ तय किया गया है। बड़ी छत पर {ideal} kW लग सकता है।",
      note: "यह Clans Machina कैलकुलेटर का अनुमान है। अंतिम कीमत मुफ़्त साइट सर्वे के बाद।",
      cta: "मेरा मुफ़्त परामर्श बुक करें",
    },
    consult: {
      ask: "क्या आप हमारे सोलर विशेषज्ञ से मुफ़्त परामर्श चाहेंगे? बुक करने में बस एक मिनट लगेगा।",
      opts: { yes: "हाँ, बुक करें", no: "अभी नहीं" },
    },
    mode: {
      ask: "आप मुफ़्त परामर्श कैसे लेना चाहेंगे?",
      opts: { call: "फ़ोन कॉल", visit: "साइट विज़िट", online: "ऑनलाइन वीडियो कॉल" },
    },
    date: { ask: "कृपया अपनी सुविधा की तारीख़ चुनें।", today: "आज", tomorrow: "कल" },
    slot: {
      ask: "और सुविधाजनक समय?",
      opts: { s1: "सुबह 10 – दोपहर 12", s2: "दोपहर 12 – 2", s3: "दोपहर 2 – 4", s4: "शाम 4 – 6" },
    },
    booked: {
      say: "शानदार, {first}! आपकी मुफ़्त {mode} {date}, {slot} के लिए बुक हो गई है। हमारी {district} टीम आपसे संपर्क करेगी। मैंने WhatsApp और SMS पर पुष्टि भेज दी है।",
      title: "परामर्श बुक हो गया!",
      team: "हमारी {district} टीम आपसे संपर्क करेगी",
      sent: "{mobile} पर WhatsApp और SMS से पुष्टि भेजी गई",
      ref: "बुकिंग आईडी",
      thanks: "Clans Machina चुनने के लिए धन्यवाद",
    },
    skip: {
      say: "कोई बात नहीं, {first}। मैंने आपका सोलर प्लान सेव कर लिया है, और हमारी टीम इसे WhatsApp पर आपके साथ साझा करेगी। आप कभी भी विशेषज्ञ से बात कर सकते हैं।",
      title: "आपका प्लान सेव हो गया",
    },
    expert: {
      button: "विशेषज्ञ से बात करें",
      title: "सोलर विशेषज्ञ से बात करें",
      sub: "हमारी टीम के पास आपकी जानकारी पहले से है, आपको कुछ दोबारा बताने की ज़रूरत नहीं।",
      call: "अभी कॉल करें",
      whatsapp: "WhatsApp चैट",
      callback: "कॉलबैक का अनुरोध",
      callbackDone: "हो गया! हम जल्द ही आपको कॉल करेंगे।",
      hours: "सोम–शनि, सुबह 9 – शाम 7",
      tollFree: "टोल-फ़्री",
    },
    money: { lakh: "लाख", thousand: "हज़ार", crore: "करोड़", rupees: "रुपये" },
  },
  or: {
    sections: ["ଆପଣଙ୍କ ବିଷୟରେ", "ଠିକଣା", "ଆପଣଙ୍କ ଘର", "ଆପଣଙ୍କ ପ୍ଲାନ", "ବୁକିଂ"],
    acks: ["ଠିକ ଅଛି।", "ବହୁତ ଭଲ।", "ବୁଝିଗଲି।", "ଚମତ୍କାର।", "ନୋଟ କଲି।"],
    next: "ଆଗକୁ",
    otp: {
      ask: "ଧନ୍ୟବାଦ। ମୁଁ {mobile} କୁ 6 ଅଙ୍କର ଏକ କୋଡ ପଠାଇଛି। ଆପଣଙ୍କ ନମ୍ବର ଯାଞ୍ଚ ପାଇଁ ସେହି କୋଡ ଦିଅନ୍ତୁ।",
      verifiedThenEmail: "ଆପଣଙ୍କ ନମ୍ବର ଯାଞ୍ଚ ହୋଇଗଲା। ଶେଷରେ, ଆପଣଙ୍କ ଇମେଲ ଆଇଡି ଦିଅନ୍ତୁ। ମୁଁ ସେଠାକୁ ଆପଣଙ୍କ ସୋଲାର ରିପୋର୍ଟ ପଠାଇବି।",
      wrong: "ଏହି କୋଡ ଠିକ ନୁହେଁ। ଦୟାକରି ଯାଞ୍ଚ କରି ପୁଣି ଦିଅନ୍ତୁ।",
      resent: "ମୁଁ ଆପଣଙ୍କ ନମ୍ବରକୁ ନୂଆ କୋଡ ପଠାଇଦେଲି।",
      resend: "କୋଡ ପୁଣି ପଠାନ୍ତୁ",
      resendIn: "{s} ସେକେଣ୍ଡରେ ପୁଣି ପଠାନ୍ତୁ",
      change: "ନମ୍ବର ବଦଳାନ୍ତୁ",
      demo: "ଡେମୋ ମୋଡ: କୋଡ 123456 ଦିଅନ୍ତୁ",
      label: "ଯାଞ୍ଚ କୋଡ",
      verify: "ଯାଞ୍ଚ କରନ୍ତୁ",
      verified: "ଯାଞ୍ଚିତ",
    },
    pin: {
      ask: "ବହୁତ ଭଲ, {first}! ଏବେ ଆପଣଙ୍କ ଠିକଣା ଜାଣିବା। ଆପଣଙ୍କ 6 ଅଙ୍କର ପିନ କୋଡ ଦିଅନ୍ତୁ।",
      label: "ପିନ କୋଡ",
      placeholder: "6 ଅଙ୍କର ପିନ କୋଡ",
      invalid: "ପିନ କୋଡରେ 6ଟି ଅଙ୍କ ଥାଏ ଏବଂ ଏହା 0 ରୁ ଆରମ୍ଭ ହୁଏ ନାହିଁ। ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ।",
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
      ask: "ଆପଣ କେଉଁ ଅଞ୍ଚଳ ବା ପଡ଼ାରେ ରହନ୍ତି? ତଳୁ ବାଛନ୍ତୁ, କିମ୍ବା ଲେଖନ୍ତୁ।",
      askPlain: "ଆପଣ କେଉଁ ଅଞ୍ଚଳ ବା ପଡ଼ାରେ ରହନ୍ତି?",
      label: "ଅଞ୍ଚଳ / ପଡ଼ା",
      placeholder: "ଯେପରି: ପାଟିଆ, ଭୁବନେଶ୍ୱର",
      err: "ଦୟାକରି ଆପଣଙ୍କ ଅଞ୍ଚଳ ବା ପଡ଼ା ଲେଖନ୍ତୁ।",
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
      exactErr: "ଦୟାକରି ₹10,000 ରୁ ଅଧିକ ରାଶି ଦିଅନ୍ତୁ।",
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
    calc: { title: "ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ ପ୍ରସ୍ତୁତ କରୁଛି…", sub: "{district} ପାଇଁ ଉତ୍ପାଦନ, ସବସିଡି ଓ ସଞ୍ଚୟ ହିସାବ କରୁଛି" },
    result: {
      say: "{first}, ଏହା ହେଉଛି ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ! ମୋ ପରାମର୍ଶ ହେଉଛି {kw} କିଲୋୱାଟ ସିଷ୍ଟମ। ଏହାର ମୋଟ ଖର୍ଚ୍ଚ ପ୍ରାୟ {cost}, ଏବଂ ଆପଣ {subsidy} ସବସିଡି ପାଇପାରିବେ। ଆପଣଙ୍କ ନିବେଶ ପ୍ରାୟ {invest} ହେବ, ଏବଂ ପ୍ରତି ମାସରେ ପ୍ରାୟ {monthly} ସଞ୍ଚୟ ହେବ। ଅର୍ଥାତ 25 ବର୍ଷରେ ପ୍ରାୟ {life} ସଞ୍ଚୟ!",
      sayNoSub: "{first}, ଏହା ହେଉଛି ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ! ମୋ ପରାମର୍ଶ ହେଉଛି {kw} କିଲୋୱାଟ ସିଷ୍ଟମ। ଏହାର ମୋଟ ଖର୍ଚ୍ଚ ପ୍ରାୟ {cost}। ପ୍ରତି ମାସରେ ପ୍ରାୟ {monthly} ସଞ୍ଚୟ ହେବ, ଏବଂ 25 ବର୍ଷରେ ପ୍ରାୟ {life}!",
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
    },
    consult: {
      ask: "ଆପଣ ଆମ ସୋଲାର ବିଶେଷଜ୍ଞଙ୍କ ସହ ମାଗଣା ପରାମର୍ଶ ନେବାକୁ ଚାହିଁବେ କି? ବୁକ କରିବାକୁ ମାତ୍ର ଏକ ମିନିଟ ଲାଗିବ।",
      opts: { yes: "ହଁ, ବୁକ କରନ୍ତୁ", no: "ଏବେ ନୁହେଁ" },
    },
    mode: {
      ask: "ଆପଣ ମାଗଣା ପରାମର୍ଶ କିପରି ନେବାକୁ ଚାହିଁବେ?",
      opts: { call: "ଫୋନ କଲ", visit: "ସାଇଟ ପରିଦର୍ଶନ", online: "ଅନଲାଇନ ଭିଡିଓ କଲ" },
    },
    date: { ask: "ଦୟାକରି ଆପଣଙ୍କ ସୁବିଧା ଅନୁସାରେ ଏକ ତାରିଖ ବାଛନ୍ତୁ।", today: "ଆଜି", tomorrow: "କାଲି" },
    slot: {
      ask: "ଏବଂ ସୁବିଧାଜନକ ସମୟ?",
      opts: { s1: "ସକାଳ 10 – ମଧ୍ୟାହ୍ନ 12", s2: "ମଧ୍ୟାହ୍ନ 12 – 2", s3: "ଅପରାହ୍ନ 2 – 4", s4: "ସନ୍ଧ୍ୟା 4 – 6" },
    },
    booked: {
      say: "ଚମତ୍କାର, {first}! ଆପଣଙ୍କ ମାଗଣା {mode} {date}, {slot} ପାଇଁ ବୁକ ହୋଇଗଲା। ଆମ {district} ଟିମ ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବେ। ମୁଁ WhatsApp ଓ SMS ରେ ନିଶ୍ଚିତକରଣ ପଠାଇଦେଲି।",
      title: "ପରାମର୍ଶ ବୁକ ହୋଇଗଲା!",
      team: "ଆମ {district} ଟିମ ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବେ",
      sent: "{mobile} କୁ WhatsApp ଓ SMS ରେ ନିଶ୍ଚିତକରଣ ପଠାଯାଇଛି",
      ref: "ବୁକିଂ ଆଇଡି",
      thanks: "Clans Machina ବାଛିଥିବାରୁ ଧନ୍ୟବାଦ",
    },
    skip: {
      say: "କିଛି ଅସୁବିଧା ନାହିଁ, {first}। ମୁଁ ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ ସେଭ କରିଦେଲି, ଏବଂ ଆମ ଟିମ ଏହାକୁ WhatsApp ରେ ଆପଣଙ୍କ ସହ ସେୟାର କରିବେ। ଆପଣ ଯେକୌଣସି ସମୟରେ ବିଶେଷଜ୍ଞଙ୍କ ସହ କଥା ହୋଇପାରିବେ।",
      title: "ଆପଣଙ୍କ ପ୍ଲାନ ସେଭ ହୋଇଗଲା",
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
