// Password-protects everything under /staff/ (works on the free Netlify plan).
// Set STAFF_PASSWORD (and optionally STAFF_USER, default "staff") in
// Netlify > Site configuration > Environment variables, then redeploy.
const eq = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

export default async (request, context) => {
  const user = Netlify.env.get("STAFF_USER") || "staff";
  const pass = Netlify.env.get("STAFF_PASSWORD");
  if (!pass) return new Response("Staff area is not set up yet.", { status: 503, headers: { "Cache-Control": "no-store" } });

  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(auth.slice(6)).split(":");
      if (eq(u, user) && eq(rest.join(":"), pass)) return context.next();
    } catch (_) {}
  }
  return new Response("Staff login required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PNS staff", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
};

export const config = { path: ["/staff", "/staff/*"] };
