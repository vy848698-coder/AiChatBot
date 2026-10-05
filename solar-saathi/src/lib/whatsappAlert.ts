// Server only: sends the lead alert to the owner's WhatsApp through CallMeBot
// (https://www.callmebot.com, free). CallMeBot can only message the number
// that activated it, which is exactly the owner's alert we need.
//
// Activate (once per receiving number): save +34 644 99 26 98 in your phone
// contacts, send it "I allow callmebot to send me messages" on WhatsApp, and
// it replies with your API key. Then in .env.local / Vercel:
//   CALLMEBOT_WHATSAPP=919876543210:123456
// (number with country code, a colon, the key; several owners: comma-separated)
// The key is a secret: keep it out of the code and GitHub.
//
// When the client moves to the WhatsApp Business API, only this file changes.

const BASE = process.env.CALLMEBOT_BASE_URL || "https://api.callmebot.com"; // override only for tests
const TIMEOUT_MS = 15_000;

type Owner = { phone: string; apikey: string };

export function alertOwners(): Owner[] {
  return (process.env.CALLMEBOT_WHATSAPP ?? "")
    .split(",")
    .map((entry) => {
      const [phone = "", apikey = ""] = entry.split(":").map((x) => x.trim());
      return { phone: phone.replace(/\D/g, ""), apikey };
    })
    .filter((o) => o.phone.length >= 10 && o.apikey);
}

export const alertsOn = () => alertOwners().length > 0;

// Sends `text` to every owner, one after another (the free service dislikes
// bursts). Returns how many got it.
export async function sendOwnerAlert(text: string): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const { phone, apikey } of alertOwners()) {
    const q = new URLSearchParams({ phone: `+${phone}`, text, apikey });
    try {
      const res = await fetch(`${BASE}/whatsapp.php?${q}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const body = (await res.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      // Success reads like "Message queued. You will receive it in a few seconds."
      if (res.ok && /queued|sent/i.test(body) && !/error|invalid/i.test(body)) sent++;
      else {
        failed++;
        console.error(`[whatsapp] CallMeBot refused for …${phone.slice(-4)}: ${res.status} ${body.slice(0, 160)}`);
      }
    } catch (err) {
      failed++;
      console.error(`[whatsapp] CallMeBot unreachable for …${phone.slice(-4)}: ${(err as Error).message}`);
    }
  }
  return { sent, failed };
}
