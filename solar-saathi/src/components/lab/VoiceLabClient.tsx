"use client";

import dynamic from "next/dynamic";

// The lab leans on browser-only APIs (localStorage, speech, mic), so it is
// rendered in the browser only.
const VoiceLab = dynamic(() => import("./VoiceLab"), { ssr: false });

export default function VoiceLabClient() {
  return <VoiceLab />;
}
