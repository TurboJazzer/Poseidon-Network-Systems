// Morning stock check. Compares what the public refurbished Dell page is showing with what Universe Direct
// currently has in stock, and builds a short report. It never changes the website: it only tells staff.
//
// How it matches, with no saved links: each website product's model number (for example 5400, 3080, R760) is
// searched in Universe Direct's public WooCommerce product feed, and the results are kept only when the
// model number (and SFF / Micro / 2-in-1 where the card says so) appears in the supplier's product name.
// Universe Direct lists several variants of a model (different CPU or RAM), so the check is by model:
// "all out" means every variant of that model is out of stock there.
//
// Public data only. No secrets are needed to read either source.
import pageStock from "./page-stock.js";

const { readPageProducts } = pageStock;

export const SUPPLIER_BASE = "https://www.universedirect.co.za";
const TIMEOUT_MS = 15000;
const UA = "PNS-morning-stock-check/1.0";

// "Dell Latitude 5400" -> { code: "5400", form: null }; "Dell OptiPlex 3080 SFF" -> { code: "3080", form: "sff" }
export const modelKey = (name) => {
  const s = String(name || "");
  const m = /\b(R\d{3}|T\d{3}|\d{4}|\d{3})\b/i.exec(s);
  if (!m) return null;
  let form = null;
  if (/\bsff\b/i.test(s)) form = "sff";
  else if (/\bmicro\b/i.test(s)) form = "micro";
  else if (/2[\s-]?in[\s-]?1/i.test(s)) form = "2in1";
  return { code: m[1].toUpperCase(), form };
};

const FORM_RE = { sff: /\bSFF\b/, micro: /\bMICRO\b/, "2in1": /2[\s-]?IN[\s-]?1/ };

// Keeps the supplier products that are the same model as the website product.
export const matchSupplier = (key, supplierProducts) => {
  if (!key) return [];
  const codeRe = new RegExp("(^|[^A-Z0-9])" + key.code + "([^A-Z0-9]|$)");
  return (supplierProducts || []).filter((p) => {
    const n = String(p.name || "").toUpperCase();
    return codeRe.test(n) && (!key.form || FORM_RE[key.form].test(n));
  });
};

