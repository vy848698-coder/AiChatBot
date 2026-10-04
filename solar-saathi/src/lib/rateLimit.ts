// Small in-memory rate limiter (per server process). Good for a single Node
// server; on serverless hosting each instance counts separately, so put a
// shared store (e.g. Redis) behind this before scaling out.

// On globalThis so the dev server's hot reload doesn't reset the counts.
const hits: Map<string, number[]> = ((globalThis as { __saathiHits?: Map<string, number[]> }).__saathiHits ??= new Map());

// Allows `limit` hits per `windowMs` for `key`. Returns seconds to wait when
// over the limit.
export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 3600_000)) hits.delete(k);
  return { ok: true };
}

// Takes back the latest hit, e.g. when the action it guarded failed on our side.
export function undoHit(key: string) {
  hits.get(key)?.pop();
}

// Automated tests (development only) send this header so no real email or
// SMS goes out; the code is shown on screen instead. Ignored in production.
export const isTestRequest = (request: Request) =>
  process.env.NODE_ENV !== "production" && request.headers.get("x-saathi-test") === "1";

export function clientIp(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || request.headers.get("x-real-ip") || "local").trim();
}
