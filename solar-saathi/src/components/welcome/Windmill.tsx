// A wind turbine whose rotor spins (CSS, .ws-rotor). `speed` = seconds per turn.
export function Windmill({ className = "", speed = 6, delay = 0 }: { className?: string; speed?: number; delay?: number }) {
  return (
    <svg viewBox="0 0 100 210" className={className} aria-hidden>
      <defs>
        <linearGradient id="wm-tower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a69cb8" />
          <stop offset="0.55" stopColor="#efe9f1" />
          <stop offset="1" stopColor="#ffd7b8" />
        </linearGradient>
        <linearGradient id="wm-blade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c8c0d4" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9dfe6" />
        </linearGradient>
      </defs>
      <polygon points="47.5,58 52.5,58 55.5,210 44.5,210" fill="url(#wm-tower)" />
      <rect x="43" y="50.5" width="17" height="9" rx="3.5" fill="#efe9f1" />
      <g className="ws-rotor" style={{ animationDuration: `${speed}s`, animationDelay: `${delay}s` }}>
        {[0, 120, 240].map((a) => (
          <path
            key={a}
            transform={`rotate(${a} 50 55)`}
            d="M50 55 C46.6 42 47.2 20 49.2 3 C50.6 2.4 51.6 3 52 4 C53.4 22 53.6 42 50 55Z"
            fill="url(#wm-blade)"
          />
        ))}
        <circle cx="50" cy="55" r="4" fill="#f7f3f8" stroke="#b7aec4" strokeWidth="0.8" />
      </g>
    </svg>
  );
}
