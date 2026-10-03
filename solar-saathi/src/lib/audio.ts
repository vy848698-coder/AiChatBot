// One AudioContext for the whole app (UI sounds + Saathi's voice). It must be
// created/resumed inside the first user tap, or iOS keeps it suspended.

let ctx: AudioContext | null = null;

export function audioCtx() {
  // A context the browser suspended (e.g. after an app switch) is resumed on
  // the next use; resume() is a no-op when already running.
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

// Without a tap, browsers usually keep audio suspended. Some allow it (e.g.
// returning visitors in Chrome). Returns true when sound can play right now.
export async function tryStartAudio() {
  try {
    const policy = (navigator as Navigator & { getAutoplayPolicy?: (t: string) => string }).getAutoplayPolicy?.("audiocontext");
    if (policy === "disallowed") return false;
    if (!ctx) {
      const C =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
    }
    if (ctx.state !== "running") await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 300))]);
    return ctx.state === "running";
  } catch {
    return false;
  }
}

export function unlockAudio() {
  try {
    if (!ctx) {
      const C =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
    }
    void ctx.resume();
    // A 1-sample silent blip fully unlocks output on strict engines.
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, 22050);
    s.connect(ctx.destination);
    s.start(0);
  } catch {
    /* no Web Audio: UI sounds and cloud voice are skipped */
  }
}
