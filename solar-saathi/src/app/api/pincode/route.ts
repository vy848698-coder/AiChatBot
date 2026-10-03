// PIN code → state, district and area names, via India Post's public API.
// GET /api/pincode?pin=751024 → { ok, state, district, areas[] }
// Fails soft ({ ok: false }) so the user can still pick state/district by hand.

const cache = new Map<string, unknown>();

type PostOffice = { Name: string; District: string; State: string };

export async function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get("pin") ?? "";
  if (!/^[1-9]\d{5}$/.test(pin)) return Response.json({ ok: false, error: "invalid_pin" }, { status: 400 });

  const hit = cache.get(pin);
  if (hit) return Response.json(hit);

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(6000) });
    const data = (await res.json()) as { Status: string; PostOffice: PostOffice[] | null }[];
    const offices = data?.[0]?.Status === "Success" ? (data[0].PostOffice ?? []) : [];
    if (!offices.length) return Response.json({ ok: false, error: "not_found" });
    const result = {
      ok: true,
      state: offices[0].State,
      district: offices[0].District,
      areas: [...new Set(offices.map((o) => o.Name))].slice(0, 8),
    };
    cache.set(pin, result);
    return Response.json(result);
  } catch {
    return Response.json({ ok: false, error: "unavailable" });
  }
}
