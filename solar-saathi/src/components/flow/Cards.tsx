"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PHONE, TOLL_FREE, whatsAppLink } from "@/lib/contact";
import { CALC, emi, rupees, rupeesShort, type Estimate } from "@/lib/estimate";
import { FAQ } from "@/lib/faq";
import { FLOW } from "@/lib/flowCopy";
import { fill, type Lang } from "@/lib/i18n";
import type { Lead } from "@/lib/lead";
import { displayMobile } from "@/lib/speech";
import { IconBolt, IconCalendar, IconCallback, IconCheck, IconChevron, IconClock, IconHeadset, IconHome, IconPhone, IconSpark, IconWhatsApp } from "../ui/icons";
import { PrimaryButton } from "./Widgets";

// Animates a number up from 0 once (ease-out), writing straight to the DOM.
function CountUp({ value, format, delay = 0 }: { value: number; format: (n: number) => string; delay?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 1300));
      if (el.current) el.current.textContent = format(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, format, delay]);
  return <span ref={el}>{format(0)}</span>;
}

// Keeps a phone number or "6.5% p.a." on one line.
const NBSP = "\u00a0";

// Stable formatters: a new function each render would restart the count-up.
const fmtInt = (n: number) => String(Math.round(n));
const fmtR = (n: number) => rupees(n);
const fmtShort = (n: number) => rupeesShort(n);

