// POST /api/lead-magnet  — emails a checklist PDF link, notifies the team,
// and (opt-in only) adds a Resend contact to a segment and schedules 2 follow-ups.
// GET/POST /api/lead-magnet?unsub=1&... — one-click unsubscribe from follow-ups.
//
// Env (Netlify > Site configuration > Environment variables):
//   RESEND_API_KEY                 (already used by bill-review)
//   LEAD_FROM, LEAD_TO             (fall back to BILL_REVIEW_FROM / BILL_REVIEW_TO)
//   LEAD_UNSUB_SECRET              any long random string, signs unsubscribe links
//   RESEND_SEGMENT_PHONE_BILL      id of the Resend segment "lead-phone-bill"
//   RESEND_SEGMENT_REFURB_LAPTOP   id of the Resend segment "lead-refurb-laptop"
// Resend scheduled sends: up to 30 days ahead, no attachments, not via batch.
import { createHmac, timingSafeEqual } from "node:crypto";

const SITE = (process.env.URL || "https://poseidon-network.com").replace(/\/$/, "");
const SIGN = `<p style="margin:24px 0 0;color:#4A5578;font-size:13px;line-height:1.6">The Poseidon Network Systems team<br>Poseidon Network Systems CC, Sea Point, Cape Town<br>Phone 021 300 8278 · WhatsApp 064 702 9962 · <a href="${SITE}/" style="color:#2D5BE3">poseidon-network.com</a></p>`;
const WA_BILL = "https://wa.me/27647029962?text=Hi%2C%20I%27d%20like%20a%20free%20phone%20bill%20review.";
const P = (s) => `<p style="margin:0 0 14px;color:#0D1B4B;font-size:15px;line-height:1.6">${s}</p>`;
const A = (href, text) => `<a href="${href}" style="color:#2D5BE3;font-weight:600">${text}</a>`;
const wrap = (body, unsub) => `<div style="font-family:Inter,Arial,sans-serif;max-width:560px">${body}${SIGN}${
  unsub ? `<p style="margin:16px 0 0;font-size:12px;color:#5A6588">You're getting this because you asked for follow-up tips. ${A(unsub, "Unsubscribe")}</p>` : ""}</div>`;

