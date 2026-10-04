// All customer-facing copy. Hindi is conversational Hinglish; Odia is a first
// draft and must be reviewed by a native speaker before launch.

export type Lang = "or" | "hi" | "en";

export const LANGS: {
  code: Lang;
  native: string;
  english: string;
  hello: string;
  glyph: string;
  bcp: string;
}[] = [
  { code: "or", native: "ଓଡ଼ିଆ", english: "Odia", hello: "ନମସ୍କାର", glyph: "ଓ", bcp: "or-IN" },
  { code: "hi", native: "हिन्दी", english: "Hindi", hello: "नमस्ते", glyph: "हि", bcp: "hi-IN" },
  { code: "en", native: "English", english: "English", hello: "Hello", glyph: "En", bcp: "en-IN" },
];

export const bcpOf = (lang: Lang) => LANGS.find((l) => l.code === lang)!.bcp;

// First page, shown before a language is chosen.
export const WELCOME = {
  cta: "Meet Solar Saathi",
  intro: "Namaste! I'm Saathi, your solar friend from Clans Machina. I'm so happy you're here! Tap the button below, and let's see how much you can save.",
  greet: "Welcome! I'm really glad you came. In just two minutes, I'll design a solar plan for your home, and show you exactly how much you can save. Which language would you like to talk in?",
};

type Field = "name" | "mobile" | "email";

type Dict = {
  langChosen: string;
  stepLabel: string;
  steps: [string, string, string, string];
  voiceMissing: string;
  aria: { back: string; mute: string; unmute: string; language: string };
  assistant: { role: string; speaking: string; listening: string; thinking: string; online: string };
  chat: {
    askName: string;
    nameAck: string;
    mobileAck: string;
    confirm: string;
    confirmAsk: string;
    confirmTitle: string;
    ask: Record<Field, string>;
    yes: string;
    edit: string;
    done: string;
    editAsk: Record<Field, string>;
    errName: string;
    errMobileShort: string;
    errMobileStart: string;
    errMobileFake: string;
    errEmail: string;
    emailTypo: string;
    saved: Record<Field, string>;
    labels: Record<Field, string>;
    placeholders: Record<Field, string>;
    checklist: string;
    send: string;
    nextBtn: string;
    speak: string;
    listening: string;
    privacy: string;
    // How symbols in an email ID are read aloud.
    spoken: { at: string; dot: string; underscore: string; dash: string; plus: string };
  };
  next: { title: string; line: string; summary: string; upNext: string; upNextSub: string; cta: string; soon: string };
};

