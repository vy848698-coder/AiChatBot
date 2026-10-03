import { House } from "./House";
import { Windmill } from "./Windmill";

// Full-screen dawn landscape built from layers, so it composes well on both
// a tall phone and a wide desktop: sky → sun → clouds → hills → windmills →
// ground → house. `focus` dims it when Saathi steps forward to talk.

const STARS = (() => {
  let s = 11;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 26 }, () => ({ left: r() * 100, top: r() * 38, size: 1 + r() * 1.6, delay: r() * 4 }));
})();

export function WelcomeScene({ focus, calm = false }: { focus: boolean; calm?: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="ws-sky absolute inset-0" />
      <div className="ws-night absolute inset-0" />
      {STARS.map((st, i) => (
        <span
          key={i}
          className="ws-star absolute rounded-full bg-white"
          style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.size, height: st.size, animationDelay: `${st.delay}s` }}
        />
      ))}

      {/* sun */}
      <div className="ws-sun absolute top-[17%] right-[12%] h-16 w-16 lg:top-[13%] lg:right-auto lg:left-[33%] lg:h-[84px] lg:w-[84px]">
        <div className="ws-rays absolute inset-[-120%] rounded-full" />
        <div className="ws-sun-core absolute inset-0 rounded-full" />
      </div>

      {/* clouds */}
      <div className="ws-cloud absolute top-[24%] left-[6%] h-6 w-28 lg:h-8 lg:w-44" />
      <div className="ws-cloud ws-cloud-2 absolute top-[11%] right-[34%] h-4 w-20 lg:h-6 lg:w-36" />

      {/* hills */}
      <svg className="absolute inset-x-0 bottom-0 h-[46%] w-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0 34 Q50 16 110 30 T230 24 T400 30 V100 H0Z" fill="#3b2c55" />
        <path d="M0 52 Q70 36 150 48 T300 42 T400 50 V100 H0Z" fill="#2b2242" />
      </svg>

      {/* wind turbines: one far, one near */}
      {!calm && (
        <>
      <Windmill className="absolute bottom-[33%] left-[4%] h-[17%] opacity-70 lg:bottom-[34%] lg:left-auto lg:right-[24%] lg:h-[30%]" speed={7.5} />
      <Windmill className="absolute right-[-3%] bottom-[24%] h-[30%] lg:right-[8%] lg:bottom-[24%] lg:h-[50%]" speed={5.2} delay={-1.3} />
        </>
      )}
      {calm && (
        <>
          <Windmill className="absolute bottom-[30%] left-[8%] h-[16%] opacity-50 lg:left-[6%] lg:h-[26%]" speed={7} />
          <Windmill className="absolute right-[6%] bottom-[29%] h-[20%] opacity-60 lg:right-[5%] lg:h-[32%]" speed={5.6} delay={-2} />
        </>
      )}

      {/* near ground */}
      <svg className="absolute inset-x-0 bottom-0 h-[27%] w-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ws-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#221c33" />
            <stop offset="1" stopColor="#0a0d12" />
          </linearGradient>
        </defs>
        <path d="M0 14 Q100 2 200 10 T400 8 V100 H0Z" fill="url(#ws-ground)" />
        <path d="M0 14 Q100 2 200 10 T400 8" fill="none" stroke="#7a4b5e" strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.7" />
      </svg>

      {!calm && <House className="absolute bottom-[20%] left-[-7%] w-[50%] max-w-[420px] lg:bottom-[17%] lg:left-[7%] lg:w-[31%]" />}

      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgba(5,8,12,.15),rgba(5,8,12,.7))] transition-opacity duration-700 ${focus ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
