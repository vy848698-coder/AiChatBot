"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { voice } from "@/lib/voice";
import type { MascotMood } from "./Mascot";

// ── 3D Saathi ────────────────────────────────────────────────────────────
// Built from primitives (no model file to download) and lit like a product
// shot: warm key light (sunrise), green rim light, glossy reflections.
// The face is a canvas texture redrawn every frame, so brows, eyes and the
// mouth animate freely with the voice. Arms are a shoulder → elbow → wrist
// chain driven by springs; while speaking he cycles conversational gestures
// and his forearms beat with the loudness of each syllable.

type Arm = { out: number; fwd: number; elbow: number; ez: number; wrist: number };
const A = (out: number, fwd: number, elbow: number, ez = 0, wrist = 0): Arm => ({ out, fwd, elbow, ez, wrist });
const REST = A(11, 4, 14);

const POSES = {
  rest: { l: REST, r: REST },
  explain: { l: A(16, 40, 84, 0, -12), r: A(20, 34, 92, 0, -16) },
  open: { l: A(50, 28, 40, 0, -26), r: A(50, 28, 40, 0, -26) },
  leftUp: { l: A(18, 50, 110, 0, -18), r: A(10, 8, 18) },
  rightUp: { l: A(10, 8, 18), r: A(18, 50, 110, 0, -18) },
  present: { l: A(10, 10, 22), r: A(34, 62, 24, 0, -30) },
  count: { l: A(14, 42, 98), r: A(20, 30, 114, 0, 14) },
  shrug: { l: A(42, 22, 74, 0, 34), r: A(42, 22, 74, 0, 34) },
  wave: { l: A(10, 8, 18), r: A(140, 8, 0, 30) },
  happy: { l: A(150, 10, 0, 12), r: A(150, 10, 0, 12) },
  listen: { l: A(10, 8, 18), r: A(112, 24, 120) },
  think: { l: A(12, 34, 90), r: A(10, 58, 134, 0, 20) },
  looking: { l: A(14, 38, 88, 0, -10), r: A(14, 38, 88, 0, -10) },
  sleep: { l: A(4, 2, 6), r: A(4, 2, 6) },
} satisfies Record<string, { l: Arm; r: Arm }>;
type PoseName = keyof typeof POSES;

const TALK: PoseName[] = ["explain", "open", "leftUp", "rightUp", "present", "count", "shrug", "explain"];
const MOOD_POSE: Partial<Record<MascotMood, PoseName>> = {
  wave: "wave",
  happy: "happy",
  listening: "listen",
  thinking: "think",
  sleep: "sleep",
  looking: "looking",
};

const D = THREE.MathUtils.degToRad;
type Spring = { x: number; v: number };
const sp = (x = 0): Spring => ({ x, v: 0 });
function step(s: Spring, target: number, k = 0.09, damp = 0.76) {
  s.v = (s.v + (target - s.x) * k) * damp;
  s.x += s.v;
  return s.x;
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function plate(w: number, h: number, r: number, depth: number) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 4,
    curveSegments: 18,
  });
  g.center();
  return g;
}

// ── face texture ──
type Face = {
  gx: number; gy: number; blink: number; brow: number; browTilt: number;
  open: number; round: number; wide: number; hiss: number; smile: number; mood: MascotMood;
};
const FW = 384;
const FH = 240;
const G = "#4dffb0";