export function ResultsCard({
  lang,
  est,
  lead,
  onBook,
  onFaq,
  summary,
}: {
  lang: Lang;
  est: Estimate;
  lead: Lead;
  onBook: () => void;
  onFaq: () => void;
  summary: string; // the WhatsApp message with all their answers
}) {
  const r = FLOW[lang].result;
  const showEmi = lead.pay === "bank" || lead.pay === "emi";
  const [tenure, setTenure] = useState(5);
  const noSub = est.subsidy === 0;

  const tiles = [
    { label: r.cost, value: est.cost, tone: "text-white" },
    { label: r.subsidy, value: est.subsidy, tone: "text-mint", sub: noSub ? undefined : est.subsidyState ? `${rupees(est.subsidyCentral)} + ${rupees(est.subsidyState)}` : undefined },
    { label: r.youPay, value: est.investment, tone: "text-gold" },
    { label: r.monthly, value: est.monthlySaving, tone: "text-mint" },
  ];

  return (
    <div lang={lang}>
      {/* headline */}
      <div className="flex items-stretch gap-2.5">
        <div className="flex-1 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/20 to-transparent p-3.5">
          <p className="text-[12px] font-semibold text-ink-2">{r.kw}</p>
          <p className="mt-0.5 flex items-baseline gap-1 font-display text-[34px] leading-none font-bold text-white">
            <CountUp value={est.kw} format={fmtInt} />
            <span className="text-[18px] text-mint">kW</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-2">
            <IconBolt className="h-3.5 w-3.5 text-gold" />
            {fill(r.panels, { n: est.panels })}
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/20 to-transparent p-3.5">
          <p className="text-[12px] font-semibold text-ink-2">{r.life}</p>
          <p className="mt-1 font-display text-[28px] leading-none font-bold text-gold" lang="en">
            <CountUp value={est.savings25} format={fmtShort} delay={200} />
          </p>
          <p className="mt-1.5 text-[12px] text-ink-2">
            {r.payback}: {fill(r.years, { n: est.paybackYears.toFixed(1) })}
          </p>
        </div>
      </div>

      {/* money */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="rounded-2xl border border-white/10 bg-white/[.04] p-3"
          >
            <p className="text-[11.5px] font-semibold text-ink-3">{t.label}</p>
            <p className={`mt-0.5 font-display text-[19px] font-bold ${t.tone}`} lang="en">
              <CountUp value={t.value} format={fmtR} delay={300 + i * 100} />
            </p>
            {t.sub && <p className="mt-0.5 text-[10.5px] text-ink-3" lang="en">{t.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* emi */}
      {showEmi && est.investment > 0 && (
        <div className="mt-2.5 rounded-2xl border border-white/10 bg-white/[.04] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-ink-3">{r.emi}</p>
            <div className="flex gap-1.5" lang="en">
              {CALC.emiTenures.map((y) => (
                <button
                  key={y}
                  onClick={() => setTenure(y)}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${tenure === y ? "bg-brand text-night" : "bg-white/8 text-white/80"}`}
                >
                  {y}y
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 font-display text-[15.5px] font-bold text-white min-[400px]:text-[18px]">
            {fill(r.emiLine, { amount: rupees(emi(est.investment, tenure)), years: tenure, rate: CALC.emiRate }).replace("% ", "%" + NBSP)}
          </p>
        </div>
      )}

      <p className="mt-2.5 text-[12px] text-ink-2">
        🌱 {r.co2}: <b className="text-white">{Math.round(est.co2TonnesLife)} t</b> · {fill(r.trees, { n: est.trees })}
      </p>
      {(noSub || lead.ownerOk === "no" || est.roofCapped) && (
        <ul className="mt-2 space-y-1 text-[12px] leading-snug text-gold/90">
          {noSub && <li>• {r.noSubsidy}</li>}
          {lead.ownerOk === "no" && <li>• {r.ownerNote}</li>}
          {est.roofCapped && <li>• {fill(r.roofNote, { ideal: est.idealKw }).replace(" kW", NBSP + "kW")}</li>}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-ink-3">{r.note}</p>

      <div className="mt-3">
        <PrimaryButton onClick={onBook}>
          <IconCalendar className="h-5 w-5" />
          {r.cta}
        </PrimaryButton>
        {/* Not ready to book? Clear doubts in the FAQ first (it has a Book button too). */}
        <button
          onClick={onFaq}
          className="mt-2.5 flex w-full items-center gap-3 rounded-2xl border border-brand/35 bg-brand/[.08] px-3.5 py-3 text-left transition hover:border-brand/60 hover:bg-brand/[.12]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
            <IconSpark className="h-5.5 w-5.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-tight font-bold text-white">{r.faq}</span>
            <span className="mt-0.5 block text-[12px] leading-tight text-ink-2">{r.faqSub}</span>
          </span>
          <IconChevron className="h-5 w-5 shrink-0 text-brand" />
        </button>
        {/* Or talk to the team first: WhatsApp opens with every answer and the plan typed in. */}
        <a
          href={whatsAppLink(summary)}
          target="_blank"
          rel="noopener"
          className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-[#25d366]/40 bg-[#25d366]/[.08] px-3.5 py-3 text-left transition hover:border-[#25d366]/70 hover:bg-[#25d366]/[.14]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#25d366]/15 text-[#25d366]">
            <IconWhatsApp className="h-5.5 w-5.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-tight font-bold text-white">{r.wa}</span>
            <span className="mt-0.5 block text-[12px] leading-tight text-ink-2">{r.waSub}</span>
          </span>
          <IconChevron className="h-5 w-5 shrink-0 text-[#25d366]" />
        </a>
      </div>
    </div>
  );
}

export function BookedCard({
  lang,
  lead,
  modeLabel,
  dateLabel,
  slotLabel,
  onFaq,
  summary,
}: {
  lang: Lang;
  lead: Lead;
  modeLabel: string;
  dateLabel: string;
  slotLabel: string;
  onFaq: () => void;
  summary: string;
}) {
  const b = FLOW[lang].booked;
  return (
    <div lang={lang}>
      <div className="flex items-center gap-3">
        <motion.span
          initial={{ scale: 0, rotate: -120 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-night shadow-[0_0_30px_rgba(62,207,142,.6)]"
        >
          <IconCheck className="h-7 w-7" />
        </motion.span>
        <div>
          <p className="font-display text-[22px] leading-tight font-bold">{b.title}</p>
          <p className="text-[12.5px] text-ink-3" lang="en">
            {b.ref}: <b className="text-white">{lead.bookingId}</b>
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {[
          { icon: lead.mode === "visit" ? <IconHome className="h-4.5 w-4.5" /> : lead.mode === "online" ? <IconHeadset className="h-4.5 w-4.5" /> : <IconPhone className="h-4.5 w-4.5" />, text: modeLabel },
          { icon: <IconCalendar className="h-4.5 w-4.5" />, text: dateLabel },
          { icon: <IconClock className="h-4.5 w-4.5" />, text: slotLabel },
          { icon: <IconHeadset className="h-4.5 w-4.5" />, text: fill(b.team, { district: lead.district ?? "" }) },
          { icon: <IconPhone className="h-4.5 w-4.5" />, text: fill(b.sent, { mobile: displayMobile(lead.mobile).replace(/ /g, NBSP) }) }, // number never splits
        ].map((row, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-2.5 text-[14.5px] text-white/90"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">{row.icon}</span>
            {row.text}
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[13px] text-ink-2">☀ {b.thanks}</p>
      <NextSteps lang={lang} onFaq={onFaq} summary={summary} />
    </div>
  );
}

// ── End of the journey: "Have more questions?" → FAQ, call, WhatsApp, callback ──
function NextSteps({ lang, onFaq, summary }: { lang: Lang; onFaq: () => void; summary: string }) {
  const h = FAQ[lang].hub;
  const [requested, setRequested] = useState(false);
  const small = "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[12.5px] font-semibold transition";
  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-2.5 text-[11.5px] font-bold tracking-[.12em] text-gold uppercase">{h.title}</p>
      <motion.button
        onClick={onFaq}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 22 }}
        whileTap={{ scale: 0.98 }}
        className="btn-primary flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-night/15">
          <IconSpark className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] leading-tight font-bold">{h.faq}</span>
          <span className="mt-0.5 block text-[12px] leading-tight font-medium opacity-80">{h.faqSub}</span>
        </span>
        <IconChevron className="h-5 w-5 shrink-0" />
      </motion.button>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <a href={`tel:${PHONE.tel}`} className={`${small} border-white/12 bg-white/[.05] text-white/90 hover:border-brand/50`}>
          <IconPhone className="h-5 w-5 text-brand" />
          {h.call}
        </a>
        <a href={whatsAppLink(summary)} target="_blank" rel="noopener" className={`${small} border-[#25d366]/40 bg-[#25d366]/12 text-white/90 hover:bg-[#25d366]/20`}>
          <IconWhatsApp className="h-5 w-5 text-[#25d366]" />
          {h.whatsapp}
        </a>
        <button
          onClick={() => setRequested(true)}
          disabled={requested}
          className={`${small} border-white/12 bg-white/[.05] text-white/90 hover:border-brand/50 disabled:border-brand/40 disabled:text-mint`}
        >
          {requested ? <IconCheck className="h-5 w-5" /> : <IconCallback className="h-5 w-5 text-brand" />}
          {requested ? h.callbackDone : h.callback}
        </button>
      </div>
    </div>
  );
}

// ── Talk to an Expert (PDF §5): call, WhatsApp with all the customer's answers, callback ──
export function ExpertSheet({ open, onClose, lang, lead, summary }: { open: boolean; onClose: () => void; lang: Lang; lead: Lead; summary: string }) {
  const e = FLOW[lang].expert;
  const [requested, setRequested] = useState(false);
  const wa = whatsAppLink(summary);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            lang={lang}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative w-full max-w-[440px] rounded-t-[28px] border border-white/12 bg-[#0d151a] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl lg:rounded-[28px]"
          >
            <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-white/20 lg:hidden" />
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/15 text-brand">
                <IconHeadset className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-[19px] font-bold">{e.title}</p>
                <p className="text-[12px] text-ink-3">{e.hours}</p>
              </div>
            </div>
            <p className="mt-3 text-[13.5px] text-ink-2">{e.sub}</p>
            <div className="mt-4 grid gap-2.5">
              <a href={`tel:${PHONE.tel}`} className="btn-primary flex h-13 items-center justify-center gap-2 rounded-2xl py-3.5 text-[16px] font-bold">
                <IconPhone className="h-5 w-5" />
                {e.call} · {PHONE.show}
              </a>
              <a href={wa} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] py-3.5 text-[16px] font-bold text-[#062b14]">
                <IconWhatsApp className="h-5 w-5" />
                {e.whatsapp}
              </a>
              <button
                onClick={() => setRequested(true)}
                disabled={requested}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[.05] py-3.5 text-[15px] font-semibold text-white/90 disabled:border-brand/40 disabled:text-mint"
              >
                {requested ? <IconCheck className="h-5 w-5" /> : <IconCallback className="h-5 w-5" />}
                {requested ? e.callbackDone : e.callback}
              </button>
              <a href={`tel:${TOLL_FREE.tel}`} className="text-center text-[13px] text-ink-3 underline-offset-2 hover:underline" lang="en">
                {e.tollFree}: {TOLL_FREE.show}
              </a>
            </div>
            <p className="sr-only">{lead.name}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
