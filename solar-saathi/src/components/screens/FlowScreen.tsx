"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { computeEstimate, rupees } from "@/lib/estimate";
import { FAQ, matchFaq } from "@/lib/faq";
import { FLOW, type FlowCopy } from "@/lib/flowCopy";
import { STRINGS, fill, type Lang } from "@/lib/i18n";
import { categoryOf, EMPTY_LEAD, saveLead, type Lead } from "@/lib/lead";
import { whatsAppText } from "@/lib/leadMessage";
import { HOME_STATE, matchDistrict, matchState } from "@/lib/regions";
import { sfx } from "@/lib/sfx";
import { displayMobile, spokenEmail, spokenMobile, spokenRupees } from "@/lib/speech";
import { useSpeechInput } from "@/lib/useSpeechInput";
import { cleanMobile, emailTypo, firstName, isArea, isEmail, isExactBill, isFakeMobile, isMobile, isName, isPin, NAME_MAX, nameProblem, tidyName } from "@/lib/validate";
import { voice } from "@/lib/voice";
import { BookedCard, ExpertSheet, ResultsCard } from "../flow/Cards";
import { FaqCard, type FaqView } from "../flow/Faq";
import { Busy, Chip, ChoiceGrid, DateChips, FieldInput, NextLabel, OtpBoxes, PrimaryButton, RangeSlider, RegionSelect, type DayOpt, type Option } from "../flow/Widgets";
import type { MascotMood } from "../mascot/Mascot";
import { AnswerCard, Caption, StageLayout } from "../StageLayout";
import { IconCheck, IconEdit, IconKey, IconMail, IconMic, IconPhone, IconPin, IconRupee, IconUser } from "../ui/icons";
import { TopBar } from "../ui/TopBar";

export type Speak = (text: string, opts?: { spoken?: string; onProgress?: (n: number) => void }) => Promise<void>;

// ── the journey ──────────────────────────────────────────────────────────
type NodeId =
  | "name" | "mobile" | "otp" | "email" | "emailOtp" | "review"
  | "pin" | "region" | "area"
  | "own" | "ownerOk" | "ptype" | "roofType" | "bill" | "billExact" | "roof" | "goal" | "cuts" | "when" | "pay"
  | "calc" | "results"
  | "mode" | "date" | "slot" | "booked"
  | "faq";

const SECTION: Record<NodeId, number> = {
  name: 0, mobile: 0, otp: 0, email: 0, emailOtp: 0, review: 0,
  pin: 1, region: 1, area: 1,
  own: 2, ownerOk: 2, ptype: 2, roofType: 2, bill: 2, billExact: 2, roof: 2, goal: 2, cuts: 2, when: 2, pay: 2,
  calc: 3, results: 3,
  mode: 4, date: 4, slot: 4, booked: 4,
  faq: 4,
};

// "n / total" shown on the card (follow-ups share their parent's number).
const STEP: Partial<Record<NodeId, [number, number]>> = {
  name: [1, 3], mobile: [2, 3], otp: [2, 3], email: [3, 3], emailOtp: [3, 3],
  pin: [1, 3], region: [2, 3], area: [3, 3],
  own: [1, 6], ownerOk: [1, 6], ptype: [2, 6], roofType: [2, 6], bill: [3, 6], billExact: [3, 6], roof: [3, 6],
  goal: [4, 6], cuts: [4, 6], when: [5, 6], pay: [6, 6],
  mode: [1, 3], date: [2, 3], slot: [3, 3],
};

const CHOICE_ICONS: Record<string, string> = {
  own: "🏠", rented: "🔑", yes: "✅", no: "🤔",
  house: "🏡", flat: "🏢", commercial: "🏬", industrial: "🏭", society: "🏘️",
  savings: "💰", subsidy: "🏛️", backup: "🔋",
  lt1: "🕐", h1_3: "🕒", h3_6: "🕕", gt6: "🕘",
  now: "🚀", d15: "📅", d30: "🗓️", later: "⏳",
  full: "💳", bank: "🏦", emi: "📆", guide: "🤝",
  call: "📞", visit: "🏠", online: "💻",
};
const SLOT_HOUR = { s1: 10, s2: 12, s3: 14, s4: 16 } as const;
// SMS code for the mobile (paid per SMS): on only with NEXT_PUBLIC_SMS_OTP=on.
// Off: the server still checks the number is a real Indian mobile, then the
// user goes straight to the email step. The server reads the same switch.
const SMS_OTP = process.env.NEXT_PUBLIC_SMS_OTP === "on";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
// The two verification codes: SMS to the mobile, and email.
type CodeKind = "tel" | "mail";
const CODE_NODE: Record<CodeKind, NodeId> = { tel: "otp", mail: "emailOtp" };
// A code lasts 10 minutes; reuse it only with a minute to spare.
const stillValid = (sentAt: number) => Date.now() - sentAt < 9 * 60_000;

function nextNode(id: NodeId, l: Lead, editing: boolean): NodeId {
  const societyRoof = l.ptype === "flat" && l.roofType === "society";
  switch (id) {
    case "name": return editing ? "review" : "mobile";
    case "mobile": return SMS_OTP ? "otp" : editing ? "review" : "email";
    case "otp": return editing ? "review" : "email";
    case "email": return "emailOtp";
    case "emailOtp": return "review";
    case "review": return "pin";
    case "pin": return "region";
    case "region": return "area";
    case "area": return "own";
    case "own": return l.own === "rented" ? "ownerOk" : "ptype";
    case "ownerOk": return "ptype";
    case "ptype": return l.ptype === "flat" ? "roofType" : "bill";
    case "roofType": return "bill";
    case "bill": return societyRoof ? "goal" : "roof";
    case "billExact": return societyRoof ? "goal" : "roof";
    case "roof": return "goal";
    case "goal": return l.goal === "backup" ? "cuts" : "when";
    case "cuts": return "when";
    case "when": return "pay";
    case "pay": return "calc";
    case "calc": return "results";
    case "results": return "mode";
    case "mode": return "date";
    case "date": return "slot";
    default: return "booked";
  }
}

// Fields a step owns: cleared when the user goes back to it.
const CLEARS: Partial<Record<NodeId, (keyof Lead)[]>> = {
  name: ["name"], mobile: ["mobile", "otpVerified", "mobileProof", "mobileCheck"], otp: ["otpVerified", "mobileProof"], email: ["email", "emailVerified", "emailProof"],
  emailOtp: ["emailVerified", "emailProof"],
  pin: ["pin", "state", "district", "area"], region: ["state", "district"], area: ["area"],
  own: ["own", "ownerOk"], ownerOk: ["ownerOk"], ptype: ["ptype", "roofType"], roofType: ["roofType"],
  bill: ["bill"], billExact: ["bill"], roof: ["roof"], goal: ["goal", "cuts"], cuts: ["cuts"], when: ["when"], pay: ["pay"],
  mode: ["mode", "consult"], date: ["date"], slot: ["slot", "bookingId"],
};

