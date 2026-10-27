// Branded staff sign-in page for /staff/login. Checks the password against STAFF_PASSWORD and sets a
// signed session cookie: it is dropped when the browser is closed and is also valid for 12 hours at most. Limited to 10 requests a minute per visitor to stop password guessing.
import { MAX_AGE, eq, sign, validCookie } from "./lib/staff-token.js";

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Only ever send people back to a page inside /staff/.
const safeNext = (n) => (typeof n === "string" && /^\/staff(\/[A-Za-z0-9._~\-\/]*)?(\?[A-Za-z0-9._~\-=&%]*)?$/.test(n) && !n.includes("..") && !n.includes("//") && !n.startsWith("/staff/login") ? n : "/staff/");

const headers = (extra = {}) => ({
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  ...extra,
});

const page = (next, error) => `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>Staff sign in | Poseidon Network Systems</title>
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:24px 16px;background:#000;color:#fff;font-family:'Inter',system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.card{width:100%;max-width:440px;background:#172841;border:1px solid #2F4A8F;border-radius:12px;padding:28px}
.logo{display:block;width:84px;height:auto;margin:0 0 20px;border-radius:6px}
.tag{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8fabf5}
h1{margin:0 0 8px;font-family:'Space Grotesk',sans-serif;font-size:32px;line-height:1.15}
p.sub{margin:0 0 22px;color:#C9D5F5;font-size:16px}
label{display:block;margin:0 0 8px;font-size:15px;font-weight:700}
input[type=password]{width:100%;min-height:48px;padding:11px 12px;font:inherit;font-size:16px;color:#fff;background:#0F1D33;border:1px solid #3C5A9A;border-radius:8px}
input[type=password]:focus-visible{outline:3px solid #9DB6F5;outline-offset:2px}
button{width:100%;min-height:48px;margin-top:16px;font:inherit;font-size:16px;font-weight:700;color:#fff;background:#2D5BE3;border:0;border-radius:8px;cursor:pointer}
button:hover{background:#1F47C4}
button:focus-visible{outline:3px solid #9DB6F5;outline-offset:2px}
.err{margin:0 0 16px;padding:10px 12px;font-size:15px;font-weight:600;color:#FFD9D6;background:#4A1B22;border:1px solid #B3261E;border-radius:8px}
.back{margin:18px 0 0;font-size:14px;text-align:center}
.back a{color:#8fabf5}
</style>
</head>
<body>
<main class="card">
  <img class="logo" src="/assets/pns_logo_new_sm.webp" alt="Poseidon Network Systems" width="84" height="71">
  <p class="tag">Staff area</p>
  <h1>Sign in</h1>
  <p class="sub">Poseidon Network Systems. Authorised people only.</p>
  ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ""}
  <form method="post" action="/staff/login">
    <input type="hidden" name="next" value="${esc(next)}">
    <label for="pw">Password</label>
    <input id="pw" type="password" name="password" autocomplete="current-password" required autofocus>
    <button type="submit">Sign in</button>
  </form>
  <p class="back"><a href="/">Back to website</a></p>
</main>
</body>
</html>`;

export default async (request) => {
  const pass = Netlify.env.get("STAFF_PASSWORD");
  if (!pass) return new Response("Staff area is not set up yet.", { status: 503, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const clear = "pns_staff=; Path=/staff; HttpOnly; Secure; SameSite=Strict; Max-Age=0";

  if (request.method === "GET") {
    if (url.searchParams.get("logout") === "1") return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": clear, "Cache-Control": "no-store" } });
    const next = safeNext(url.searchParams.get("next"));
    if (await validCookie(request, pass)) return new Response(null, { status: 302, headers: { Location: next, "Cache-Control": "no-store" } });
    return new Response(page(next), { status: 200, headers: headers() });
  }

  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return new Response("Request not allowed.", { status: 403, headers: { "Cache-Control": "no-store" } });
    let password = "", next = "/staff/";
    try {
      const form = await request.formData();
      password = String(form.get("password") || "").slice(0, 200);
      next = safeNext(String(form.get("next") || ""));
    } catch (_) {
      return new Response(page("/staff/", "That did not work. Please try again."), { status: 400, headers: headers() });
    }
    if (!eq(password, pass)) {
      await new Promise((r) => setTimeout(r, 400));
      return new Response(page(next, "That password is not right. Please try again."), { status: 401, headers: headers() });
    }
    const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
    const cookie = `pns_staff=${exp}.${await sign(pass, exp)}; Path=/staff; HttpOnly; Secure; SameSite=Strict`;
    return new Response(null, { status: 303, headers: { Location: next, "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  }

  return new Response("Method not allowed.", { status: 405, headers: { Allow: "GET, POST", "Cache-Control": "no-store" } });
};

export const config = {
  path: "/staff/login",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
