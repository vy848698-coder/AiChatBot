// Solar Saathi FAQ assistant (client brief, PDF §4): 7 topics, short spoken
// answers, and a matcher for questions the user types or speaks.
//
// Sources: the client's own site (clansmachina.com/faq.html and the on-grid /
// off-grid / hybrid guides) first, then MNRE / PM Surya Ghar and Odisha
// (OREDA, OERC, TP Odisha DISCOMs) for government facts. Figures match the
// calculator in estimate.ts (₹5/unit, 4 units per kW a day, 6.5% EMI).
// Checked October 2026. Review subsidy and loan figures when the schemes change.
//
// Answers are written to be heard: 2–3 short sentences, numbers in words.
// `k` is the one fact shown big on the card. Hindi is conversational; Odia is
// a first draft: get it checked by a native speaker.
//
// Kept apart from the app code so it can later move to the admin-editable
// knowledge base (PDF §7) without touching the screens.

import type { Lang } from "./i18n";

export type TopicId = "basics" | "subsidy" | "savings" | "finance" | "install" | "netmeter" | "care";

export const TOPICS: { id: TopicId; icon: string }[] = [
  { id: "basics", icon: "☀️" },
  { id: "subsidy", icon: "🏛️" },
  { id: "savings", icon: "💰" },
  { id: "finance", icon: "🏦" },
  { id: "install", icon: "🛠️" },
  { id: "netmeter", icon: "🔌" },
  { id: "care", icon: "🛡️" },
];

// Item order inside a topic = order shown. `keys` are words people use for
// this question, in any of the three languages (and Hinglish), for matching.
export const ITEMS: { id: string; topic: TopicId; keys: string[] }[] = [
  // basics
  { id: "ongrid", topic: "basics", keys: ["on grid", "ongrid", "grid tied", "ऑन ग्रिड", "ऑनग्रिड", "ଅନ ଗ୍ରିଡ", "ଅନଗ୍ରିଡ"] },
  { id: "offgrid", topic: "basics", keys: ["off grid", "offgrid", "without grid", "ऑफ ग्रिड", "ऑफ़ ग्रिड", "ऑफग्रिड", "ଅଫ ଗ୍ରିଡ", "ଅଫଗ୍ରିଡ"] },
  { id: "hybrid", topic: "basics", keys: ["hybrid", "हाइब्रिड", "ହାଇବ୍ରିଡ"] },
  { id: "which", topic: "basics", keys: ["on grid+off grid", "ऑन ग्रिड+ऑफ", "ଅନ ଗ୍ରିଡ+ଅଫ", "which system", "best system", "difference", "right for", "konsa", "कौन सा सिस्टम", "सबसे अच्छा", "फर्क", "फ़र्क", "अंतर", "କେଉଁ ସିଷ୍ଟମ", "ପାର୍ଥକ୍ୟ"] },
  { id: "powercut", topic: "basics", keys: ["power cut", "light goes", "light jaye", "no electricity", "no power", "outage", "load shedding", "blackout", "battery", "backup", "bijli kat", "बिजली कट", "कटौती", "बैटरी", "बैकअप", "ବିଦ୍ୟୁତ କଟ", "କଟିଲେ", "ବ୍ୟାଟେରୀ", "ବ୍ୟାକଅପ"] },
  { id: "cloudy", topic: "basics", keys: ["cloud", "cloudy", "rain", "rainy", "monsoon", "winter", "barish", "बादल", "बारिश", "बरसात", "सर्दी", "ମେଘ", "ମେଘୁଆ", "ବର୍ଷା", "ଶୀତ"] },
  // subsidy
  { id: "pmsg", topic: "subsidy", keys: ["surya ghar", "suryaghar", "muft bijli", "scheme", "yojana", "सूर्य घर", "योजना", "मुफ्त बिजली", "मुफ़्त बिजली", "ସୂର୍ଯ୍ୟ ଘର", "ଯୋଜନା"] },
  { id: "amount", topic: "subsidy", keys: ["how much subsidy", "subsidy amount", "subsidy", "sabsidi", "kitni subsidy", "सब्सिडी", "सबसिडी", "अनुदान", "कितनी सब्सिडी", "ସବସିଡି", "କେତେ ସବସିଡି", "ରିହାତି"] },
  { id: "eligible", topic: "subsidy", keys: ["eligible", "eligibility", "who can", "qualify", "patra", "पात्र", "पात्रता", "किसे मिल", "कौन ले सकता", "ଯୋଗ୍ୟ", "ଯୋଗ୍ୟତା", "କିଏ ପାଇ"] },
  { id: "apply", topic: "subsidy", keys: ["apply", "application", "register", "registration", "portal", "apply kaise", "आवेदन", "अप्लाई", "रजिस्टर", "पोर्टल", "ଆବେଦନ", "ପଞ୍ଜୀକରଣ", "ପୋର୍ଟାଲ"] },
  { id: "payout", topic: "subsidy", keys: ["when+subsidy", "subsidy money", "कब+सब्सिडी", "କେବେ+ସବସିଡି", "when will", "credited", "receive", "reach my account", "kab milegi", "kab aayegi", "कब आएगी", "कब मिलेगी", "खाते में", "କେବେ ଆସିବ", "କେବେ ମିଳିବ", "ଖାତାକୁ"] },
  { id: "docs", topic: "subsidy", keys: ["document", "documents", "papers", "aadhaar", "aadhar", "kyc", "kagaz", "दस्तावेज", "दस्तावेज़", "कागज", "कागज़", "आधार", "ଡକ୍ୟୁମେଣ୍ଟ", "କାଗଜ", "ଆଧାର"] },
  // savings
  { id: "units", topic: "savings", keys: ["units", "unit", "generation", "generate", "produce", "kwh", "यूनिट", "कितनी बिजली", "बनाएगा", "ୟୁନିଟ", "କେତେ ବିଦ୍ୟୁତ", "ତିଆରି କରିବ"] },
  { id: "bill", topic: "savings", keys: ["save", "saving", "savings", "bill", "reduce", "bachat", "बचत", "बचेगा", "बिल", "ସଞ୍ଚୟ", "ବିଲ"] },
  { id: "payback", topic: "savings", keys: ["recover+money", "money back", "paisa vapas", "पैसा वापस", "पैसे वापस", "ଟଙ୍କା ଫେରସ୍ତ", "payback", "roi", "return", "recover", "pay for itself", "वसूल", "रिटर्न", "कितने साल में", "ଫେରସ୍ତ", "ରିଟର୍ଣ୍ଣ", "ଉଠିଆସେ"] },
  { id: "life25", topic: "savings", keys: ["25 years", "25 year", "lifetime saving", "long term", "total saving", "25 साल", "25 ବର୍ଷ"] },
  { id: "size", topic: "savings", keys: ["size", "capacity", "how many kw", "how many kilowatt", "kitne kw", "साइज", "साइज़", "कितने किलोवाट", "क्षमता", "ସାଇଜ", "କେତେ କିଲୋୱାଟ", "କ୍ଷମତା"] },
  // finance
  { id: "cost", topic: "finance", keys: ["cost", "price", "rate", "expensive", "kimat", "kitne ka", "daam", "कीमत", "दाम", "लागत", "खर्च", "कितने का", "ଦାମ", "ଖର୍ଚ୍ଚ", "ମୂଲ୍ୟ"] },
  { id: "loan", topic: "finance", keys: ["loan", "finance", "interest", "collateral", "लोन", "कर्ज", "क़र्ज़", "ऋण", "ब्याज", "फाइनेंस", "ଋଣ", "ଲୋନ", "ସୁଧ"] },
  { id: "emi", topic: "finance", keys: ["emi", "installment", "instalment", "monthly payment", "किस्त", "क़िस्त", "ईएमआई", "ई एम आई", "କିସ୍ତି", "ଇଏମଆଇ"] },
  { id: "worth", topic: "finance", keys: ["worth", "good investment", "should i", "fayda", "फायदे", "फ़ायदे", "फायदा", "निवेश", "ଲାଭ", "ଲାଭଜନକ", "ନିବେଶ"] },
  { id: "business", topic: "finance", keys: ["business", "commercial", "shop", "factory", "industrial", "office", "resco", "opex", "dukan", "बिजनेस", "बिज़नेस", "दुकान", "फैक्ट्री", "फ़ैक्ट्री", "कमर्शियल", "ବ୍ୟବସାୟ", "ଦୋକାନ", "କାରଖାନା"] },
  // installation
  { id: "time", topic: "install", keys: ["how long", "how many days", "installation time", "timeline", "kitna time", "kitne din", "कितना समय", "कितने दिन", "कितना टाइम", "କେତେ ସମୟ", "କେତେ ଦିନ"] },
  { id: "steps", topic: "install", keys: ["steps", "procedure", "process", "survey", "how does it work", "स्टेप", "प्रक्रिया", "सर्वे", "कैसे लगता", "ପଦକ୍ଷେପ", "ପ୍ରକ୍ରିୟା", "ସର୍ଭେ"] },
  { id: "roof", topic: "install", keys: ["roof space", "roof area", "sq ft", "square feet", "space", "terrace", "जगह", "छत पर", "वर्ग फुट", "एरिया", "ଜାଗା", "ବର୍ଗଫୁଟ"] },
  { id: "damage", topic: "install", keys: ["damage", "leak", "leakage", "crack", "waterproof", "storm", "cyclone", "wind", "नुकसान", "नुक़सान", "लीक", "तूफान", "तूफ़ान", "क्षति", "ଲିକ", "ଝଡ଼", "ବାତ୍ୟା", "କ୍ଷତି"] },
  { id: "panels", topic: "install", keys: ["panel brand", "inverter", "brand", "module", "topcon", "mono", "perc", "dcr", "tier", "इन्वर्टर", "इनवर्टर", "ब्रांड", "ଇନଭର୍ଟର", "ବ୍ରାଣ୍ଡ"] },
  { id: "rented", topic: "install", keys: ["rent", "rented", "tenant", "flat", "apartment", "society", "landlord", "kiraya", "किराए", "किराये", "फ्लैट", "फ़्लैट", "अपार्टमेंट", "सोसाइटी", "ଭଡ଼ା", "ଫ୍ଲାଟ", "ସୋସାଇଟି"] },
  // net metering
  { id: "netmeter", topic: "netmeter", keys: ["net meter", "net metering", "netmeter", "bidirectional", "two way meter", "नेट मीटर", "नेट मीटरिंग", "ନେଟ ମିଟର", "ନେଟ ମିଟରିଂ"] },
  { id: "extra", topic: "netmeter", keys: ["extra", "excess", "surplus", "export", "sell", "earn", "credit", "bech", "ज्यादा बिजली", "ज़्यादा बिजली", "बेच", "कमाई", "क्रेडिट", "ବଳକା", "ବିକ୍ରି", "କ୍ରେଡିଟ"] },
  { id: "getmeter", topic: "netmeter", keys: ["net meter+get", "net meter+install", "नेट मीटर+लग", "नेट मीटर+मिल", "ନେଟ ମିଟର+ମିଳ", "ନେଟ ମିଟର+ଲଗା", "discom", "tpcodl", "tpsodl", "tpwodl", "tpnodl", "tata power", "electricity board", "get a net meter", "डिस्कॉम", "बिजली विभाग", "टाटा पावर", "ଡିସକମ", "ଟାଟା ପାୱାର", "ବିଦ୍ୟୁତ ବିଭାଗ"] },
  { id: "ndocs", topic: "netmeter", keys: ["document+net", "papers+net", "दस्तावेज+नेट", "कागज+नेट", "कागज़+नेट", "କାଗଜ+ନେଟ", "net metering documents", "net meter documents", "agreement", "एग्रीमेंट", "नेट मीटर के कागज", "ଚୁକ୍ତି"] },
  // warranty & maintenance
  { id: "warranty", topic: "care", keys: ["warranty", "warrenty", "guarantee", "वारंटी", "गारंटी", "ୱାରେଣ୍ଟି", "ଗ୍ୟାରେଣ୍ଟି"] },
  { id: "life", topic: "care", keys: ["last", "lifespan", "life", "how many years", "durable", "उम्र", "टिकाऊ", "कितने साल चलते", "ଆୟୁ", "କେତେ ବର୍ଷ ଚାଲେ"] },
  { id: "clean", topic: "care", keys: ["clean", "cleaning", "wash", "dust", "dirt", "saaf", "safai", "साफ", "साफ़", "सफाई", "सफ़ाई", "धूल", "ସଫା", "ଧୂଳି"] },
  { id: "monitor", topic: "care", keys: ["monitor", "monitoring", "app", "track", "check generation", "ऐप", "मॉनिटर", "ट्रैक", "ଆପ", "ମନିଟର"] },
  { id: "drop", topic: "care", keys: ["generation+low", "generation+less", "उत्पादन+कम", "बिजली+कम बन", "ଉତ୍ପାଦନ+କମ", "drop", "low generation", "not working", "problem", "fault", "error", "issue", "repair", "complaint", "खराब", "ख़राब", "काम नहीं", "समस्या", "शिकायत", "एरर", "ସମସ୍ୟା", "ଖରାପ", "କାମ କରୁନି", "ଅଭିଯୋଗ"] },
  { id: "upkeep", topic: "care", keys: ["maintenance", "maintainance", "service", "upkeep", "amc", "मेंटेनेंस", "सर्विस", "देखभाल", "रखरखाव", "ରକ୍ଷଣାବେକ୍ଷଣ", "ସର୍ଭିସ", "ଯତ୍ନ"] },
];

