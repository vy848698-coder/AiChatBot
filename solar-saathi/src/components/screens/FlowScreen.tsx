"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { computeEstimate, rupees, type Category } from "@/lib/estimate";
import { FLOW } from "@/lib/flowCopy";
import { STRINGS, fill, type Lang } from "@/lib/i18n";
import { EMPTY_LEAD, saveLead, type Lead } from "@/lib/lead";
import { HOME_STATE, matchDistrict, matchState } from "@/lib/regions";
import { sfx } from "@/lib/sfx";
import { displayMobile, spokenEmail, spokenMobile, spokenRupees } from "@/lib/speech";
import { useSpeechInput } from "@/lib/useSpeechInput";
import { cleanMobile, firstName, isEmail, isName } from "@/lib/validate";
import { voice } from "@/lib/voice";
import { BookedCard, ExpertSheet, ResultsCard, SavedCard } from "../flow/Cards";
import { Busy, Chip, ChoiceGrid, DateChips, FieldInput, NextLabel, OtpBoxes, PrimaryButton, RangeSlider, RegionSelect, type DayOpt, type Option } from "../flow/Widgets";
import type { MascotMood } from "../mascot/Mascot";
import { AnswerCard, Caption, StageLayout } from "../StageLayout";
import { IconCheck, IconEdit, IconKey, IconMail, IconMic, IconPhone, IconPin, IconRupee, IconUser } from "../ui/icons";
import { TopBar } from "../ui/TopBar";

export type Speak = (text: string, opts?: { spoken?: string; onProgress?: (n: number) => void }) => Promise<void>;

// ── the journey ──────────────────────────────────────────────────────────
type NodeId =
  | "name" | "mobile" | "otp" | "email" | "review"
  | "pin" | "region" | "area"
  | "own" | "ownerOk" | "ptype" | "roofType" | "bill" | "billExact" | "roof" | "goal" | "cuts" | "when" | "pay"
  | "calc" | "results"
  | "consult" | "mode" | "date" | "slot" | "booked" | "skip";

const SECTION: Record<NodeId, number> = {
  name: 0, mobile: 0, otp: 0, email: 0, review: 0,
  pin: 1, region: 1, area: 1,
  own: 2, ownerOk: 2, ptype: 2, roofType: 2, bill: 2, billExact: 2, roof: 2, goal: 2, cuts: 2, when: 2, pay: 2,
  calc: 3, results: 3,
  consult: 4, mode: 4, date: 4, slot: 4, booked: 4, skip: 4,
};

// "n / total" shown on the card (follow-ups share their parent's number).
const STEP: Partial<Record<NodeId, [number, number]>> = {
  name: [1, 3], mobile: [2, 3], otp: [2, 3], email: [3, 3],
  pin: [1, 3], region: [2, 3], area: [3, 3],
  own: [1, 6], ownerOk: [1, 6], ptype: [2, 6], roofType: [2, 6], bill: [3, 6], billExact: [3, 6], roof: [3, 6],
  goal: [4, 6], cuts: [4, 6], when: [5, 6], pay: [6, 6],
  consult: [1, 4], mode: [2, 4], date: [3, 4], slot: [4, 4],
};

const CHOICE_ICONS: Record<string, string> = {
  own: "🏠", rented: "🔑", yes: "✅", no: "🤔",
  house: "🏡", flat: "🏢", commercial: "🏬", industrial: "🏭", society: "🏘️",
  savings: "💰", subsidy: "🏛️", backup: "🔋", independence: "⚡",
  lt1: "🕐", h1_3: "🕒", h3_6: "🕕", gt6: "🕘",
  now: "🚀", d15: "📅", d30: "🗓️", later: "⏳",
  full: "💳", bank: "🏦", emi: "📆", guide: "🤝",
  call: "📞", visit: "🏠", online: "💻",
};
const SLOT_HOUR = { s1: 10, s2: 12, s3: 14, s4: 16 } as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function nextNode(id: NodeId, l: Lead, editing: boolean): NodeId {
  const societyRoof = l.ptype === "flat" && l.roofType === "society";
  switch (id) {
    case "name": return editing ? "review" : "mobile";
    case "mobile": return "otp";
    case "otp": return editing ? "review" : "email";
    case "email": return "review";
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
    case "results": return "consult";
    case "consult": return l.consult === "yes" ? "mode" : "skip";
    case "mode": return "date";
    case "date": return "slot";
    default: return "booked";
  }
}

