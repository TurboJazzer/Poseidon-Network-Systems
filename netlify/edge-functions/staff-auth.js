// Protects everything under /staff/ with the branded sign-in page (staff-login.js).
// Set STAFF_PASSWORD in Netlify > Site configuration > Environment variables, then redeploy.
//
// A visitor signs in at /staff/login and gets a signed session cookie. It is dropped when the browser
// is closed, and expires after 12 hours at most. There is no other way in.
import { validCookie } from "./lib/staff-token.js";

export default async (request, context) => {
  const pass = Netlify.env.get("STAFF_PASSWORD");
  if (!pass) return new Response("Staff area is not set up yet.", { status: 503, headers: { "Cache-Control": "no-store" } });

  if (await validCookie(request, pass)) return context.next();

  const url = new URL(request.url);
  const wantsPage = request.method === "GET" && (request.headers.get("accept") || "").includes("text/html");
  if (wantsPage) {
    const next = url.pathname + url.search;
    const to = "/staff/login" + (next && next !== "/staff" && next !== "/staff/" ? "?next=" + encodeURIComponent(next) : "");
    return new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  }
  return new Response(JSON.stringify({ error: "Staff login required." }), {
    status: 401,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
};

export const config = { path: ["/staff", "/staff/*"], excludedPath: ["/staff/login"] };
