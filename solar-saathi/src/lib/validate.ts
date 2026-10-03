// Accepts pasted forms like "+91 98765 43210" or "098765 43210".
export function cleanMobile(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return d.slice(0, 10);
}

// Names may be typed (or dictated) in Latin, Odia or Devanagari script.
export function isName(v: string) {
  const s = v.trim();
  return /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(s) && s.replace(/[^\p{L}]/gu, "").length >= 2;
}

export const isMobile = (v: string) => /^[6-9]\d{9}$/.test(v);

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
