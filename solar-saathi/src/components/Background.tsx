// Deep dawn backdrop: drifting green/blue/sun-gold light and twinkling stars.
// Pure CSS (no blur filters) so it stays smooth on low-end Android phones.

// Seeded so server and client render the same stars (no hydration mismatch).
const STARS = (() => {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 34 }, () => ({
    left: r() * 100,
    top: r() * 62,
    size: 1 + r() * 1.8,
    delay: r() * 4.5,
  }));
})();

export function Background() {
  return (
    <div aria-hidden className="bg-root">
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />
      {STARS.map((st, i) => (
        <span
          key={i}
          className="star"
          style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.size, height: st.size, animationDelay: `${st.delay}s` }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,.55))]" />
    </div>
  );
}
