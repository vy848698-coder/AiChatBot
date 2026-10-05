// Checks the FAQ matcher: each question must find its answer.
//   npm run faq:check
// Add a line here for any question a customer asked that went unanswered,
// then add keywords in src/lib/faq.ts until it passes.

import { matchFaq, scoreFaq } from "../src/lib/faq";
const cases: [string, string][] = [
  ["how much subsidy can i get", "amount"],
  ["subsidy kitni milegi", "amount"],
  ["मुझे कितनी सब्सिडी मिलेगी", "amount"],
  ["ମୋତେ କେତେ ସବସିଡି ମିଳିବ", "amount"],
  ["what is the price of 3 kw", "cost"],
  ["3 किलोवाट का दाम कितना है", "cost"],
  ["will it work when the light goes", "powercut"],
  ["बिजली कट जाए तो सोलर चलेगा क्या", "powercut"],
  ["does it work in rain", "cloudy"],
  ["how to clean panels", "clean"],
  ["पैनल की सफाई कैसे करें", "clean"],
  ["ପ୍ୟାନେଲ କିପରି ସଫା କରିବି", "clean"],
  ["what is net metering", "netmeter"],
  ["documents for net metering", "ndocs"],
  ["what documents are required", "docs"],
  ["can i get loan", "loan"],
  ["emi kitni hogi", "emi"],
  ["warranty kitni hai", "warranty"],
  ["how long will installation take", "time"],
  ["is solar good for my shop", "business"],
  ["i live in a flat can i install", "rented"],
  ["what is hybrid", "hybrid"],
  ["difference between on grid and off grid", "which"],
  ["how many units per day", "units"],
  ["payback period", "payback"],
  ["generation is low what to do", "drop"],
  ["when will i get subsidy money", "payout"],
  ["how do i apply", "apply"],
  ["सोलर पैनल कितने साल चलेंगे", "life"],
  ["क्या लोन मिल सकता है सोलर के लिए", "loan"],
  ["नेट मीटर कैसे लगेगा", "getmeter"],
  ["कौन से कागज लगेंगे", "docs"],
  ["किराए के मकान में लगा सकते हैं क्या", "rented"],
  ["बादल में बिजली बनेगी क्या", "cloudy"],
  ["ମୋ ଘରେ କେଉଁ ସିଷ୍ଟମ ଭଲ", "which"],
  ["ଋଣ ମିଳିବ କି", "loan"],
  ["ୱାରେଣ୍ଟି କେତେ ବର୍ଷ", "warranty"],
  ["ଛାତରେ କେତେ ଜାଗା ଲାଗିବ", "roof"],
  ["ବିଦ୍ୟୁତ କଟିଲେ କଣ ହେବ", "powercut"],
  ["is maintenance costly", "upkeep"],
  ["can i sell extra electricity", "extra"],
  ["which panel brand do you use", "panels"],
  ["will it leak during cyclone", "damage"],
  ["what is pm surya ghar", "pmsg"],
  ["who is eligible", "eligible"],
  ["how many years to recover my money", "payback"],
  ["what is the weather today", "-"],
  ["tell me a joke", "-"],
];
let ok = 0;
for (const [q, want] of cases) {
  const m = matchFaq(q);
  const got = m.kind === "answer" ? m.id : m.kind === "suggest" ? `?${m.ids.join("|")}` : "-";
  const pass = got === want || (m.kind === "suggest" && m.ids[0] === want);
  if (pass) ok++;
  const top = scoreFaq(q).slice(0, 3).map((r) => `${r.id}:${r.score}`).join(" ");
  console.log(`${pass ? "ok  " : "FAIL"} ${q.padEnd(42)} → ${got.padEnd(28)} [${top}]`);
}
console.log(`${ok}/${cases.length}`);
if (ok < cases.length) process.exit(1);