// Shown on the FAQ home for a one-tap answer.
export const POPULAR = ["amount", "cost", "payback"];

type Item = { q: string; a: string; k: string };

export type FaqCopy = {
  ui: {
    title: string; intro: string; topicSay: string; suggest: string; noMatch: string; placeholder: string; ask: string;
    topics: string; popular: string; youAsked: string; related: string; allTopics: string; expert: string;
  };
  // "Have more questions?" panel after the booking / saved plan.
  hub: { title: string; say: string; faq: string; faqSub: string; call: string; whatsapp: string; callback: string; callbackDone: string };
  topics: Record<TopicId, { name: string; sub: string }>;
  items: Record<string, Item>;
};

export const FAQ: Record<Lang, FaqCopy> = {
  en: {
    ui: {
      title: "Solar FAQ",
      intro: "Ask me anything about solar! Pick a topic, or type or speak your question.",
      topicSay: "Tap any question, and I'll explain it simply.",
      suggest: "I found a few close matches. Which one did you mean?",
      noMatch: "Sorry, I don't have the answer to that yet. Please try a topic below, or ask our solar expert directly.",
      placeholder: "Type or speak your question",
      ask: "Ask",
      topics: "Topics",
      popular: "Most asked",
      youAsked: "Your question",
      related: "People also ask",
      allTopics: "All topics",
      expert: "Talk to an expert",
    },
    hub: {
      title: "Have more questions?",
      say: "Have more questions? Ask me in the Solar FAQ, or reach our team on call or WhatsApp.",
      faq: "Ask Saathi · Solar FAQ",
      faqSub: "Instant answers on subsidy, savings, loans and more",
      call: "Call",
      whatsapp: "WhatsApp",
      callback: "Callback",
      callbackDone: "Requested",
    },
    topics: {
      basics: { name: "Solar basics", sub: "On-grid, off-grid, hybrid" },
      subsidy: { name: "Govt subsidy", sub: "PM Surya Ghar" },
      savings: { name: "Savings & ROI", sub: "Units, bill, payback" },
      finance: { name: "Price & finance", sub: "Cost, EMI, loans" },
      install: { name: "Installation", sub: "Process, roof, panels" },
      netmeter: { name: "Net metering", sub: "DISCOM & documents" },
      care: { name: "Warranty & care", sub: "Cleaning, monitoring" },
    },
    items: {
      ongrid: {
        q: "What is an on-grid solar system?",
        a: "An on-grid system is connected to the electricity grid and has no battery. Your home uses solar power first, and the extra goes to the grid as credit. It's the lowest-cost option, and it gets the full government subsidy.",
        k: "Lowest cost · Full subsidy",
      },
      offgrid: {
        q: "What is an off-grid solar system?",
        a: "An off-grid system runs on batteries and is not connected to the grid. It suits places with no grid or very long power cuts. It costs more because of the batteries, and it gets no subsidy.",
        k: "Battery · No subsidy",
      },
      hybrid: {
        q: "What is a hybrid solar system?",
        a: "A hybrid system is connected to the grid and also has a battery. It cuts your bill like on-grid, and keeps your lights on during power cuts. It costs more than on-grid, but it gives you backup.",
        k: "Savings + backup",
      },
      which: {
        q: "Which system is right for my home?",
        a: "For most homes, on-grid is best. It has the lowest cost, the highest savings and the full subsidy. If you get long power cuts, choose hybrid. Off-grid makes sense only where there is no grid at all.",
        k: "Most homes: on-grid",
      },
      powercut: {
        q: "Will solar work during a power cut?",
        a: "An on-grid system switches off during a power cut, to keep line workers safe. To have power during cuts, you need a hybrid system with a battery. A battery can also be added later.",
        k: "Backup needs a battery",
      },
      cloudy: {
        q: "Does solar work on cloudy or rainy days?",
        a: "Yes. It makes less power on cloudy days, but your system is sized on the yearly average. On-grid homes simply take the rest from the grid. Most of India gets around 300 sunny days a year.",
        k: "≈ 300 sunny days a year",
      },
      pmsg: {
        q: "What is PM Surya Ghar Yojana?",
        a: "PM Surya Ghar: Muft Bijli Yojana is the central government's scheme for rooftop solar on homes. It aims to give families up to 300 units of free power a month. The subsidy goes straight into your bank account.",
        k: "Up to 300 free units a month",
      },
      amount: {
        q: "How much subsidy will I get?",
        a: "The central subsidy is 30 thousand rupees for 1 kilowatt, 60 thousand for 2 kilowatts, and 78 thousand for 3 kilowatts or more. In Odisha, the state adds up to 60 thousand more. So you can get up to 1 lakh 38 thousand rupees in total.",
        k: "Up to ₹1,38,000 in Odisha",
      },
      eligible: {
        q: "Who is eligible for the subsidy?",
        a: "Any Indian household with its own roof and an electricity connection in the family's name. The system must be installed by a registered vendor, with made-in-India panels. Shops, offices and factories don't get this subsidy.",
        k: "Homes only · Registered vendor",
      },
      apply: {
        q: "How do I apply for the subsidy?",
        a: "Register on the PM Surya Ghar portal with your electricity consumer number. After approval, a registered vendor installs the system and the net meter is fitted. Then you add your bank details, and the subsidy is paid. Clans Machina does all this paperwork for you.",
        k: "We file it for you",
      },
      payout: {
        q: "When will the subsidy reach my account?",
        a: "The subsidy comes straight to your bank account after the system is installed, inspected and the net meter is fitted. It usually arrives within about 30 days.",
        k: "≈ 30 days · Direct to bank",
      },
      docs: {
        q: "Which documents do I need?",
        a: "Keep your Aadhaar card, latest electricity bill, proof that you own the house, bank passbook and a passport photo ready. The name on your Aadhaar and electricity bill should match.",
        k: "Aadhaar · Bill · Bank · Photo",
      },
      units: {
        q: "How much power will my system make?",
        a: "Each kilowatt makes about 4 units a day, or about 120 units a month. So a 3 kilowatt system makes around 360 units every month.",
        k: "≈ 120 units per kW a month",
      },
      bill: {
        q: "How much will I save on my bill?",
        a: "A well-sized on-grid system can cut your electricity bill by up to 90 percent. For example, a 3 kilowatt system saves about eighteen hundred rupees every month.",
        k: "Up to 90% lower bills",
      },
      payback: {
        q: "How soon does solar pay for itself?",
        a: "For homes, the system usually pays for itself in 4 to 5 years after the subsidy. After that, your power is almost free for the rest of its 25-year life.",
        k: "Payback in 4–5 years",
      },
      life25: {
        q: "How much will I save in 25 years?",
        a: "At today's tariff, a 3 kilowatt system saves about 5 lakh 40 thousand rupees over 25 years. Tariffs go up every year, so your real savings will be even higher.",
        k: "≈ ₹5.4 lakh on 3 kW",
      },
      size: {
        q: "What size system do I need?",
        a: "A simple rule: about 1 kilowatt for every 600 rupees of monthly bill. So an eighteen hundred rupee bill needs about 3 kilowatts. Your solar plan already shows the right size for your home.",
        k: "≈ 1 kW per ₹600 of monthly bill",
      },
      cost: {
        q: "How much does rooftop solar cost?",
        a: "A home system costs about 55 to 70 thousand rupees per kilowatt before subsidy. So a 3 kilowatt system costs about 1 lakh 70 thousand to 2 lakh 10 thousand rupees. In Odisha, the subsidy brings this down by up to 1 lakh 38 thousand.",
        k: "₹55,000–70,000 per kW",
      },
      loan: {
        q: "Can I get a solar loan?",
        a: "Yes. Under PM Surya Ghar, government banks give home solar loans without collateral, at about 7 percent interest, for up to 10 years. For systems up to 3 kilowatts, you pay just 10 percent as down payment. We help you with the loan papers.",
        k: "≈ 7% · No collateral · 10 years",
      },
      emi: {
        q: "How much will my EMI be?",
        a: "In most cases, your EMI is lower than what you save on your bill, so you gain from day one. For example, for a 3 kilowatt home in Odisha, the EMI is about fourteen hundred rupees a month over 5 years, while you save about eighteen hundred.",
        k: "EMI < monthly saving",
      },
      worth: {
        q: "Is solar worth it?",
        a: "Yes, for most homes. Power tariffs rise every year, the subsidy cuts your cost, and panels last 25 years. You get your money back in about 4 to 5 years, then enjoy almost free power for 20 more.",
        k: "4–5 yrs payback · 25 yrs life",
      },
      business: {
        q: "Is there any benefit for shops and factories?",
        a: "Businesses don't get the home subsidy, but they save a lot, since they use most power during the day. Payback is usually 3 and a half to 5 years. Zero-upfront plans are also available, where you just pay a lower rate per unit.",
        k: "Payback in 3.5–5 years",
      },
      time: {
        q: "How long does installation take?",
        a: "Fitting the system on your roof takes just 1 to 3 days. The full process, from survey to switching on with the net meter, usually takes 18 to 27 days.",
        k: "1–3 days on the roof",
      },
      steps: {
        q: "What are the steps to install solar?",
        a: "First, a free site survey. Then a 3D design and quote, and we file the subsidy papers. Next, the system is installed, and the net meter is fitted and inspected. Then your system goes live, and you track it on the app.",
        k: "Survey → Design → Install → Net meter → Live",
      },
      roof: {
        q: "How much roof space do I need?",
        a: "About 100 square feet of shadow-free roof for every kilowatt. So a 3 kilowatt system needs around 300 square feet.",
        k: "100 sq ft per kW",
      },
      damage: {
        q: "Will the panels damage my roof?",
        a: "No. The structure is fixed with proper waterproofing, so there are no leaks. The panels even shade your roof and protect it from sun and rain. Our structures are built for winds up to 170 kilometres an hour.",
        k: "Storm-proof up to 170 km/h",
      },
      panels: {
        q: "Which panels and inverter do you use?",
        a: "We use Tier-1, high-efficiency Mono PERC or TOPCon panels, and a smart inverter you can track on your phone. For the subsidy, the panels must be made in India, with Indian solar cells.",
        k: "Tier-1 · Made in India",
      },
      rented: {
        q: "Can I install solar on a flat or rented house?",
        a: "Yes. A rented house needs the owner's written permission. In a flat, panels can go on your own terrace, or the society can put solar on the common roof to cut the common bill. Housing societies get a subsidy too.",
        k: "Owner's consent · Society roof",
      },
      netmeter: {
        q: "What is net metering?",
        a: "Net metering uses a two-way meter. It counts the power you send to the grid and the power you take from it. You pay only for the difference, and that's why your bill drops so much.",
        k: "Pay only for the difference",
      },
      extra: {
        q: "What happens to the extra power I make?",
        a: "Extra power goes to the grid and is saved as credit on your account. The credit is used in the months when you use more power, like in summer. Any credit left at the year end is settled as per your DISCOM's rules.",
        k: "Extra units = bill credit",
      },
      getmeter: {
        q: "How do I get a net meter?",
        a: "Your DISCOM fits the net meter after the system is installed. In Odisha, that's TP Central, TP Southern, TP Western or TP Northern Odisha. Clans Machina handles the application, inspection and follow-ups for you.",
        k: "We handle the DISCOM work",
      },
      ndocs: {
        q: "Which documents are needed for net metering?",
        a: "The net metering form, your latest electricity bill, ID proof, and the system's design and equipment details. An agreement is signed with the DISCOM, and any pending bill must be cleared first. Our team prepares all of this for you.",
        k: "Form · Bill · ID · Agreement",
      },
      warranty: {
        q: "What warranty do I get?",
        a: "Panels come with a 25-year performance warranty and a 10 to 12 year product warranty. The inverter has a 5 to 10 year warranty. And our service team supports you all along.",
        k: "25 years on panels",
      },
      life: {
        q: "How long do solar panels last?",
        a: "Solar panels last 25 years or more. They keep making power even after that, just a little less.",
        k: "25+ years",
      },
      clean: {
        q: "How do I clean the panels?",
        a: "Clean them about once a month, or more often if there's a lot of dust. Use plain water and a soft cloth or mop, in the early morning or evening. Never use soap, hard brushes or high-pressure water.",
        k: "Once a month · Plain water",
      },
      monitor: {
        q: "How do I check my solar generation?",
        a: "Your inverter connects to an app on your phone. It shows today's units, your savings and any fault, live. Your electricity bill also shows the units you sent to the grid.",
        k: "Live on your phone",
      },
      drop: {
        q: "What if my generation suddenly drops?",
        a: "First check for dust, a new shadow or a tripped switch, and look for an error on the inverter app. Our monitoring also flags drops on its own, and our team arranges a service check. Just call or WhatsApp us.",
        k: "We get alerted too",
      },
      upkeep: {
        q: "Is maintenance expensive?",
        a: "No. Solar has no moving parts, so upkeep is mostly regular cleaning and a yearly check-up. An on-grid system has no battery to replace.",
        k: "Low upkeep",
      },
    },
  },
  hi: {
    ui: {
      title: "सोलर सवाल-जवाब",
      intro: "सोलर के बारे में मुझसे कुछ भी पूछिए! कोई विषय चुनिए, या अपना सवाल लिखिए या बोलिए।",
      topicSay: "कोई भी सवाल चुनिए, मैं आसान भाषा में समझाऊँगा।",
      suggest: "मुझे कुछ मिलते-जुलते सवाल मिले। आप इनमें से कौन-सा पूछना चाहते हैं?",
      noMatch: "माफ़ कीजिए, इसका जवाब अभी मेरे पास नहीं है। नीचे कोई विषय चुनिए, या सीधे हमारे सोलर एक्सपर्ट से पूछिए।",
      placeholder: "अपना सवाल लिखिए या बोलिए",
      ask: "पूछें",
      topics: "विषय",
      popular: "सबसे ज़्यादा पूछे गए",
      youAsked: "आपका सवाल",
      related: "ये भी पूछे जाते हैं",
      allTopics: "सभी विषय",
      expert: "एक्सपर्ट से बात करें",
    },
    hub: {
      title: "कोई और सवाल?",
      say: "कोई और सवाल है? सोलर सवाल-जवाब में मुझसे पूछिए, या हमारी टीम से कॉल या WhatsApp पर बात कीजिए।",
      faq: "Saathi से पूछें · सवाल-जवाब",
      faqSub: "सब्सिडी, बचत, लोन और बहुत कुछ के तुरंत जवाब",
      call: "कॉल",
      whatsapp: "WhatsApp",
      callback: "कॉलबैक",
      callbackDone: "हो गया",
    },
    topics: {
      basics: { name: "सोलर बेसिक्स", sub: "ऑन-ग्रिड, ऑफ़-ग्रिड, हाइब्रिड" },
      subsidy: { name: "सरकारी सब्सिडी", sub: "पीएम सूर्य घर" },
      savings: { name: "बचत और रिटर्न", sub: "यूनिट, बिल, वसूली" },
      finance: { name: "कीमत और फ़ाइनेंस", sub: "लागत, EMI, लोन" },
      install: { name: "इंस्टॉलेशन", sub: "प्रक्रिया, छत, पैनल" },
      netmeter: { name: "नेट मीटरिंग", sub: "डिस्कॉम और कागज़" },
      care: { name: "वारंटी और देखभाल", sub: "सफ़ाई, मॉनिटरिंग" },
    },
    items: {
      ongrid: {
        q: "ऑन-ग्रिड सोलर सिस्टम क्या है?",
        a: "ऑन-ग्रिड सिस्टम बिजली ग्रिड से जुड़ा होता है और इसमें बैटरी नहीं होती। आपका घर पहले सोलर बिजली इस्तेमाल करता है, और बची हुई बिजली ग्रिड में क्रेडिट बनकर जाती है। यह सबसे किफ़ायती विकल्प है, और इस पर पूरी सरकारी सब्सिडी मिलती है।",
        k: "सबसे किफ़ायती · पूरी सब्सिडी",
      },
      offgrid: {
        q: "ऑफ़-ग्रिड सोलर सिस्टम क्या है?",
        a: "ऑफ़-ग्रिड सिस्टम बैटरी पर चलता है और ग्रिड से जुड़ा नहीं होता। यह उन जगहों के लिए है जहाँ ग्रिड नहीं है या बहुत लंबी बिजली कटौती होती है। बैटरी की वजह से यह महँगा पड़ता है, और इस पर सब्सिडी नहीं मिलती।",
        k: "बैटरी के साथ · सब्सिडी नहीं",
      },
      hybrid: {
        q: "हाइब्रिड सोलर सिस्टम क्या है?",
        a: "हाइब्रिड सिस्टम ग्रिड से भी जुड़ा होता है और इसमें बैटरी भी होती है। यह ऑन-ग्रिड की तरह बिल घटाता है, और बिजली कटने पर भी घर में रोशनी रखता है। यह ऑन-ग्रिड से महँगा है, लेकिन बैकअप देता है।",
        k: "बचत + बैकअप",
      },
      which: {
        q: "मेरे घर के लिए कौन-सा सिस्टम सही है?",
        a: "ज़्यादातर घरों के लिए ऑन-ग्रिड सबसे अच्छा है। इसकी लागत सबसे कम, बचत सबसे ज़्यादा, और सब्सिडी पूरी मिलती है। अगर लंबी बिजली कटौती होती है, तो हाइब्रिड चुनिए। ऑफ़-ग्रिड सिर्फ़ वहीं ठीक है जहाँ ग्रिड है ही नहीं।",
        k: "ज़्यादातर घर: ऑन-ग्रिड",
      },
      powercut: {
        q: "क्या बिजली कटने पर सोलर चलेगा?",
        a: "बिजली कटने पर ऑन-ग्रिड सिस्टम बंद हो जाता है, ताकि लाइन पर काम करने वाले सुरक्षित रहें। कटौती में भी बिजली चाहिए, तो बैटरी वाला हाइब्रिड सिस्टम लगवाइए। बैटरी बाद में भी जोड़ी जा सकती है।",
        k: "बैकअप के लिए बैटरी ज़रूरी",
      },
      cloudy: {
        q: "क्या बादल या बारिश में सोलर काम करता है?",
        a: "हाँ। बादल वाले दिन बिजली थोड़ी कम बनती है, लेकिन सिस्टम का साइज़ पूरे साल के औसत पर तय होता है। ऑन-ग्रिड घरों को बाक़ी बिजली ग्रिड से मिल जाती है। भारत के ज़्यादातर हिस्सों में साल में लगभग 300 दिन धूप रहती है।",
        k: "साल में ≈ 300 धूप वाले दिन",
      },
      pmsg: {
        q: "पीएम सूर्य घर योजना क्या है?",
        a: "पीएम सूर्य घर: मुफ़्त बिजली योजना घरों पर रूफ़टॉप सोलर के लिए केंद्र सरकार की योजना है। इसका मक़सद परिवारों को हर महीने 300 यूनिट तक मुफ़्त बिजली देना है। सब्सिडी सीधे आपके बैंक खाते में आती है।",
        k: "हर महीने 300 यूनिट तक मुफ़्त",
      },
      amount: {
        q: "मुझे कितनी सब्सिडी मिलेगी?",
        a: "केंद्र सरकार 1 किलोवाट पर 30 हज़ार, 2 किलोवाट पर 60 हज़ार, और 3 किलोवाट या उससे ज़्यादा पर 78 हज़ार रुपये देती है। ओडिशा सरकार 60 हज़ार रुपये तक और जोड़ती है। यानी कुल 1 लाख 38 हज़ार रुपये तक की सब्सिडी मिल सकती है।",
        k: "ओडिशा में ₹1,38,000 तक",
      },
      eligible: {
        q: "सब्सिडी किसे मिल सकती है?",
        a: "हर भारतीय परिवार जिसकी अपनी छत हो और बिजली कनेक्शन परिवार के नाम पर हो। सिस्टम किसी रजिस्टर्ड वेंडर से, भारत में बने पैनल के साथ लगना चाहिए। दुकान, ऑफ़िस और फ़ैक्ट्री को यह सब्सिडी नहीं मिलती।",
        k: "सिर्फ़ घरों के लिए · रजिस्टर्ड वेंडर",
      },
      apply: {
        q: "सब्सिडी के लिए आवेदन कैसे करें?",
        a: "पीएम सूर्य घर पोर्टल पर अपने बिजली कंज़्यूमर नंबर से रजिस्टर कीजिए। मंज़ूरी के बाद रजिस्टर्ड वेंडर सिस्टम लगाता है और नेट मीटर लगता है। फिर बैंक की जानकारी देनी होती है, और सब्सिडी आ जाती है। यह सारी कागज़ी कार्रवाई Clans Machina आपके लिए करता है।",
        k: "पूरा आवेदन हम करते हैं",
      },
      payout: {
        q: "सब्सिडी मेरे खाते में कब आएगी?",
        a: "सिस्टम लगने, जाँच होने और नेट मीटर लगने के बाद सब्सिडी सीधे आपके बैंक खाते में आती है। आमतौर पर यह लगभग 30 दिनों में आ जाती है।",
        k: "≈ 30 दिन · सीधे बैंक में",
      },
      docs: {
        q: "कौन-से दस्तावेज़ चाहिए?",
        a: "आधार कार्ड, बिजली का ताज़ा बिल, घर के मालिकाना हक़ का सबूत, बैंक पासबुक और पासपोर्ट फ़ोटो तैयार रखिए। आधार और बिजली बिल पर नाम एक जैसा होना चाहिए।",
        k: "आधार · बिल · बैंक · फ़ोटो",
      },
      units: {
        q: "मेरा सिस्टम कितनी बिजली बनाएगा?",
        a: "हर किलोवाट रोज़ लगभग 4 यूनिट, यानी महीने में लगभग 120 यूनिट बिजली बनाता है। तो 3 किलोवाट का सिस्टम हर महीने लगभग 360 यूनिट बनाएगा।",
        k: "हर kW ≈ 120 यूनिट/महीना",
      },
      bill: {
        q: "मेरे बिल में कितनी बचत होगी?",
        a: "सही साइज़ का ऑन-ग्रिड सिस्टम आपका बिजली बिल 90 प्रतिशत तक घटा सकता है। जैसे, 3 किलोवाट का सिस्टम हर महीने लगभग अठारह सौ रुपये बचाता है।",
        k: "बिल 90% तक कम",
      },
      payback: {
        q: "सोलर की लागत कितने समय में वसूल होती है?",
        a: "घरों के लिए सब्सिडी के बाद सिस्टम आमतौर पर 4 से 5 साल में अपनी लागत वसूल कर लेता है। उसके बाद अपनी 25 साल की उम्र तक बिजली लगभग मुफ़्त रहती है।",
        k: "4–5 साल में वसूली",
      },
      life25: {
        q: "25 साल में कितनी बचत होगी?",
        a: "आज के रेट पर 3 किलोवाट का सिस्टम 25 साल में लगभग 5 लाख 40 हज़ार रुपये बचाता है। बिजली के रेट हर साल बढ़ते हैं, इसलिए असली बचत इससे भी ज़्यादा होगी।",
        k: "3 kW पर ≈ ₹5.4 लाख",
      },
      size: {
        q: "मुझे कितने किलोवाट का सिस्टम चाहिए?",
        a: "आसान नियम: हर 600 रुपये के मासिक बिल पर लगभग 1 किलोवाट। यानी अठारह सौ रुपये के बिल पर लगभग 3 किलोवाट। आपके सोलर प्लान में आपके घर का सही साइज़ पहले से दिखाया गया है।",
        k: "₹600 मासिक बिल ≈ 1 kW",
      },
      cost: {
        q: "रूफ़टॉप सोलर की कीमत कितनी है?",
        a: "सब्सिडी से पहले घर के सिस्टम की कीमत लगभग 55 से 70 हज़ार रुपये प्रति किलोवाट होती है। यानी 3 किलोवाट का सिस्टम लगभग 1 लाख 70 हज़ार से 2 लाख 10 हज़ार रुपये का पड़ता है। ओडिशा में सब्सिडी से इसमें 1 लाख 38 हज़ार रुपये तक की कमी आती है।",
        k: "₹55,000–70,000 प्रति kW",
      },
      loan: {
        q: "क्या सोलर के लिए लोन मिलता है?",
        a: "हाँ। पीएम सूर्य घर योजना में सरकारी बैंक बिना गारंटी के, लगभग 7 प्रतिशत ब्याज पर, 10 साल तक का सोलर लोन देते हैं। 3 किलोवाट तक के सिस्टम पर सिर्फ़ 10 प्रतिशत डाउन पेमेंट देना होता है। लोन के कागज़ों में हम आपकी मदद करते हैं।",
        k: "≈ 7% · बिना गारंटी · 10 साल",
      },
      emi: {
        q: "मेरी EMI कितनी होगी?",
        a: "ज़्यादातर मामलों में आपकी EMI बिल की बचत से कम होती है, यानी पहले दिन से फ़ायदा। जैसे, ओडिशा में 3 किलोवाट के घर पर 5 साल की EMI लगभग चौदह सौ रुपये महीना होती है, जबकि बचत लगभग अठारह सौ रुपये होती है।",
        k: "EMI < हर महीने की बचत",
      },
      worth: {
        q: "क्या सोलर लगवाना फ़ायदे का सौदा है?",
        a: "हाँ, ज़्यादातर घरों के लिए। बिजली के रेट हर साल बढ़ते हैं, सब्सिडी से लागत घटती है, और पैनल 25 साल चलते हैं। लगभग 4 से 5 साल में पैसा वापस, फिर 20 साल तक लगभग मुफ़्त बिजली।",
        k: "4–5 साल में वसूली · 25 साल चलता है",
      },
      business: {
        q: "दुकान और फ़ैक्ट्री के लिए क्या फ़ायदा है?",
        a: "बिज़नेस को घरेलू सब्सिडी नहीं मिलती, लेकिन बचत बहुत होती है, क्योंकि वे ज़्यादातर बिजली दिन में ही इस्तेमाल करते हैं। लागत आमतौर पर साढ़े 3 से 5 साल में वसूल हो जाती है। बिना शुरुआती खर्च वाले प्लान भी हैं, जिनमें आप बस प्रति यूनिट कम रेट देते हैं।",
        k: "साढ़े 3–5 साल में वसूली",
      },
      time: {
        q: "इंस्टॉलेशन में कितना समय लगता है?",
        a: "छत पर सिस्टम लगाने में सिर्फ़ 1 से 3 दिन लगते हैं। सर्वे से लेकर नेट मीटर के साथ चालू होने तक पूरी प्रक्रिया में आमतौर पर 18 से 27 दिन लगते हैं।",
        k: "छत पर 1–3 दिन",
      },
      steps: {
        q: "सोलर लगवाने के क्या स्टेप हैं?",
        a: "पहले फ़्री साइट सर्वे। फिर 3D डिज़ाइन और कोटेशन, और हम सब्सिडी के कागज़ भरते हैं। इसके बाद सिस्टम लगता है, और नेट मीटर लगकर जाँच होती है। फिर सिस्टम चालू, और आप ऐप पर सब देख सकते हैं।",
        k: "सर्वे → डिज़ाइन → इंस्टॉल → नेट मीटर → चालू",
      },
      roof: {
        q: "छत पर कितनी जगह चाहिए?",
        a: "हर किलोवाट के लिए लगभग 100 वर्ग फ़ुट छाँव-रहित छत चाहिए। यानी 3 किलोवाट के सिस्टम के लिए लगभग 300 वर्ग फ़ुट।",
        k: "हर kW पर 100 वर्ग फ़ुट",
      },
      damage: {
        q: "क्या पैनल से छत को नुक़सान होगा?",
        a: "नहीं। स्ट्रक्चर सही वॉटरप्रूफ़िंग के साथ लगता है, इसलिए कोई लीकेज नहीं होता। पैनल छत को धूप और बारिश से बचाते भी हैं। हमारे स्ट्रक्चर 170 किलोमीटर प्रति घंटे तक की हवा झेल सकते हैं।",
        k: "170 km/h तक तूफ़ान-रोधी",
      },
      panels: {
        q: "आप कौन-से पैनल और इन्वर्टर लगाते हैं?",
        a: "हम टियर-1, हाई-एफ़िशिएंसी मोनो पर्क या टॉपकॉन पैनल, और फ़ोन पर ट्रैक होने वाला स्मार्ट इन्वर्टर लगाते हैं। सब्सिडी के लिए पैनल भारत में बने होने चाहिए, भारतीय सोलर सेल के साथ।",
        k: "टियर-1 · मेड इन इंडिया",
      },
      rented: {
        q: "क्या फ़्लैट या किराए के घर में सोलर लग सकता है?",
        a: "हाँ। किराए के घर के लिए मकान मालिक की लिखित अनुमति चाहिए। फ़्लैट में पैनल आपकी अपनी छत पर लग सकते हैं, या सोसाइटी कॉमन छत पर सोलर लगाकर कॉमन बिल घटा सकती है। हाउसिंग सोसाइटी को भी सब्सिडी मिलती है।",
        k: "मालिक की अनुमति · सोसाइटी की छत",
      },
      netmeter: {
        q: "नेट मीटरिंग क्या है?",
        a: "नेट मीटरिंग में दो-तरफ़ा मीटर लगता है। यह गिनता है कि आपने ग्रिड को कितनी बिजली दी और कितनी ली। आप सिर्फ़ फ़र्क का पैसा देते हैं, इसीलिए बिल इतना कम हो जाता है।",
        k: "सिर्फ़ फ़र्क का बिल",
      },
      extra: {
        q: "ज़्यादा बनी बिजली का क्या होता है?",
        a: "ज़्यादा बिजली ग्रिड में जाती है और आपके खाते में क्रेडिट बनकर जमा होती है। यह क्रेडिट उन महीनों में काम आता है जब आप ज़्यादा बिजली इस्तेमाल करते हैं, जैसे गर्मियों में। साल के अंत में बचा क्रेडिट डिस्कॉम के नियमों के हिसाब से सेटल होता है।",
        k: "ज़्यादा यूनिट = बिल में क्रेडिट",
      },
      getmeter: {
        q: "नेट मीटर कैसे मिलेगा?",
        a: "सिस्टम लगने के बाद आपकी डिस्कॉम नेट मीटर लगाती है। ओडिशा में ये टीपी सेंट्रल, टीपी सदर्न, टीपी वेस्टर्न या टीपी नॉर्दर्न ओडिशा हैं। आवेदन, जाँच और सारी भाग-दौड़ Clans Machina आपके लिए करता है।",
        k: "डिस्कॉम का काम हम करते हैं",
      },
      ndocs: {
        q: "नेट मीटरिंग के लिए कौन-से कागज़ चाहिए?",
        a: "नेट मीटरिंग फ़ॉर्म, बिजली का ताज़ा बिल, पहचान पत्र, और सिस्टम के डिज़ाइन व उपकरणों की जानकारी। डिस्कॉम के साथ एक एग्रीमेंट होता है, और पुराना बकाया बिल पहले भरना होता है। यह सब हमारी टीम आपके लिए तैयार करती है।",
        k: "फ़ॉर्म · बिल · आईडी · एग्रीमेंट",
      },
      warranty: {
        q: "कितनी वारंटी मिलती है?",
        a: "पैनल पर 25 साल की परफ़ॉर्मेंस वारंटी और 10 से 12 साल की प्रोडक्ट वारंटी मिलती है। इन्वर्टर पर 5 से 10 साल की वारंटी होती है। और हमारी सर्विस टीम हमेशा आपके साथ है।",
        k: "पैनल पर 25 साल",
      },
      life: {
        q: "सोलर पैनल कितने साल चलते हैं?",
        a: "सोलर पैनल 25 साल या उससे ज़्यादा चलते हैं। उसके बाद भी बिजली बनाते रहते हैं, बस थोड़ी कम।",
        k: "25+ साल",
      },
      clean: {
        q: "पैनल कैसे साफ़ करें?",
        a: "महीने में लगभग एक बार साफ़ कीजिए, धूल ज़्यादा हो तो और जल्दी। सुबह जल्दी या शाम को सादे पानी और नरम कपड़े या पोछे से साफ़ कीजिए। साबुन, सख़्त ब्रश या तेज़ प्रेशर वाला पानी कभी इस्तेमाल मत कीजिए।",
        k: "महीने में एक बार · सादा पानी",
      },
      monitor: {
        q: "अपना सोलर उत्पादन कैसे देखें?",
        a: "आपका इन्वर्टर फ़ोन के एक ऐप से जुड़ा रहता है। उसमें आज की यूनिट, आपकी बचत और कोई भी ख़राबी लाइव दिखती है। बिजली बिल में भी ग्रिड को भेजी गई यूनिट दिखती हैं।",
        k: "फ़ोन पर लाइव",
      },
      drop: {
        q: "अगर उत्पादन अचानक कम हो जाए तो?",
        a: "पहले देखिए कि धूल, कोई नई छाँव या ट्रिप हुआ स्विच तो नहीं है, और इन्वर्टर ऐप पर कोई एरर देखिए। हमारी मॉनिटरिंग भी गिरावट अपने आप पकड़ लेती है, और हमारी टीम सर्विस चेक करती है। बस हमें कॉल या WhatsApp कीजिए।",
        k: "हमें भी अलर्ट मिलता है",
      },
      upkeep: {
        q: "क्या मेंटेनेंस महँगा है?",
        a: "नहीं। सोलर में कोई घूमने वाला पुर्ज़ा नहीं होता, इसलिए देखभाल में बस नियमित सफ़ाई और साल में एक बार जाँच। ऑन-ग्रिड सिस्टम में बदलने के लिए कोई बैटरी भी नहीं होती।",
        k: "बहुत कम देखभाल",
      },
    },
  },
  or: {
    ui: {
      title: "ସୋଲାର ପ୍ରଶ୍ନୋତ୍ତର",
      intro: "ସୋଲାର ବିଷୟରେ ମୋତେ କିଛି ବି ପଚାରନ୍ତୁ! ଏକ ବିଷୟ ବାଛନ୍ତୁ, କିମ୍ବା ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ ବା କୁହନ୍ତୁ।",
      topicSay: "ଯେକୌଣସି ପ୍ରଶ୍ନ ବାଛନ୍ତୁ, ମୁଁ ସହଜରେ ବୁଝାଇବି।",
      suggest: "ମୁଁ କିଛି ମିଳୁଥିବା ପ୍ରଶ୍ନ ପାଇଲି। ଆପଣ କେଉଁଟି ପଚାରିବାକୁ ଚାହୁଁଛନ୍ତି?",
      noMatch: "କ୍ଷମା କରିବେ, ଏହାର ଉତ୍ତର ଏବେ ମୋ ପାଖରେ ନାହିଁ। ତଳେ ଏକ ବିଷୟ ବାଛନ୍ତୁ, କିମ୍ବା ସିଧା ଆମ ସୋଲାର ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାରନ୍ତୁ।",
      placeholder: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ ବା କୁହନ୍ତୁ",
      ask: "ପଚାରନ୍ତୁ",
      topics: "ବିଷୟ",
      popular: "ସବୁଠାରୁ ଅଧିକ ପଚରାଯାଇଥିବା",
      youAsked: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ",
      related: "ଏହା ମଧ୍ୟ ପଚରାଯାଏ",
      allTopics: "ସବୁ ବିଷୟ",
      expert: "ବିଶେଷଜ୍ଞଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ",
    },
    hub: {
      title: "ଆଉ କିଛି ପ୍ରଶ୍ନ?",
      say: "ଆଉ କିଛି ପ୍ରଶ୍ନ ଅଛି କି? ସୋଲାର ପ୍ରଶ୍ନୋତ୍ତରରେ ମୋତେ ପଚାରନ୍ତୁ, କିମ୍ବା ଆମ ଟିମ ସହ କଲ ବା WhatsApp ରେ କଥା ହୁଅନ୍ତୁ।",
      faq: "Saathi ଙ୍କୁ ପଚାରନ୍ତୁ · ପ୍ରଶ୍ନୋତ୍ତର",
      faqSub: "ସବସିଡି, ସଞ୍ଚୟ, ଋଣ ଓ ଆହୁରି ଅନେକର ତୁରନ୍ତ ଉତ୍ତର",
      call: "କଲ",
      whatsapp: "WhatsApp",
      callback: "କଲବ୍ୟାକ",
      callbackDone: "ହୋଇଗଲା",
    },
    topics: {
      basics: { name: "ସୋଲାର ମୂଳ କଥା", sub: "ଅନ-ଗ୍ରିଡ, ଅଫ-ଗ୍ରିଡ, ହାଇବ୍ରିଡ" },
      subsidy: { name: "ସରକାରୀ ସବସିଡି", sub: "ପିଏମ ସୂର୍ଯ୍ୟ ଘର" },
      savings: { name: "ସଞ୍ଚୟ ଓ ରିଟର୍ଣ୍ଣ", sub: "ୟୁନିଟ, ବିଲ, ଫେରସ୍ତ" },
      finance: { name: "ଦାମ ଓ ଫାଇନାନ୍ସ", sub: "ଖର୍ଚ୍ଚ, EMI, ଋଣ" },
      install: { name: "ଲଗାଇବା", sub: "ପ୍ରକ୍ରିୟା, ଛାତ, ପ୍ୟାନେଲ" },
      netmeter: { name: "ନେଟ ମିଟରିଂ", sub: "ଡିସକମ ଓ କାଗଜପତ୍ର" },
      care: { name: "ୱାରେଣ୍ଟି ଓ ଯତ୍ନ", sub: "ସଫା, ମନିଟରିଂ" },
    },
    items: {
      ongrid: {
        q: "ଅନ-ଗ୍ରିଡ ସୋଲାର ସିଷ୍ଟମ କଣ?",
        a: "ଅନ-ଗ୍ରିଡ ସିଷ୍ଟମ ବିଦ୍ୟୁତ ଗ୍ରିଡ ସହ ଯୋଡ଼ା ଥାଏ ଏବଂ ଏଥିରେ ବ୍ୟାଟେରୀ ନଥାଏ। ଆପଣଙ୍କ ଘର ପ୍ରଥମେ ସୋଲାର ବିଦ୍ୟୁତ ବ୍ୟବହାର କରେ, ଆଉ ବଳକା ବିଦ୍ୟୁତ ଗ୍ରିଡକୁ କ୍ରେଡିଟ ଭାବେ ଯାଏ। ଏହା ସବୁଠାରୁ କମ ଖର୍ଚ୍ଚର ବିକଳ୍ପ, ଏବଂ ଏଥିରେ ପୂରା ସରକାରୀ ସବସିଡି ମିଳେ।",
        k: "କମ ଖର୍ଚ୍ଚ · ପୂରା ସବସିଡି",
      },
      offgrid: {
        q: "ଅଫ-ଗ୍ରିଡ ସୋଲାର ସିଷ୍ଟମ କଣ?",
        a: "ଅଫ-ଗ୍ରିଡ ସିଷ୍ଟମ ବ୍ୟାଟେରୀରେ ଚାଲେ ଏବଂ ଗ୍ରିଡ ସହ ଯୋଡ଼ା ନଥାଏ। ଯେଉଁଠି ଗ୍ରିଡ ନାହିଁ କିମ୍ବା ବହୁତ ସମୟ ବିଦ୍ୟୁତ କଟେ, ସେଠି ପାଇଁ ଏହା ଉପଯୁକ୍ତ। ବ୍ୟାଟେରୀ ଯୋଗୁଁ ଏହାର ଖର୍ଚ୍ଚ ଅଧିକ, ଏବଂ ଏଥିରେ ସବସିଡି ମିଳେ ନାହିଁ।",
        k: "ବ୍ୟାଟେରୀ ସହ · ସବସିଡି ନାହିଁ",
      },
      hybrid: {
        q: "ହାଇବ୍ରିଡ ସୋଲାର ସିଷ୍ଟମ କଣ?",
        a: "ହାଇବ୍ରିଡ ସିଷ୍ଟମ ଗ୍ରିଡ ସହ ଯୋଡ଼ା ଥାଏ ଏବଂ ଏଥିରେ ବ୍ୟାଟେରୀ ମଧ୍ୟ ଥାଏ। ଏହା ଅନ-ଗ୍ରିଡ ପରି ବିଲ କମାଏ, ଆଉ ବିଦ୍ୟୁତ କଟିଲେ ବି ଘରେ ଆଲୁଅ ରଖେ। ଏହା ଅନ-ଗ୍ରିଡଠାରୁ ଅଧିକ ଖର୍ଚ୍ଚ, କିନ୍ତୁ ବ୍ୟାକଅପ ଦିଏ।",
        k: "ସଞ୍ଚୟ + ବ୍ୟାକଅପ",
      },
      which: {
        q: "ମୋ ଘର ପାଇଁ କେଉଁ ସିଷ୍ଟମ ଠିକ?",
        a: "ଅଧିକାଂଶ ଘର ପାଇଁ ଅନ-ଗ୍ରିଡ ସବୁଠାରୁ ଭଲ। ଏହାର ଖର୍ଚ୍ଚ କମ, ସଞ୍ଚୟ ଅଧିକ, ଏବଂ ପୂରା ସବସିଡି ମିଳେ। ଯଦି ବହୁତ ସମୟ ବିଦ୍ୟୁତ କଟେ, ତେବେ ହାଇବ୍ରିଡ ବାଛନ୍ତୁ। ଯେଉଁଠି ଗ୍ରିଡ ଆଦୌ ନାହିଁ, କେବଳ ସେଠି ଅଫ-ଗ୍ରିଡ ଠିକ।",
        k: "ଅଧିକାଂଶ ଘର: ଅନ-ଗ୍ରିଡ",
      },
      powercut: {
        q: "ବିଦ୍ୟୁତ କଟିଲେ ସୋଲାର ଚାଲିବ କି?",
        a: "ବିଦ୍ୟୁତ କଟିଲେ ଅନ-ଗ୍ରିଡ ସିଷ୍ଟମ ବନ୍ଦ ହୋଇଯାଏ, ଯାହାଦ୍ୱାରା ଲାଇନରେ କାମ କରୁଥିବା ଲୋକ ସୁରକ୍ଷିତ ରୁହନ୍ତି। ବିଦ୍ୟୁତ କଟିବା ସମୟରେ ବି ବିଦ୍ୟୁତ ଚାହିଁଲେ, ବ୍ୟାଟେରୀ ଥିବା ହାଇବ୍ରିଡ ସିଷ୍ଟମ ଲଗାନ୍ତୁ। ବ୍ୟାଟେରୀ ପରେ ମଧ୍ୟ ଯୋଡ଼ାଯାଇପାରିବ।",
        k: "ବ୍ୟାକଅପ ପାଇଁ ବ୍ୟାଟେରୀ ଦରକାର",
      },
      cloudy: {
        q: "ମେଘୁଆ କିମ୍ବା ବର୍ଷା ଦିନରେ ସୋଲାର କାମ କରେ କି?",
        a: "ହଁ। ମେଘୁଆ ଦିନରେ ବିଦ୍ୟୁତ ଟିକେ କମ ତିଆରି ହୁଏ, କିନ୍ତୁ ସିଷ୍ଟମର ସାଇଜ ବର୍ଷସାରା ହାରାହାରି ଉପରେ ସ୍ଥିର ହୁଏ। ଅନ-ଗ୍ରିଡ ଘର ବାକି ବିଦ୍ୟୁତ ଗ୍ରିଡରୁ ନେଇଥାଏ। ଭାରତର ଅଧିକାଂଶ ସ୍ଥାନରେ ବର୍ଷକୁ ପ୍ରାୟ 300 ଦିନ ଖରା ରହେ।",
        k: "ବର୍ଷକୁ ≈ 300 ଖରା ଦିନ",
      },
      pmsg: {
        q: "ପିଏମ ସୂର୍ଯ୍ୟ ଘର ଯୋଜନା କଣ?",
        a: "ପିଏମ ସୂର୍ଯ୍ୟ ଘର: ମୁଫତ ବିଜୁଳି ଯୋଜନା ହେଉଛି ଘର ଛାତରେ ସୋଲାର ପାଇଁ କେନ୍ଦ୍ର ସରକାରଙ୍କ ଯୋଜନା। ଏହାର ଲକ୍ଷ୍ୟ ପରିବାରକୁ ମାସକୁ 300 ୟୁନିଟ ପର୍ଯ୍ୟନ୍ତ ମାଗଣା ବିଦ୍ୟୁତ ଦେବା। ସବସିଡି ସିଧାସଳଖ ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଖାତାକୁ ଆସେ।",
        k: "ମାସକୁ 300 ୟୁନିଟ ପର୍ଯ୍ୟନ୍ତ ମାଗଣା",
      },
      amount: {
        q: "ମୋତେ କେତେ ସବସିଡି ମିଳିବ?",
        a: "କେନ୍ଦ୍ର ସରକାର 1 କିଲୋୱାଟ ପାଇଁ 30 ହଜାର, 2 କିଲୋୱାଟ ପାଇଁ 60 ହଜାର, ଏବଂ 3 କିଲୋୱାଟ କିମ୍ବା ଅଧିକ ପାଇଁ 78 ହଜାର ଟଙ୍କା ଦିଅନ୍ତି। ଓଡ଼ିଶା ସରକାର ଆହୁରି 60 ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ଯୋଡ଼ନ୍ତି। ଅର୍ଥାତ ମୋଟ 1 ଲକ୍ଷ 38 ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ସବସିଡି ମିଳିପାରିବ।",
        k: "ଓଡ଼ିଶାରେ ₹1,38,000 ପର୍ଯ୍ୟନ୍ତ",
      },
      eligible: {
        q: "ସବସିଡି କିଏ ପାଇପାରିବେ?",
        a: "ନିଜ ଛାତ ଥିବା ଏବଂ ପରିବାର ନାମରେ ବିଦ୍ୟୁତ ସଂଯୋଗ ଥିବା ଯେକୌଣସି ଭାରତୀୟ ପରିବାର। ସିଷ୍ଟମ ଜଣେ ପଞ୍ଜୀକୃତ ଭେଣ୍ଡରଙ୍କ ଦ୍ୱାରା, ଭାରତରେ ତିଆରି ପ୍ୟାନେଲ ସହ ଲାଗିବା ଦରକାର। ଦୋକାନ, ଅଫିସ ଓ କାରଖାନା ଏହି ସବସିଡି ପାଆନ୍ତି ନାହିଁ।",
        k: "କେବଳ ଘର · ପଞ୍ଜୀକୃତ ଭେଣ୍ଡର",
      },
      apply: {
        q: "ସବସିଡି ପାଇଁ କିପରି ଆବେଦନ କରିବି?",
        a: "ଆପଣଙ୍କ ବିଦ୍ୟୁତ କନଜ୍ୟୁମର ନମ୍ବର ସହ ପିଏମ ସୂର୍ଯ୍ୟ ଘର ପୋର୍ଟାଲରେ ପଞ୍ଜୀକରଣ କରନ୍ତୁ। ମଞ୍ଜୁରୀ ପରେ ପଞ୍ଜୀକୃତ ଭେଣ୍ଡର ସିଷ୍ଟମ ଲଗାନ୍ତି ଏବଂ ନେଟ ମିଟର ଲାଗେ। ତାପରେ ବ୍ୟାଙ୍କ ବିବରଣୀ ଦେଲେ ସବସିଡି ଆସିଯାଏ। ଏହି ସବୁ କାଗଜପତ୍ର କାମ Clans Machina ଆପଣଙ୍କ ପାଇଁ କରେ।",
        k: "ଆବେଦନ ଆମେ କରିଦେଉ",
      },
      payout: {
        q: "ସବସିଡି ମୋ ଖାତାକୁ କେବେ ଆସିବ?",
        a: "ସିଷ୍ଟମ ଲାଗିବା, ଯାଞ୍ଚ ହେବା ଏବଂ ନେଟ ମିଟର ଲାଗିବା ପରେ ସବସିଡି ସିଧାସଳଖ ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଖାତାକୁ ଆସେ। ସାଧାରଣତଃ ଏହା ପ୍ରାୟ 30 ଦିନ ଭିତରେ ଆସିଯାଏ।",
        k: "≈ 30 ଦିନ · ସିଧା ବ୍ୟାଙ୍କକୁ",
      },
      docs: {
        q: "କେଉଁ କାଗଜପତ୍ର ଦରକାର?",
        a: "ଆଧାର କାର୍ଡ, ସଦ୍ୟତମ ବିଦ୍ୟୁତ ବିଲ, ଘର ମାଲିକାନାର ପ୍ରମାଣ, ବ୍ୟାଙ୍କ ପାସବୁକ ଏବଂ ପାସପୋର୍ଟ ଫଟୋ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ। ଆଧାର ଓ ବିଦ୍ୟୁତ ବିଲରେ ନାମ ସମାନ ହେବା ଦରକାର।",
        k: "ଆଧାର · ବିଲ · ବ୍ୟାଙ୍କ · ଫଟୋ",
      },
      units: {
        q: "ମୋ ସିଷ୍ଟମ କେତେ ବିଦ୍ୟୁତ ତିଆରି କରିବ?",
        a: "ପ୍ରତି କିଲୋୱାଟ ଦିନକୁ ପ୍ରାୟ 4 ୟୁନିଟ, ଅର୍ଥାତ ମାସକୁ ପ୍ରାୟ 120 ୟୁନିଟ ବିଦ୍ୟୁତ ତିଆରି କରେ। ତେଣୁ 3 କିଲୋୱାଟ ସିଷ୍ଟମ ମାସକୁ ପ୍ରାୟ 360 ୟୁନିଟ ତିଆରି କରିବ।",
        k: "ପ୍ରତି kW ≈ 120 ୟୁନିଟ/ମାସ",
      },
      bill: {
        q: "ମୋ ବିଲରେ କେତେ ସଞ୍ଚୟ ହେବ?",
        a: "ଠିକ ସାଇଜର ଅନ-ଗ୍ରିଡ ସିଷ୍ଟମ ଆପଣଙ୍କ ବିଦ୍ୟୁତ ବିଲ 90 ପ୍ରତିଶତ ପର୍ଯ୍ୟନ୍ତ କମାଇପାରେ। ଯେପରି, 3 କିଲୋୱାଟ ସିଷ୍ଟମ ମାସକୁ ପ୍ରାୟ 1 ହଜାର 800 ଟଙ୍କା ସଞ୍ଚୟ କରେ।",
        k: "ବିଲ 90% ପର୍ଯ୍ୟନ୍ତ କମ",
      },
      payback: {
        q: "ସୋଲାରର ଖର୍ଚ୍ଚ କେତେ ବର୍ଷରେ ଉଠିଆସେ?",
        a: "ଘର ପାଇଁ ସବସିଡି ପରେ ସିଷ୍ଟମ ସାଧାରଣତଃ 4 ରୁ 5 ବର୍ଷରେ ନିଜ ଖର୍ଚ୍ଚ ଉଠାଇଦିଏ। ତା'ପରେ ଏହାର 25 ବର୍ଷ ଜୀବନକାଳ ଯାଏ ବିଦ୍ୟୁତ ପ୍ରାୟ ମାଗଣା।",
        k: "4–5 ବର୍ଷରେ ଖର୍ଚ୍ଚ ଫେରସ୍ତ",
      },
      life25: {
        q: "25 ବର୍ଷରେ କେତେ ସଞ୍ଚୟ ହେବ?",
        a: "ଆଜିର ଦରରେ 3 କିଲୋୱାଟ ସିଷ୍ଟମ 25 ବର୍ଷରେ ପ୍ରାୟ 5 ଲକ୍ଷ 40 ହଜାର ଟଙ୍କା ସଞ୍ଚୟ କରେ। ବିଦ୍ୟୁତ ଦର ପ୍ରତିବର୍ଷ ବଢ଼େ, ତେଣୁ ପ୍ରକୃତ ସଞ୍ଚୟ ଆହୁରି ଅଧିକ ହେବ।",
        k: "3 kW ରେ ≈ ₹5.4 ଲକ୍ଷ",
      },
      size: {
        q: "ମୋତେ କେତେ କିଲୋୱାଟ ସିଷ୍ଟମ ଦରକାର?",
        a: "ସହଜ ନିୟମ: ମାସିକ ବିଲର ପ୍ରତି 600 ଟଙ୍କା ପାଇଁ ପ୍ରାୟ 1 କିଲୋୱାଟ। ଅର୍ଥାତ 1 ହଜାର 800 ଟଙ୍କା ବିଲ ପାଇଁ ପ୍ରାୟ 3 କିଲୋୱାଟ। ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନରେ ଆପଣଙ୍କ ଘର ପାଇଁ ଠିକ ସାଇଜ ଦେଖାଯାଇଛି।",
        k: "₹600 ମାସିକ ବିଲ ≈ 1 kW",
      },
      cost: {
        q: "ରୁଫଟପ ସୋଲାରର ଦାମ କେତେ?",
        a: "ସବସିଡି ପୂର୍ବରୁ ଘର ସିଷ୍ଟମର ଦାମ ପ୍ରତି କିଲୋୱାଟ ପ୍ରାୟ 55 ରୁ 70 ହଜାର ଟଙ୍କା। ଅର୍ଥାତ 3 କିଲୋୱାଟ ସିଷ୍ଟମ ପ୍ରାୟ 1 ଲକ୍ଷ 70 ହଜାରରୁ 2 ଲକ୍ଷ 10 ହଜାର ଟଙ୍କା। ଓଡ଼ିଶାରେ ସବସିଡି ଏହାକୁ 1 ଲକ୍ଷ 38 ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ କମାଇଦିଏ।",
        k: "ପ୍ରତି kW ₹55,000–70,000",
      },
      loan: {
        q: "ସୋଲାର ପାଇଁ ଋଣ ମିଳେ କି?",
        a: "ହଁ। ପିଏମ ସୂର୍ଯ୍ୟ ଘର ଯୋଜନାରେ ସରକାରୀ ବ୍ୟାଙ୍କ ବିନା ବନ୍ଧକରେ, ପ୍ରାୟ 7 ପ୍ରତିଶତ ସୁଧରେ, 10 ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ସୋଲାର ଋଣ ଦିଅନ୍ତି। 3 କିଲୋୱାଟ ପର୍ଯ୍ୟନ୍ତ ସିଷ୍ଟମ ପାଇଁ କେବଳ 10 ପ୍ରତିଶତ ଡାଉନ ପେମେଣ୍ଟ ଦେବାକୁ ପଡ଼େ। ଋଣ କାଗଜପତ୍ରରେ ଆମେ ସାହାଯ୍ୟ କରୁ।",
        k: "≈ 7% · ବିନା ବନ୍ଧକ · 10 ବର୍ଷ",
      },
      emi: {
        q: "ମୋର EMI କେତେ ହେବ?",
        a: "ଅଧିକାଂଶ କ୍ଷେତ୍ରରେ ଆପଣଙ୍କ EMI ବିଲ ସଞ୍ଚୟଠାରୁ କମ, ଅର୍ଥାତ ପ୍ରଥମ ଦିନରୁ ଲାଭ। ଯେପରି, ଓଡ଼ିଶାରେ 3 କିଲୋୱାଟ ଘର ପାଇଁ 5 ବର୍ଷର EMI ମାସକୁ ପ୍ରାୟ 1 ହଜାର 400 ଟଙ୍କା, ଆଉ ସଞ୍ଚୟ ପ୍ରାୟ 1 ହଜାର 800 ଟଙ୍କା।",
        k: "EMI < ମାସିକ ସଞ୍ଚୟ",
      },
      worth: {
        q: "ସୋଲାର ଲଗାଇବା ଲାଭଜନକ କି?",
        a: "ହଁ, ଅଧିକାଂଶ ଘର ପାଇଁ। ବିଦ୍ୟୁତ ଦର ପ୍ରତିବର୍ଷ ବଢ଼େ, ସବସିଡି ଖର୍ଚ୍ଚ କମାଏ, ଏବଂ ପ୍ୟାନେଲ 25 ବର୍ଷ ଚାଲେ। ପ୍ରାୟ 4 ରୁ 5 ବର୍ଷରେ ଟଙ୍କା ଫେରସ୍ତ, ତା'ପରେ 20 ବର୍ଷ ପ୍ରାୟ ମାଗଣା ବିଦ୍ୟୁତ।",
        k: "4–5 ବର୍ଷରେ ଫେରସ୍ତ · 25 ବର୍ଷ ଚାଲେ",
      },
      business: {
        q: "ଦୋକାନ ଓ କାରଖାନା ପାଇଁ କିଛି ଲାଭ ଅଛି କି?",
        a: "ବ୍ୟବସାୟକୁ ଘରୋଇ ସବସିଡି ମିଳେ ନାହିଁ, କିନ୍ତୁ ସଞ୍ଚୟ ବହୁତ ହୁଏ, କାରଣ ସେମାନେ ଅଧିକାଂଶ ବିଦ୍ୟୁତ ଦିନରେ ବ୍ୟବହାର କରନ୍ତି। ଖର୍ଚ୍ଚ ସାଧାରଣତଃ ସାଢ଼େ 3 ରୁ 5 ବର୍ଷରେ ଉଠିଆସେ। ପ୍ରାରମ୍ଭିକ ଖର୍ଚ୍ଚ ବିନା ପ୍ଲାନ ମଧ୍ୟ ଅଛି, ଯେଉଁଥିରେ ଆପଣ କେବଳ ପ୍ରତି ୟୁନିଟ କମ ଦର ଦିଅନ୍ତି।",
        k: "ସାଢ଼େ 3–5 ବର୍ଷରେ ଫେରସ୍ତ",
      },
      time: {
        q: "ଲଗାଇବାକୁ କେତେ ସମୟ ଲାଗେ?",
        a: "ଛାତରେ ସିଷ୍ଟମ ଲଗାଇବାକୁ କେବଳ 1 ରୁ 3 ଦିନ ଲାଗେ। ସର୍ଭେଠାରୁ ନେଟ ମିଟର ସହ ଚାଲୁ ହେବା ଯାଏ ପୂରା ପ୍ରକ୍ରିୟାରେ ସାଧାରଣତଃ 18 ରୁ 27 ଦିନ ଲାଗେ।",
        k: "ଛାତରେ 1–3 ଦିନ",
      },
      steps: {
        q: "ସୋଲାର ଲଗାଇବାର ପଦକ୍ଷେପ କଣ?",
        a: "ପ୍ରଥମେ ମାଗଣା ସାଇଟ ସର୍ଭେ। ତାପରେ 3D ଡିଜାଇନ ଓ କୋଟେସନ, ଏବଂ ଆମେ ସବସିଡି କାଗଜପତ୍ର ଭରୁ। ତାପରେ ସିଷ୍ଟମ ଲାଗେ, ଏବଂ ନେଟ ମିଟର ଲାଗି ଯାଞ୍ଚ ହୁଏ। ଶେଷରେ ସିଷ୍ଟମ ଚାଲୁ, ଆଉ ଆପଣ ଆପରେ ସବୁ ଦେଖିପାରିବେ।",
        k: "ସର୍ଭେ → ଡିଜାଇନ → ଲଗାଇବା → ନେଟ ମିଟର → ଚାଲୁ",
      },
      roof: {
        q: "ଛାତରେ କେତେ ଜାଗା ଦରକାର?",
        a: "ପ୍ରତି କିଲୋୱାଟ ପାଇଁ ପ୍ରାୟ 100 ବର୍ଗଫୁଟ ଛାଇ ନଥିବା ଛାତ ଦରକାର। ଅର୍ଥାତ 3 କିଲୋୱାଟ ସିଷ୍ଟମ ପାଇଁ ପ୍ରାୟ 300 ବର୍ଗଫୁଟ।",
        k: "ପ୍ରତି kW ରେ 100 ବର୍ଗଫୁଟ",
      },
      damage: {
        q: "ପ୍ୟାନେଲ ଯୋଗୁଁ ଛାତର କ୍ଷତି ହେବ କି?",
        a: "ନା। ଷ୍ଟ୍ରକଚର ଠିକ ୱାଟରପ୍ରୁଫିଂ ସହ ଲାଗେ, ତେଣୁ କୌଣସି ଲିକେଜ ହୁଏ ନାହିଁ। ପ୍ୟାନେଲ ଛାତକୁ ଖରା ଓ ବର୍ଷାରୁ ବଞ୍ଚାଏ ମଧ୍ୟ। ଆମ ଷ୍ଟ୍ରକଚର ଘଣ୍ଟାକୁ 170 କିଲୋମିଟର ପର୍ଯ୍ୟନ୍ତ ପବନ ସହିପାରେ।",
        k: "170 km/h ପର୍ଯ୍ୟନ୍ତ ଝଡ଼ ସହେ",
      },
      panels: {
        q: "ଆପଣ କେଉଁ ପ୍ୟାନେଲ ଓ ଇନଭର୍ଟର ଲଗାନ୍ତି?",
        a: "ଆମେ ଟିୟର-1, ଅଧିକ ଦକ୍ଷତାର ମୋନୋ ପର୍କ କିମ୍ବା ଟପକନ ପ୍ୟାନେଲ, ଏବଂ ଫୋନରେ ଦେଖିହେବା ଭଳି ସ୍ମାର୍ଟ ଇନଭର୍ଟର ଲଗାଉ। ସବସିଡି ପାଇଁ ପ୍ୟାନେଲ ଭାରତରେ ତିଆରି, ଭାରତୀୟ ସୋଲାର ସେଲ ସହ ହେବା ଦରକାର।",
        k: "ଟିୟର-1 · ଭାରତରେ ତିଆରି",
      },
      rented: {
        q: "ଫ୍ଲାଟ କିମ୍ବା ଭଡ଼ା ଘରେ ସୋଲାର ଲାଗିପାରିବ କି?",
        a: "ହଁ। ଭଡ଼ା ଘର ପାଇଁ ଘର ମାଲିକଙ୍କ ଲିଖିତ ଅନୁମତି ଦରକାର। ଫ୍ଲାଟରେ ପ୍ୟାନେଲ ଆପଣଙ୍କ ନିଜ ଛାତରେ ଲାଗିପାରିବ, କିମ୍ବା ସୋସାଇଟି ସାଧାରଣ ଛାତରେ ସୋଲାର ଲଗାଇ ସାଧାରଣ ବିଲ କମାଇପାରିବ। ହାଉସିଂ ସୋସାଇଟି ମଧ୍ୟ ସବସିଡି ପାଆନ୍ତି।",
        k: "ମାଲିକଙ୍କ ଅନୁମତି · ସୋସାଇଟି ଛାତ",
      },
      netmeter: {
        q: "ନେଟ ମିଟରିଂ କଣ?",
        a: "ନେଟ ମିଟରିଂରେ ଦୁଇ-ଦିଗିଆ ମିଟର ଲାଗେ। ଏହା ଗଣେ ଆପଣ ଗ୍ରିଡକୁ କେତେ ବିଦ୍ୟୁତ ଦେଲେ ଏବଂ କେତେ ନେଲେ। ଆପଣ କେବଳ ପାର୍ଥକ୍ୟର ଦାମ ଦିଅନ୍ତି, ସେଥିପାଇଁ ବିଲ ଏତେ କମିଯାଏ।",
        k: "କେବଳ ପାର୍ଥକ୍ୟର ବିଲ",
      },
      extra: {
        q: "ଅଧିକ ତିଆରି ହୋଇଥିବା ବିଦ୍ୟୁତର କଣ ହୁଏ?",
        a: "ଅଧିକ ବିଦ୍ୟୁତ ଗ୍ରିଡକୁ ଯାଏ ଏବଂ ଆପଣଙ୍କ ଖାତାରେ କ୍ରେଡିଟ ଭାବେ ଜମା ହୁଏ। ଯେଉଁ ମାସରେ ଆପଣ ଅଧିକ ବିଦ୍ୟୁତ ବ୍ୟବହାର କରନ୍ତି, ଯେପରି ଗ୍ରୀଷ୍ମରେ, ସେତେବେଳେ ଏହି କ୍ରେଡିଟ କାମରେ ଆସେ। ବର୍ଷ ଶେଷରେ ବଳକା କ୍ରେଡିଟ ଡିସକମର ନିୟମ ଅନୁସାରେ ସେଟଲ ହୁଏ।",
        k: "ଅଧିକ ୟୁନିଟ = ବିଲରେ କ୍ରେଡିଟ",
      },
      getmeter: {
        q: "ନେଟ ମିଟର କିପରି ମିଳିବ?",
        a: "ସିଷ୍ଟମ ଲାଗିବା ପରେ ଆପଣଙ୍କ ଡିସକମ ନେଟ ମିଟର ଲଗାଏ। ଓଡ଼ିଶାରେ ଏହା ଟିପି ସେଣ୍ଟ୍ରାଲ, ଟିପି ସାଉଦର୍ନ, ଟିପି ୱେଷ୍ଟର୍ନ କିମ୍ବା ଟିପି ନର୍ଦର୍ନ ଓଡ଼ିଶା। ଆବେଦନ, ଯାଞ୍ଚ ଓ ସବୁ ଦୌଡ଼ାଦୌଡ଼ି Clans Machina ଆପଣଙ୍କ ପାଇଁ କରେ।",
        k: "ଡିସକମ କାମ ଆମେ କରୁ",
      },
      ndocs: {
        q: "ନେଟ ମିଟରିଂ ପାଇଁ କେଉଁ କାଗଜପତ୍ର ଦରକାର?",
        a: "ନେଟ ମିଟରିଂ ଫର୍ମ, ସଦ୍ୟତମ ବିଦ୍ୟୁତ ବିଲ, ପରିଚୟ ପ୍ରମାଣ, ଏବଂ ସିଷ୍ଟମର ଡିଜାଇନ ଓ ଉପକରଣ ବିବରଣୀ। ଡିସକମ ସହ ଏକ ଚୁକ୍ତି ହୁଏ, ଏବଂ ପୁରୁଣା ବକେୟା ବିଲ ପ୍ରଥମେ ଦେବାକୁ ପଡ଼େ। ଏସବୁ ଆମ ଟିମ ଆପଣଙ୍କ ପାଇଁ ପ୍ରସ୍ତୁତ କରେ।",
        k: "ଫର୍ମ · ବିଲ · ପରିଚୟ · ଚୁକ୍ତି",
      },
      warranty: {
        q: "କେତେ ୱାରେଣ୍ଟି ମିଳେ?",
        a: "ପ୍ୟାନେଲରେ 25 ବର୍ଷର ପରଫର୍ମାନ୍ସ ୱାରେଣ୍ଟି ଏବଂ 10 ରୁ 12 ବର୍ଷର ପ୍ରଡକ୍ଟ ୱାରେଣ୍ଟି ମିଳେ। ଇନଭର୍ଟରରେ 5 ରୁ 10 ବର୍ଷର ୱାରେଣ୍ଟି ଥାଏ। ଆଉ ଆମ ସର୍ଭିସ ଟିମ ସବୁବେଳେ ଆପଣଙ୍କ ସହିତ ଅଛି।",
        k: "ପ୍ୟାନେଲରେ 25 ବର୍ଷ",
      },
      life: {
        q: "ସୋଲାର ପ୍ୟାନେଲ କେତେ ବର୍ଷ ଚାଲେ?",
        a: "ସୋଲାର ପ୍ୟାନେଲ 25 ବର୍ଷ କିମ୍ବା ତାଠାରୁ ଅଧିକ ଚାଲେ। ତା'ପରେ ବି ବିଦ୍ୟୁତ ତିଆରି କରୁଥାଏ, କେବଳ ଟିକେ କମ।",
        k: "25+ ବର୍ଷ",
      },
      clean: {
        q: "ପ୍ୟାନେଲ କିପରି ସଫା କରିବି?",
        a: "ମାସକୁ ପ୍ରାୟ ଥରେ ସଫା କରନ୍ତୁ, ଧୂଳି ଅଧିକ ହେଲେ ଆହୁରି ଶୀଘ୍ର। ସକାଳୁ କିମ୍ବା ସନ୍ଧ୍ୟାରେ ସାଧା ପାଣି ଓ ନରମ କପଡ଼ା କିମ୍ବା ପୋଛାରେ ସଫା କରନ୍ତୁ। ସାବୁନ, ଟାଣ ବ୍ରସ କିମ୍ବା ଜୋରରେ ପାଣି କେବେ ବ୍ୟବହାର କରନ୍ତୁ ନାହିଁ।",
        k: "ମାସକୁ ଥରେ · ସାଧା ପାଣି",
      },
      monitor: {
        q: "ମୋ ସୋଲାର ଉତ୍ପାଦନ କିପରି ଦେଖିବି?",
        a: "ଆପଣଙ୍କ ଇନଭର୍ଟର ଫୋନର ଏକ ଆପ ସହ ଯୋଡ଼ା ଥାଏ। ସେଥିରେ ଆଜିର ୟୁନିଟ, ଆପଣଙ୍କ ସଞ୍ଚୟ ଓ କୌଣସି ତ୍ରୁଟି ଲାଇଭ ଦେଖାଯାଏ। ବିଦ୍ୟୁତ ବିଲରେ ମଧ୍ୟ ଗ୍ରିଡକୁ ପଠାଯାଇଥିବା ୟୁନିଟ ଦେଖାଯାଏ।",
        k: "ଫୋନରେ ଲାଇଭ",
      },
      drop: {
        q: "ହଠାତ ଉତ୍ପାଦନ କମିଗଲେ କଣ କରିବି?",
        a: "ପ୍ରଥମେ ଦେଖନ୍ତୁ ଧୂଳି, ନୂଆ ଛାଇ କିମ୍ବା ଟ୍ରିପ ହୋଇଥିବା ସୁଇଚ ଅଛି କି, ଏବଂ ଇନଭର୍ଟର ଆପରେ କୌଣସି ଏରର ଦେଖନ୍ତୁ। ଆମ ମନିଟରିଂ ମଧ୍ୟ ନିଜେ କମିବା ଧରିପାରେ, ଏବଂ ଆମ ଟିମ ସର୍ଭିସ ଯାଞ୍ଚ କରେ। କେବଳ ଆମକୁ କଲ କିମ୍ବା WhatsApp କରନ୍ତୁ।",
        k: "ଆମକୁ ମଧ୍ୟ ଆଲର୍ଟ ମିଳେ",
      },
      upkeep: {
        q: "ରକ୍ଷଣାବେକ୍ଷଣ ଖର୍ଚ୍ଚ ଅଧିକ କି?",
        a: "ନା। ସୋଲାରରେ କୌଣସି ଘୂରୁଥିବା ଅଂଶ ନାହିଁ, ତେଣୁ ଯତ୍ନ ମାନେ କେବଳ ନିୟମିତ ସଫା ଓ ବର୍ଷକୁ ଥରେ ଯାଞ୍ଚ। ଅନ-ଗ୍ରିଡ ସିଷ୍ଟମରେ ବଦଳାଇବାକୁ କୌଣସି ବ୍ୟାଟେରୀ ବି ନାହିଁ।",
        k: "ବହୁତ କମ ଯତ୍ନ",
      },
    },
  },
};

