"use client";

import { useEffect, useRef, type InputHTMLAttributes, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { REGIONS, STATES } from "@/lib/regions";
import { IconArrow, IconCheck, IconMic } from "../ui/icons";

// ── shared bits ──────────────────────────────────────────────────────────

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold transition disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

export const NextLabel = ({ label }: { label: string }) => (
  <>
    {label}
    <IconArrow className="h-5 w-5" />
  </>
);

// The large input row used for every typed answer.
export function FieldInput({
  icon,
  prefix,
  error,
  listening,
  onMic,
  micLabel,
  inputRef,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  prefix?: string;
  error?: boolean;
  listening?: boolean;
  onMic?: () => void;
  micLabel?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      className={`flex h-[60px] items-center gap-2 rounded-2xl border-2 bg-white/[.05] px-2 transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-[0_0_0_5px_rgba(62,207,142,.14)] ${
        error ? "border-danger/80" : listening ? "border-danger/60" : "border-white/14"
      }`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/14 text-brand">{icon}</span>
      {prefix && <span className="shrink-0 border-r border-white/15 pr-2 text-[18px] font-semibold text-white/80">{prefix}</span>}
      <input
        ref={inputRef}
        className="h-full min-w-0 flex-1 bg-transparent text-[18px] font-medium text-white outline-none placeholder:text-[15px] placeholder:font-normal placeholder:text-white/35"
        {...input}
      />
      {onMic && (
        <button
          type="button"
          onClick={onMic}
          aria-label={micLabel}
          className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
            listening ? "bg-danger text-night" : "bg-white/8 text-white/80 hover:text-brand"
          }`}
        >
          {listening && <span className="pulse-ring absolute inset-0 rounded-xl border-2 border-danger" />}
          <IconMic className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// ── OTP: one real input (paste / SMS autofill friendly) drawn as 6 boxes ──
export function OtpBoxes({
  value,
  onChange,
  error,
  inputRef,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  label: string;
}) {
  return (
    <label className="group relative block">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={label}
        maxLength={6}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <span className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const filled = i < value.length;
          const active = i === Math.min(value.length, 5);
          return (
            <motion.span
              key={i}
              animate={filled ? { scale: [0.85, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`grid h-14 place-items-center rounded-xl border-2 bg-white/[.05] font-display text-[24px] font-bold text-white transition-colors ${
                error
                  ? "border-danger/80"
                  : active
                    ? "border-white/14 group-focus-within:border-brand group-focus-within:shadow-[0_0_0_4px_rgba(62,207,142,.14)]"
                    : filled
                      ? "border-brand/50"
                      : "border-white/14"
              }`}
            >
              {value[i] ?? ""}
            </motion.span>
          );
        })}
      </span>
    </label>
  );
}

// ── option cards ──────────────────────────────────────────────────────────
export type Option = { id: string; label: string; icon?: string };

export function ChoiceGrid({ options, picked, onPick, cols = 2 }: { options: Option[]; picked?: string; onPick: (id: string) => void; cols?: 1 | 2 }) {
  return (
    <div className={`grid gap-2.5 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {options.map((o, i) => {
        const on = picked === o.id;
        return (
          <motion.button
            key={o.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: picked && !on ? 0.45 : 1, y: 0, scale: on ? 1.03 : 1 }}
            transition={{ delay: picked ? 0 : 0.05 * i, type: "spring", stiffness: 300, damping: 24 }}
            whileTap={{ scale: 0.96 }}
            disabled={!!picked}
            onClick={() => onPick(o.id)}
            className={`relative flex min-h-[58px] items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left text-[15px] leading-tight font-semibold transition-colors ${
              on ? "border-brand bg-brand/15 text-white" : "border-white/12 bg-white/[.04] text-white/90 hover:border-gold/50 hover:bg-gold/[.06]"
            }`}
          >
            {o.icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-[20px]">{o.icon}</span>}
            <span className="min-w-0 flex-1">{o.label}</span>
            {on && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-night">
                <IconCheck className="h-3.5 w-3.5" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── sliders ───────────────────────────────────────────────────────────────
export function RangeSlider({
  value,
  min,
  max,
  step,
  onChange,
  ticks,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  ticks: string[];
  ariaLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="pt-1">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="saathi-range w-full"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-ink-3" lang="en">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── state + district ──────────────────────────────────────────────────────
const Chevron = () => (
  <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 right-3.5 h-5 w-5 -translate-y-1/2 text-white/60" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export function RegionSelect({
  state,
  district,
  onState,
  onDistrict,
  labels,
  error,
}: {
  state: string;
  district: string;
  onState: (s: string) => void;
  onDistrict: (d: string) => void;
  labels: { state: string; district: string; chooseState: string; chooseDistrict: string };
  error?: boolean;
}) {
  const districts = REGIONS[state] ?? [];
  const sel = `h-[56px] w-full appearance-none rounded-2xl border-2 bg-white/[.05] pr-10 pl-4 text-[16.5px] font-medium text-white outline-none transition focus:border-brand focus:shadow-[0_0_0_5px_rgba(62,207,142,.14)] ${
    error ? "border-danger/80" : "border-white/14"
  }`;
  return (
    <div className="grid gap-2.5">
      <label className="block">
        <span className="mb-1 ml-1 block text-[12px] font-semibold text-ink-3">{labels.state}</span>
        <span className="relative block">
          <select value={state} onChange={(e) => onState(e.target.value)} className={sel}>
            <option value="" disabled className="bg-night">
              {labels.chooseState}
            </option>
            {STATES.map((s) => (
              <option key={s} value={s} className="bg-night">
                {s}
              </option>
            ))}
          </select>
          <Chevron />
        </span>
      </label>
      <label className="block">
        <span className="mb-1 ml-1 block text-[12px] font-semibold text-ink-3">{labels.district}</span>
        <span className="relative block">
          <select value={district} onChange={(e) => onDistrict(e.target.value)} disabled={!state} className={`${sel} disabled:opacity-50`}>
            <option value="" disabled className="bg-night">
              {labels.chooseDistrict}
            </option>
            {districts.map((d) => (
              <option key={d} value={d} className="bg-night">
                {d}
              </option>
            ))}
          </select>
          <Chevron />
        </span>
      </label>
    </div>
  );
}

// ── chips (areas, roof "not sure", above ₹10k) ───────────────────────────
export function Chip({ children, on, onClick }: { children: ReactNode; on?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-[13.5px] font-semibold transition ${
        on ? "border-brand bg-brand/20 text-mint" : "border-white/14 bg-white/[.05] text-white/85 hover:border-gold/50"
      }`}
    >
      {children}
    </button>
  );
}

// ── date + time ───────────────────────────────────────────────────────────
export type DayOpt = { iso: string; top: string; day: string; month: string };

export function DateChips({ days, value, onPick }: { days: DayOpt[]; value?: string; onPick: (iso: string) => void }) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    row.current?.scrollTo({ left: 0 });
  }, []);
  return (
    <div ref={row} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {days.map((d, i) => {
        const on = value === d.iso;
        return (
          <motion.button
            key={d.iso}
            type="button"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: value && !on ? 0.5 : 1, x: 0, scale: on ? 1.05 : 1 }}
            transition={{ delay: value ? 0 : i * 0.04 }}
            disabled={!!value}
            onClick={() => onPick(d.iso)}
            className={`flex w-[74px] shrink-0 flex-col items-center rounded-2xl border-2 py-2.5 transition-colors ${
              on ? "border-brand bg-brand/15" : "border-white/12 bg-white/[.04] hover:border-gold/50"
            }`}
          >
            <span className="text-[11.5px] font-semibold text-ink-3">{d.top}</span>
            <span className="font-display text-[24px] leading-tight font-bold">{d.day}</span>
            <span className="text-[11.5px] text-ink-2">{d.month}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── small status line under an input (e.g. "Finding your area…") ────────
export function Busy({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-center gap-2 pt-2 text-[13px] font-medium text-mint"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-mint/30 border-t-mint" />
          {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
