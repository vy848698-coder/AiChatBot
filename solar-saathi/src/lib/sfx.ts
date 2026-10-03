// Tiny synthesized UI sounds, so no audio files are needed for taps and chimes.

import { audioCtx } from "./audio";

type Note = [freq: number, start: number, dur: number];

let muted = false;

function play(notes: Note[], type: OscillatorType, gain: number) {
  const ctx = audioCtx();
  if (muted || !ctx) return;
  const now = ctx.currentTime;
  for (const [freq, start, dur] of notes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + start);
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(gain, now + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  }
}

export const sfx = {
  setMuted(m: boolean) {
    muted = m;
  },
  tap: () => play([[880, 0, 0.07]], "sine", 0.04),
  pop: () => play([[620, 0, 0.06], [930, 0.04, 0.08]], "sine", 0.035),
  select: () => play([[660, 0, 0.12], [990, 0.07, 0.18]], "sine", 0.05),
  start: () => play([[523, 0, 0.18], [784, 0.09, 0.22], [1047, 0.18, 0.3]], "sine", 0.045),
  success: () =>
    play([[523, 0, 0.16], [659, 0.08, 0.16], [784, 0.16, 0.18], [1047, 0.26, 0.4]], "triangle", 0.05),
  error: () => play([[300, 0, 0.12], [220, 0.1, 0.2]], "triangle", 0.05),
};