export const itemsOf = (topic: TopicId) => ITEMS.filter((i) => i.topic === topic).map((i) => i.id);
export const topicOf = (id: string) => ITEMS.find((i) => i.id === id)?.topic ?? "basics";

// Every sentence Saathi may say in the FAQ (for the voice recorder).
export const faqSpoken = (lang: Lang) => {
  const c = FAQ[lang];
  return [c.ui.intro, c.ui.topicSay, c.ui.suggest, c.ui.noMatch, c.hub.say, ...Object.values(c.items).map((i) => i.a)];
};

// ── matching a typed or spoken question ─────────────────────────────────
// No AI needed: score every item by the words it shares with the question
// (its keywords plus its question in all three languages). Good enough for
// short questions; a cloud model can replace this later (PDF §4).

// Words that appear in almost every question and say nothing about which one.
const STOP = new Set(
  (
    "what is are the a an how much many do does did i my me can could will would for of to in on it its and or about get " +
    "should which when there this that be you your we our with from have has any need tell please solar system kya hai " +
    "kaise kitna kitni mera meri mujhe ka ki ke me se ko aur " +
    "क्या है हैं कैसे कितना कितनी कितने मेरे मेरा मेरी मुझे के की का में से को और या पर यह ये वह हो होता होती होगा " +
    "कब कौन सा सी लिए तो भी जी सोलर सिस्टम चाहिए " +
    "କଣ କି କେତେ କିପରି ମୋର ମୋ ମୁଁ ର ରେ କୁ ପାଇଁ ଓ ଏବଂ ଏହା ସୋଲାର ସିଷ୍ଟମ ହେବ ଅଛି କେଉଁ ଦରକାର"
  ).split(" "),
);

