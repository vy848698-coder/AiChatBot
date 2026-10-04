// Server only: is this a real Indian mobile number?
// 1. 10 digits starting 6–9 (after removing +91 / 0).
// 2. Not a placeholder (9999999999, 9876543210, 7000000000…).
// 3. A mobile number under India's numbering plan (Google's libphonenumber
//    data): rejects landlines and number ranges that don't exist.
// Whether the SIM is active can only be proven by the SMS code reaching it.

import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { isFakeMobile, isMobile } from "../validate";

export type MobileCheck = { ok: true } | { ok: false; reason: "invalid" | "fake" };

export function checkMobile(mobile: string): MobileCheck {
  if (!isMobile(mobile)) return { ok: false, reason: "invalid" };
  if (isFakeMobile(mobile)) return { ok: false, reason: "fake" };
  const p = parsePhoneNumberFromString(mobile, "IN");
  const type = p?.getType();
  if (!p?.isValid() || (type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE")) return { ok: false, reason: "invalid" };
  return { ok: true };
}