// Saathi's reaction to the answer just given; said before the next question.
function reactionFor(id: NodeId, l: Lead, r: FlowCopy["react"]): string {
  switch (id) {
    case "emailOtp": return r.emailVerified;
    case "own": return l.own === "own" ? r.own : "";
    case "ownerOk": return l.ownerOk === "yes" ? r.ownerYes : r.ownerNo;
    case "ptype": return l.ptype ? r[l.ptype] : "";
    case "roofType": return l.roofType === "society" ? r.roofSociety : r.roofOwn;
    case "bill":
    case "billExact": return (l.bill ?? 0) >= 3000 ? r.billHigh : r.billLow;
    case "roof": return l.roof == null ? r.roofUnsure : r.roofKnown;
    case "goal":
      if (l.goal === "subsidy") return categoryOf(l) === "commercial" ? r.subsidyNone : l.state === HOME_STATE ? r.subsidyOdisha : r.subsidyOther;
      return l.goal ? r[l.goal] : "";
    case "cuts": return r.cuts;
    case "when": return l.when === "now" ? r.now : l.when === "later" ? r.later : r.soon;
    case "pay": return l.pay === "full" ? r.payFull : l.pay === "guide" ? r.payGuide : r.payLoan;
    default: return "";
  }
}

// Answers a step can take, used to load Saathi's next line before the user
// picks (so the reply plays at once).
const CHOICE_FIELD: Partial<Record<NodeId, keyof Lead>> = {
  own: "own", ownerOk: "ownerOk", ptype: "ptype", roofType: "roofType", goal: "goal", cuts: "cuts", when: "when", pay: "pay", mode: "mode", slot: "slot",
};

// What Saathi says on each FAQ screen.
function faqLine(v: FaqView, lang: Lang) {
  const c = FAQ[lang];
  switch (v.kind) {
    case "home": return c.ui.intro;
    case "topic": return c.ui.topicSay;
    case "answer": return c.items[v.id].a;
    case "suggest": return c.ui.suggest;
    case "none": return c.ui.noMatch;
  }
}

