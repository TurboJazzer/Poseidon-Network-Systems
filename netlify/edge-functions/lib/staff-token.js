// Shared by staff-auth.js and staff-login.js. Not an edge function itself (it sits in a subfolder).
// The sign-in cookie is "<expiry seconds>.<HMAC-SHA256 of the expiry, keyed from STAFF_PASSWORD>".
// netlify/functions/dell-offers.mjs checks the same cookie with the same recipe.
const enc = new TextEncoder();
export const MAX_AGE = 12 * 60 * 60;

export const eq = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const sign = async (secret, exp) => {
  const key = await crypto.subtle.importKey("raw", enc.encode("pns-staff-v1|" + secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode("pns-staff|" + exp)));
};

export const validCookie = async (request, secret) => {
  const m = /(?:^|;\s*)pns_staff=(\d{10,13})\.([0-9a-f]{64})(?:;|$)/.exec(request.headers.get("cookie") || "");
  if (!m) return false;
  if (Number(m[1]) < Math.floor(Date.now() / 1000)) return false;
  return eq(m[2], await sign(secret, m[1]));
};
