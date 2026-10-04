// Server only: can this email address receive mail at all?
//
// 1. Format (same rules as the form).
// 2. Not a throwaway inbox (mailinator & co.), since the plan goes there.
// 3. The domain exists and accepts mail: it has MX records, or (per RFC 5321)
//    an A/AAAA record to fall back on, and no "null MX" (RFC 7505).
//
// Whether the mailbox itself exists can't be checked reliably (big providers
// accept every address at first, and port 25 is blocked on most hosts), so the
// code reaching the inbox is the final proof.

import { promises as dns } from "node:dns";
import { isEmail } from "../validate";

export type DomainCheck = { ok: true } | { ok: false; reason: "invalid" | "no_domain" | "disposable" };

// Providers we know accept mail; skips a DNS lookup for most users.
const KNOWN = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.in", "ymail.com", "rocketmail.com", "outlook.com", "outlook.in",
  "hotmail.com", "live.com", "live.in", "msn.com", "icloud.com", "me.com", "rediffmail.com", "zohomail.in", "zoho.com", "proton.me", "protonmail.com", "aol.com",
]);

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamailblock.com", "sharklasers.com", "grr.la", "pokemail.net", "spam4.me",
  "10minutemail.com", "10minutemail.net", "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmail.net", "tempail.com", "tempr.email",
  "yopmail.com", "yopmail.fr", "yopmail.net", "trashmail.com", "getnada.com", "nada.email", "dispostable.com", "maildrop.cc", "mailnesia.com",
  "mintemail.com", "throwawaymail.com", "fakeinbox.com", "mohmal.com", "emailondeck.com", "moakt.com", "mailcatch.com", "spamgourmet.com",
  "burnermail.io", "discard.email", "mailpoof.com", "1secmail.com", "1secmail.net", "emailfake.com", "minuteinbox.com", "inboxkitten.com",
  "mytemp.email", "tmail.ws", "tmpmail.org", "tmpmail.net", "luxusmail.org", "tempmailo.com", "emailnator.com", "mail.tm",
]);

const cache = new Map<string, { result: DomainCheck; at: number }>();
const CACHE_MS = 3600_000;
const TIMEOUT_MS = 4000;

export async function checkEmail(email: string): Promise<DomainCheck> {
  const e = email.trim().toLowerCase();
  if (!isEmail(e)) return { ok: false, reason: "invalid" };
  const domain = e.slice(e.lastIndexOf("@") + 1);
  if (DISPOSABLE.has(domain)) return { ok: false, reason: "disposable" };
  if (KNOWN.has(domain)) return { ok: true };

  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;
  const result = await lookup(domain);
  cache.set(domain, { result, at: Date.now() });
  return result;
}

// What DNS says about one record type: records found, a definite "none", or
// no answer (resolver unreachable, timeout).
type Answer = { kind: "records"; values: string[] } | { kind: "nodata" } | { kind: "nxdomain" } | { kind: "error" };
type RType = "MX" | "A" | "AAAA";

// Tries the system resolver, then public DNS (some machines and hosts have a
// broken local resolver), then DNS over HTTPS (works where port 53 is blocked).
async function query(domain: string, type: RType): Promise<Answer> {
  for (const ask of [viaResolver(system), viaResolver(publicDns), viaDoh("https://cloudflare-dns.com/dns-query"), viaDoh("https://dns.google/resolve")]) {
    const a = await ask(domain, type);
    if (a.kind !== "error") return a;
  }
  return { kind: "error" };
}

const system = new dns.Resolver({ timeout: 2500, tries: 1 });
const publicDns = new dns.Resolver({ timeout: 2500, tries: 1 });
publicDns.setServers(["1.1.1.1", "8.8.8.8", "9.9.9.9"]);

function viaResolver(r: InstanceType<typeof dns.Resolver>) {
  return async (domain: string, type: RType): Promise<Answer> => {
    try {
      const values =
        type === "MX"
          ? (await withTimeout(r.resolveMx(domain))).map((m) => m.exchange)
          : await withTimeout(type === "A" ? r.resolve4(domain) : r.resolve6(domain));
      return values.length ? { kind: "records", values } : { kind: "nodata" };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOTFOUND") return { kind: "nxdomain" };
      if (code === "ENODATA") return { kind: "nodata" };
      return { kind: "error" };
    }
  };
}

const TYPE_NUM: Record<RType, number> = { MX: 15, A: 1, AAAA: 28 };

function viaDoh(endpoint: string) {
  return async (domain: string, type: RType): Promise<Answer> => {
    try {
      const res = await fetch(`${endpoint}?name=${encodeURIComponent(domain)}&type=${type}`, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return { kind: "error" };
      const j = (await res.json()) as { Status: number; Answer?: { type: number; data: string }[] };
      if (j.Status === 3) return { kind: "nxdomain" };
      if (j.Status !== 0) return { kind: "error" };
      // MX data is "10 mx.example.com."; a null MX is "0 .".
      const values = (j.Answer ?? [])
        .filter((a) => a.type === TYPE_NUM[type])
        .map((a) => (type === "MX" ? a.data.split(" ")[1]?.replace(/\.$/, "") ?? "" : a.data));
      return values.length ? { kind: "records", values } : { kind: "nodata" };
    } catch {
      return { kind: "error" };
    }
  };
}

async function lookup(domain: string): Promise<DomainCheck> {
  const mx = await query(domain, "MX");
  if (mx.kind === "nxdomain") return { ok: false, reason: "no_domain" }; // the domain doesn't exist
  if (mx.kind === "error") return { ok: true }; // can't tell: don't block the user
  if (mx.kind === "records") {
    // Null MX (RFC 7505): the domain explicitly accepts no mail.
    const nullMx = mx.values.length === 1 && (mx.values[0] === "" || mx.values[0] === ".");
    return nullMx ? { ok: false, reason: "no_domain" } : { ok: true };
  }
  // No MX records: mail may still go to the domain's own address (RFC 5321).
  const [v4, v6] = await Promise.all([query(domain, "A"), query(domain, "AAAA")]);
  if (v4.kind === "records" || v6.kind === "records") return { ok: true };
  if (v4.kind === "error" || v6.kind === "error") return { ok: true };
  return { ok: false, reason: "no_domain" };
}

function withTimeout<T>(p: Promise<T>) {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error("DNS timeout"), { code: "ETIMEOUT" })), TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}
