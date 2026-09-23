const MAX_TOTAL = 5 * 1024 * 1024; // 5 MB across all files
const MAX_FILES = 3;
const TYPES = ["application/pdf", "image/jpeg", "image/png"];

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

export default async (req) => {
  const wantsJson = req.headers.get("x-requested-with") === "fetch";
  const reply = (ok, status = ok ? 200 : 400, code = "") =>
    wantsJson
      ? Response.json({ ok, code }, { status })
      : new Response(null, {
          status: 303,
          headers: {
            Location: ok
              ? "/bill-review-thanks.html"
              : "/business-voip-cape-town.html?review=error#bill-review",
          },
        });

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!process.env.RESEND_API_KEY || !process.env.BILL_REVIEW_TO || !process.env.BILL_REVIEW_FROM) {
    console.error("bill-review: missing_env");
    return reply(false, 500, "not_configured");
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return reply(false, 400, "invalid_form");
  }

  // Spam trap: pretend success, send nothing
  if ((form.get("company_website") || "").toString().trim()) return reply(true);

  const f = (k) => (form.get(k) || "").toString().trim().slice(0, 200);
  const name = f("name");
  const business = f("business");
  const email = f("email");
  const mobile = f("mobile");
  const users = f("users");
  const fixes = form.getAll("fix").map((x) => x.toString().slice(0, 60));
  const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => `${k}: ${f(k) || "-"}`).join(" | ");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !business || !mobile || !emailOk || form.get("consent") !== "yes") {
    return reply(false, 400, "missing_fields");
  }

  const all = form.getAll("bill").filter((x) => x && typeof x === "object" && x.size > 0);
  const files = all.slice(0, MAX_FILES);
  const total = files.reduce((n, x) => n + x.size, 0);
  if (!files.length || all.length > MAX_FILES || total > MAX_TOTAL || files.some((x) => !TYPES.includes(x.type))) {
    return reply(false, 400, "file_invalid");
  }

  const attachments = await Promise.all(
    files.map(async (x, i) => ({
      filename: (x.name || `phone-bill-${i + 1}`).replace(/[^\w.\- ]/g, "_").slice(0, 80),
      content: Buffer.from(await x.arrayBuffer()).toString("base64"),
    }))
  );

  const send = (body) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  const teamHtml = `
    <h2>Phone bill review request</h2>
    <p><strong>Name:</strong> ${esc(name)}<br>
    <strong>Business:</strong> ${esc(business)}<br>
    <strong>Email:</strong> ${esc(email)}<br>
    <strong>Mobile:</strong> ${esc(mobile)}<br>
    <strong>Phone users:</strong> ${esc(users || "not given")}<br>
    <strong>Wants to fix:</strong> ${esc(fixes.join(", ") || "not given")}<br>
    <strong>Source:</strong> ${esc(utm)}</p>
    <p>Bill attached (${attachments.length} file${attachments.length > 1 ? "s" : ""}).
    Reply within one business day using the Phone Bill Review spreadsheet.</p>
    <p><strong>Delete this email once the review has been sent.</strong></p>`;

  let teamRes;
  try {
    teamRes = await send({
      from: process.env.BILL_REVIEW_FROM,
      to: [process.env.BILL_REVIEW_TO],
      reply_to: email,
      subject: `Bill review request: ${business}${users ? ` (${users} users)` : ""}`,
      html: teamHtml,
      attachments,
    });
  } catch {
    console.error("bill-review: team_send_exception");
    return reply(false, 502, "send_failed");
  }
  if (!teamRes.ok) {
    console.error("bill-review: team_send_failed", teamRes.status);
    return reply(false, 502, "send_failed");
  }

  // Confirmation to the visitor. Failure here should not fail the request.
  try {
    await send({
      from: process.env.BILL_REVIEW_FROM,
      to: [email],
      subject: "We've received your phone bill",
      html: `
        <p>Hi ${esc(name.split(" ")[0])},</p>
        <p>Thanks for sending your phone bill. We'll send your one-page comparison within one business day.</p>
        <p>We use your bill only for this review and delete it once we've sent you the result.</p>
        <p>Questions? Call 021 300 8278 or WhatsApp 064 702 9962.</p>
        <p>Poseidon Network Systems<br>Sea Point, Cape Town</p>`,
    });
  } catch {
    console.error("bill-review: confirm_send_exception");
  }

  return reply(true);
};
