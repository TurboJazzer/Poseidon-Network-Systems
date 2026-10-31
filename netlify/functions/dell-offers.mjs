// Staff-only API for the Dell offers list (/staff/dell-offers.html).
// Reads and writes the dell_offers table in Netlify Database.
//
// Security:
//  - Every request needs the signed sign-in cookie that /staff/login sets (same recipe as
//    netlify/edge-functions/lib/staff-token.js). It is a session cookie, so closing the browser
//    or signing out ends access.
//  - Changes (POST, PUT, DELETE) must be JSON and carry the X-Requested-With header, which a
//    web page on another site cannot send, so a stray link or form elsewhere cannot change data.
//  - All values go to the database as parameters, never glued into SQL.
import { createHmac } from "node:crypto";
import { getDatabase } from "@netlify/database";

const STATUSES = ["new", "listed", "sold", "dropped"];
const CONDITIONS = ["refurbished", "new", "unknown"];
const MAX_BODY = 20000;
const MAX_PRICE = 10000000;
// Photos are only ever taken from the supplier's own uploads folder.
export const IMAGE_URL_RE = /^https:\/\/www\.universedirect\.co\.za\/wp-content\/uploads\/[A-Za-z0-9._\/-]+\.(?:png|jpe?g|webp|gif)$/i;

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...extra,
    },
  });

// Constant-time string compare.
const same = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

// Same signed cookie the sign-in page sets: "<expiry seconds>.<HMAC-SHA256 of the expiry>".
const cookieOk = (req, pass) => {
  const m = /(?:^|;\s*)pns_staff=(\d{10,13})\.([0-9a-f]{64})(?:;|$)/.exec(req.headers.get("cookie") || "");
  if (!m || Number(m[1]) < Math.floor(Date.now() / 1000)) return false;
  const want = createHmac("sha256", "pns-staff-v1|" + pass).update("pns-staff|" + m[1]).digest("hex");
  return same(m[2], want);
};

// "ok", "unset" (no STAFF_PASSWORD configured) or "denied".
export const checkAuth = (req) => {
  const pass = process.env.STAFF_PASSWORD;
  if (!pass) return "unset";
  return cookieOk(req, pass) ? "ok" : "denied";
};

const text = (v, max) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
};