// Letters (with Indic vowel signs) and digits; everything else is a space.
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
const words = (s: string) => norm(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w));
// "panels" ~ "panel", "सब्सिडी" ~ "सब्सिडीका": a shared start of 4+ letters.
const alike = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));

const LANG_KEYS: Lang[] = ["en", "hi", "or"];
// "a+b" = both parts must appear (e.g. "document+net" for net-metering papers).
const INDEX = ITEMS.map((it) => ({
  id: it.id,
  keys: it.keys.map((k) => k.split("+").map(norm)),
  qWords: [...new Set(LANG_KEYS.flatMap((l) => words(FAQ[l].items[it.id].q)))],
}));

export function scoreFaq(query: string) {
  const q = ` ${norm(query)} `;
  const qw = new Set(words(query));
  const has = (k: string) => !!k && (q.includes(` ${k} `) || (k.length >= 5 && q.includes(k)));
  // Inside "a+b" a short stem is enough ("लग" in "लगेगा").
  const hasPart = (k: string) => !!k && q.includes(` ${k}`);
  return INDEX.map((it) => {
    // Keyword phrases in the question: the best one counts in full (longer =
    // stronger, "a+b" strongest), each further one adds a little.
    const hits = it.keys
      .filter((parts) => (parts.length > 1 ? parts.every(hasPart) : has(parts[0])))
      .map((parts) => (parts.length > 1 ? 4 + 2 * parts.length : 2 + parts[0].split(" ").length))
      .sort((a, b) => b - a);
    let score = hits.length ? hits[0] + (hits.length - 1) : 0;
    // Shared words with the item's question.
    for (const w of qw) if (it.qWords.some((x) => alike(w, x))) score += 1.5;
    return { id: it.id, score };
  }).sort((a, b) => b.score - a.score);
}

export type FaqMatch = { kind: "answer"; id: string } | { kind: "suggest"; ids: string[] } | { kind: "none" };

export function matchFaq(query: string): FaqMatch {
  const ranked = scoreFaq(query);
  const [top, second] = ranked;
  if (!top || top.score < 3) return { kind: "none" };
  if (top.score >= second.score + 2) return { kind: "answer", id: top.id };
  const close = ranked.filter((r) => r.score >= top.score - 1.5).slice(0, 3).map((r) => r.id);
  return close.length === 1 ? { kind: "answer", id: close[0] } : { kind: "suggest", ids: close };
}
