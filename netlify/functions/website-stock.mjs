// Staff-only: edit price, stock status and visibility of the fixed cards on refurbished-dell-equipment.html
// (/staff/api/website-stock). Changes go live on the public page straight away; no redeploy.
//  GET             -> { items: [{ key, price_excl_vat, availability, hidden, updated_at }] }
//  PUT ?key=<key>  -> body { price_excl_vat, availability, hidden, description } (price, availability and description may be null = leave as written)
//  DELETE ?key=    -> puts the card back exactly as written in the page
import { getDatabase } from "@netlify/database";
import { json, checkAuth } from "./dell-offers.mjs";

const AVAIL = ["in_stock", "coming_soon", "to_order"];
const KEY_RE = /^[a-z0-9-]{1,60}$/;
const MAX_BODY = 2000;

export const cleanStock = (b) => {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { error: "Send the change as a JSON object." };
  let price = null;
  if (b.price_excl_vat !== undefined && b.price_excl_vat !== null && b.price_excl_vat !== "") {
    const n = typeof b.price_excl_vat === "number" ? b.price_excl_vat : Number(String(b.price_excl_vat).replace(/[\s,]/g, ""));
    if (!Number.isFinite(n) || n < 0 || n > 10000000) return { error: "The price must be a number from 0 to 10,000,000." };
    price = Math.round(n * 100) / 100;
  }
  let availability = null;
  if (b.availability !== undefined && b.availability !== null && b.availability !== "") {
    if (!AVAIL.includes(b.availability)) return { error: "Stock status must be in stock, coming soon or available to order." };
    availability = b.availability;
  }
  let description = null;
  if (b.description !== undefined && b.description !== null) {
    const t = String(b.description).trim();
    if (t.length > 300) return { error: "The description can be up to 300 characters." };
    description = t || null;
  }
  const hidden = b.hidden === true || b.hidden === "true";
  return { value: { price_excl_vat: price, availability, hidden, description } };
};

export const createStockHandler = (getDb) => async (req) => {
  const auth = checkAuth(req);
  if (auth === "unset") return json({ error: "The staff area is not set up yet." }, 503);
  if (auth !== "ok") return json({ error: "Staff login required." }, 401);

  const method = req.method.toUpperCase();
  if (!["GET", "PUT", "DELETE"].includes(method)) return json({ error: "Method not allowed." }, 405, { Allow: "GET, PUT, DELETE" });
  if (method !== "GET") {
    if (req.headers.get("x-requested-with") !== "pns-staff") return json({ error: "Request not allowed." }, 403);
    if (method === "PUT" && !(req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return json({ error: "Send JSON." }, 415);
  }

  const url = new URL(req.url);
  try {
    const db = getDb();
    if (method === "GET") {
      const rows = await db.sql`SELECT card_key AS key, price_excl_vat::float8 AS price_excl_vat, availability, hidden, description, updated_at FROM website_stock ORDER BY card_key`;
      return json({ items: rows });
    }
    const key = url.searchParams.get("key");
    if (!key || !KEY_RE.test(key)) return json({ error: "A valid card key is needed." }, 400);

    if (method === "DELETE") {
      const rows = await db.sql`DELETE FROM website_stock WHERE card_key = ${key} RETURNING card_key AS key`;
      return json({ reset: key, existed: rows.length > 0 });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: "Request too large." }, 413);
    let body;
    try { body = JSON.parse(raw); } catch (_) { return json({ error: "That was not valid JSON." }, 400); }
    const c = cleanStock(body);
    if (c.error) return json({ error: c.error }, 400);
    const v = c.value;
    const rows = await db.sql`
      INSERT INTO website_stock (card_key, price_excl_vat, availability, hidden, description, updated_at)
      VALUES (${key}, ${v.price_excl_vat}, ${v.availability}, ${v.hidden}, ${v.description}, NOW())
      ON CONFLICT (card_key) DO UPDATE SET price_excl_vat = EXCLUDED.price_excl_vat, availability = EXCLUDED.availability,
        hidden = EXCLUDED.hidden, description = EXCLUDED.description, updated_at = NOW()
      RETURNING card_key AS key, price_excl_vat::float8 AS price_excl_vat, availability, hidden, description, updated_at`;
    return json({ item: rows[0] });
  } catch (err) {
    if (err && err.name === "MissingDatabaseConnectionError") return json({ error: "The database is not connected to this site yet." }, 503);
    console.error("website-stock error:", err && err.message ? err.message : err);
    return json({ error: "Something went wrong saving that. Please try again." }, 500);
  }
};

export default createStockHandler(() => getDatabase());
