"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Mascot, type MascotMood } from "./Mascot";
import type { Framing } from "./Mascot3D";

// The 3D Saathi (three.js) loads on demand; devices without WebGL get the
// 2D SVG version of the same character.
const Mascot3D = dynamic(() => import("./Mascot3D"), { ssr: false, loading: () => null });

let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl === null) {
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}
const noop = () => () => {};

// `framing="bust"` is a close-up of head and chest (used on phones so his face
// and mouth stay large); the container's aspect ratio is set by the parent.
export function Saathi({ mood, framing = "full", className = "aspect-[24/29] w-full" }: { mood: MascotMood; framing?: Framing; className?: string }) {
  const gl = useSyncExternalStore(noop, hasWebGL, () => null);

  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden
        className="absolute inset-[-4%] rounded-full"
        style={{ background: "radial-gradient(circle at 50% 45%, rgba(62,207,142,.26), rgba(255,180,100,.08) 45%, transparent 66%)" }}
      />
      {gl === null ? null : gl ? (
        <div className="absolute inset-0">
          <Mascot3D mood={mood} framing={framing} />
        </div>
      ) : (
        <Mascot mood={mood} />
      )}
    </div>
  );
}
