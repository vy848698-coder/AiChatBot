import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type P = SVGProps<SVGSVGElement>;

export const IconBack = (p: P) => (
  <svg {...base} {...p}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 21v-1.5a5.5 5.5 0 0 1 5.5-5.5h4a5.5 5.5 0 0 1 5.5 5.5V21" /></svg>
);
export const IconPhone = (p: P) => (
  <svg {...base} {...p}><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>
);
export const IconMail = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6 8.5-6" /></svg>
);
export const IconMic = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} strokeWidth={2.6} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconLock = (p: P) => (
  <svg {...base} {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const IconGlobe = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>
);
export const IconSound = (p: P) => (
  <svg {...base} {...p}><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>
);
export const IconMute = (p: P) => (
  <svg {...base} {...p}><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></svg>
);
export const IconArrow = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconHome = (p: P) => (
  <svg {...base} {...p}><path d="M3.5 11L12 4l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></svg>
);
export const IconEdit = (p: P) => (
  <svg {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>
);
export const IconSun = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>
);
export const IconBolt = (p: P) => (
  <svg {...base} {...p}><path d="M13 2.5L4.5 13.5H12l-1 8L19.5 10.5H12z" /></svg>
);
export const IconRupee = (p: P) => (
  <svg {...base} {...p}><path d="M6.5 4h11M6.5 8.5h11M9 4c5 0 5 9 0 9H6.5l8 7" /></svg>
);
export const IconSend = (p: P) => (
  <svg {...base} strokeWidth={2.4} {...p}><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg>
);
export const IconPin = (p: P) => (
  <svg {...base} {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.6" /></svg>
);
export const IconKey = (p: P) => (
  <svg {...base} {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M16 7l3 3M14 9l2 2" /></svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base} {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconHeadset = (p: P) => (
  <svg {...base} {...p}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4.5" height="6.5" rx="1.8" /><rect x="16.5" y="13" width="4.5" height="6.5" rx="1.8" /><path d="M19 19.5c0 1.4-1.6 2-4 2h-2" /></svg>
);
export const IconWhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 1 1 6.98 3.86zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z" /></svg>
);
export const IconCallback = (p: P) => (
  <svg {...base} {...p}><path d="M6 3l3 4-2 3c2 3 3 4 6 6l3-2 4 3c-1 3-4 4-6 3C10 20 4 14 3 9 2 7 3 4 6 3z" /><path d="M15 3h6v6M21 3l-6 6" /></svg>
);
