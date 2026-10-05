"use client";

import type { ReactNode, RefObject } from "react";
import { motion } from "motion/react";
import { FAQ, POPULAR, TOPICS, itemsOf, topicOf, type TopicId } from "@/lib/faq";
import type { Lang } from "@/lib/i18n";
import { IconCalendar, IconChevron, IconGrid, IconHeadset, IconMic, IconSearch, IconSend } from "../ui/icons";

// ── Solar Saathi FAQ assistant (PDF §4) ──────────────────────────────────
// Saathi speaks the answer in his bubble; this card holds what you can do
// next: ask (type or speak), browse topics, or follow a related question.

export type FaqView =
  | { kind: "home" }
  | { kind: "topic"; topic: TopicId }
  | { kind: "answer"; id: string }
  | { kind: "suggest"; ids: string[]; asked: string }
  | { kind: "none"; asked: string };

type Mic = { supported: boolean; listening: boolean; label: string; listeningLabel: string; onClick: () => void };

const iconOf = (t: TopicId) => TOPICS.find((x) => x.id === t)?.icon ?? "☀️";

export function FaqCard({
  lang,
  view,
  draft,
  onDraft,
  onAsk,
  onTopic,
  onQuestion,
  onHome,
  onExpert,
  onBook,
  bookLabel,
  mic,
  inputRef,
}: {
  lang: Lang;
  view: FaqView;
  draft: string;
  onDraft: (v: string) => void;
  onAsk: (text: string) => void;
  onTopic: (t: TopicId) => void;
  onQuestion: (id: string) => void;
  onHome: () => void;
  onExpert: () => void;
  // Set while the user hasn't booked yet: questions answered → book from here.
  onBook?: () => void;
  bookLabel: string;
  mic: Mic;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const c = FAQ[lang];
  const ask = <AskBar value={draft} onChange={onDraft} onSubmit={onAsk} placeholder={c.ui.placeholder} askLabel={c.ui.ask} mic={mic} inputRef={inputRef} />;
  const book = onBook && (
    <button onClick={onBook} className="btn-primary flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-3 text-[16px] font-bold">
      <IconCalendar className="h-5 w-5 shrink-0" />
      {bookLabel}
    </button>
  );
  const questions = (ids: string[]) => (
    <div className="grid gap-2">
      {ids.map((id, i) => (
        <QuestionRow key={id} i={i} text={c.items[id].q} onClick={() => onQuestion(id)} />
      ))}
    </div>
  );
  const actions = (
    <div className="grid grid-cols-2 gap-2">
      <SmallButton onClick={onHome} icon={<IconGrid className="h-4.5 w-4.5 text-brand" />}>
        {c.ui.allTopics}
      </SmallButton>
      <SmallButton onClick={onExpert} icon={<IconHeadset className="h-4.5 w-4.5 text-brand" />}>
        {c.ui.expert}
      </SmallButton>
    </div>
  );

  if (view.kind === "home") {
    return (
      <div lang={lang} className="space-y-3.5">
        {ask}
        <Section label={c.ui.popular}>{questions(POPULAR)}</Section>
        <Section label={c.ui.topics}>
          <TopicGrid lang={lang} onTopic={onTopic} />
        </Section>
        {book}
      </div>
    );
  }

  if (view.kind === "topic") {
    const t = c.topics[view.topic];
    return (
      <div lang={lang} className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/12 text-[22px]">{iconOf(view.topic)}</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[18px] leading-tight font-bold">{t.name}</p>
            <p className="text-[12px] text-ink-3">{t.sub}</p>
          </div>
          <button onClick={onHome} className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-brand hover:bg-brand/10">
            <IconGrid className="h-3.5 w-3.5" />
            {c.ui.allTopics}
          </button>
        </div>
        {questions(itemsOf(view.topic))}
        {ask}
        {book}
      </div>
    );
  }

  if (view.kind === "answer") {
    const item = c.items[view.id];
    const topic = topicOf(view.id);
    const siblings = itemsOf(topic);
    const at = siblings.indexOf(view.id);
    // The next questions in the same topic (wrapping round).
    const related = [1, 2, 3].map((n) => siblings[(at + n) % siblings.length]).filter((id) => id !== view.id);
    return (
      <div lang={lang} className="space-y-3">
        <div>
          <p className="text-[11px] font-bold tracking-[.12em] text-gold uppercase">
            {iconOf(topic)} {c.topics[topic].name}
          </p>
          <p className="mt-1 font-display text-[18px] leading-snug font-bold text-white">{item.q}</p>
        </div>
        <motion.div
          key={view.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/16 to-transparent px-4 py-3"
        >
          <p className="font-display text-[19px] leading-snug font-bold text-gold">{item.k}</p>
        </motion.div>
        <Section label={c.ui.related}>{questions([...new Set(related)])}</Section>
        {actions}
        {ask}
        {book}
      </div>
    );
  }

  // "suggest" (a few close matches) or "none" (nothing found).
  return (
    <div lang={lang} className="space-y-3">
      <div>
        <p className="text-[11px] font-bold tracking-[.12em] text-gold uppercase">{c.ui.youAsked}</p>
        <p className="mt-1 text-[15.5px] leading-snug font-semibold [overflow-wrap:anywhere] text-white/85">“{view.asked}”</p>
      </div>
      {view.kind === "suggest" ? (
        questions(view.ids)
      ) : (
        <>
          <button onClick={onExpert} className="btn-primary flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-3 text-[16px] font-bold">
            <IconHeadset className="h-5 w-5" />
            {c.ui.expert}
          </button>
          <TopicGrid lang={lang} onTopic={onTopic} />
        </>
      )}
      {view.kind === "suggest" && actions}
      {ask}
      {book}
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11.5px] font-bold tracking-[.12em] text-gold uppercase">{label}</p>
      {children}
    </div>
  );
}

function TopicGrid({ lang, onTopic }: { lang: Lang; onTopic: (t: TopicId) => void }) {
  const c = FAQ[lang];
  return (
    <div className="grid grid-cols-2 gap-2">
      {TOPICS.map((t, i) => (
        <motion.button
          key={t.id}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * i, type: "spring", stiffness: 300, damping: 24 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onTopic(t.id)}
          // Icon above the name so names fit on a phone. The 7th tile spans
          // the row (icon beside the name) so the grid ends square.
          className={`flex gap-2.5 rounded-2xl border border-white/12 bg-white/[.04] p-3 text-left transition-colors hover:border-gold/50 hover:bg-gold/[.06] ${
            i === TOPICS.length - 1 && TOPICS.length % 2 ? "col-span-2 items-center" : "flex-col items-start"
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-[18px]">{t.icon}</span>
          <span className="min-w-0">
            <span className="block text-[14px] leading-tight font-bold text-white">{c.topics[t.id].name}</span>
            <span className="mt-0.5 block text-[11.5px] leading-tight text-ink-3">{c.topics[t.id].sub}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function QuestionRow({ text, onClick, i }: { text: string; onClick: () => void; i: number }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * i, type: "spring", stiffness: 320, damping: 26 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-left text-[14.5px] leading-snug font-semibold text-white/90 transition-colors hover:border-brand/50 hover:bg-brand/[.06]"
    >
      <span className="min-w-0 flex-1">{text}</span>
      <IconChevron className="h-4 w-4 shrink-0 text-ink-3" />
    </motion.button>
  );
}

function SmallButton({ onClick, icon, children }: { onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-white/12 bg-white/[.05] px-2 py-2 text-center text-[13px] leading-tight font-semibold text-white/90 hover:border-brand/50"
    >
      {icon}
      {children}
    </button>
  );
}

// Type or speak a question. 16px text so phones don't zoom in on focus.
function AskBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  askLabel,
  mic,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  placeholder: string;
  askLabel: string;
  mic: Mic;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className={`flex h-[54px] items-center gap-1.5 rounded-2xl border-2 bg-white/[.05] pr-1.5 pl-3 transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-[0_0_0_5px_rgba(62,207,142,.14)] ${
        mic.listening ? "border-danger/60" : "border-white/14"
      }`}
    >
      <IconSearch className="h-5 w-5 shrink-0 text-brand" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={mic.listening ? mic.listeningLabel : placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        maxLength={160}
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium text-white outline-none placeholder:text-[14.5px] placeholder:font-normal placeholder:text-white/40"
      />
      {mic.supported && (
        <button
          type="button"
          onClick={mic.onClick}
          aria-label={mic.label}
          className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${mic.listening ? "bg-danger text-night" : "bg-white/8 text-white/80 hover:text-brand"}`}
        >
          {mic.listening && <span className="pulse-ring absolute inset-0 rounded-xl border-2 border-danger" />}
          <IconMic className="h-5 w-5" />
        </button>
      )}
      <button type="submit" disabled={!value.trim()} aria-label={askLabel} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-night transition disabled:opacity-30">
        <IconSend className="h-5 w-5" />
      </button>
    </form>
  );
}