// The scrolling column the cards sit in: back to the top for a new FAQ screen.
function scrollStageTop() {
  let el = document.querySelector("[data-node]")?.parentElement ?? null;
  while (el && !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el = el.parentElement;
  el?.scrollTo({ top: 0, behavior: "smooth" });
}

// Voice answer for option cards: match the transcript against the option
// labels in the current language and in English.
function matchOption(transcript: string, opts: Option[], en: Record<string, string>) {
  const said = transcript.toLowerCase();
  for (const o of opts) {
    for (const cand of [o.label, en[o.id] ?? ""]) {
      const words = cand.toLowerCase().split(/[\s/,–-]+/).filter((w) => w.length >= 3);
      if (words.some((w) => said.includes(w))) return o.id;
    }
  }
  return null;
}

export function FlowScreen({
  lang,
  speak,
  mood,
  setMood,
  voiceNote,
  muted,
  onMute,
  onExit,
}: {
  lang: Lang;
  speak: Speak;
  mood: MascotMood;
  setMood: (m: MascotMood) => void;
  voiceNote: string | null;
  muted: boolean;
  onMute: () => void;
  onExit: () => void;
}) {
  const t = STRINGS[lang].chat;
  const f = FLOW[lang];
  const loc = `${lang}-IN`;

  const [node, setNode] = useState<NodeId>("name");
  const [lead, setLead] = useState<Lead>(EMPTY_LEAD);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);
  const [line, setLine] = useState({ key: 0, text: "", shown: 0 });
  const [preparing, setPreparing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [region, setRegion] = useState({ state: "", district: "" });
  const [areas, setAreas] = useState<string[]>([]);
  const [bill, setBill] = useState(3000);
  const [roof, setRoof] = useState(400);
  const [picked, setPicked] = useState<string | undefined>();
  const [otp, setOtp] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(0);
  const [burst, setBurst] = useState(0);
  const [expert, setExpert] = useState(false);
  const [shake, setShake] = useState(0);
  const [emailFix, setEmailFix] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [faqView, setFaqView] = useState<FaqView>({ kind: "home" });
  const [faqSeq, setFaqSeq] = useState(0);

  const nodeRef = useRef<NodeId>("name");
  const leadRef = useRef<Lead>(EMPTY_LEAD);
  const geoFound = useRef(false);
  const history = useRef<NodeId[]>([]);
  const editing = useRef(false);
  const turn = useRef(0);
  const verifying = useRef(false);
  const typoAsked = useRef("");
  const lastLine = useRef<Promise<void>>(Promise.resolve());
  // Signed by the server; hold only a hash of the code (or the SMS provider's reference).
  const codeTicket = useRef<Record<CodeKind, string>>({ tel: "", mail: "" });
  const codeSent = useRef<Partial<Record<CodeKind, { to: string; at: number; used: boolean }>>>({});
  const started = useRef(false);
  const faqViewRef = useRef<FaqView>({ kind: "home" });
  const faqStack = useRef<FaqView[]>([]); // earlier FAQ screens, for Back
  const inputRef = useRef<HTMLInputElement>(null);
  const speaking = useSyncExternalStore(voice.subscribe, () => voice.speaking, () => false);
  const mic = useSpeechInput(lang);
  const [scope, animate] = useAnimate();

  // ── speaking ──
  const say = useCallback(
    async (text: string, spoken?: string) => {
      const my = ++turn.current;
      voice.stop();
      setPreparing(true);
      await Promise.all([wait(320), Promise.race([voice.prepare(spoken ?? text, lang), wait(4000)])]);
      if (my !== turn.current) return;
      setPreparing(false);
      const key = Date.now();
      setLine({ key, text, shown: 0 });
      await speak(text, { spoken, onProgress: (n) => setLine((l) => (l.key === key ? { ...l, shown: n } : l)) });
    },
    [speak, lang],
  );

  const update = useCallback(
    (patch: Partial<Lead>) => {
      leadRef.current = { ...leadRef.current, ...patch };
      setLead(leadRef.current);
      saveLead(leadRef.current, lang);
    },
    [lang],
  );

  const flashHappy = useCallback(() => {
    setMood("happy");
    setTimeout(() => setMood("idle"), 850);
  }, [setMood]);

  // What Saathi says when a step opens.
  function baseLine(id: NodeId, how: "fwd" | "back" | "edit", L: Lead): { text: string; spoken?: string } {
    const first = firstName(L.name);
    switch (id) {
      case "name": return { text: how === "edit" ? t.editAsk.name : t.askName };
      case "mobile":
        return { text: how === "fwd" ? fill(t.nameAck, { name: L.name, first }) : how === "edit" ? t.editAsk.mobile : t.ask.mobile };
      case "otp":
        return { text: fill(f.otp.ask, { mobile: displayMobile(L.mobile) }), spoken: fill(f.otp.ask, { mobile: spokenMobile(L.mobile) }) };
      case "email":
        return {
          // "again" only if there was an email before (not when adding a skipped one)
          text: how === "fwd" ? (SMS_OTP ? f.otp.verifiedThenEmail : f.otp.savedThenEmail) : how === "edit" && L.email ? t.editAsk.email : t.ask.email,
        };
      case "emailOtp":
        return { text: fill(f.emailOtp.ask, { email: L.email }), spoken: fill(f.emailOtp.ask, { email: spokenEmail(L.email, lang) }) };
      case "review":
        return {
          text: t.confirmAsk,
          spoken: L.email
            ? fill(t.confirm, { name: L.name, mobile: spokenMobile(L.mobile), email: spokenEmail(L.email, lang) })
            : fill(t.confirmNoEmail, { name: L.name, mobile: spokenMobile(L.mobile) }),
        };
      case "pin": return { text: fill(f.pin.ask, { first }) };
      case "region":
        return { text: geoFound.current ? fill(f.pin.found, { district: L.district ?? "", state: L.state ?? "" }) : f.pin.notFound };
      case "area": return { text: areas.length ? f.area.ask : f.area.askPlain };
      case "own": return { text: f.own.ask };
      case "ownerOk": return { text: f.ownerOk.ask };
      case "ptype": return { text: f.ptype.ask };
      case "roofType": return { text: f.roofType.ask };
      case "bill": return { text: f.bill.ask };
      case "billExact": return { text: f.bill.exactAsk };
      case "roof": return { text: f.roof.ask };
      case "goal": return { text: f.goal.ask };
      case "cuts": return { text: f.cuts.ask };
      case "when": return { text: f.when.ask };
      case "pay": return { text: f.pay.ask };
      case "calc": return { text: fill(f.calc.say, { first }) };
      case "results": {
        const e = computeEstimate(L.bill ?? 3000, L.roof ?? null, categoryOf(L), L.state === HOME_STATE);
        const v = {
          first,
          kw: e.kw,
          cost: spokenRupees(e.cost, lang),
          subsidy: spokenRupees(e.subsidy, lang),
          invest: spokenRupees(e.investment, lang),
          monthly: spokenRupees(e.monthlySaving, lang),
          life: spokenRupees(e.savings25, lang),
          payback: Math.max(2, Math.round(e.paybackYears)),
        };
        // Ends with the two ways forward: book now, or ask in the FAQ first.
        return {
          text: `${fill(f.result.caption, { first })} ${f.result.next}`,
          spoken: `${fill(e.subsidy ? f.result.say : f.result.sayNoSub, v)} ${f.result.next}`,
        };
      }
      case "mode": return { text: f.mode.ask };
      case "date": return { text: f.date.ask };
      case "slot": return { text: f.slot.ask };
      case "booked": {
        const dateLabel = L.date ? new Date(`${L.date}T00:00`).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" }) : "";
        const said = fill(f.booked.say, {
          first,
          // "your free site visit" reads better than "your free Site visit"
          mode: L.mode ? (lang === "en" ? f.mode.opts[L.mode].toLowerCase() : f.mode.opts[L.mode]) : "",
          date: dateLabel,
          slot: L.slot ? f.slot.opts[L.slot] : "",
          district: L.district ?? "",
        });
        return { text: `${said} ${FAQ[lang].hub.say}` };
      }
      case "faq": return { text: faqLine(faqViewRef.current, lang) }; // the screen it reopens on
    }
  }

  // `L` defaults to the current answers; prefetching passes "what if" answers.
  // `react` is Saathi's reaction to the previous answer, said first.
  const lineFor = useCallback(
    (id: NodeId, how: "fwd" | "back" | "edit", L: Lead = leadRef.current, react = ""): { text: string; spoken?: string } => {
      const line = baseLine(id, how, L);
      if (!react) return line;
      return { text: `${react} ${line.text}`, spoken: line.spoken && `${react} ${line.spoken}` };
    },
    // baseLine only reads the values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, t, lang, loc, areas.length],
  );

  // Load what Saathi will say after this step, for every possible answer.
  const prefetchAfter = useCallback(
    (id: NodeId) => {
      const L = leadRef.current;
      let variants: Lead[] = [];
      const field = CHOICE_FIELD[id];
      if (field) {
        const opts = id === "slot" ? f.slot.opts : (f[id as "own"] as { opts: Record<string, string> }).opts;
        variants = Object.keys(opts).map((v) => ({ ...L, [field]: v }));
      } else if (id === "bill") variants = [{ ...L, bill: 3000 }, { ...L, bill: 1000 }];
      else if (id === "roof") variants = [{ ...L, roof: 400 }, { ...L, roof: null }];
      else if (id === "results") variants = [{ ...L, consult: "yes" }];
      else if (id === "review" || id === "emailOtp" || id === "area" || id === "date") variants = [L];
      const seen = new Set<string>();
      for (const v of variants) {
        const nxt = nextNode(id, v, editing.current);
        const steps: NodeId[] = nxt === "calc" ? ["calc", "results"] : [nxt];
        for (const n of steps) {
          const { text, spoken } = lineFor(n, "fwd", v, n === nxt ? reactionFor(id, v, f.react) : "");
          const line = spoken ?? text;
          if (seen.has(line)) continue;
          seen.add(line);
          voice.prefetch(line, lang);
        }
      }
    },
    [f, lang, lineFor],
  );

  // The owner's WhatsApp alert (api/lead → CallMeBot): when the plan is shown
  // and when a consultation is booked. In the background; never blocks the
  // customer. Sent again only if the answers changed since the last one.
  const alerted = useRef<Partial<Record<"plan" | "booked", string>>>({});
  // This chat's id: the plan and the booking land on one database row.
  const journey = useRef("");
  const alertOwner = (stage: "plan" | "booked") => {
    const L = leadRef.current;
    const sig = JSON.stringify(L);
    if (alerted.current[stage] === sig) return;
    alerted.current[stage] = sig;
    // getRandomValues, not randomUUID: phones on the LAN dev server aren't HTTPS.
    journey.current ||= Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
    void fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, lead: L, lang, journey: journey.current }),
      keepalive: true, // still delivered if the customer closes the tab right away
    }).catch(() => {});
  };

  const goTo = useCallback(
    (id: NodeId, how: "fwd" | "back" | "edit" = "fwd", react = "") => {
      const from = nodeRef.current;
      if (how === "fwd" && from !== id && from !== "calc") history.current.push(from);
      nodeRef.current = id;
      setNode(id);
      setDraft("");
      setError(false);
      setPicked(undefined);
      setBusy(false);
      setEmailFix(null);
      const L = leadRef.current;
      if (id === "otp" || id === "emailOtp") setOtp("");
      if (id === "region") setRegion({ state: L.state ?? "", district: L.district ?? "" });
      if (id === "bill") setBill(3000);
      if (id === "roof") setRoof(400);
      if (id === "name" || id === "email" || id === "mobile") setDraft(how === "edit" ? (L[id] ?? "") : "");
      if (id === "calc") setMood("thinking");
      if (id === "booked") {
        setBurst((b) => b + 1);
        sfx.success();
        setMood("happy");
        setTimeout(() => setMood("idle"), 2500);
      }
      const { text, spoken } = lineFor(id, how, L, react);
      lastLine.current = say(text, spoken);
      prefetchAfter(id);
      if (id === "results") alertOwner("plan");
      if (id === "booked") alertOwner("booked");
      if (["name", "mobile", "email", "pin", "area", "billExact", "otp", "emailOtp"].includes(id) && started.current)
        requestAnimationFrame(() => inputRef.current?.focus());
    },
    // alertOwner only reads refs and `lang`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lineFor, say, setMood, prefetchAfter],
  );

  // First question when the journey opens.
  useEffect(() => {
    const id = setTimeout(() => {
      started.current = true;
      const { text } = lineFor("name", "fwd");
      void say(text);
    }, 420);
    return () => clearTimeout(id);
    // Runs once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Designing your plan" plays while Saathi finishes his line, then the
  // results open.
  useEffect(() => {
    if (node !== "calc") return;
    let live = true;
    const lineDone = lastLine.current.then(() => wait(600)); // a breath before the reveal
    void Promise.all([wait(3200), Promise.race([lineDone, wait(15000)])]).then(() => {
      if (!live || nodeRef.current !== "calc") return;
      setMood("idle");
      setBurst((b) => b + 1);
      sfx.success();
      goTo("results");
    });
    return () => {
      live = false;
    };
  }, [node, goTo, setMood]);

  // While the user types their name or email, get Saathi's reply (which
  // repeats it) ready, so it plays the moment they tap Next.
  useEffect(() => {
    if (node !== "name" && node !== "email" && node !== "mobile") return;
    const id = setTimeout(() => {
      const patch: Partial<Lead> =
        node === "name" ? { name: tidyName(draft) } : node === "mobile" ? { mobile: cleanMobile(draft) } : { email: draft.trim().toLowerCase() };
      const ok =
        node === "name" ? isName(patch.name!) : node === "mobile" ? isMobile(patch.mobile!) && !isFakeMobile(patch.mobile!) : isEmail(patch.email!) && !emailTypo(patch.email!);
      if (!ok) return;
      const v = { ...leadRef.current, ...patch };
      const { text, spoken } = lineFor(nextNode(node, v, editing.current), "fwd", v);
      voice.prefetch(spoken ?? text, lang);
    }, 400);
    return () => clearTimeout(id);
  }, [node, draft, lineFor, lang]);

  // OTP resend countdown.
  useEffect(() => {
    if (node !== "otp" && node !== "emailOtp") return;
    const id = setInterval(() => setClock(Date.now()), 500);
    return () => clearInterval(id);
  }, [node]);

  useEffect(() => {
    if (shake && scope.current) void animate(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 });
  }, [shake, animate, scope]);

  useEffect(() => {
    if (!mic.listening && mood === "listening") setMood("idle");
  }, [mic.listening, mood, setMood]);

  const fail = (msg: string, spoken?: string) => {
    sfx.error();
    setError(true);
    setShake((k) => k + 1);
    void say(msg, spoken);
  };

  const advance = (patch: Partial<Lead>) => {
    update(patch);
    sfx.pop();
    flashHappy();
    const cur = nodeRef.current;
    const nxt = nextNode(cur, leadRef.current, editing.current);
    if (nxt === "review") editing.current = false;
    goTo(nxt, "fwd", reactionFor(cur, leadRef.current, f.react));
  };

  // "Skip" on the email or email-code step: no email, straight to the review.
  // The lead still reaches the owner (the checked mobile is its proof).
  const skipEmail = () => {
    if (busy) return;
    mic.stop();
    sfx.tap();
    setDevCode(null);
    editing.current = false;
    update({ email: "", emailVerified: false, emailProof: undefined });
    goTo("review", "fwd", f.react.emailSkipped);
  };

  // ── step handlers ──
  // `typed` replaces the field's text, e.g. when a suggestion chip is tapped.
  const submitText = async (typed?: string) => {
    const id = nodeRef.current;
    const raw = typed ?? draft;
    if (!raw.trim() && id !== "billExact") return;
    mic.stop();
    if (id === "name") {
      const v = tidyName(raw);
      const problem = nameProblem(v);
      if (!problem) return advance({ name: v });
      return fail(problem === "long" ? t.errNameLong : problem === "junk" ? t.errNameJunk : t.errName);
    }
    if (id === "mobile") {
      const d = cleanMobile(raw);
      if (d.length !== 10) return d.length ? fail(fill(t.errMobileShort, { n: d.length })) : fail(t.ask.mobile);
      if (!/^[6-9]/.test(d)) return fail(t.errMobileStart);
      if (isFakeMobile(d)) return fail(t.errMobileFake);
      // Same number again soon after ("Change number" by mistake): the code
      // already sent is still valid, so don't send another.
      const last = codeSent.current.tel;
      if (SMS_OTP && last && last.to === d && !last.used && stillValid(last.at)) return advance({ mobile: d, otpVerified: false, mobileProof: undefined });
      // The server checks the number is a real mobile, then sends the SMS.
      if (busy) return;
      setMood("thinking");
      const res = await sendCode("tel", d);
      setMood("idle");
      if (nodeRef.current !== "mobile") return;
      if (!res.ok) return fail(sendError("tel", res), sendError("tel", res, true));
      return advance({ mobile: d, otpVerified: false, mobileProof: undefined, mobileCheck: res.proof });
    }
    if (id === "email") {
      const v = raw.trim().toLowerCase();
      if (!isEmail(v)) return fail(t.errEmail, t.errEmail.replace("name@gmail.com", spokenEmail("name@gmail.com", lang)));
      // "rahul@gmial.com": ask once whether they meant gmail.com.
      const fix = emailTypo(v);
      if (fix && typoAsked.current !== v) {
        typoAsked.current = v;
        setEmailFix(fix);
        sfx.tap();
        const next = lineFor("emailOtp", "fwd", { ...leadRef.current, email: fix });
        voice.prefetch(next.spoken ?? next.text, lang); // ready if they tap the suggestion
        void say(fill(t.emailTypo, { email: fix }), fill(t.emailTypo, { email: spokenEmail(fix, lang) }));
        return;
      }
      // Same address again soon after (e.g. "Change email" by mistake): the
      // code already sent is still valid, so don't send another.
      const last = codeSent.current.mail;
      if (last && last.to === v && !last.used && stillValid(last.at)) {
        return advance({ email: v, emailVerified: false, emailProof: undefined });
      }
      // The server checks the address can receive mail, then emails a code.
      if (busy) return;
      setMood("thinking");
      const res = await sendCode("mail", v);
      setMood("idle");
      if (nodeRef.current !== "email") return;
      if (!res.ok) return fail(sendError("mail", res), sendError("mail", res, true));
      return advance({ email: v, emailVerified: false, emailProof: undefined });
    }
    if (id === "area") {
      const v = raw.trim().replace(/\s+/g, " ").replace(/[.,।!?]+$/u, "");
      return isArea(v) ? advance({ area: v }) : fail(f.area.err);
    }
    if (id === "billExact") {
      const n = Number(raw.replace(/\D/g, ""));
      return isExactBill(n) ? advance({ bill: n }) : fail(f.bill.exactErr);
    }
    if (id === "pin") {
      if (busy) return;
      const pin = raw.replace(/\D/g, "");
      if (!isPin(pin)) return fail(f.pin.invalid);
      setBusy(true);
      setMood("thinking");
      const res = await fetch(`/api/pincode?pin=${pin}`)
        .then((r) => r.json())
        .catch(() => ({ ok: false }));
      setMood("idle");
      if (nodeRef.current !== "pin") return;
      let state = res.ok ? matchState(res.state) : undefined;
      if (!state && /^7[5-7]/.test(pin)) state = HOME_STATE; // Odisha PIN range
      const district = state && res.ok ? matchDistrict(state, res.district) : undefined;
      geoFound.current = !!(res.ok && state && district);
      setAreas(res.ok ? res.areas : []);
      update({ pin, state, district });
      sfx.pop();
      goTo("region");
    }
  };

  type SendRes = { ok: boolean; ticket?: string; resendAfter?: number; devCode?: string; error?: string; retryAfter?: number; proof?: string };

  // Asks the server to text or email a code; keeps the signed ticket.
  const sendCode = async (kind: CodeKind, to: string): Promise<SendRes> => {
    setBusy(true);
    const res: SendRes = await fetch(kind === "tel" ? "/api/otp/send" : "/api/email-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "tel" ? { mobile: to } : { email: to, lang, name: leadRef.current.name }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "offline" }));
    setBusy(false);
    if (res.ok && res.ticket) {
      codeTicket.current[kind] = res.ticket;
      codeSent.current[kind] = { to, at: Date.now(), used: false };
      setDevCode(res.devCode ?? null);
      setResendAt(Date.now() + (res.resendAfter ?? 30) * 1000);
    } else if (res.error === "wait" && res.retryAfter) setResendAt(Date.now() + res.retryAfter * 1000);
    return res;
  };

  // What Saathi says when the number/email can't be used or no code went out.
  const sendError = (kind: CodeKind, res: SendRes, spoken = false) => {
    if (res.error === "offline") return f.netErr;
    if (kind === "tel") {
      const m = f.mobErr;
      switch (res.error) {
        case "fake": return t.errMobileFake;
        case "invalid": return m.invalid;
        case "wait": return fill(m.wait, { s: res.retryAfter ?? 30 });
        case "limit": return m.limit;
        default: return m.unavailable;
      }
    }
    const e = f.emailErr;
    switch (res.error) {
      case "invalid": return spoken ? t.errEmail.replace("name@gmail.com", spokenEmail("name@gmail.com", lang)) : t.errEmail;
      case "no_domain": return e.noDomain;
      case "disposable": return e.disposable;
      case "rejected": return e.rejected;
      case "wait": return fill(e.wait, { s: res.retryAfter ?? 30 });
      case "limit": return e.limit;
      default: return e.unavailable;
    }
  };

  const verifyCode = async (kind: CodeKind, code: string) => {
    if (verifying.current) return;
    verifying.current = true;
    setBusy(true);
    const to = kind === "tel" ? leadRef.current.mobile : leadRef.current.email;
    const res: { ok?: boolean; proof?: string; error?: string } = await fetch(kind === "tel" ? "/api/otp/verify" : "/api/email-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [kind === "tel" ? "mobile" : "email"]: to, code, ticket: codeTicket.current[kind] }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "offline" }));
    verifying.current = false;
    if (nodeRef.current !== CODE_NODE[kind]) return;
    setBusy(false);
    if (res.ok) {
      sfx.success();
      setDevCode(null);
      const sent = codeSent.current[kind];
      if (sent) sent.used = true;
      return advance(kind === "tel" ? { otpVerified: true, mobileProof: res.proof } : { emailVerified: true, emailProof: res.proof });
    }
    setOtp("");
    const c = kind === "tel" ? f.otp : f.emailOtp;
    if (res.error === "offline") return fail(f.netErr);
    if (res.error === "wrong") return fail(c.wrong);
    if (res.error === "unavailable" || res.error === "limit") return fail(sendError(kind, { ok: false, error: res.error }));
    // Expired, too many tries or an old ticket: send a fresh code right away.
    const again = await sendCode(kind, to);
    if (nodeRef.current !== CODE_NODE[kind]) return;
    if (!again.ok) return fail(sendError(kind, again), sendError(kind, again, true));
    if (res.error === "expired") void say(c.expired);
    else fail(c.tooMany);
  };

  const resendCode = async (kind: CodeKind) => {
    setOtp("");
    setError(false);
    const res = await sendCode(kind, kind === "tel" ? leadRef.current.mobile : leadRef.current.email);
    if (nodeRef.current !== CODE_NODE[kind]) return;
    if (res.ok) {
      sfx.pop();
      void say(kind === "tel" ? f.otp.resent : f.emailOtp.resent);
    } else fail(sendError(kind, res), sendError(kind, res, true));
  };

  const pick = (field: keyof Lead, id: string) => {
    if (picked) return;
    setPicked(id);
    sfx.select();
    setTimeout(() => advance({ [field]: id } as Partial<Lead>), 420);
  };

  const back = () => {
    voice.stop();
    mic.stop();
    sfx.tap();
    // Inside the FAQ, Back steps through the FAQ screens first.
    const faqPrev = nodeRef.current === "faq" ? faqStack.current.pop() : undefined;
    if (faqPrev) return showFaq(faqPrev, false);
    let prev = history.current.pop();
    // A code can't be entered twice: going back skips to the number/email.
    const skipped = prev === "otp" || prev === "emailOtp" ? prev : null;
    if (skipped) prev = history.current.pop();
    if (!prev) return onExit();
    const cleared: Partial<Lead> = {};
    for (const k of [...(CLEARS[nodeRef.current] ?? []), ...(skipped ? (CLEARS[skipped] ?? []) : []), ...(CLEARS[prev] ?? [])])
      (cleared as Record<string, undefined>)[k] = undefined;
    if (prev === "name" || prev === "mobile" || prev === "email") (cleared as Record<string, string>)[prev] = "";
    if (prev === "pin") geoFound.current = false;
    editing.current = false;
    update(cleared);
    goTo(prev, "back");
  };

  const editField = (id: "name" | "mobile" | "email") => {
    sfx.tap();
    editing.current = true;
    goTo(id, "edit");
  };

  // ── FAQ assistant ──
  const showFaq = (v: FaqView, push = true) => {
    if (push) faqStack.current.push(faqViewRef.current);
    faqViewRef.current = v;
    setFaqView(v);
    setFaqSeq((n) => n + 1);
    setDraft("");
    mic.stop();
    void say(faqLine(v, lang));
    setTimeout(scrollStageTop, 180); // after the old card has faded out
  };

  const openFaq = () => {
    sfx.tap();
    faqStack.current = [];
    faqViewRef.current = { kind: "home" };
    setFaqView({ kind: "home" });
    goTo("faq");
  };

  // Kept on the lead so the sales team sees what the customer wanted to know.
  const noteQuestion = (q: string) => {
    const asked = leadRef.current.faq ?? [];
    if (asked[asked.length - 1] !== q) update({ faq: [...asked, q].slice(-20) });
  };

  const askFaq = (text: string) => {
    const q = text.trim().replace(/\s+/g, " ");
    if (!q) return;
    noteQuestion(q);
    const m = matchFaq(q);
    if (m.kind === "answer") {
      sfx.pop();
      return showFaq({ kind: "answer", id: m.id });
    }
    sfx.tap();
    showFaq(m.kind === "suggest" ? { kind: "suggest", ids: m.ids, asked: q } : { kind: "none", asked: q });
  };

  // From the FAQ (opened on the plan, before booking): straight to booking.
  const bookFromFaq = () => {
    sfx.select();
    flashHappy();
    update({ consult: "yes" });
    goTo("mode");
  };

  const pickQuestion = (id: string) => {
    sfx.select();
    noteQuestion(FAQ.en.items[id].q);
    showFaq({ kind: "answer", id });
  };

  const onMic = (onText: (s: string) => void) => {
    if (mic.listening) return mic.stop();
    sfx.tap();
    setMood("listening");
    mic.start((text, final) => {
      if (final) {
        setMood("idle");
        onText(text);
      } else if (["name", "mobile", "email", "pin", "area", "billExact", "faq"].includes(nodeRef.current)) {
        setDraft(nodeRef.current === "mobile" ? cleanMobile(text) : text);
      }
    });
  };

  // ── derived ──
  const estimate = useMemo(
    () => (node === "results" ? computeEstimate(lead.bill ?? 3000, lead.roof ?? null, categoryOf(lead), lead.state === HOME_STATE) : null),
    [node, lead],
  );

  const atDate = node === "date";
  const days: DayOpt[] = useMemo(() => {
    const out: DayOpt[] = [];
    const d = new Date();
    if (d.getHours() >= 15) d.setDate(d.getDate() + 1);
    const today = new Date();
    while (out.length < 7) {
      if (d.getDay() !== 0) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const diff = Math.round((new Date(d.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / 864e5);
        out.push({
          iso,
          top: diff === 0 ? f.date.today : diff === 1 ? f.date.tomorrow : d.toLocaleDateString(loc, { weekday: "short" }),
          day: String(d.getDate()),
          month: d.toLocaleDateString(loc, { month: "short" }),
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
    // Recomputed when the booking step opens (so "today" is current).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atDate, f, loc]);

  const opts = (group: { opts: Record<string, string> }): Option[] =>
    Object.entries(group.opts).map(([id, label]) => ({ id, label, icon: CHOICE_ICONS[id] }));

  const choiceFor: Partial<Record<NodeId, { field: keyof Lead; options: Option[]; en: Record<string, string>; cols?: 1 | 2 }>> = {
    own: { field: "own", options: opts(f.own), en: FLOW.en.own.opts },
    ownerOk: { field: "ownerOk", options: opts(f.ownerOk), en: FLOW.en.ownerOk.opts, cols: 1 },
    ptype: { field: "ptype", options: opts(f.ptype), en: FLOW.en.ptype.opts },
    roofType: { field: "roofType", options: opts(f.roofType), en: FLOW.en.roofType.opts, cols: 1 },
    goal: { field: "goal", options: opts(f.goal), en: FLOW.en.goal.opts, cols: 1 },
    cuts: { field: "cuts", options: opts(f.cuts), en: FLOW.en.cuts.opts },
    when: { field: "when", options: opts(f.when), en: FLOW.en.when.opts },
    pay: { field: "pay", options: opts(f.pay), en: FLOW.en.pay.opts },
    mode: { field: "mode", options: opts(f.mode), en: FLOW.en.mode.opts, cols: 1 },
  };
  const choice = choiceFor[node];

  const slotOptions: Option[] = useMemo(() => {
    const todayIso = days[0]?.top === f.date.today ? days[0].iso : null;
    const hourNow = new Date().getHours();
    return (Object.keys(SLOT_HOUR) as (keyof typeof SLOT_HOUR)[])
      .filter((s) => !(lead.date && lead.date === todayIso && SLOT_HOUR[s] <= hourNow + 1))
      .map((s) => ({ id: s, label: f.slot.opts[s], icon: "🕒" }));
  }, [lead.date, days, f]);

  // Everything the customer answered, ready in the WhatsApp chat they open.
  const summary = useMemo(() => whatsAppText(lead, lang), [lead, lang]);

  const step = STEP[node];
  const label = step ? `${step[0]} / ${step[1]}` : undefined;
  const section = SECTION[node];
  const progress = step ? (step[0] - 1) / step[1] + (picked ? 1 / step[1] : 0) : node === "results" || node === "calc" ? 0.5 : 1;
  const tall = ["results", "booked", "faq", "review", "date", "region"].includes(node);
  const resendLeft = Math.max(0, Math.ceil((resendAt - clock) / 1000));
  const iconCls = "h-5 w-5";

  // ── render ──
  const card = (() => {
    if (choice) {
      return (
        <AnswerCard label={label}>
          <ChoiceGrid options={choice.options} picked={picked} cols={choice.cols} onPick={(id) => pick(choice.field, id)} />
          {mic.supported && (
            <MicLink
              listening={mic.listening}
              label={t.speak}
              onClick={() =>
                onMic((said) => {
                  const id = matchOption(said, choice.options, choice.en);
                  if (id) pick(choice.field, id);
                })
              }
            />
          )}
        </AnswerCard>
      );
    }
    switch (node) {
      case "name":
      case "mobile":
      case "email":
      case "area":
      case "pin":
      case "billExact": {
        const conf = {
          name: { icon: <IconUser className={iconCls} />, ph: t.placeholders.name, props: { autoComplete: "name", autoCapitalize: "words", maxLength: NAME_MAX + 1 } }, // +1: an over-long name is flagged, never silently cut
          mobile: { icon: <IconPhone className={iconCls} />, ph: t.placeholders.mobile, props: { type: "tel", inputMode: "numeric" as const, autoComplete: "tel-national", lang: "en" } },
          email: { icon: <IconMail className={iconCls} />, ph: t.placeholders.email, props: { type: "email", inputMode: "email" as const, autoComplete: "email", autoCapitalize: "none", spellCheck: false, lang: "en", maxLength: 80 } },
          area: { icon: <IconPin className={iconCls} />, ph: f.area.placeholder, props: { autoComplete: "address-level3", maxLength: 80 } },
          pin: { icon: <IconPin className={iconCls} />, ph: f.pin.placeholder, props: { inputMode: "numeric" as const, autoComplete: "postal-code", maxLength: 6, lang: "en" } },
          billExact: { icon: <IconRupee className={iconCls} />, ph: f.bill.exactPlaceholder, props: { inputMode: "numeric" as const, lang: "en", maxLength: 9 } },
        }[node];
        const clean = (v: string) => (node === "mobile" ? cleanMobile(v) : node === "pin" ? v.replace(/\D/g, "").slice(0, 6) : node === "billExact" ? v.replace(/\D/g, "").slice(0, 7) : v);
        const domains = ["gmail.com", "yahoo.com", "outlook.com", "rediffmail.com"];
        const local = draft.split("@")[0];
        const suggest = node === "email" && local && !/\.[a-z]{2,}$/i.test(draft) ? domains.map((d) => `${local}@${d}`).filter((s) => s.startsWith(draft.toLowerCase())) : [];
        return (
          <AnswerCard label={label}>
            <form
              ref={scope}
              onSubmit={(e) => {
                e.preventDefault();
                void submitText();
              }}
            >
              {node === "area" && areas.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-2" lang="en">
                  {areas.map((a) => (
                    <Chip key={a} on={draft === a} onClick={() => setDraft(a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              )}
              <FieldInput
                key={node}
                inputRef={inputRef}
                icon={conf.icon}
                prefix={node === "mobile" ? "+91" : node === "billExact" ? "₹" : undefined}
                value={node === "billExact" && draft ? Number(draft).toLocaleString("en-IN") : draft}
                error={error}
                onChange={(e) => {
                  setError(false);
                  setEmailFix(null);
                  setDraft(clean(e.target.value));
                }}
                placeholder={mic.listening ? t.listening : conf.ph}
                aria-label={conf.ph}
                enterKeyHint="next"
                listening={mic.listening}
                micLabel={t.speak}
                onMic={
                  mic.supported && (node === "name" || node === "mobile" || node === "area")
                    ? () => onMic((said) => setDraft(node === "mobile" ? cleanMobile(said) : said.replace(/[.,।!?]+$/u, "")))
                    : undefined
                }
                {...conf.props}
              />
              {node === "email" && emailFix && (
                <div className="pt-2.5" lang="en">
                  <Chip
                    on
                    onClick={() => {
                      // Same path as typing it: check the address, then email the code.
                      const fix = emailFix;
                      setEmailFix(null);
                      setDraft(fix);
                      void submitText(fix);
                    }}
                  >
                    ✓ {emailFix}
                  </Chip>
                </div>
              )}
              {!emailFix && suggest.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2.5" lang="en">
                  {suggest.map((s) => (
                    <Chip key={s} onClick={() => setDraft(s)}>
                      @{s.split("@")[1]}
                    </Chip>
                  ))}
                </div>
              )}
              <Busy show={busy}>{node === "email" ? f.emailOtp.sending : node === "mobile" ? (SMS_OTP ? f.otp.sending : f.otp.checking) : f.pin.looking}</Busy>
              <div className="mt-3">
                <PrimaryButton type="submit" disabled={!draft.trim() || busy}>
                  <NextLabel label={f.next} />
                </PrimaryButton>
              </div>
              {node === "email" && (
                <button type="button" onClick={skipEmail} disabled={busy} className="mx-auto mt-2 block px-3 py-1.5 text-[13.5px] font-semibold text-white/60 hover:text-white disabled:opacity-40">
                  {t.skip}
                </button>
              )}
            </form>
          </AnswerCard>
        );
      }
      case "otp":
        return (
          <AnswerCard label={label}>
            <p className="mb-2.5 flex items-center justify-center gap-1.5 text-[15px] font-semibold text-white/90" lang="en">
              <IconPhone className="h-4 w-4 shrink-0 text-brand" />
              {displayMobile(lead.mobile)}
            </p>
            <div ref={scope}>
              <OtpBoxes
                inputRef={inputRef}
                value={otp}
                error={error}
                label={f.otp.label}
                onChange={(v) => {
                  if (busy) return; // a code is being checked
                  setError(false);
                  setOtp(v);
                  if (v.length === 6) void verifyCode("tel", v);
                }}
              />
            </div>
            {devCode ? (
              <p className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-gold/10 py-2 text-[12.5px] font-semibold text-gold">
                <IconKey className="h-4 w-4" />
                {fill(f.otp.dev, { code: devCode })}
              </p>
            ) : (
              <p className="mt-2.5 text-center text-[12.5px] text-ink-3">{f.otp.hint}</p>
            )}
            <Busy show={busy}>{otp.length === 6 ? `${f.otp.verify}…` : f.otp.sending}</Busy>
            <div className="mt-3 flex items-center justify-between text-[13px] font-semibold">
              <button onClick={back} className="flex items-center gap-1 text-white/70 hover:text-white">
                <IconEdit className="h-3.5 w-3.5" />
                {f.otp.change}
              </button>
              <button disabled={resendLeft > 0 || busy} onClick={() => void resendCode("tel")} className="text-brand disabled:text-ink-3">
                {resendLeft > 0 ? fill(f.otp.resendIn, { s: resendLeft }) : f.otp.resend}
              </button>
            </div>
          </AnswerCard>
        );
      case "emailOtp":
        return (
          <AnswerCard label={label}>
            <p className="mb-2.5 flex items-center justify-center gap-1.5 text-center text-[14px] font-semibold break-words text-white/90" lang="en">
              <IconMail className="h-4 w-4 shrink-0 text-brand" />
              <span className="min-w-0">
                <EmailText email={lead.email} />
              </span>
            </p>
            <div ref={scope}>
              <OtpBoxes
                inputRef={inputRef}
                value={otp}
                error={error}
                label={f.emailOtp.label}
                onChange={(v) => {
                  if (busy) return; // a code is being checked or sent
                  setError(false);
                  setOtp(v);
                  if (v.length === 6) void verifyCode("mail", v);
                }}
              />
            </div>
            {devCode ? (
              <p className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-gold/10 py-2 text-[12.5px] font-semibold text-gold">
                <IconKey className="h-4 w-4" />
                {fill(f.emailOtp.dev, { code: devCode })}
              </p>
            ) : (
              <p className="mt-2.5 text-center text-[12.5px] text-ink-3">{f.emailOtp.spam}</p>
            )}
            <Busy show={busy}>{otp.length === 6 ? `${f.otp.verify}…` : f.emailOtp.sending}</Busy>
            <div className="mt-3 flex items-center justify-between text-[13px] font-semibold">
              <button onClick={back} className="flex items-center gap-1 text-white/70 hover:text-white">
                <IconEdit className="h-3.5 w-3.5" />
                {f.emailOtp.change}
              </button>
              <button disabled={resendLeft > 0 || busy} onClick={() => void resendCode("mail")} className="text-brand disabled:text-ink-3">
                {resendLeft > 0 ? fill(f.otp.resendIn, { s: resendLeft }) : f.otp.resend}
              </button>
            </div>
            {/* The code didn't come? They can go on without an email. */}
            <button onClick={skipEmail} disabled={busy} className="mx-auto mt-2 block px-3 py-1.5 text-[13px] font-semibold text-white/55 hover:text-white disabled:opacity-40">
              {t.skipEmail}
            </button>
          </AnswerCard>
        );
      case "review":
        return (
          <AnswerCard label={t.confirmTitle}>
            <ul className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
              {(["name", "mobile", "email"] as const).map((k) => (
                <li key={k} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/14 text-brand">
                    {k === "name" ? <IconUser className={iconCls} /> : k === "mobile" ? <IconPhone className={iconCls} /> : <IconMail className={iconCls} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {/* The badge sits by the label, so the value keeps the full width on a phone. */}
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3">
                      {t.labels[k]}
                      {((k === "mobile" && lead.otpVerified) || (k === "email" && lead.emailVerified)) && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand/15 px-1.5 py-px text-[10.5px] whitespace-nowrap text-mint">
                          <IconCheck className="h-3 w-3" />
                          {f.otp.verified}
                        </span>
                      )}
                    </span>
                    {k === "email" && !lead.email ? (
                      // Skipped: say so plainly; the button beside it adds one.
                      <span className="mt-0.5 block text-[15px] font-medium text-ink-3">{t.notGiven}</span>
                    ) : (
                      <span className={`mt-0.5 block leading-snug font-semibold break-words text-white ${k === "email" ? "text-[14.5px]" : "text-[15.5px]"}`} lang={k === "name" ? undefined : "en"}>
                        {k === "mobile" ? displayMobile(lead.mobile) : k === "email" ? <EmailText email={lead.email} /> : lead.name}
                      </span>
                    )}
                  </span>
                  {k === "email" && !lead.email ? (
                    <button
                      onClick={() => editField(k)}
                      className="flex shrink-0 items-center gap-1 rounded-full border border-brand/40 px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap text-brand hover:bg-brand/10"
                    >
                      + {t.add}
                    </button>
                  ) : (
                    // Icon only on narrow phones, so the value gets the width.
                    <button
                      onClick={() => editField(k)}
                      aria-label={`${t.edit} ${t.labels[k]}`}
                      className="flex shrink-0 items-center gap-1 rounded-full p-2 text-[12.5px] font-semibold whitespace-nowrap text-brand hover:bg-brand/10 min-[400px]:px-2.5 min-[400px]:py-1.5"
                    >
                      <IconEdit className="h-4 w-4 min-[400px]:h-3.5 min-[400px]:w-3.5" />
                      <span className="hidden min-[400px]:inline">{t.edit}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <PrimaryButton
                onClick={() => {
                  sfx.success();
                  setBurst((b) => b + 1);
                  advance({});
                }}
              >
                <IconCheck className="h-5 w-5" />
                {t.yes}
              </PrimaryButton>
            </div>
          </AnswerCard>
        );
      case "region":
        return (
          <AnswerCard label={label}>
            <RegionSelect
              state={region.state}
              district={region.district}
              error={error}
              labels={f.region}
              onState={(s) => {
                setError(false);
                setRegion({ state: s, district: "" });
              }}
              onDistrict={(d) => {
                setError(false);
                setRegion((r) => ({ ...r, district: d }));
              }}
            />
            <div className="mt-3">
              <PrimaryButton
                disabled={!region.state || !region.district}
                onClick={() => (region.state && region.district ? advance({ state: region.state, district: region.district }) : fail(f.region.err))}
              >
                <NextLabel label={f.region.confirm} />
              </PrimaryButton>
            </div>
          </AnswerCard>
        );
      case "bill":
        return (
          <AnswerCard label={label}>
            <div className="flex items-end justify-between">
              <p className="text-[13px] font-semibold text-ink-2">{f.bill.label}</p>
              <p className="font-display text-[30px] leading-none font-bold text-gold" lang="en">
                {rupees(bill)}
                <span className="ml-1 text-[13px] font-medium text-ink-3">{f.bill.perMonth}</span>
              </p>
            </div>
            <RangeSlider value={bill} min={500} max={10000} step={100} onChange={setBill} ariaLabel={f.bill.label} ticks={["₹500", "₹2.5k", "₹5k", "₹7.5k", "₹10k"]} />
            <div className="mt-2 flex">
              <Chip onClick={() => goTo("billExact")}>{f.bill.above}</Chip>
            </div>
            <div className="mt-3">
              <PrimaryButton onClick={() => advance({ bill })}>
                <NextLabel label={f.next} />
              </PrimaryButton>
            </div>
          </AnswerCard>
        );
      case "roof":
        return (
          <AnswerCard label={label}>
            <div className="flex items-end justify-between">
              <p className="text-[13px] font-semibold text-ink-2">{f.roof.label}</p>
              <p className="font-display text-[30px] leading-none font-bold text-gold" lang="en">
                {roof.toLocaleString("en-IN")}
                <span className="ml-1 text-[13px] font-medium text-ink-3">{f.roof.sqft}</span>
              </p>
            </div>
            <RangeSlider value={roof} min={100} max={3000} step={50} onChange={setRoof} ariaLabel={f.roof.label} ticks={["100", "750", "1.5k", "2.25k", "3k"]} />
            <div className="mt-2 flex">
              <Chip onClick={() => advance({ roof: null })}>{f.roof.unsure}</Chip>
            </div>
            <div className="mt-3">
              <PrimaryButton onClick={() => advance({ roof })}>
                <NextLabel label={f.next} />
              </PrimaryButton>
            </div>
          </AnswerCard>
        );
      case "calc":
        return (
          <AnswerCard>
            <CalcProgress lang={lang} district={lead.district ?? ""} />
          </AnswerCard>
        );
      case "results":
        return estimate ? (
          <AnswerCard>
            <ResultsCard lang={lang} est={estimate} lead={lead} onBook={() => advance({ consult: "yes" })} onFaq={openFaq} summary={summary} />
          </AnswerCard>
        ) : null;
      case "date":
        return (
          <AnswerCard label={label}>
            <DateChips days={days} value={picked} onPick={(iso) => pick("date", iso)} />
          </AnswerCard>
        );
      case "slot":
        return (
          <AnswerCard label={label}>
            <ChoiceGrid
              options={slotOptions}
              picked={picked}
              onPick={(id) => {
                if (picked) return;
                setPicked(id);
                sfx.select();
                const bookingId = `CM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                setTimeout(() => advance({ slot: id as Lead["slot"], bookingId }), 420);
              }}
            />
          </AnswerCard>
        );
      case "booked":
        return (
          <AnswerCard>
            <BookedCard
              lang={lang}
              lead={lead}
              modeLabel={lead.mode ? f.mode.opts[lead.mode] : ""}
              dateLabel={lead.date ? new Date(`${lead.date}T00:00`).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" }) : ""}
              slotLabel={lead.slot ? f.slot.opts[lead.slot] : ""}
              onFaq={openFaq}
              summary={summary}
            />
          </AnswerCard>
        );
      case "faq":
        return (
          <AnswerCard>
            <FaqCard
              lang={lang}
              view={faqView}
              draft={draft}
              onDraft={setDraft}
              onAsk={askFaq}
              onTopic={(topic) => {
                sfx.select();
                showFaq({ kind: "topic", topic });
              }}
              onQuestion={pickQuestion}
              onHome={() => {
                sfx.tap();
                showFaq({ kind: "home" });
              }}
              onExpert={() => setExpert(true)}
              onBook={lead.bookingId ? undefined : bookFromFaq}
              bookLabel={f.result.cta}
              inputRef={inputRef}
              mic={{
                supported: mic.supported,
                listening: mic.listening,
                label: t.speak,
                listeningLabel: t.listening,
                onClick: () => onMic(askFaq),
              }}
            />
          </AnswerCard>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="relative flex h-full flex-col">
      <TopBar
        lang={lang}
        sections={f.sections}
        section={section}
        progress={progress}
        title={node === "faq" ? FAQ[lang].ui.title : undefined}
        muted={muted}
        expertLabel={f.expert.button}
        onBack={back}
        onMute={onMute}
        onExpert={() => setExpert(true)}
      />
      <div className="relative min-h-0 flex-1">
        <StageLayout
          mood={mood}
          burst={burst}
          tall={tall}
          caption={<Caption text={line.text} shown={line.shown} preparing={preparing} speaking={speaking} note={voiceNote} lang={lang} />}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={node === "faq" ? `faq-${faqSeq}` : node}
              data-node={node}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              {card}
            </motion.div>
          </AnimatePresence>
        </StageLayout>
      </div>
      <ExpertSheet open={expert} onClose={() => setExpert(false)} lang={lang} lead={lead} summary={summary} />
    </div>
  );
}

// An email that wraps on a narrow screen only after a dot in the name part or
// before "@" ("rahul.mohanty." / "bhubaneswar" / "@gmail.com"), never in the
// middle of a word or inside the domain.
function EmailText({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  const parts = at < 0 ? [email] : [...email.slice(0, at).split(/(?<=\.)/), email.slice(at)];
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <wbr />}
          {p}
        </span>
      ))}
    </>
  );
}

function MicLink({ listening, label, onClick }: { listening: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-auto mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
        listening ? "bg-danger text-night" : "text-white/60 hover:text-brand"
      }`}
    >
      <IconMic className="h-4 w-4" />
      {label}
    </button>
  );
}

// Three checks ticking while Saathi "designs" the plan.
function CalcProgress({ lang, district }: { lang: Lang; district: string }) {
  const c = FLOW[lang].calc;
  const r = FLOW[lang].result;
  const rows = [r.kw, r.subsidy, r.monthly];
  return (
    <div lang={lang}>
      <div className="flex items-center gap-3">
        <span className="relative grid h-12 w-12 place-items-center">
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-gold/25 border-t-gold" />
          <span className="text-[22px]">☀</span>
        </span>
        <div className="min-w-0">
          <p className="font-display text-[17px] font-bold">{c.title}</p>
          <p className="text-[12.5px] text-ink-3">{fill(c.sub, { district })}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((label, i) => (
          <motion.li
            key={label}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.8 }}
            className="flex items-center gap-2.5 text-[14px] text-white/85"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.8, type: "spring", stiffness: 400, damping: 18 }}
              className="grid h-5 w-5 place-items-center rounded-full bg-brand text-night"
            >
              <IconCheck className="h-3 w-3" />
            </motion.span>
            {label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
