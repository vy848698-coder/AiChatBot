"use client";

import { useEffect, useId, useRef } from "react";
import { voice } from "@/lib/voice";

export type MascotMood = "sleep" | "idle" | "wave" | "happy" | "listening" | "thinking" | "looking";

// ── Rig ─────────────────────────────────────────────────────────────────
// Saathi is a hovering robot with jointed arms (shoulder → elbow → wrist).
// Every frame, poses are blended with springs, so motion overshoots and
// settles like a living character instead of snapping between states.
// While he speaks he cycles through conversational gestures, and his
// forearms, wrists, head, brows and mouth follow the loudness of the voice.
//
// Arm angles are in degrees, 0 = hanging straight down. Positive swings the
// arm outward, away from the body (the right arm is mirrored, so the same
// numbers work for both). a2/a3 are relative to the previous segment.

type Pose = { l1: number; l2: number; l3: number; r1: number; r2: number; r3: number };

const POSES = {
  rest: { l1: 8, l2: -10, l3: 0, r1: 8, r2: -10, r3: 0 },
  explain: { l1: 30, l2: -140, l3: -15, r1: 34, r2: -134, r3: -10 },
  open: { l1: 50, l2: 48, l3: -30, r1: 50, r2: 48, r3: -30 },
  leftUp: { l1: 36, l2: -150, l3: -20, r1: 12, r2: -22, r3: 0 },
  rightUp: { l1: 12, l2: -22, l3: 0, r1: 38, r2: -152, r3: -20 },
  present: { l1: 14, l2: -30, l3: 0, r1: 52, r2: 14, r3: -35 },
  shrug: { l1: 38, l2: 62, l3: -45, r1: 38, r2: 62, r3: -45 },
  count: { l1: 26, l2: -128, l3: -10, r1: 30, r2: -150, r3: 15 },
  wave: { l1: 12, l2: -18, l3: 0, r1: 152, r2: -24, r3: 0 },
  happy: { l1: 148, l2: 14, l3: 0, r1: 148, r2: 14, r3: 0 },
  listen: { l1: 10, l2: -14, l3: 0, r1: 120, r2: 52, r3: 10 },
  think: { l1: 24, l2: -112, l3: 0, r1: 10, r2: -156, r3: 25 },
  looking: { l1: 18, l2: -104, l3: -10, r1: 18, r2: -104, r3: -10 },
  sleep: { l1: 3, l2: -4, l3: 0, r1: 3, r2: -4, r3: 0 },
} satisfies Record<string, Pose>;

type PoseName = keyof typeof POSES;
const TALK: PoseName[] = ["explain", "open", "leftUp", "rightUp", "present", "count", "shrug", "explain"];
const MOOD_POSE: Partial<Record<MascotMood, PoseName>> = {
  wave: "wave",
  happy: "happy",
  listening: "listen",
  thinking: "think",
  sleep: "sleep",
};
const MOOD_TILT: Partial<Record<MascotMood, number>> = { thinking: 7, listening: -8, sleep: 9, looking: 3 };

const SH_L = { x: 91, y: 152 };
const SH_R = { x: 149, y: 152 };
const UPPER = 27;
const FORE = 24;
const EYE = { l: 101, r: 139, y: 91 };
const MOUTH = { x: 120, y: 111 };

type Spring = { x: number; v: number };
const sp = (x = 0): Spring => ({ x, v: 0 });
function step(s: Spring, target: number, k = 0.1, damp = 0.76) {
  s.v = (s.v + (target - s.x) * k) * damp;
  s.x += s.v;
  return s.x;
}
const f = (n: number) => n.toFixed(2);

