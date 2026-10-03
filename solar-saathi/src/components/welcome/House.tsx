// The solar home: gable front, sun-lit side wall, rooftop panels with a
// travelling glare, energy flowing panels → inverter → home, windows that
// light up. Animation classes live in globals.css (.house-*).

// Panels are drawn in the roof plane's own 0–100 space and mapped onto it.
const ROOF = "matrix(1.12 -0.14 0.52 0.45 74 77)";
const COLS = 4;
const ROWS = 2;
const PANELS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { x: 6 + c * 22.75, y: 12 + r * 38, w: 19.75, h: 36 };
});

export function House({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 250 204" className={className} aria-hidden>
      <defs>
        <linearGradient id="h-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#30304a" />
          <stop offset="1" stopColor="#1f2033" />
        </linearGradient>
        <linearGradient id="h-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6a4862" />
          <stop offset="1" stopColor="#9a6464" />
        </linearGradient>
        <linearGradient id="h-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4189e0" />
          <stop offset="1" stopColor="#163a6d" />
        </linearGradient>
        <linearGradient id="h-glare" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe2b0" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff6e2" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffe2b0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="h-lamp">
          <stop offset="0" stopColor="#ffd68a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd68a" stopOpacity="0" />
        </radialGradient>
        <clipPath id="h-roof-clip">
          <rect x="0" y="0" width="100" height="100" />
        </clipPath>
        <filter id="h-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="132" cy="198" rx="122" ry="6" fill="#000" opacity="0.4" />

      {/* chimney behind the roof */}
      <rect x="150" y="48" width="12" height="26" fill="#3a3048" />
      <rect x="148" y="45" width="16" height="5" rx="1" fill="#4a3d5a" />

      {/* walls */}
      <polygon points="120,198 120,120 232,106 232,184" fill="url(#h-side)" />
      <polygon points="28,198 28,120 74,80 120,120 120,198" fill="url(#h-front)" />
      <line x1="120" y1="120" x2="120" y2="198" stroke="#ffb27a" strokeOpacity="0.35" strokeWidth="1" />

      {/* roof plane with solar panels */}
      <polygon points="74,77 186,63 238,108 126,122" fill="#2a2235" />
      <g transform={ROOF}>
        {PANELS.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="0.8" fill="url(#h-panel)" stroke="#a9cdf4" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
            <g stroke="#fff" strokeOpacity="0.22" strokeWidth="0.5" vectorEffect="non-scaling-stroke">
              <line x1={p.x + p.w / 3} y1={p.y} x2={p.x + p.w / 3} y2={p.y + p.h} />
              <line x1={p.x + (2 * p.w) / 3} y1={p.y} x2={p.x + (2 * p.w) / 3} y2={p.y + p.h} />
              <line x1={p.x} y1={p.y + p.h / 3} x2={p.x + p.w} y2={p.y + p.h / 3} />
              <line x1={p.x} y1={p.y + (2 * p.h) / 3} x2={p.x + p.w} y2={p.y + (2 * p.h) / 3} />
            </g>
          </g>
        ))}
        <rect className="house-warm" x="0" y="0" width="100" height="100" fill="#ffb066" />
        <g clipPath="url(#h-roof-clip)">
          <rect className="house-glare" x="-30" y="-10" width="16" height="120" fill="url(#h-glare)" />
        </g>
      </g>
      <line x1="74" y1="77" x2="186" y2="63" stroke="#ffd59a" strokeWidth="1.8" strokeOpacity="0.85" />
      <line x1="126" y1="122" x2="238" y2="108" stroke="#1c1726" strokeWidth="3" strokeLinecap="round" />
      <polyline points="22,124 74,76 126,124" fill="none" stroke="#1c1726" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      {/* windows + door */}
      <g className="house-window" filter="url(#h-glow)">
        <circle cx="74" cy="104" r="8" />
        <rect x="36" y="140" width="18" height="20" rx="1.5" />
        <polygon points="142,140 168,137 168,160 142,163" />
        <polygon points="190,134 216,131 216,154 190,157" style={{ animationDelay: "3.1s" }} />
      </g>
      <g stroke="#2a2235" strokeWidth="1.3" fill="none">
        <line x1="74" y1="96" x2="74" y2="112" />
        <line x1="66" y1="104" x2="82" y2="104" />
        <line x1="45" y1="140" x2="45" y2="160" />
        <line x1="155" y1="138.5" x2="155" y2="161.5" />
        <line x1="142" y1="151.5" x2="168" y2="148.5" />
        <line x1="203" y1="132.5" x2="203" y2="155.5" />
        <line x1="190" y1="145.5" x2="216" y2="142.5" />
      </g>
      <rect x="60" y="150" width="26" height="48" rx="2" fill="#16141f" stroke="#3a3450" strokeWidth="1.2" />
      <circle cx="81" cy="175" r="1.6" fill="#e8c468" />
      <circle className="house-lamp" cx="95" cy="150" r="9" fill="url(#h-lamp)" />
      <circle cx="95" cy="150" r="2.4" fill="#ffd68a" />
      <polygon points="56,198 90,198 96,203 50,203" fill="#2c2738" />

      {/* inverter + energy flow */}
      <polygon points="125,150 136,148.6 136,166 125,167.4" fill="#d9e1e9" />
      <circle className="house-led" cx="130.5" cy="153" r="1.4" fill="#3ecf8e" />
      <g className="house-energy" fill="none" strokeLinecap="round" filter="url(#h-glow)">
        <path d="M134 122 C 135 132, 132 140, 131 148" stroke="#ffd36b" strokeWidth="2" />
        <path d="M136 160 C 146 161, 150 154, 155 151" stroke="#7ff0bd" strokeWidth="2" />
      </g>

      {/* garden */}
      <ellipse cx="34" cy="195" rx="15" ry="8" fill="#1d2a25" />
      <ellipse cx="34" cy="192" rx="11" ry="5" fill="#2a3d33" />
      <ellipse cx="108" cy="196" rx="10" ry="5.5" fill="#1d2a25" />
      <ellipse cx="226" cy="186" rx="16" ry="8" fill="#1d2a25" />
      <ellipse cx="226" cy="183" rx="11" ry="5" fill="#2a3d33" />
    </svg>
  );
}