const MAGNETS = {
  "phone-bill": {
    pdf: "/assets/poseidon-phone-bill-checklist.pdf",
    page: "/phone-bill-checklist.html",
    segmentEnv: "RESEND_SEGMENT_PHONE_BILL",
    e1: (pdf) => ({
      subject: "Your business phone bill checklist",
      html: P(`Here's your checklist: ${A(pdf, "Download the PDF")}`) +
        P("Start with items 3 and 7: what you pay for calls to cellphones, and when your contract ends. Those two usually tell you whether it's worth looking at alternatives now or later.") +
        P(`If you'd rather we did the checking, WhatsApp a photo or PDF of your last bill to ${A(WA_BILL, "064 702 9962")}. We'll send back a one-page comparison with a cloud-based switchboard. No obligation.`),
    }),
    e2: {
      subject: "The line on your bill that renews without asking",
      html: P("Many business phone contracts renew automatically if notice isn't given in time, and some add a yearly price increase. Check your contract end date and notice period (items 7 and 8 on the checklist) and put a reminder in your calendar a month before the notice deadline.") +
        P(`Need a second pair of eyes? WhatsApp your bill to ${A(WA_BILL, "064 702 9962")}.`),
    },
    e3: {
      subject: "Still on a copper line?",
      html: P("Telkom is retiring copper lines area by area. Moving to a cloud-based switchboard means your numbers can come with you. Handsets are set up before delivery and plug into your existing network points.") +
        P("We start with a free bill review and a network readiness check, so you know what changes before anything is quoted.") +
        P(A(`${SITE}/business-voip-cape-town.html`, "See how it works")) +
        P("WhatsApp 064 702 9962 · Phone 021 300 8278"),
    },
  },
  "refurb-laptop": {
    pdf: "/assets/poseidon-refurbished-laptop-checklist.pdf",
    page: "/refurbished-laptop-checklist.html",
    segmentEnv: "RESEND_SEGMENT_REFURB_LAPTOP",
    e1: (pdf) => ({
      subject: "Your refurbished laptop buyer's checklist",
      html: P(`Here's your checklist: ${A(pdf, "Download the PDF")}`) +
        P(`The quickest check is number 4: run <code>powercfg /batteryreport</code> on any Windows laptop you're considering and compare full charge capacity with design capacity.`) +
        P(`Current refurbished Dell prices, excl. and incl. VAT: ${A(`${SITE}/refurbished-dell-equipment.html`, "See refurbished Dell →")}`),
    }),
    e2: {
      subject: "What \u201cGrade A\u201d should mean",
      html: P("Grades describe how a laptop looks, not how it works, and every seller defines them differently. Ask for the definition in writing.") +
        P("Ours: factory reconditioned means each unit goes through a full set of reliability tests and is completely cleaned before sale. Units sold as A-grade have no cosmetic defects and look like new."),
    },
    e3: {
      subject: "Laptops for the team?",
      html: P("Every refurbished Dell we sell ships with Windows 11 Pro and a 1-year warranty: a faulty unit is repaired or replaced, and the battery is covered for 6 months. We deliver within 40km of Cape Town, and further away by courier at your cost.") +
        P("Tell us how many people need laptops and what they use them for, and we'll quote. No obligation.") +
        P(`${A(`${SITE}/#quote-form`, "Get a quote")} · WhatsApp 064 702 9962`),
    },
  },
};

const DAY = 864e5;
const secret = () => process.env.LEAD_UNSUB_SECRET || "";
const sign = (s) => createHmac("sha256", secret()).update(s).digest("base64url");
const unsubUrl = (email, magnet, ids) => {
  const q = new URLSearchParams({ unsub: "1", e: email, m: magnet, ids: ids.join(",") });
  q.set("s", sign(q.toString()));
  return `${SITE}/api/lead-magnet?${q}`;
};

const api = (path, method, body) =>
  fetch(`https://api.resend.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const page = (title, msg, status = 200) =>
  new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><body style="font-family:Inter,Arial,sans-serif;color:#0D1B4B;max-width:520px;margin:64px auto;padding:0 24px"><h1 style="font-size:24px">${title}</h1><p>${msg}</p><p><a href="/" style="color:#2D5BE3">Back to poseidon-network.com</a></p></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });

async function unsubscribe(url) {
  const q = new URLSearchParams(url.search);
  const s = q.get("s") || ""; q.delete("s");
  const ok = secret() && s.length && (() => { const a = Buffer.from(sign(q.toString())), b = Buffer.from(s); return a.length === b.length && timingSafeEqual(a, b); })();
  if (!ok) return page("Link not valid", "This unsubscribe link isn't valid. Reply to any of our emails and we'll remove you.", 400);
  const email = q.get("e");
  const ids = (q.get("ids") || "").split(",").filter(Boolean);
  await Promise.all(ids.map((id) => api(`/emails/${encodeURIComponent(id)}/cancel`, "POST").catch(() => {})));
  await api(`/contacts/${encodeURIComponent(email)}`, "PATCH", { unsubscribed: true }).catch(() => {});
  return page("You're unsubscribed", "You won't get any more follow-up emails from us.");
}

export default async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("unsub") === "1") return unsubscribe(url);
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const wantsJson = req.headers.get("x-requested-with") === "fetch";
  let form;
  try { form = await req.formData(); } catch { return Response.json({ ok: false, code: "invalid_form" }, { status: 400 }); }
  const f = (k) => (form.get(k) || "").toString().trim().slice(0, 200);
  const magnet = f("magnet");
  const M = MAGNETS[magnet];
  const back = (ok, code = "") => wantsJson
    ? Response.json({ ok, code }, { status: ok ? 200 : 400 })
    : new Response(null, { status: 303, headers: { Location: ok ? (M ? M.pdf : "/") : `${M ? M.page : "/"}?lead=error#lead-form` } });

  if (f("company_website")) return back(true); // honeypot: pretend success
  const email = f("email");
  if (!M || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back(false, "invalid_email");
  const optIn = form.get("followups") === "yes";
  const source = f("source") || "-";

  const FROM = process.env.LEAD_FROM || process.env.BILL_REVIEW_FROM;
  const TO = process.env.LEAD_TO || process.env.BILL_REVIEW_TO;
  if (!process.env.RESEND_API_KEY || !FROM || !TO) { console.error("lead-magnet: missing_env"); return back(false, "not_configured"); }
  const pdf = SITE + M.pdf;
  const send = (body) => api("/emails", "POST", { from: FROM, reply_to: TO, ...body });

  // Email 1
  const e1 = M.e1(pdf);
  const r1 = await send({ to: [email], subject: e1.subject, html: wrap(e1.html) }).catch(() => null);
  if (!r1 || !r1.ok) { console.error("lead-magnet: e1_failed", r1 && r1.status); return back(false, "send_failed"); }

  // Follow-ups (opt-in only). Email 3 is scheduled first so email 2's unsubscribe link can cancel it.
  let followups = "no";
  // Follow-ups need signed unsubscribe links, so never schedule them without LEAD_UNSUB_SECRET.
  if (optIn && !secret()) { followups = "yes (not scheduled: LEAD_UNSUB_SECRET missing)"; console.error("lead-magnet: no_unsub_secret"); }
  else if (optIn) {
    followups = "yes (scheduling failed)";
    try {
      const seg = process.env[M.segmentEnv];
      const c = await api("/contacts", "POST", { email, unsubscribed: false, ...(seg ? { segments: [{ id: seg }] } : {}) });
      if (!c.ok && seg) await api(`/contacts/${encodeURIComponent(email)}/segments/${seg}`, "POST");
      const now = Date.now();
      const u3 = unsubUrl(email, magnet, []);
      const r3 = await send({ to: [email], subject: M.e3.subject, html: wrap(M.e3.html, u3), scheduled_at: new Date(now + 7 * DAY).toISOString(),
        headers: { "List-Unsubscribe": `<${u3}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
      const id3 = r3.ok ? (await r3.json()).id : null;
      if (!id3) throw new Error("e3_failed"); // both or neither
      const u2 = unsubUrl(email, magnet, id3 ? [id3] : []);
      const r2 = await send({ to: [email], subject: M.e2.subject, html: wrap(M.e2.html, u2), scheduled_at: new Date(now + 3 * DAY).toISOString(),
        headers: { "List-Unsubscribe": `<${u2}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
      if (r2.ok && id3) followups = "yes (emails 2 and 3 scheduled)";
      else if (id3) await api(`/emails/${id3}/cancel`, "POST"); // both or neither
    } catch (e) { console.error("lead-magnet: followup_failed"); }
  }

  // Internal notification (failure doesn't fail the visitor's request)
  await send({
    to: [TO],
    subject: `Checklist download: ${magnet}`,
    html: `<p><strong>Email:</strong> ${email.replace(/[<>&"]/g, "")}<br><strong>Magnet:</strong> ${magnet}<br><strong>Source:</strong> ${source.replace(/[<>&"]/g, "")}<br><strong>Follow-ups opt-in:</strong> ${followups}<br><strong>Time:</strong> ${new Date().toISOString()}</p>`,
  }).catch(() => console.error("lead-magnet: notify_failed"));

  return back(true);
};