const decodeName = (s) => String(s || "").replace(/&#8211;|&ndash;/g, "-").replace(/&amp;/g, "&").replace(/&#038;/g, "&");

// One request per model number to Universe Direct's public product feed.
export const fetchSupplierProducts = async (fetchFn, code) => {
  const url = `${SUPPLIER_BASE}/wp-json/wc/store/v1/products?search=${encodeURIComponent(code)}&per_page=100`;
  const res = await fetchFn(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Universe Direct answered ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Universe Direct sent something unexpected");
  return data.map((p) => ({
    name: decodeName(p.name),
    in_stock: p.is_in_stock === true,
    url: typeof p.permalink === "string" ? p.permalink : null,
  }));
};

const SELLING_NOW = (a) => !/coming soon|out of stock/i.test(String(a || ""));

// website product + what the supplier matched -> one report line.
export const classify = (product, matches, error) => {
  const line = {
    model: product.name,
    website: product.availability || "Not stated",
    supplier_variants: 0,
    supplier_in_stock: 0,
    level: "ok",
    note: "",
  };
  if (error) {
    line.level = "check";
    line.note = `Could not check Universe Direct (${error}).`;
    return line;
  }
  line.supplier_variants = matches.length;
  line.supplier_in_stock = matches.filter((m) => m.in_stock).length;
  const selling = SELLING_NOW(product.availability);
  if (!matches.length) {
    if (selling) {
      line.level = "check";
      line.note = "No match on Universe Direct. It may have been removed or renamed there. Check before taking orders.";
    } else line.note = "No match on Universe Direct yet.";
  } else if (!line.supplier_in_stock) {
    if (selling) {
      line.level = "action";
      line.note = `Website says "${line.website}" but all ${matches.length} Universe Direct variant${matches.length === 1 ? " is" : "s are"} out of stock. Set it to Out of stock on the Website stock page, unless you hold your own stock.`;
    } else line.note = `Still out of stock at Universe Direct, so "${line.website}" is correct.`;
  } else if (!selling) {
    line.level = "info";
    line.note = `Universe Direct now has ${line.supplier_in_stock} of ${matches.length} variant${matches.length === 1 ? "" : "s"} in stock. You could switch this ${/out of stock/i.test(line.website) ? "back to In stock" : "from Coming soon"}.`;
  } else {
    line.note = `Universe Direct has ${line.supplier_in_stock} of ${matches.length} variant${matches.length === 1 ? "" : "s"} in stock.`;
  }
  line.matches = matches.slice(0, 12).map((m) => ({ name: m.name, in_stock: m.in_stock }));
  return line;
};

const ORDER = { action: 0, check: 1, info: 2, ok: 3 };

export const buildReport = async (products, fetchFn) => {
  const lines = [];
  const cache = new Map();
  for (const p of products) {
    const key = modelKey(p.name);
    if (!key) {
      lines.push({ ...classify(p, [], "no model number in the product name"), level: "check" });
      continue;
    }
    let supplier;
    let error = null;
    try {
      if (!cache.has(key.code)) cache.set(key.code, await fetchSupplierProducts(fetchFn, key.code));
      supplier = cache.get(key.code);
    } catch (err) {
      error = err && err.message ? err.message : "unknown error";
    }
    lines.push(classify(p, error ? [] : matchSupplier(key, supplier), error));
  }
  lines.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  const count = (l) => lines.filter((x) => x.level === l).length;
  return { checked_at: new Date().toISOString(), counts: { action: count("action"), check: count("check"), info: count("info"), ok: count("ok") }, lines };
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LABEL = { action: "Out of stock at Universe Direct", check: "Please check", info: "Good news", ok: "All fine" };
const COLOUR = { action: "#B3261E", check: "#92400E", info: "#1D5F3A", ok: "#4A5578" };

export const emailParts = (report) => {
  const { action, check, info } = report.counts;
  const subject = action
    ? `Dell stock check: ${action} item${action === 1 ? "" : "s"} out of stock at Universe Direct`
    : check
      ? `Dell stock check: ${check} item${check === 1 ? "" : "s"} to check`
      : "Dell stock check: everything on the website matches Universe Direct";
  const text = [subject, ""]
    .concat(report.lines.map((l) => `[${LABEL[l.level]}] ${l.model} (website: ${l.website}) - ${l.note}`))
    .concat(["", "Full report: https://poseidon-network.com/staff/stock-check.html"])
    .join("\n");
  const rows = report.lines
    .map((l) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #E4E9F5"><strong>${esc(l.model)}</strong><br><span style="color:#4A5578;font-size:12px">Website: ${esc(l.website)}</span></td><td style="padding:8px 10px;border-bottom:1px solid #E4E9F5;color:${COLOUR[l.level]}"><strong>${esc(LABEL[l.level])}</strong><br>${esc(l.note)}</td></tr>`)
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0D1B4B"><h2 style="margin:0 0 12px">${esc(subject)}</h2><table style="border-collapse:collapse;width:100%">${rows}</table><p style="color:#4A5578;font-size:12px">Checked against the live refurbished Dell page. Nothing on the website was changed. <a href="https://poseidon-network.com/staff/stock-check.html">Open the full report</a></p></div>`;
  return { subject, text, html };
};

const sendEmail = async (fetchFn, env, parts) => {
  const to = env.STOCK_CHECK_TO || env.BILL_REVIEW_TO;
  const from = env.STOCK_CHECK_FROM || env.BILL_REVIEW_FROM;
  if (!env.RESEND_API_KEY || !to || !from) return "not set up";
  const res = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: parts.subject, text: parts.text, html: parts.html }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return res.ok ? "sent" : `failed (${res.status})`;
};

export const runStockCheck = async ({ db, fetchFn = fetch, env = process.env, log = console, read = readPageProducts, email = true }) => {
  let products;
  try {
    products = await read(fetchFn);
  } catch (err) {
    log.error("stock-check: could not read the refurbished page:", err && err.message ? err.message : err);
    if (email) {
      const subject = "Dell stock check could not run";
      const msg = "The refurbished Dell page could not be read this morning, so the check was skipped. Nothing on the website was changed.";
      await sendEmail(fetchFn, env, { subject, text: msg, html: `<p>${msg}</p>` }).catch(() => {});
    }
    return { ok: false };
  }
  const report = await buildReport(products, fetchFn);
  await db.sql`
    INSERT INTO stock_check_report (id, report, checked_at)
    VALUES (1, ${JSON.stringify(report)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET report = EXCLUDED.report, checked_at = NOW()`;
  let mail = "skipped";
  if (email) {
    try {
      mail = await sendEmail(fetchFn, env, emailParts(report));
    } catch (err) {
      mail = "failed";
      log.error("stock-check: email failed:", err && err.message ? err.message : err);
    }
  }
  log.log("stock-check:", JSON.stringify({ counts: report.counts, email: mail }));
  return { ok: true, report, email: mail };
};
