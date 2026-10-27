// Protects everything under /staff/ with the branded sign-in page (staff-login.js).
// Set STAFF_PASSWORD in Netlify > Site configuration > Environment variables, then redeploy.
//
// A visitor signs in once at /staff/login and gets a signed cookie that lasts 12 hours.
// Scripts can still send the old Basic login (user STAFF_USER, default "staff", plus the password).
import { eq, validCookie } from "./lib/staff-token.js";

export default async (request, context) => {
  const pass = Netlify.env.get("STAFF_PASSWORD");
  if (!pass) return new Response("Staff area is not set up yet.", { status: 503, headers: { "Cache-Control": "no-store" } });

  if (await validCookie(request, pass)) return context.next();

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (eq(u, Netlify.env.get("STAFF_USER") || "staff") && eq(rest.join(":"), pass)) return context.next();
    } catch (_) {}
  }

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