// Fields a step owns: cleared when the user goes back to it.
const CLEARS: Partial<Record<NodeId, (keyof Lead)[]>> = {
  name: ["name"], mobile: ["mobile", "otpVerified"], otp: ["otpVerified"], email: ["email"],
  pin: ["pin", "state", "district", "area"], region: ["state", "district"], area: ["area"],
  own: ["own", "ownerOk"], ownerOk: ["ownerOk"], ptype: ["ptype", "roofType"], roofType: ["roofType"],
  bill: ["bill"], billExact: ["bill"], roof: ["roof"], goal: ["goal", "cuts"], cuts: ["cuts"], when: ["when"], pay: ["pay"],
  consult: ["consult"], mode: ["mode"], date: ["date"], slot: ["slot", "bookingId"],
};

function categoryOf(l: Lead): Category {
  if (l.ptype === "commercial" || l.ptype === "industrial") return "commercial";
  if (l.ptype === "flat" && l.roofType === "society") return "society";
  return "residential";
}

function mobileDigits(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  return d.replace(/^0+/, "");
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

  const nodeRef = useRef<NodeId>("name");
  const leadRef = useRef<Lead>(EMPTY_LEAD);
  const geoFound = useRef(false);
  const history = useRef<NodeId[]>([]);
  const editing = useRef(false);
  const turn = useRef(0);
  const ackIdx = useRef(0);
  const started = useRef(false);
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
  const lineFor = useCallback(
    (id: NodeId, how: "fwd" | "back" | "edit"): { text: string; spoken?: string } => {
      const L = leadRef.current;
      const first = firstName(L.name);
      const ack = how === "fwd" ? `${f.acks[ackIdx.current++ % f.acks.length]} ` : "";
      switch (id) {
        case "name": return { text: how === "edit" ? t.editAsk.name : t.askName };
        case "mobile":
          return { text: how === "fwd" ? fill(t.nameAck, { name: L.name, first }) : how === "edit" ? t.editAsk.mobile : t.ask.mobile };
        case "otp":
          return { text: fill(f.otp.ask, { mobile: displayMobile(L.mobile) }), spoken: fill(f.otp.ask, { mobile: spokenMobile(L.mobile) }) };
        case "email": return { text: how === "fwd" ? f.otp.verifiedThenEmail : how === "edit" ? t.editAsk.email : t.ask.email };
        case "review":
          return {
            text: t.confirmAsk,
            spoken: fill(t.confirm, { name: L.name, mobile: spokenMobile(L.mobile), email: spokenEmail(L.email, lang) }),
          };
        case "pin": return { text: fill(f.pin.ask, { first }) };
        case "region":
          return { text: geoFound.current ? fill(f.pin.found, { district: L.district ?? "", state: L.state ?? "" }) : f.pin.notFound };
        case "area": return { text: areas.length ? f.area.ask : f.area.askPlain };
        case "own": return { text: f.own.ask };
        case "ownerOk": return { text: f.ownerOk.ask };
        case "ptype": return { text: ack + f.ptype.ask };
        case "roofType": return { text: f.roofType.ask };
        case "bill": return { text: ack + f.bill.ask };
        case "billExact": return { text: f.bill.exactAsk };
        case "roof": return { text: ack + f.roof.ask };
        case "goal": return { text: ack + f.goal.ask };
        case "cuts": return { text: f.cuts.ask };
        case "when": return { text: ack + f.when.ask };
        case "pay": return { text: ack + f.pay.ask };
        case "calc": return { text: f.calc.title };
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
          };
          return { text: fill(f.result.caption, { first }), spoken: fill(e.subsidy ? f.result.say : f.result.sayNoSub, v) };
        }
        case "consult": return { text: f.consult.ask };
        case "mode": return { text: ack + f.mode.ask };
        case "date": return { text: f.date.ask };
        case "slot": return { text: f.slot.ask };
        case "booked": {
          const dateLabel = L.date ? new Date(`${L.date}T00:00`).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" }) : "";
          return {
            text: fill(f.booked.say, {
              first,
              // "your free site visit" reads better than "your free Site visit"
              mode: L.mode ? (lang === "en" ? f.mode.opts[L.mode].toLowerCase() : f.mode.opts[L.mode]) : "",
              date: dateLabel,
              slot: L.slot ? f.slot.opts[L.slot] : "",
              district: L.district ?? "",
            }),
          };
        }
        case "skip": return { text: fill(f.skip.say, { first }) };
      }
    },
    [f, t, lang, loc, areas.length],
  );

  const sendOtp = useCallback(async () => {
    setResendAt(Date.now() + 30000);
    await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: leadRef.current.mobile }),
    }).catch(() => {});
  }, []);

  const goTo = useCallback(
    (id: NodeId, how: "fwd" | "back" | "edit" = "fwd") => {
      const from = nodeRef.current;
      if (how === "fwd" && from !== id && from !== "calc") history.current.push(from);
      nodeRef.current = id;
      setNode(id);
      setDraft("");
      setError(false);
      setPicked(undefined);
      setBusy(false);
      const L = leadRef.current;
      if (id === "otp") {
        setOtp("");
        void sendOtp();
      }
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
      const { text, spoken } = lineFor(id, how);
      void say(text, spoken);
      if (["name", "mobile", "email", "pin", "area", "billExact", "otp"].includes(id) && started.current)
        requestAnimationFrame(() => inputRef.current?.focus());
    },
    [lineFor, say, sendOtp, setMood],
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

  // "Designing your plan" plays for a moment, then the results open.
  useEffect(() => {
    if (node !== "calc") return;
    const id = setTimeout(() => {
      setMood("idle");
      setBurst((b) => b + 1);
      sfx.success();
      goTo("results");
    }, 3200);
    return () => clearTimeout(id);
  }, [node, goTo, setMood]);

  // OTP resend countdown.
  useEffect(() => {
    if (node !== "otp") return;
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
    goTo(nxt);
  };

  // ── step handlers ──
  const submitText = async () => {
    const id = nodeRef.current;
    const raw = draft;
    if (!raw.trim() && id !== "billExact") return;
    mic.stop();
    if (id === "name") {
      const v = raw.trim().replace(/\s+/g, " ");
      return isName(v) ? advance({ name: v }) : fail(t.errName);
    }
    if (id === "mobile") {
      const d = mobileDigits(raw);
      if (d.length !== 10) return d.length ? fail(fill(t.errMobileShort, { n: d.length })) : fail(t.ask.mobile);
      if (!/^[6-9]/.test(d)) return fail(t.errMobileStart);
      return advance({ mobile: d, otpVerified: false });
    }
    if (id === "email") {
      const v = raw.trim().toLowerCase();
      return isEmail(v) ? advance({ email: v }) : fail(t.errEmail, t.errEmail.replace("name@gmail.com", spokenEmail("name@gmail.com", lang)));
    }
    if (id === "area") {
      const v = raw.trim().replace(/\s+/g, " ");
      return v.length >= 2 ? advance({ area: v }) : fail(f.area.err);
    }
    if (id === "billExact") {
      const n = Number(raw.replace(/\D/g, ""));
      return n > 10000 && n <= 1000000 ? advance({ bill: n }) : fail(f.bill.exactErr);
    }
    if (id === "pin") {
      const pin = raw.replace(/\D/g, "");
      if (!/^[1-9]\d{5}$/.test(pin)) return fail(f.pin.invalid);
      setBusy(true);
      setMood("thinking");
      const res = await fetch(`/api/pincode?pin=${pin}`)
        .then((r) => r.json())
        .catch(() => ({ ok: false }));
      if (nodeRef.current !== "pin") return;
      setMood("idle");
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

  const verifyOtp = async (code: string) => {
    setBusy(true);
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: leadRef.current.mobile, code }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false }));
    if (nodeRef.current !== "otp") return;
    setBusy(false);
    if (res.ok) {
      sfx.success();
      return advance({ otpVerified: true });
    }
    setOtp("");
    fail(f.otp.wrong);
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
    const prev = history.current.pop();
    if (!prev) return onExit();
    const cleared: Partial<Lead> = {};
    for (const k of [...(CLEARS[nodeRef.current] ?? []), ...(CLEARS[prev] ?? [])]) (cleared as Record<string, undefined>)[k] = undefined;
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

  const onMic = (onText: (s: string) => void) => {
    if (mic.listening) return mic.stop();
    sfx.tap();
    setMood("listening");
    mic.start((text, final) => {
      if (final) {
        setMood("idle");
        onText(text);
      } else if (["name", "mobile", "email", "pin", "area", "billExact"].includes(nodeRef.current)) {
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
    goal: { field: "goal", options: opts(f.goal), en: FLOW.en.goal.opts },
    cuts: { field: "cuts", options: opts(f.cuts), en: FLOW.en.cuts.opts },
    when: { field: "when", options: opts(f.when), en: FLOW.en.when.opts },
    pay: { field: "pay", options: opts(f.pay), en: FLOW.en.pay.opts },
    consult: { field: "consult", options: opts(f.consult), en: FLOW.en.consult.opts },
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

  const summary = useMemo(() => {
    const L = lead;
    return [
      `Hi Clans Machina, I'm ${L.name || "a customer"}${L.mobile ? ` (${displayMobile(L.mobile)})` : ""}.`,
      L.district ? `Location: ${[L.area, L.district, L.state, L.pin].filter(Boolean).join(", ")}.` : "",
      L.bill ? `Monthly bill: ${rupees(L.bill)}.` : "",
      L.ptype ? `Property: ${FLOW.en.ptype.opts[L.ptype]}.` : "",
      "I'd like to know more about rooftop solar.",
    ]
      .filter(Boolean)
      .join(" ");
  }, [lead]);

  const step = STEP[node];
  const label = step ? `${step[0]} / ${step[1]}` : undefined;
  const section = SECTION[node];
  const progress = step ? (step[0] - 1) / step[1] + (picked ? 1 / step[1] : 0) : node === "results" || node === "calc" ? 0.5 : 1;
  const tall = node === "results" || node === "booked" || node === "review" || node === "date" || node === "region";
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
          name: { icon: <IconUser className={iconCls} />, ph: t.placeholders.name, props: { autoComplete: "name", autoCapitalize: "words", maxLength: 60 } },
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
                value={draft}
                error={error}
                onChange={(e) => {
                  setError(false);
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
              {suggest.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2.5" lang="en">
                  {suggest.map((s) => (
                    <Chip key={s} onClick={() => setDraft(s)}>
                      @{s.split("@")[1]}
                    </Chip>
                  ))}
                </div>
              )}
              <Busy show={busy}>{f.pin.looking}</Busy>
              <div className="mt-3">
                <PrimaryButton type="submit" disabled={!draft.trim() || busy}>
                  <NextLabel label={f.next} />
                </PrimaryButton>
              </div>
            </form>
          </AnswerCard>
        );
      }
      case "otp":
        return (
          <AnswerCard label={label}>
            <div ref={scope}>
              <OtpBoxes
                inputRef={inputRef}
                value={otp}
                error={error}
                label={f.otp.label}
                onChange={(v) => {
                  setError(false);
                  setOtp(v);
                  if (v.length === 6) void verifyOtp(v);
                }}
              />
            </div>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-gold/10 py-2 text-[12.5px] font-semibold text-gold">
              <IconKey className="h-4 w-4" />
              {f.otp.demo}
            </p>
            <Busy show={busy}>{f.otp.verify}…</Busy>
            <div className="mt-3 flex items-center justify-between text-[13px] font-semibold">
              <button onClick={back} className="flex items-center gap-1 text-white/70 hover:text-white">
                <IconEdit className="h-3.5 w-3.5" />
                {f.otp.change}
              </button>
              <button
                disabled={resendLeft > 0}
                onClick={() => {
                  void sendOtp();
                  setOtp("");
                  void say(f.otp.resent);
                }}
                className="text-brand disabled:text-ink-3"
              >
                {resendLeft > 0 ? fill(f.otp.resendIn, { s: resendLeft }) : f.otp.resend}
              </button>
            </div>
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
                    <span className="block text-[11px] font-semibold text-ink-3">{t.labels[k]}</span>
                    <span className="flex items-center gap-1.5 text-[15.5px] font-semibold [overflow-wrap:anywhere] text-white" lang={k === "name" ? undefined : "en"}>
                      {k === "mobile" ? displayMobile(lead.mobile) : lead[k]}
                      {k === "mobile" && lead.otpVerified && (
                        <span className="flex items-center gap-0.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10.5px] text-mint">
                          <IconCheck className="h-3 w-3" />
                          {f.otp.verified}
                        </span>
                      )}
                    </span>
                  </span>
                  <button onClick={() => editField(k)} className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[12.5px] font-semibold text-brand hover:bg-brand/10">
                    <IconEdit className="h-3.5 w-3.5" />
                    {t.edit}
                  </button>
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
            <ResultsCard lang={lang} est={estimate} lead={lead} onBook={() => advance({})} />
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
              onExpert={() => setExpert(true)}
            />
          </AnswerCard>
        );
      case "skip":
        return (
          <AnswerCard>
            <SavedCard lang={lang} onExpert={() => setExpert(true)} />
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
              key={node}
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