export function Mascot({ mood }: { mood: MascotMood }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const url = (n: string) => `url(#${id(n)})`;

  const rootRef = useRef<SVGSVGElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const flameRef = useRef<SVGGElement>(null);
  const torsoRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const capRef = useRef<SVGGElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const blinkRef = useRef<SVGGElement>(null);
  const browLRef = useRef<SVGPathElement>(null);
  const browRRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const armLRef = useRef<SVGGElement>(null);
  const foreLRef = useRef<SVGGElement>(null);
  const handLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const foreRRef = useRef<SVGGElement>(null);
  const handRRef = useRef<SVGGElement>(null);
  const bars = useRef<(SVGRectElement | null)[]>([]);
  const moodRef = useRef(mood);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const el = {
      root: rootRef.current, halo: haloRef.current, hover: hoverRef.current, shadow: shadowRef.current,
      flame: flameRef.current, torso: torsoRef.current, head: headRef.current, cap: capRef.current,
      face: faceRef.current, browL: browLRef.current, browR: browRRef.current, mouth: mouthRef.current,
      armL: armLRef.current, foreL: foreLRef.current, handL: handLRef.current,
      armR: armRRef.current, foreR: foreRRef.current, handR: handRRef.current,
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const J = {
      l1: sp(8), l2: sp(-10), l3: sp(), r1: sp(8), r2: sp(-10), r3: sp(),
      tilt: sp(), nod: sp(), sway: sp(), cap: sp(), brow: sp(), lx: sp(), ly: sp(), open: sp(), wide: sp(),
    };
    let raf = 0;
    let gesture: PoseName = "rest";
    let nextGesture = 0;
    let vowel = 0.5;
    let nextVowel = 0;
    let blinkAt = performance.now() + 1600;
    let blinkUntil = 0;
    let pointerAt = -1e9;
    let nextGlance = 0;
    const look = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      const b = el.root?.getBoundingClientRect();
      if (!b) return;
      look.x = Math.max(-5, Math.min(5, ((e.clientX - (b.left + b.width / 2)) / Math.max(innerWidth, 1)) * 20));
      look.y = Math.max(-3, Math.min(3.5, ((e.clientY - (b.top + b.height * 0.3)) / Math.max(innerHeight, 1)) * 14));
      pointerAt = performance.now();
    };
    addEventListener("pointermove", onMove, { passive: true });

    const frame = (now: number) => {
      const t = now / 1000;
      const m = moodRef.current;
      const lvl = voice.level;
      const talking = voice.speaking || lvl > 0.04;
      const beat = talking ? lvl : 0;

      // ── choose a pose ──
      let pose: Pose;
      const forced = MOOD_POSE[m];
      if (forced) pose = POSES[forced];
      else if (talking) {
        if (now > nextGesture) {
          const options = TALK.filter((g) => g !== gesture);
          gesture = options[Math.floor(Math.random() * options.length)];
          nextGesture = now + 1000 + Math.random() * 1500;
        }
        pose = POSES[gesture];
      } else {
        gesture = "rest";
        pose = m === "looking" ? POSES.looking : POSES.rest;
      }

      // Speech "beats": forearms lift and wrists flick with each loud syllable.
      const lift = (a: number) => a + Math.sign(a || -1) * beat * 20;
      const breath = talking ? 0 : Math.sin(t * 1.3) * 2.2;
      let tr2 = lift(pose.r2);
      if (m === "wave") tr2 = pose.r2 + Math.sin(t * 10) * 26;
      if (m === "happy") tr2 = pose.r2 + Math.sin(t * 7) * 8;

      const k = reduced ? 0.3 : 0.085;
      step(J.l1, pose.l1 + breath, k);
      step(J.l2, lift(pose.l2), k * 1.2);
      step(J.l3, pose.l3 + Math.sin(t * 5.3) * 12 * beat, k * 1.4);
      step(J.r1, pose.r1 + breath, k);
      step(J.r2, tr2, m === "wave" ? 0.22 : k * 1.2, m === "wave" ? 0.6 : 0.76);
      step(J.r3, pose.r3 + Math.sin(t * 4.7 + 1) * 12 * beat, k * 1.4);

      el.armL?.setAttribute("transform", `translate(${SH_L.x} ${SH_L.y}) rotate(${f(J.l1.x)})`);
      el.foreL?.setAttribute("transform", `translate(0 ${UPPER}) rotate(${f(J.l2.x)})`);
      el.handL?.setAttribute("transform", `translate(0 ${FORE}) rotate(${f(J.l3.x)})`);
      el.armR?.setAttribute("transform", `rotate(${f(J.r1.x)})`);
      el.foreR?.setAttribute("transform", `translate(0 ${UPPER}) rotate(${f(J.r2.x)})`);
      el.handR?.setAttribute("transform", `translate(0 ${FORE}) rotate(${f(J.r3.x)})`);

      // ── body: hover, sway, lean ──
      const hover = reduced ? 0 : Math.sin(t * 1.6) * 4 - beat * 2;
      el.hover?.setAttribute("transform", `translate(0 ${f(hover)})`);
      el.shadow?.setAttribute("transform", `translate(120 262) scale(${f(1 - (hover + 4) / 45)} 1)`);
      step(J.sway, talking ? Math.sin(t * 1.25) * 2.6 + (gesture === "open" || gesture === "shrug" ? -1.5 : 0) : Math.sin(t * 0.6) * 0.8, 0.05, 0.8);
      el.torso?.setAttribute("transform", `rotate(${f(J.sway.x)} 120 206)`);

      // Thruster flame flickers and swells with the voice.
      const flick = 0.82 + Math.random() * 0.18 + beat * 0.35;
      el.flame?.setAttribute("transform", `translate(120 212) scale(${f(0.9 + beat * 0.15)} ${f(flick)})`);

      // ── head: tilt, nod, cap follow-through ──
      step(J.tilt, (talking ? Math.sin(t * 1.9) * 4.5 + (beat - 0.4) * 3 : Math.sin(t * 0.7) * 1.6) + (MOOD_TILT[m] ?? 0), 0.06, 0.8);
      step(J.nod, beat * 3 + (m === "sleep" ? 4 : 0), 0.18, 0.7);
      el.head?.setAttribute("transform", `translate(0 ${f(J.nod.x)}) rotate(${f(J.tilt.x)} 120 140)`);
      step(J.cap, -J.tilt.v * 7 - J.sway.v * 5 - J.nod.v * 2 + Math.sin(t * 2.1) * 1.2, 0.07, 0.86);
      el.cap?.setAttribute("transform", `rotate(${f(J.cap.x - 6)} 120 46)`);

      // ── face: gaze, brows, blink, mouth ──
      let gx = look.x;
      let gy = look.y;
      if (m === "thinking") {
        gx = 4;
        gy = -3;
      } else if (m === "looking") {
        gx = 1;
        gy = 3.5;
      } else if (now - pointerAt > 2500) {
        if (now > nextGlance) {
          const centre = talking || Math.random() < 0.5;
          look.x = centre ? 0 : (Math.random() * 2 - 1) * 4;
          look.y = centre ? 0 : (Math.random() * 2 - 1) * 2;
          nextGlance = now + 1400 + Math.random() * 2600;
        }
        gx = look.x;
        gy = look.y;
      }
      step(J.lx, gx, 0.12, 0.7);
      step(J.ly, gy, 0.12, 0.7);
      el.face?.setAttribute("transform", `translate(${f(J.lx.x)} ${f(J.ly.x)})`);

      step(J.brow, -beat * 3.6 + (m === "happy" ? -2.5 : 0) + (m === "listening" ? -1.5 : 0), 0.2, 0.7);
      const browTilt = m === "thinking" ? 10 : talking ? Math.sin(t * 2.3) * 4 : 0;
      el.browL?.setAttribute("transform", `translate(${EYE.l} ${f(EYE.y - 15 + J.brow.x)}) rotate(${f(-browTilt * 0.4)})`);
      el.browR?.setAttribute("transform", `translate(${EYE.r} ${f(EYE.y - 15 + J.brow.x - (m === "thinking" ? 2 : 0))}) rotate(${f(browTilt)})`);

      if (now > blinkAt) {
        blinkUntil = now + 120;
        blinkAt = now + (Math.random() < 0.2 ? 250 : 2000 + Math.random() * 3200);
      }
      const sy = now < blinkUntil ? 0.1 : m === "listening" ? 1.12 : talking ? 1 - beat * 0.12 : 1;
      blinkRef.current?.setAttribute("transform", `translate(0 ${f(EYE.y * (1 - sy))}) scale(1 ${f(sy)})`);

      // Mouth: a smiling "D" shape. Width and opening change with the sound
      // and a randomly drifting vowel, so it never looks like a flapping lid.
      if (now > nextVowel) {
        vowel = Math.random();
        nextVowel = now + 90 + Math.random() * 90;
      }
      step(J.open, talking ? beat * (6 + vowel * 6) : m === "happy" ? 3 : 0, 0.35, 0.55);
      step(J.wide, talking ? 7.5 + (1 - vowel) * 3 + beat : m === "happy" ? 10 : 8.5, 0.3, 0.6);
      const w = J.wide.x;
      const o = Math.max(0, J.open.x);
      el.mouth?.setAttribute(
        "d",
        `M${f(MOUTH.x - w)} ${MOUTH.y} Q${MOUTH.x} ${f(MOUTH.y + 4 - Math.min(o, 3))} ${f(MOUTH.x + w)} ${MOUTH.y} Q${MOUTH.x} ${f(MOUTH.y + 4 + o * 1.7)} ${f(MOUTH.x - w)} ${MOUTH.y}Z`,
      );

      bars.current.forEach((b, i) => {
        if (!b) return;
        const wob = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.7);
        const h = talking ? 3 + lvl * 15 * (0.4 + 0.6 * wob) : 2.5 + (0.5 + 0.5 * Math.sin(t * 2 + i)) * 2;
        b.setAttribute("height", f(h));
        b.setAttribute("y", f(170 - h / 2));
      });

      if (el.halo) {
        el.halo.style.opacity = String(m === "sleep" ? 0.35 : 0.55 + lvl * 0.45);
        el.halo.style.transform = `scale(${f(1 + lvl * 0.06)})`;
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
    };
  }, []);

  const eyesOpen = mood !== "sleep" && mood !== "happy";

  const arm = (side: "l" | "r") => {
    const fore = side === "l" ? foreLRef : foreRRef;
    const hand = side === "l" ? handLRef : handRRef;
    return (
      <>
        <rect x="-6.5" y="-5" width="13" height={UPPER + 9} rx="6.5" fill={url("shell")} />
        <g ref={fore}>
          <circle r="6.6" fill={url("joint")} />
          <rect x="-6" y="0" width="12" height={FORE + 2} rx="6" fill={url("shell")} />
          <g ref={hand}>
            <ellipse cx="0" cy="7.5" rx="8.6" ry="9.6" fill={url("shell")} />
            <ellipse cx="6.8" cy="3.5" rx="3.3" ry="5.2" transform="rotate(28 6.8 3.5)" fill={url("shell")} />
            <path d="M-5.5 12 Q0 15.5 5.5 12" stroke="#9fb0bf" strokeWidth="1" fill="none" opacity="0.6" />
          </g>
        </g>
        <circle r="7.2" fill={url("joint")} />
      </>
    );
  };

  return (
    <div className="relative aspect-[24/29] w-full select-none">
      <div
        ref={haloRef}
        aria-hidden
        className="absolute inset-[-6%] rounded-full transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(62,207,142,.32), rgba(78,168,222,.12) 38%, rgba(255,190,110,.06) 52%, transparent 66%)",
        }}
      />
      <svg ref={rootRef} viewBox="0 0 240 290" className="relative h-full w-full overflow-visible" role="img" aria-label="Solar Saathi">
        <defs>
          <linearGradient id={id("shell")} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#e8eff5" />
            <stop offset="1" stopColor="#b7c6d4" />
          </linearGradient>
          <linearGradient id={id("joint")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9d5e0" />
            <stop offset="1" stopColor="#8fa3b5" />
          </linearGradient>
          <linearGradient id={id("rim")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3ecf8e" stopOpacity="0" />
            <stop offset="0.82" stopColor="#3ecf8e" stopOpacity="0" />
            <stop offset="1" stopColor="#3ecf8e" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={id("warm")} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#ffb36b" stopOpacity="0.35" />
            <stop offset="0.35" stopColor="#ffb36b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("visor")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14262f" />
            <stop offset="1" stopColor="#050c10" />
          </linearGradient>
          <linearGradient id={id("cells")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a80d6" />
            <stop offset="1" stopColor="#163a66" />
          </linearGradient>
          <radialGradient id={id("flame")} cx="0.5" cy="0.2" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.3" stopColor="#b8f5d9" />
            <stop offset="0.65" stopColor="#3ecf8e" stopOpacity="0.6" />
            <stop offset="1" stopColor="#3ecf8e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("shadow")}>
            <stop offset="0" stopColor="#000" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="#0c2b20" stopOpacity="0.25" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <clipPath id={id("cellsClip")}>
            <rect x="79" y="19" width="82" height="22" rx="3" />
          </clipPath>
          <filter id={id("glow")} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse ref={shadowRef} cx="0" cy="0" rx="52" ry="8" fill={url("shadow")} />

        <g ref={hoverRef}>
          {/* hover thruster */}
          <g ref={flameRef}>
            <ellipse cx="0" cy="12" rx="9" ry="16" fill={url("flame")} />
          </g>
          <rect x="108" y="203" width="24" height="10" rx="4" fill="#7f93a3" />

          <g ref={torsoRef}>
            {/* body + chest equalizer */}
            <path d="M84 168 Q84 140 120 140 Q156 140 156 168 L154 188 Q150 210 120 210 Q90 210 86 188Z" fill={url("shell")} />
            <path d="M84 168 Q84 140 120 140 Q156 140 156 168 L154 188 Q150 210 120 210 Q90 210 86 188Z" fill={url("rim")} />
            <path d="M84 168 Q84 140 120 140 Q156 140 156 168 L154 188 Q150 210 120 210 Q90 210 86 188Z" fill={url("warm")} />
            <rect x="98" y="158" width="44" height="24" rx="9" fill={url("visor")} stroke="rgba(62,207,142,.35)" />
            <g filter={url("glow")} fill="#3ecf8e">
              {[104, 111, 118, 125, 132].map((x, i) => (
                <rect key={x} ref={(n) => { bars.current[i] = n; }} x={x} y="168" width="4" height="4" rx="2" />
              ))}
            </g>
            <circle cx="120" cy="194" r="3" fill="#e8c468" />
            <rect x="108" y="133" width="24" height="11" rx="4" fill="#8da1b2" />

            <g ref={headRef}>
              {/* solar-panel cap with follow-through */}
              <g ref={capRef}>
                <rect x="116" y="36" width="8" height="18" rx="3" fill="#9fb0bf" />
                <rect x="76" y="16" width="88" height="28" rx="5" fill="#e3eaf0" />
                <rect x="79" y="19" width="82" height="22" rx="3" fill={url("cells")} />
                <g stroke="rgba(255,255,255,.28)" strokeWidth="0.8">
                  <line x1="99.5" y1="19" x2="99.5" y2="41" />
                  <line x1="120" y1="19" x2="120" y2="41" />
                  <line x1="140.5" y1="19" x2="140.5" y2="41" />
                  <line x1="79" y1="30" x2="161" y2="30" />
                </g>
                <g clipPath={url("cellsClip")}>
                  <g className="m-shine">
                    <rect x="70" y="8" width="14" height="44" fill="#fff" opacity="0.4" transform="skewX(-22)" />
                  </g>
                </g>
                <path className="m-glint" d="M160 13 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#ffe7a3" />
              </g>

              {[54, 186].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy="95" r="11.5" fill={url("shell")} />
                  <circle className="m-ear-ring" cx={cx} cy="95" r="5.5" fill="none" stroke="#3ecf8e" strokeWidth="2.5" filter={url("glow")} />
                </g>
              ))}

              <rect x="56" y="48" width="128" height="94" rx="42" fill={url("shell")} />
              <rect x="56" y="48" width="128" height="94" rx="42" fill={url("rim")} />
              <rect x="56" y="48" width="128" height="94" rx="42" fill={url("warm")} />
              <ellipse cx="88" cy="60" rx="20" ry="6" fill="#fff" opacity="0.8" transform="rotate(-12 88 60)" />

              <rect x="68" y="62" width="104" height="66" rx="30" fill={url("visor")} stroke="rgba(62,207,142,.22)" />
              <path d="M84 72 Q120 62 156 72" stroke="rgba(255,255,255,.1)" strokeWidth="3" strokeLinecap="round" fill="none" />

              <g ref={faceRef} filter={url("glow")}>
                <g stroke="#3ecf8e" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity={mood === "sleep" ? 0 : 0.9}>
                  <path ref={browLRef} d="M-7 2 Q0 -2.5 7 2" />
                  <path ref={browRRef} d="M-7 2 Q0 -2.5 7 2" />
                </g>
                {eyesOpen && (
                  <g ref={blinkRef}>
                    <rect x={EYE.l - 6.5} y={EYE.y - 10} width="13" height="20" rx="6.5" fill="#3ecf8e" />
                    <rect x={EYE.r - 6.5} y={EYE.y - 10} width="13" height="20" rx="6.5" fill="#3ecf8e" />
                    <circle cx={EYE.l + 2.5} cy={EYE.y - 5} r="1.9" fill="#eafff5" />
                    <circle cx={EYE.r + 2.5} cy={EYE.y - 5} r="1.9" fill="#eafff5" />
                  </g>
                )}
                {mood === "happy" && (
                  <g stroke="#3ecf8e" strokeWidth="4" strokeLinecap="round" fill="none">
                    <path d={`M${EYE.l - 8} ${EYE.y + 4} Q${EYE.l} ${EYE.y - 8} ${EYE.l + 8} ${EYE.y + 4}`} />
                    <path d={`M${EYE.r - 8} ${EYE.y + 4} Q${EYE.r} ${EYE.y - 8} ${EYE.r + 8} ${EYE.y + 4}`} />
                  </g>
                )}
                {mood === "sleep" && (
                  <g stroke="#3ecf8e" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.8">
                    <path d={`M${EYE.l - 8} ${EYE.y} Q${EYE.l} ${EYE.y + 7} ${EYE.l + 8} ${EYE.y}`} />
                    <path d={`M${EYE.r - 8} ${EYE.y} Q${EYE.r} ${EYE.y + 7} ${EYE.r + 8} ${EYE.y}`} />
                  </g>
                )}
                <path ref={mouthRef} d="M111 111 Q120 115 129 111 Q120 115 111 111Z" fill="#1d8a5b" stroke="#3ecf8e" strokeWidth="2.6" strokeLinejoin="round" />
              </g>
              <ellipse cx="84" cy="108" rx="6.5" ry="3.6" fill="#ffb27a" opacity="0.32" />
              <ellipse cx="156" cy="108" rx="6.5" ry="3.6" fill="#ffb27a" opacity="0.32" />
            </g>

            {/* arms in front of the body */}
            <g ref={armLRef} transform={`translate(${SH_L.x} ${SH_L.y})`}>
              {arm("l")}
            </g>
            <g transform={`translate(${SH_R.x} ${SH_R.y}) scale(-1 1)`}>
              <g ref={armRRef}>{arm("r")}</g>
            </g>
          </g>

          {mood === "sleep" && (
            <g className="m-zzz" fill="#b8f5d9" fontWeight="700" fontFamily="var(--font-grotesk), sans-serif">
              <text x="172" y="52" fontSize="12">z</text>
              <text x="172" y="52" fontSize="15" style={{ animationDelay: "0.85s" }}>z</text>
              <text x="172" y="52" fontSize="18" style={{ animationDelay: "1.7s" }}>Z</text>
            </g>
          )}
          {mood === "thinking" && (
            <g className="m-dots" fill="#b8f5d9">
              <circle cx="176" cy="40" r="3" />
              <circle cx="186" cy="33" r="3" style={{ animationDelay: "0.15s" }} />
              <circle cx="196" cy="26" r="3" style={{ animationDelay: "0.3s" }} />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