const money = (v) => {
  if (v === undefined || v === null || v === "") return { value: null };
  const n = typeof v === "number" ? v : Number(String(v).replace(/[\s,]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) return { error: "Prices must be a number from 0 to 10,000,000." };
  return { value: Math.round(n * 100) / 100 };
};

// Validates a full offer. Returns { error } or { value }.
export const cleanOffer = (b) => {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { error: "Send the offer as a JSON object." };
  const model = text(b.model, 120);
  if (!model) return { error: "Model is required." };

  const status = b.status === undefined || b.status === "" ? "new" : b.status;
  if (!STATUSES.includes(status)) return { error: "Status must be new, listed, sold or dropped." };

  const unit_condition = b.unit_condition === undefined || b.unit_condition === "" ? "unknown" : b.unit_condition;
  if (!CONDITIONS.includes(unit_condition)) return { error: "Condition must be refurbished, new or unknown." };

  const sp = money(b.supplier_price_excl_vat);
  if (sp.error) return { error: sp.error };
  const op = money(b.our_price_excl_vat);
  if (op.error) return { error: op.error };

  let first_seen = null;
  if (b.first_seen !== undefined && b.first_seen !== null && b.first_seen !== "") {
    const s = String(b.first_seen);
    const d = new Date(s + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
      return { error: "First seen must be a real date written as YYYY-MM-DD." };
    }
    first_seen = s;
  }

  const source_url = text(b.source_url, 500);
  if (source_url && !/^https:\/\//i.test(source_url)) return { error: "The source link must start with https://" };

  const image_url = text(b.image_url, 500);
  if (image_url && !IMAGE_URL_RE.test(image_url)) {
    return { error: "The photo link must be a picture address from universedirect.co.za (https://www.universedirect.co.za/wp-content/uploads/...)." };
  }

  return {
    value: {
      model,
      cpu: text(b.cpu, 80),
      ram: text(b.ram, 40),
      storage: text(b.storage, 60),
      screen: text(b.screen, 60),
      unit_condition,
      supplier: text(b.supplier, 80) || "Universe Direct",
      supplier_price_excl_vat: sp.value,
      our_price_excl_vat: op.value,
      source_ref: text(b.source_ref, 200),
      source_url,
      image_url,
      first_seen,
      status,
      notes: text(b.notes, 1000),
    },
  };
};

const parseId = (url) => {
  const raw = url.searchParams.get("id");
  if (!raw || !/^\d{1,9}$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 ? n : null;
};

// getDb is injectable so the logic can be tested against a local Postgres.
export const createHandler = (getDb) => async (req) => {
  const auth = checkAuth(req);
  if (auth === "unset") return json({ error: "The staff area is not set up yet." }, 503);
  if (auth !== "ok") {
    return json({ error: "Staff login required." }, 401);
  }

  const method = req.method.toUpperCase();
  if (!["GET", "POST", "PUT", "DELETE"].includes(method)) return json({ error: "Method not allowed." }, 405, { Allow: "GET, POST, PUT, DELETE" });

  if (method !== "GET") {
    if (req.headers.get("x-requested-with") !== "pns-staff") return json({ error: "Request not allowed." }, 403);
    if (method !== "DELETE" && !(req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
      return json({ error: "Send JSON." }, 415);
    }
  }

  const url = new URL(req.url);

  try {
    const db = getDb();

    if (method === "GET") {
      const status = url.searchParams.get("status");
      if (status && !STATUSES.includes(status)) return json({ error: "Unknown status." }, 400);
      const rows = await db.sql`
        SELECT id::int AS id, model, cpu, ram, storage, screen, unit_condition, supplier,
               supplier_price_excl_vat::float8 AS supplier_price_excl_vat,
               our_price_excl_vat::float8 AS our_price_excl_vat,
               source_ref, source_url, image_url, first_seen::text AS first_seen, status, notes,
               created_at, updated_at
        FROM dell_offers
        WHERE (${status || null}::text IS NULL OR status = ${status || null}::text)
        ORDER BY first_seen DESC, id DESC
        LIMIT 500`;
      return json({ offers: rows });
    }

    if (method === "DELETE") {
      const id = parseId(url);
      if (!id) return json({ error: "A valid id is needed." }, 400);
      const rows = await db.sql`DELETE FROM dell_offers WHERE id = ${id} RETURNING id::int AS id`;
      return rows.length ? json({ deleted: rows[0].id }) : json({ error: "Offer not found." }, 404);
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: "Request too large." }, 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch (_) {
      return json({ error: "That was not valid JSON." }, 400);
    }
    const checked = cleanOffer(body);
    if (checked.error) return json({ error: checked.error }, 400);
    const v = checked.value;

    if (method === "POST") {
      const rows = await db.sql`
        INSERT INTO dell_offers
          (model, cpu, ram, storage, screen, unit_condition, supplier,
           supplier_price_excl_vat, our_price_excl_vat, source_ref, source_url, image_url, first_seen, status, notes)
        VALUES
          (${v.model}, ${v.cpu}, ${v.ram}, ${v.storage}, ${v.screen}, ${v.unit_condition}, ${v.supplier},
           ${v.supplier_price_excl_vat}, ${v.our_price_excl_vat}, ${v.source_ref}, ${v.source_url}, ${v.image_url},
           COALESCE(${v.first_seen}::date, CURRENT_DATE), ${v.status}, ${v.notes})
        RETURNING id::int AS id, model, cpu, ram, storage, screen, unit_condition, supplier,
               supplier_price_excl_vat::float8 AS supplier_price_excl_vat,
               our_price_excl_vat::float8 AS our_price_excl_vat,
               source_ref, source_url, image_url, first_seen::text AS first_seen, status, notes,
               created_at, updated_at`;
      return json({ offer: rows[0] }, 201);
    }

    // PUT: replace every editable field of one offer.
    const id = parseId(url);
    if (!id) return json({ error: "A valid id is needed." }, 400);
    const rows = await db.sql`
      UPDATE dell_offers SET
        model = ${v.model}, cpu = ${v.cpu}, ram = ${v.ram}, storage = ${v.storage}, screen = ${v.screen},
        unit_condition = ${v.unit_condition}, supplier = ${v.supplier},
        supplier_price_excl_vat = ${v.supplier_price_excl_vat}, our_price_excl_vat = ${v.our_price_excl_vat},
        source_ref = ${v.source_ref}, source_url = ${v.source_url},
        image_url = ${v.image_url}, image_checked_at = CASE WHEN ${v.image_url}::text IS DISTINCT FROM image_url THEN NULL ELSE image_checked_at END,
        first_seen = COALESCE(${v.first_seen}::date, first_seen),
        status = ${v.status}, notes = ${v.notes}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id::int AS id, model, cpu, ram, storage, screen, unit_condition, supplier,
             supplier_price_excl_vat::float8 AS supplier_price_excl_vat,
             our_price_excl_vat::float8 AS our_price_excl_vat,
             source_ref, source_url, image_url, first_seen::text AS first_seen, status, notes,
             created_at, updated_at`;
    return rows.length ? json({ offer: rows[0] }) : json({ error: "Offer not found." }, 404);
  } catch (err) {
    if (err && err.code === "23505") return json({ error: "An offer with that source reference is already saved." }, 409);
    if (err && err.name === "MissingDatabaseConnectionError") {
      return json({ error: "The database is not connected to this site yet." }, 503);
    }
    console.error("dell-offers error:", err && err.message ? err.message : err);
    return json({ error: "Something went wrong saving that. Please try again." }, 500);
  }
};

export default createHandler(() => getDatabase());
