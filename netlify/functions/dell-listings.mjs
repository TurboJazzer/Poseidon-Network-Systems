// PUBLIC list of the Dell offers staff have published to the website (/api/dell-listings).
// The refurbished Dell page calls this and draws a card for each one.
//
// Only offers that are published AND status "listed" are returned, and only public fields:
// model, specs, condition, availability, public description, our price. Supplier price, margin, internal
// notes, email links and references are never sent.
// ?photo=<id> returns the photo, only when staff ticked "photo is fine for the website".
import { getDatabase } from "@netlify/database";
import { IMAGE_URL_RE } from "./dell-offers.mjs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const MAX_IMAGE = 8 * 1024 * 1024;

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
        SELECT image_url FROM dell_offers
        WHERE id = ${Number(photo)} AND published AND status = 'listed' AND photo_ok AND image_url IS NOT NULL`;
      const img = rows[0] && rows[0].image_url;
      if (!img || !IMAGE_URL_RE.test(img)) return json({ error: "Not found." }, 404, { "Cache-Control": "no-store" });
      const res = await fetchFn(img, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) return json({ error: "Not found." }, 404, { "Cache-Control": "no-store" });
      const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!/^image\/(png|jpeg|webp|gif)$/.test(type)) return json({ error: "Not found." }, 404, { "Cache-Control": "no-store" });
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_IMAGE) return json({ error: "Not found." }, 404, { "Cache-Control": "no-store" });
      return new Response(buf, {
        status: 200,
        headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" },
      });
    }

    const rows = await db.sql`
      SELECT id::int AS id, model, cpu, ram, storage, screen, unit_condition, availability, website_text,
             our_price_excl_vat::float8 AS price_excl_vat, photo_ok AND image_url IS NOT NULL AS has_photo
      FROM dell_offers
      WHERE published AND status = 'listed' AND our_price_excl_vat IS NOT NULL
      ORDER BY updated_at DESC, id DESC
      LIMIT 60`;
    return json({ offers: rows });
  } catch (err) {
    console.error("dell-listings error:", err && err.message ? err.message : err);
    return json({ offers: [] }, 200, { "Cache-Control": "no-store" });
  }
};

export default createListingsHandler(() => getDatabase());