function drawFace(ctx: CanvasRenderingContext2D, f: Face) {
  ctx.clearRect(0, 0, FW, FH);
  ctx.save();
  ctx.translate(f.gx * 9, f.gy * 6);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(62,255,160,0.95)";
  ctx.shadowBlur = 18;
  ctx.strokeStyle = G;
  ctx.fillStyle = G;

  const EL = 124;
  const ER = 260;
  const EY = 90;

  if (f.mood !== "sleep") {
    ([[EL, -f.browTilt * 0.4], [ER, f.browTilt]] as const).forEach(([x, tilt]) => {
      ctx.save();
      ctx.translate(x, 38 + f.brow * 5);
      ctx.rotate(D(tilt));
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-22, 7);
      ctx.quadraticCurveTo(0, -7, 22, 7);
      ctx.stroke();
      ctx.restore();
    });
  }

  if (f.mood === "happy") {
    ctx.lineWidth = 11;
    [EL, ER].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x - 22, EY + 12);
      ctx.quadraticCurveTo(x, EY - 22, x + 22, EY + 12);
      ctx.stroke();
    });
  } else if (f.mood === "sleep") {
    ctx.lineWidth = 9;
    [EL, ER].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x - 22, EY);
      ctx.quadraticCurveTo(x, EY + 20, x + 22, EY);
      ctx.stroke();
    });
  } else {
    // Eyes squash a little when he smiles, like cheeks pushing up.
    const h = Math.max(5, 58 * f.blink * (1 - f.smile * 0.18));
    [EL, ER].forEach((x) => {
      ctx.beginPath();
      ctx.roundRect(x - 18, EY - h / 2, 36, h, 18);
      ctx.fill();
    });
    if (f.blink > 0.5) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#eafff5";
      [EL, ER].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x + 7, EY - 14, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 18;
    }
  }

  drawMouth(ctx, f);
  ctx.restore();

  // cheeks lift with the smile
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,160,120,${0.28 + f.smile * 0.15})`;
  [80, 304].forEach((x) => {
    ctx.beginPath();
    ctx.ellipse(x, 150 - f.smile * 6, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Viseme mouth: `open` = jaw drop, `round` = o/u, `wide` = e/i, `hiss` = s/f
// (teeth together, lips apart). Glowing lips; inside a dark mouth with upper
// teeth and a tongue.
function drawMouth(ctx: CanvasRenderingContext2D, f: Face) {
  const cx = 192;
  const y = 172;
  const hw = 34 + f.wide * 18 - f.round * 15 + f.hiss * 6 + f.smile * 6;
  const h = Math.max(0, f.open * 58 * (0.75 + f.round * 0.45) * (1 - f.hiss * 0.55));
  const lift = 5 + f.smile * 6; // corners up = friendly

  if (h < 3) {
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - hw, y - lift);
    ctx.quadraticCurveTo(cx, y + 14 + f.smile * 4, cx + hw, y - lift);
    ctx.stroke();
    return;
  }

  const top = y - h * 0.32;
  const bot = y + h * 0.68;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(cx - hw, y - lift);
    ctx.bezierCurveTo(cx - hw * 0.55, top - 3, cx + hw * 0.55, top - 3, cx + hw, y - lift);
    ctx.bezierCurveTo(cx + hw * 0.8 - f.round * 6, bot + h * 0.12, cx - hw * 0.8 + f.round * 6, bot + h * 0.12, cx - hw, y - lift);
    ctx.closePath();
  };

  ctx.save();
  shape();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#04140d";
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#effff7";
  ctx.beginPath();
  ctx.roundRect(cx - hw * 0.72, top - 6, hw * 1.44, Math.min(13, 6 + h * 0.22), 5);
  ctx.fill();
  if (h > 16) {
    ctx.fillStyle = "#ff8aa0";
    ctx.beginPath();
    ctx.ellipse(cx, bot - 1, hw * 0.55, Math.min(16, h * 0.3), 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();

  shape();
  ctx.lineWidth = 6.5;
  ctx.stroke();
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function cellsTexture() {
  const c = makeCanvas(256, 96);
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 256, 96);
  grad.addColorStop(0, "#3d86e0");
  grad.addColorStop(1, "#143768");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 96);
  g.strokeStyle = "rgba(255,255,255,.35)";
  g.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) g.strokeRect(x, 0, 0, 96);
  g.strokeRect(0, 48, 256, 0);
  g.strokeStyle = "rgba(255,255,255,.12)";
  g.lineWidth = 1;
  for (let x = 16; x < 256; x += 32) g.strokeRect(x, 0, 0, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(inner: string, outer: string) {
  const c = makeCanvas(128, 128);
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Egg-shaped body from a lathe profile.
function bodyGeometry() {
  const pts = [
    [0, -0.82], [0.36, -0.79], [0.62, -0.64], [0.76, -0.38], [0.8, -0.08],
    [0.77, 0.2], [0.66, 0.44], [0.46, 0.6], [0.2, 0.68], [0, 0.69],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const curve = new THREE.SplineCurve(pts);
  return new THREE.LatheGeometry(curve.getPoints(48), 48);
}

function Robot({ mood }: { mood: MascotMood }) {
  const moodRef = useRef(mood);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const hover = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const shL = useRef<THREE.Group>(null);
  const elL = useRef<THREE.Group>(null);
  const haL = useRef<THREE.Group>(null);
  const shR = useRef<THREE.Group>(null);
  const elR = useRef<THREE.Group>(null);
  const haR = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Group>(null);
  const flameLight = useRef<THREE.PointLight>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const glint = useRef<THREE.Sprite>(null);

  const res = useMemo(() => {
    const faceCanvas = makeCanvas(FW, FH);
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    return {
      faceCanvas,
      faceCtx: faceCanvas.getContext("2d")!,
      faceTex,
      cells: cellsTexture(),
      flameTex: glowTexture("rgba(220,255,240,1)", "rgba(62,207,142,0)"),
      shadowTex: glowTexture("rgba(0,0,0,0.6)", "rgba(0,0,0,0)"),
      glintTex: glowTexture("rgba(255,240,200,1)", "rgba(255,200,120,0)"),
      body: bodyGeometry(),
      visor: plate(2.16, 1.46, 0.58, 0.16),
      chest: plate(0.66, 0.36, 0.15, 0.06),
      shell: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.35 }),
      joint: new THREE.MeshStandardMaterial({ color: "#8fa4b6", metalness: 0.65, roughness: 0.32 }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#04090c", roughness: 0.06, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03 }),
      glow: new THREE.MeshBasicMaterial({ color: "#4dffb0", toneMapped: false }),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(res).forEach((v) => (v as { dispose?: () => void })?.dispose?.());
    },
    [res],
  );

  const st = useRef({
    l: { out: sp(9), fwd: sp(4), elbow: sp(14), ez: sp(), wrist: sp() },
    r: { out: sp(9), fwd: sp(4), elbow: sp(14), ez: sp(), wrist: sp() },
    sway: sp(), lean: sp(), yaw: sp(), pitch: sp(), roll: sp(), nod: sp(), capX: sp(), capZ: sp(),
    brow: sp(), open: sp(), round: sp(), wide: sp(), hiss: sp(), smile: sp(0.5), gx: sp(), gy: sp(),
    gesture: "rest" as PoseName, nextGesture: 0,
    blinkAt: 1.6, blinkUntil: 0, glanceAt: 0, look: { x: 0, y: 0 }, pointerAt: -99,
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = st.current;
      s.look.x = (e.clientX / innerWidth) * 2 - 1;
      s.look.y = (e.clientY / innerHeight) * 2 - 1;
      s.pointerAt = performance.now() / 1000;
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => removeEventListener("pointermove", onMove);
  }, []);

  // three.js objects are mutated every frame by design (R3F's render loop).
  // eslint-disable-next-line react-hooks/immutability
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const now = performance.now() / 1000;
    const s = st.current;
    const m = moodRef.current;
    const lvl = voice.level;
    const talking = voice.speaking || lvl > 0.04;
    const beat = talking ? lvl : 0;

    // ── pose selection ──
    let pose = POSES.rest;
    const forced = MOOD_POSE[m];
    if (forced && !(talking && m === "looking")) pose = POSES[forced];
    else if (talking) {
      if (t > s.nextGesture) {
        const opts = TALK.filter((g) => g !== s.gesture);
        s.gesture = opts[Math.floor(Math.random() * opts.length)];
        s.nextGesture = t + 1.0 + Math.random() * 1.5;
      }
      pose = POSES[s.gesture];
    } else s.gesture = "rest";

    const breathe = talking ? 0 : Math.sin(t * 1.3) * 2;
    const arm = (side: "l" | "r", target: Arm, g: THREE.Group | null, e: THREE.Group | null, h: THREE.Group | null, sign: number) => {
      const a = s[side];
      const phase = side === "l" ? 0 : 1.3;
      let ez = target.ez;
      if (side === "r" && m === "wave") ez = target.ez + Math.sin(t * 9) * 28;
      if (m === "happy") ez = target.ez + Math.sin(t * 7 + phase) * 10;
      const wave = side === "r" && m === "wave";
      step(a.out, target.out + breathe, 0.08);
      step(a.fwd, target.fwd + beat * 6, 0.08);
      step(a.elbow, target.elbow + (target.elbow > 30 ? beat * 22 : 0), 0.1);
      step(a.ez, ez, wave ? 0.22 : 0.1, wave ? 0.6 : 0.76);
      step(a.wrist, target.wrist + Math.sin(t * 5.2 + phase) * 14 * beat, 0.14);
      g?.rotation.set(-D(a.fwd.x), 0, sign * D(a.out.x));
      e?.rotation.set(-D(a.elbow.x), 0, sign * D(a.ez.x));
      h?.rotation.set(-D(a.wrist.x), 0, 0);
    };
    arm("l", pose.l, shL.current, elL.current, haL.current, -1);
    arm("r", pose.r, shR.current, elR.current, haR.current, 1);

    // ── body ──
    const hy = Math.sin(t * 1.6) * 0.08 - beat * 0.05;
    if (hover.current) hover.current.position.y = hy;
    step(s.sway, talking ? Math.sin(t * 1.2) * 0.05 : Math.sin(t * 0.6) * 0.015, 0.05, 0.8);
    step(s.lean, talking ? 0.05 + beat * 0.04 : 0, 0.05, 0.8);
    torso.current?.rotation.set(s.lean.x, Math.sin(t * 0.5) * 0.06, s.sway.x);

    // ── head: look at pointer, glance, nod and tilt ──
    let lx = 0;
    let ly = 0;
    if (now - s.pointerAt < 2.5) {
      lx = s.look.x;
      ly = s.look.y;
    } else if (t > s.glanceAt) {
      s.look.x = talking ? (Math.random() * 2 - 1) * 0.25 : Math.random() < 0.5 ? 0 : Math.random() * 2 - 1;
      s.look.y = (Math.random() * 2 - 1) * 0.3;
      s.glanceAt = t + 1.4 + Math.random() * 2.6;
    }
    if (now - s.pointerAt >= 2.5) {
      lx = s.look.x;
      ly = s.look.y;
    }
    if (m === "thinking") {
      lx = 0.6;
      ly = -0.6;
    } else if (m === "looking") {
      lx = 0.15;
      ly = 0.5;
    }
    step(s.yaw, lx * 0.45 + (talking ? Math.sin(t * 0.9) * 0.1 : 0), 0.06, 0.8);
    step(s.pitch, ly * 0.22 + (m === "sleep" ? 0.25 : 0), 0.06, 0.8);
    step(s.nod, beat * 0.11, 0.2, 0.7);
    step(s.roll, (talking ? Math.sin(t * 1.9) * 0.07 : Math.sin(t * 0.7) * 0.025) + (m === "thinking" ? 0.12 : m === "listening" ? -0.14 : 0), 0.06, 0.8);
    head.current?.rotation.set(s.pitch.x + s.nod.x, s.yaw.x, -s.roll.x);
    step(s.capZ, -s.roll.v * 6 - s.sway.v * 5 + Math.sin(t * 2.1) * 0.02, 0.07, 0.86);
    step(s.capX, -s.nod.v * 4 - s.pitch.v * 3, 0.07, 0.86);
    cap.current?.rotation.set(0.42 + s.capX.x, 0, -0.1 + s.capZ.x);

    // ── thruster ──
    const flick = 0.85 + Math.random() * 0.2 + beat * 0.4;
    flame.current?.scale.set(1 + beat * 0.2, flick, 1);
    if (flameLight.current) flameLight.current.intensity = 2.2 + flick * 1.5;
    shadow.current?.scale.setScalar(1.6 - hy * 1.6);

    bars.current.forEach((b, i) => {
      if (!b) return;
      const wob = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.7);
      b.scale.y = talking ? 1 + lvl * 7 * (0.4 + 0.6 * wob) : 1 + (0.5 + 0.5 * Math.sin(t * 2 + i)) * 0.8;
    });
    if (glint.current) {
      const p = (t % 4.6) / 4.6;
      const o = p > 0.7 && p < 0.9 ? Math.sin(((p - 0.7) / 0.2) * Math.PI) : 0;
      glint.current.material.opacity = o;
      glint.current.scale.setScalar(0.25 + o * 0.25);
    }

    // ── face ──
    if (t > s.blinkAt) {
      s.blinkUntil = t + 0.12;
      s.blinkAt = t + (Math.random() < 0.2 ? 0.25 : 2 + Math.random() * 3.2);
    }
    const blink = t < s.blinkUntil ? 0.08 : m === "listening" ? 1.1 : talking ? 1 - beat * 0.12 : 1;
    const bd = voice.bands;
    const sum = bd.low + bd.mid + bd.high + 1e-3;
    const quiet = lvl < 0.06; // between words the lips close
    step(s.open, talking && !quiet ? Math.min(1, lvl * 1.35) : m === "happy" ? 0.12 : 0, 0.45, 0.5);
    step(s.round, talking ? Math.min(1, Math.max(0, (bd.low / sum - 0.38) * 2.6)) : 0, 0.3, 0.6);
    step(s.wide, talking ? Math.min(1, Math.max(0, (bd.mid / sum - 0.3) * 2.6)) : 0, 0.3, 0.6);
    step(s.hiss, talking ? Math.min(1, Math.max(0, (bd.high / sum - 0.22) * 3)) * (lvl < 0.4 ? 1 : 0.4) : 0, 0.35, 0.55);
    step(s.smile, m === "happy" ? 1 : talking ? 0.35 : 0.5, 0.08, 0.8);
    step(s.brow, -beat * 1.1 + (m === "happy" ? -0.7 : 0) + (m === "listening" ? -0.4 : 0), 0.2, 0.7);
    step(s.gx, s.yaw.x * 2.2, 0.2, 0.7);
    step(s.gy, s.pitch.x * 2.5, 0.2, 0.7);
    drawFace(res.faceCtx, {
      gx: s.gx.x, gy: s.gy.x, blink, brow: s.brow.x * 3,
      browTilt: m === "thinking" ? 12 : talking ? Math.sin(t * 2.3) * 5 : 0,
      open: s.open.x, round: s.round.x, wide: s.wide.x, hiss: s.hiss.x, smile: s.smile.x, mood: m,
    });
    // eslint-disable-next-line react-hooks/immutability
    res.faceTex.needsUpdate = true;
  });

  const armRig = (side: "l" | "r") => {
    const x = side === "l" ? -0.86 : 0.86;
    const [sh, el, ha] = side === "l" ? [shL, elL, haL] : [shR, elR, haR];
    const thumb = side === "l" ? 0.13 : -0.13;
    return (
      <group ref={sh} position={[x, -0.02, 0]}>
        <mesh material={res.joint}>
          <sphereGeometry args={[0.2, 24, 24]} />
        </mesh>
        <mesh position={[0, -0.32, 0]} material={res.shell}>
          <capsuleGeometry args={[0.16, 0.42, 8, 20]} />
        </mesh>
        <group ref={el} position={[0, -0.62, 0]}>
          <mesh material={res.joint}>
            <sphereGeometry args={[0.165, 20, 20]} />
          </mesh>
          <mesh position={[0, -0.28, 0]} material={res.shell}>
            <capsuleGeometry args={[0.145, 0.36, 8, 20]} />
          </mesh>
          <group ref={ha} position={[0, -0.56, 0]}>
            <mesh position={[0, -0.13, 0]} scale={[1, 1.1, 0.82]} material={res.shell}>
              <sphereGeometry args={[0.21, 24, 24]} />
            </mesh>
            <mesh position={[thumb, -0.06, 0.08]} rotation={[0.3, 0, -thumb * 4]} material={res.shell}>
              <capsuleGeometry args={[0.06, 0.12, 6, 12]} />
            </mesh>
          </group>
        </group>
      </group>
    );
  };

  return (
    <group position={[0, -0.25, 0]}>
      <mesh ref={shadow} position={[0, -2.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.7]} />
        <meshBasicMaterial map={res.shadowTex} transparent depthWrite={false} />
      </mesh>

      <group ref={hover}>
        {/* thruster */}
        <mesh position={[0, -1.45, 0]} material={res.joint}>
          <cylinderGeometry args={[0.2, 0.27, 0.22, 24]} />
        </mesh>
        <group ref={flame} position={[0, -1.56, 0]}>
          <group position={[0, -0.32, 0]}>
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.19, 0.62, 24, 1, true]} />
              <meshBasicMaterial color="#7dffc8" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
          <sprite position={[0, -0.2, 0]} scale={[0.9, 1.1, 1]}>
            <spriteMaterial map={res.flameTex} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
        <pointLight ref={flameLight} position={[0, -1.9, 0.3]} color="#4dffb0" distance={3} intensity={3} />

        <group ref={torso} position={[0, 0, 0]}>
          {/* body + chest screen */}
          <mesh geometry={res.body} position={[0, -0.6, 0]} scale={[1, 1, 0.86]} material={res.shell} />
          <mesh geometry={res.chest} position={[0, -0.5, 0.64]} rotation={[-0.08, 0, 0]} material={res.glass} />
          {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
            <mesh key={x} ref={(n) => { bars.current[i] = n; }} position={[x, -0.5, 0.74]} material={res.glow}>
              <boxGeometry args={[0.05, 0.035, 0.02]} />
            </mesh>
          ))}
          <mesh position={[0, -0.88, 0.66]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="#e8c468" emissive="#e0a040" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 0.16, 0]} material={res.joint}>
            <cylinderGeometry args={[0.22, 0.26, 0.26, 24]} />
          </mesh>

          {/* head */}
          <group ref={head} position={[0, 0.28, 0]}>
            <RoundedBox args={[2.56, 1.98, 1.62]} radius={0.7} smoothness={6} position={[0, 0.99, 0]} material={res.shell} />
            <mesh geometry={res.visor} position={[0, 0.96, 0.76]} material={res.glass} />
            <mesh position={[0, 0.96, 0.9]}>
              <planeGeometry args={[1.92, 1.2]} />
              <meshBasicMaterial map={res.faceTex} transparent toneMapped={false} />
            </mesh>
            {/* glossy glass over the face */}
            <mesh position={[0, 0.96, 0.91]}>
              <planeGeometry args={[2.02, 1.32]} />
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.06} roughness={0.05} clearcoat={1} />
            </mesh>
            {[-1, 1].map((sgn) => (
              <group key={sgn} position={[sgn * 1.31, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh material={res.shell}>
                  <cylinderGeometry args={[0.32, 0.32, 0.22, 32]} />
                </mesh>
                <mesh position={[0, sgn * -0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={res.glow}>
                  <torusGeometry args={[0.17, 0.035, 12, 32]} />
                </mesh>
              </group>
            ))}

            {/* solar-panel cap */}
            <group ref={cap} position={[0, 1.96, -0.05]}>
              <mesh position={[0, 0.16, 0]} material={res.joint}>
                <cylinderGeometry args={[0.06, 0.08, 0.34, 16]} />
              </mesh>
              <group position={[0, 0.36, 0]}>
                <RoundedBox args={[1.8, 0.08, 0.66]} radius={0.03} smoothness={3} material={res.shell} />
                <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[1.66, 0.54]} />
                  <meshPhysicalMaterial map={res.cells} metalness={0.45} roughness={0.22} clearcoat={1} />
                </mesh>
                <sprite ref={glint} position={[0.78, 0.12, 0.22]} scale={[0.3, 0.3, 1]}>
                  <spriteMaterial map={res.glintTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                </sprite>
              </group>
            </group>
          </group>

          {armRig("l")}
          {armRig("r")}
        </group>
      </group>
    </group>
  );
}

export type Framing = "full" | "bust";

const FRAMES: Record<Framing, { pos: [number, number, number]; look: [number, number, number] }> = {
  full: { pos: [0, 0, 10.8], look: [0, 0, 0] },
  bust: { pos: [0, 1.0, 6.6], look: [0, 0.85, 0] },
};

// Eases the camera between framings (close-up on phones, full body on desktop).
function CameraRig({ framing }: { framing: Framing }) {
  const camera = useThree((st) => st.camera);
  const size = useThree((st) => st.size);
  const look = useRef(new THREE.Vector3(...FRAMES[framing].look));
  const first = useRef(true);
  useFrame(() => {
    const fr = FRAMES[framing];
    // On narrow (portrait) canvases step back so the whole head stays in view.
    const aspect = size.width / Math.max(size.height, 1);
    const fit = framing === "bust" ? Math.max(1, 0.98 / aspect) : Math.max(1, 0.8 / aspect);
    const k = first.current ? 1 : 0.08;
    first.current = false;
    camera.position.lerp(new THREE.Vector3(fr.pos[0], fr.pos[1], fr.pos[2] * fit), k);
    look.current.lerp(new THREE.Vector3(...fr.look), k);
    camera.lookAt(look.current);
  });
  return null;
}

export default function Mascot3D({ mood, framing = "full" }: { mood: MascotMood; framing?: Framing }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      // Measure layout size, not the on-screen box: the fly-in animation
      // scales the parent, which would otherwise freeze the canvas tiny.
      resize={{ offsetSize: true }}
      camera={{ position: [0, 0, 10.8], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#fff0de", "#2a2140", 0.9]} />
      <directionalLight position={[4, 5, 6]} intensity={3} color="#ffe2c4" />
      <directionalLight position={[-5, 3, -3]} intensity={2} color="#6ff0bd" />
      <directionalLight position={[0, -3, 5]} intensity={0.5} color="#a9c2ff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#fff3e2" position={[3, 4, 6]} scale={[7, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#7af0c4" position={[-6, 2, -2]} scale={[4, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.6} color="#ffb070" position={[0, -3, 5]} scale={3} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1} color="#8fa8ff" position={[0, 6, -4]} scale={[8, 2, 1]} target={[0, 0, 0]} />
      </Environment>
      <CameraRig framing={framing} />
      <Robot mood={mood} />
    </Canvas>
  );
}
