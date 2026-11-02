// PUBLIC list of the Dell offers staff have published to the website (/api/dell-listings).
// The refurbished Dell page calls this and draws a card for each one.
//
// Only offers that are published AND status "listed" are returned, and only public fields:
// model, specs, condition, availability, public description, our price. Supplier price, margin, internal
// notes, email links and references are never sent.
// stock: staff edits (price, stock status, hidden) to the fixed cards already written in the page.
// ?photo=<id> returns the finished Poseidon website picture made on the staff page (never the supplier flyer).
import { getDatabase } from "@netlify/database";


const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=120", ...extra },
  });

export const createListingsHandler = (getDb, fetchFn = fetch) => async (req) => {
  if (req.method.toUpperCase() !== "GET") return json({ error: "Method not allowed." }, 405, { Allow: "GET", "Cache-Control": "no-store" });
  const url = new URL(req.url);
  try {
    const db = getDb();

    const photo = url.searchParams.get("photo");
    if (photo !== null) {
      if (!/^\d{1,9}$/.test(photo) || Number(photo) < 1) return json({ error: "Not found." }, 404, { "Cache-Control": "no-store" });
      const rows = await db.sql`
        SELECT card_image FROM dell_offers
        WHERE id = ${Number(photo)} AND published AND status = 'listed' AND photo_ok AND card_image IS NOT NULL`;
      const b64 = rows[0] && rows[0].card_image;
      if (!b64) return json({ error: "Not found." }, 404, { "Cache-Control": "no-store" });
      const buf = Buffer.from(b64, "base64");
      if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return json({ error: "Not found." }, 404, { "Cache-Control": "no-store" });
      return new Response(buf, {
        status: 200,
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" },
      });
    }

    const rows = await db.sql`
      SELECT id::int AS id, model, cpu, ram, storage, screen, unit_condition, availability, website_text,
             our_price_excl_vat::float8 AS price_excl_vat, (photo_ok AND card_image IS NOT NULL) AS has_photo, EXTRACT(EPOCH FROM card_image_at)::int AS pv
      FROM dell_offers
      WHERE published AND status = 'listed' AND our_price_excl_vat IS NOT NULL
      ORDER BY updated_at DESC, id DESC
      LIMIT 60`;
    const stock = await db.sql`SELECT card_key AS key, price_excl_vat::float8 AS price_excl_vat, availability, hidden, description FROM website_stock`;
    return json({ offers: rows, stock });
  } catch (err) {
    console.error("dell-listings error:", err && err.message ? err.message : err);
    return json({ offers: [] }, 200, { "Cache-Control": "no-store" });
  }
};

export default createListingsHandler(() => getDatabase());