export const STRINGS: Record<Lang, Dict> = {
  en: {
    langChosen: "Wonderful! Let's talk in English. I'll guide you at every step.",
    stepLabel: "Step {n} of 4",
    steps: ["About you", "Your home", "Your plan", "Book"],
    voiceMissing: "This device has no English voice, so I'll show the text.",
    aria: { back: "Back", mute: "Mute voice", unmute: "Turn voice on", language: "Change language" },
    assistant: { role: "AI solar assistant", speaking: "Speaking…", listening: "Listening…", thinking: "Typing…", online: "Online" },
    chat: {
      askName: "Let's get started! May I know your full name?",
      nameAck: "Thank you! It's lovely to meet you, {first}. Now, please enter your 10-digit mobile number.",
      mobileAck: "Thank you. I have noted your mobile number as {mobile}. Lastly, please enter your email ID. I will send your solar report there.",
      confirm: "Thank you! Please check your details once. Name: {name}. Mobile: {mobile}. Email: {email}. Is everything correct?",
      confirmAsk: "Thank you! Please check your details once. Is everything correct?",
      confirmTitle: "Your details",
      ask: { name: "What is your full name?", mobile: "Please enter your 10-digit mobile number.", email: "Please enter your email ID." },
      yes: "Yes, all correct",
      edit: "Edit",
      done: "Wonderful, {first}! Your details are saved. Let's move to the next step.",
      editAsk: {
        name: "Sure. Please enter your full name again.",
        mobile: "Sure. Please enter your mobile number again.",
        email: "Sure. Please enter your email ID again.",
      },
      errName: "Please enter your name using letters only, for example Rahul Mohanty.",
      errMobileShort: "Please check the number once. It has {n} digits, but a mobile number needs exactly 10.",
      errMobileStart: "Indian mobile numbers start with 6, 7, 8 or 9. Please check the number.",
      errMobileFake: "This doesn't look like a real mobile number. Please enter your own number, so I can send you the code.",
      errEmail: "This email ID doesn't look right. Please check it, for example name@gmail.com.",
      emailTypo: "One small check. Did you mean {email}? Tap it below to use it, or correct the email.",
      saved: { name: "Name saved", mobile: "Mobile number saved", email: "Email ID saved" },
      labels: { name: "Name", mobile: "Mobile", email: "Email" },
      placeholders: { name: "Type your full name", mobile: "10-digit mobile number", email: "Type your email ID" },
      checklist: "What I need",
      send: "Send",
      nextBtn: "Next",
      speak: "Speak",
      listening: "Listening…",
      privacy: "Your details are safe and used only for your solar plan.",
      spoken: { at: "at", dot: "dot", underscore: "underscore", dash: "dash", plus: "plus" },
    },
    next: {
      title: "Thank you, {name}!",
      line: "Thank you, {name}! In the next step, I'll ask a few quick questions about your home.",
      summary: "Your details",
      upNext: "Next: Your home",
      upNextSub: "6 quick questions · about 1 minute",
      cta: "Next step",
      soon: "Step 2 is coming in the next build",
    },
  },
  hi: {
    langChosen: "बहुत बढ़िया! अब हम हिंदी में बात करेंगे। हर स्टेप पर मैं आपके साथ हूँ।",
    stepLabel: "चरण {n} / 4",
    steps: ["आपके बारे में", "आपका घर", "आपका प्लान", "बुकिंग"],
    voiceMissing: "इस डिवाइस पर हिन्दी आवाज़ उपलब्ध नहीं है, इसलिए मैं टेक्स्ट दिखा रहा हूँ।",
    aria: { back: "वापस", mute: "आवाज़ बंद करें", unmute: "आवाज़ चालू करें", language: "भाषा बदलें" },
    assistant: { role: "AI सोलर सहायक", speaking: "बोल रहा हूँ…", listening: "सुन रहा हूँ…", thinking: "लिख रहा हूँ…", online: "ऑनलाइन" },
    chat: {
      askName: "चलिए शुरू करते हैं! आपका पूरा नाम क्या है?",
      nameAck: "धन्यवाद! आपसे मिलकर बहुत ख़ुशी हुई, {first}। अब अपना 10 अंकों का मोबाइल नंबर डालिए।",
      mobileAck: "धन्यवाद। मैंने आपका मोबाइल नंबर {mobile} लिख लिया है। आख़िर में, अपनी ईमेल आईडी डालिए। मैं आपकी सोलर रिपोर्ट वहीं भेजूँगा।",
      confirm: "धन्यवाद! एक बार अपनी डिटेल्स चेक कर लीजिए। नाम: {name}। मोबाइल: {mobile}। ईमेल: {email}। क्या सब सही है?",
      confirmAsk: "धन्यवाद! एक बार अपनी डिटेल्स चेक कर लीजिए। क्या सब सही है?",
      confirmTitle: "आपकी डिटेल्स",
      ask: { name: "आपका पूरा नाम क्या है?", mobile: "अपना 10 अंकों का मोबाइल नंबर डालिए।", email: "अपनी ईमेल आईडी डालिए।" },
      yes: "हाँ, सब सही है",
      edit: "बदलें",
      done: "शानदार, {first}! आपकी जानकारी सेव हो गई है। चलिए अगले चरण पर चलते हैं।",
      editAsk: {
        name: "ज़रूर। अपना पूरा नाम फिर से डालिए।",
        mobile: "ज़रूर। अपना मोबाइल नंबर फिर से डालिए।",
        email: "ज़रूर। अपनी ईमेल आईडी फिर से डालिए।",
      },
      errName: "कृपया अपना नाम सिर्फ़ अक्षरों में लिखिए, जैसे राहुल मोहंती।",
      errMobileShort: "कृपया नंबर एक बार चेक कर लीजिए। इसमें {n} अंक हैं, लेकिन मोबाइल नंबर में पूरे 10 अंक होते हैं।",
      errMobileStart: "भारत के मोबाइल नंबर 6, 7, 8 या 9 से शुरू होते हैं। कृपया नंबर चेक कर लीजिए।",
      errMobileFake: "यह नंबर असली नहीं लग रहा। कृपया अपना मोबाइल नंबर डालिए, ताकि मैं आपको कोड भेज सकूँ।",
      errEmail: "यह ईमेल आईडी सही नहीं लग रही। कृपया चेक कर लीजिए, जैसे name@gmail.com",
      emailTypo: "एक छोटी-सी बात। क्या आपका मतलब {email} है? सही है तो नीचे टैप कीजिए, या ईमेल ठीक कर लीजिए।",
      saved: { name: "नाम सेव हुआ", mobile: "मोबाइल नंबर सेव हुआ", email: "ईमेल आईडी सेव हुई" },
      labels: { name: "नाम", mobile: "मोबाइल", email: "ईमेल" },
      placeholders: { name: "अपना पूरा नाम लिखें", mobile: "10 अंकों का मोबाइल नंबर", email: "अपनी ईमेल आईडी लिखें" },
      checklist: "मुझे चाहिए",
      send: "भेजें",
      nextBtn: "आगे बढ़ें",
      speak: "बोलें",
      listening: "सुन रहा हूँ…",
      privacy: "आपकी जानकारी सुरक्षित है और सिर्फ़ आपके सोलर प्लान के लिए उपयोग होगी।",
      spoken: { at: "एट द रेट", dot: "डॉट", underscore: "अंडरस्कोर", dash: "डैश", plus: "प्लस" },
    },
    next: {
      title: "धन्यवाद, {name}!",
      line: "धन्यवाद, {name}! अगले चरण में, मैं आपके घर के बारे में कुछ छोटे सवाल पूछूँगा।",
      summary: "आपकी जानकारी",
      upNext: "अगला: आपका घर",
      upNextSub: "6 छोटे सवाल · लगभग 1 मिनट",
      cta: "अगला चरण",
      soon: "चरण 2 अगले बिल्ड में आ रहा है",
    },
  },
  or: {
    langChosen: "ବହୁତ ଭଲ! ଏବେ ମୁଁ ଆପଣଙ୍କ ସହ ଓଡ଼ିଆରେ କଥା ହେବି।",
    stepLabel: "ପଦକ୍ଷେପ {n} / 4",
    steps: ["ଆପଣଙ୍କ ବିଷୟରେ", "ଆପଣଙ୍କ ଘର", "ଆପଣଙ୍କ ପ୍ଲାନ", "ବୁକିଂ"],
    voiceMissing: "ଏହି ଡିଭାଇସରେ ଓଡ଼ିଆ ସ୍ୱର ଉପଲବ୍ଧ ନାହିଁ, ତେଣୁ ମୁଁ ଲେଖା ଦେଖାଉଛି।",
    aria: { back: "ପଛକୁ", mute: "ସ୍ୱର ବନ୍ଦ କରନ୍ତୁ", unmute: "ସ୍ୱର ଚାଲୁ କରନ୍ତୁ", language: "ଭାଷା ବଦଳାନ୍ତୁ" },
    assistant: { role: "AI ସୋଲାର ସହାୟକ", speaking: "କହୁଛି…", listening: "ଶୁଣୁଛି…", thinking: "ଲେଖୁଛି…", online: "ଅନଲାଇନ" },
    chat: {
      askName: "ଆସନ୍ତୁ, ପରସ୍ପରକୁ ଜାଣିବା। ଆପଣଙ୍କ ପୂରା ନାମ କ'ଣ?",
      nameAck: "ଧନ୍ୟବାଦ। ମୁଁ ଆପଣଙ୍କ ନାମ {name} ଲେଖିନେଲି। ଆପଣଙ୍କୁ ଭେଟି ଖୁସି ଲାଗିଲା, {first}! ଏବେ ଆପଣଙ୍କ 10 ଅଙ୍କର ମୋବାଇଲ ନମ୍ବର ଦିଅନ୍ତୁ।",
      mobileAck: "ଧନ୍ୟବାଦ। ମୁଁ ଆପଣଙ୍କ ମୋବାଇଲ ନମ୍ବର {mobile} ଲେଖିନେଲି। ଶେଷରେ, ଆପଣଙ୍କ ଇମେଲ ଆଇଡି ଦିଅନ୍ତୁ। ମୁଁ ସେଠାକୁ ଆପଣଙ୍କ ସୋଲାର ରିପୋର୍ଟ ପଠାଇବି।",
      confirm: "ଥରେ ଆପଣଙ୍କ ସୂଚନା ଯାଞ୍ଚ କରନ୍ତୁ। ନାମ: {name}। ମୋବାଇଲ ନମ୍ବର: {mobile}। ଇମେଲ ଆଇଡି: {email}। ସବୁ ଠିକ ଅଛି କି?",
      confirmAsk: "ଥରେ ଆପଣଙ୍କ ସୂଚନା ଯାଞ୍ଚ କରନ୍ତୁ। ସବୁ ଠିକ ଅଛି କି?",
      confirmTitle: "ଆପଣଙ୍କ ସୂଚନା",
      ask: { name: "ଆପଣଙ୍କ ପୂରା ନାମ କ'ଣ?", mobile: "ଆପଣଙ୍କ 10 ଅଙ୍କର ମୋବାଇଲ ନମ୍ବର ଦିଅନ୍ତୁ।", email: "ଆପଣଙ୍କ ଇମେଲ ଆଇଡି ଦିଅନ୍ତୁ।" },
      yes: "ହଁ, ସବୁ ଠିକ ଅଛି",
      edit: "ବଦଳାନ୍ତୁ",
      done: "ଚମତ୍କାର, {first}! ଆପଣଙ୍କ ସୂଚନା ସେଭ ହୋଇଗଲା। ଚାଲନ୍ତୁ ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପକୁ ଯିବା।",
      editAsk: {
        name: "ନିଶ୍ଚୟ। ଆପଣଙ୍କ ପୂରା ନାମ ପୁଣି ଦିଅନ୍ତୁ।",
        mobile: "ନିଶ୍ଚୟ। ଆପଣଙ୍କ ମୋବାଇଲ ନମ୍ବର ପୁଣି ଦିଅନ୍ତୁ।",
        email: "ନିଶ୍ଚୟ। ଆପଣଙ୍କ ଇମେଲ ଆଇଡି ପୁଣି ଦିଅନ୍ତୁ।",
      },
      errName: "ଦୟାକରି କେବଳ ଅକ୍ଷରରେ ଆପଣଙ୍କ ପୂରା ନାମ ଲେଖନ୍ତୁ।",
      errMobileShort: "ଏହି ନମ୍ବରରେ {n}ଟି ଅଙ୍କ ଅଛି। ମୋବାଇଲ ନମ୍ବରରେ ଠିକ 10ଟି ଅଙ୍କ ରହିବା ଦରକାର। ଦୟାକରି ପୁଣି ଦିଅନ୍ତୁ।",
      errMobileStart: "ଭାରତୀୟ ମୋବାଇଲ ନମ୍ବର 6, 7, 8 କିମ୍ବା 9ରୁ ଆରମ୍ଭ ହୁଏ। ଦୟାକରି ନମ୍ବର ଯାଞ୍ଚ କରି ପୁଣି ଦିଅନ୍ତୁ।",
      errMobileFake: "ଏହା ପ୍ରକୃତ ମୋବାଇଲ ନମ୍ବର ପରି ଲାଗୁନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ନିଜ ନମ୍ବର ଦିଅନ୍ତୁ, ଯାହାଦ୍ୱାରା ମୁଁ କୋଡ ପଠାଇପାରିବି।",
      errEmail: "ଏହି ଇମେଲ ଆଇଡି ଠିକ ଲାଗୁନାହିଁ। ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ, ଯେପରି name@gmail.com",
      emailTypo: "ଆପଣ {email} କହିବାକୁ ଚାହୁଁଥିଲେ କି? ଠିକ ହେଲେ ତଳେ ଟାପ କରନ୍ତୁ, କିମ୍ବା ଇମେଲ ସଂଶୋଧନ କରନ୍ତୁ।",
      saved: { name: "ନାମ ସେଭ ହେଲା", mobile: "ମୋବାଇଲ ନମ୍ବର ସେଭ ହେଲା", email: "ଇମେଲ ଆଇଡି ସେଭ ହେଲା" },
      labels: { name: "ନାମ", mobile: "ମୋବାଇଲ", email: "ଇମେଲ" },
      placeholders: { name: "ଆପଣଙ୍କ ପୂରା ନାମ ଲେଖନ୍ତୁ", mobile: "10 ଅଙ୍କର ମୋବାଇଲ ନମ୍ବର", email: "ଆପଣଙ୍କ ଇମେଲ ଆଇଡି ଲେଖନ୍ତୁ" },
      checklist: "ମୋତେ ଦରକାର",
      send: "ପଠାନ୍ତୁ",
      nextBtn: "ଆଗକୁ",
      speak: "କୁହନ୍ତୁ",
      listening: "ଶୁଣୁଛି…",
      privacy: "ଆପଣଙ୍କ ତଥ୍ୟ ସୁରକ୍ଷିତ ଏବଂ କେବଳ ଆପଣଙ୍କ ସୋଲାର ପ୍ଲାନ ପାଇଁ ବ୍ୟବହାର ହେବ।",
      spoken: { at: "ଆଟ ଦ ରେଟ", dot: "ଡଟ", underscore: "ଅଣ୍ଡରସ୍କୋର", dash: "ଡ୍ୟାସ", plus: "ପ୍ଲସ" },
    },
    next: {
      title: "ଧନ୍ୟବାଦ, {name}!",
      line: "ଧନ୍ୟବାଦ, {name}! ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପରେ, ମୁଁ ଆପଣଙ୍କ ଘର ବିଷୟରେ କିଛି ଛୋଟ ପ୍ରଶ୍ନ ପଚାରିବି।",
      summary: "ଆପଣଙ୍କ ସୂଚନା",
      upNext: "ପରବର୍ତ୍ତୀ: ଆପଣଙ୍କ ଘର",
      upNextSub: "6ଟି ଛୋଟ ପ୍ରଶ୍ନ · ପ୍ରାୟ 1 ମିନିଟ",
      cta: "ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ",
      soon: "ପଦକ୍ଷେପ 2 ପରବର୍ତ୍ତୀ ବିଲ୍ଡରେ ଆସୁଛି",
    },
  },
};

export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
