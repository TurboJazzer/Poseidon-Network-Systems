// Staff-only: the finished Poseidon Network website picture for a Dell offer (/staff/api/dell-offers-card).
// The staff page builds the picture in the browser (product cut out of the supplier flyer, Poseidon logo added)
// and saves it here as a JPEG. GET returns it, PUT saves it, DELETE removes it (which also takes the offer off the website).
import { getDatabase } from "@netlify/database";
import { json, checkAuth } from "./dell-offers.mjs";

const MAX_B64 = 900 * 1024; // base64 characters; a 1200x900 JPEG is normally 80-200 KB
const MAX_BODY = MAX_B64 + 2000;

const isJpeg = (buf) => buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

export const createCardHandler = (getDb) => async (req) => {
  const auth = checkAuth(req);
  if (auth === "unset") return json({ error: "The staff area is not set up yet." }, 503);
  if (auth !== "ok") return json({ error: "Staff login required." }, 401);

  const method = req.method.toUpperCase();
  if (!["GET", "PUT", "DELETE"].includes(method)) return json({ error: "Method not allowed." }, 405, { Allow: "GET, PUT, DELETE" });
  if (method !== "GET") {
    if (req.headers.get("x-requested-with") !== "pns-staff") return json({ error: "Request not allowed." }, 403);
    if (method === "PUT" && !(req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
      return json({ error: "Send JSON." }, 415);
    }
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("id");
  if (!raw || !/^\d{1,9}$/.test(raw) || Number(raw) < 1) return json({ error: "A valid id is needed." }, 400);
  const id = Number(raw);

  try {
    const db = getDb();

    if (method === "GET") {
      const rows = await db.sql`SELECT card_image FROM dell_offers WHERE id = ${id}`;
      if (!rows.length || !rows[0].card_image) return json({ error: "No website picture yet." }, 404);
      const headers = { "Content-Type": "image/jpeg", "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow" };
      if (url.searchParams.get("download") === "1") headers["Content-Disposition"] = `attachment; filename="PNS_dell_offer_${id}_flyer.jpg"`;
      return new Response(Buffer.from(rows[0].card_image, "base64"), { status: 200, headers });
    }

    if (method === "DELETE") {
      const rows = await db.sql`
        UPDATE dell_offers SET card_image = NULL, card_image_at = NULL, photo_ok = FALSE, published = FALSE, updated_at = NOW()
        WHERE id = ${id} RETURNING id::int AS id`;
      return rows.length ? json({ removed: rows[0].id }) : json({ error: "Offer not found." }, 404);
    }

    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: "That picture is too large." }, 413);
    let body;
    try { body = JSON.parse(text); } catch (_) { return json({ error: "That was not valid JSON." }, 400); }
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(body && typeof body.image === "string" ? body.image : "");
    if (!m || m[1].length > MAX_B64) return json({ error: "Send the picture as a JPEG." }, 400);
    const buf = Buffer.from(m[1], "base64");
    if (!isJpeg(buf)) return json({ error: "That is not a JPEG picture." }, 400);

    const rows = await db.sql`
      UPDATE dell_offers SET card_image = ${m[1]}, card_image_at = NOW(), photo_ok = TRUE, updated_at = NOW()
      WHERE id = ${id} RETURNING id::int AS id`;
    return rows.length ? json({ saved: rows[0].id }) : json({ error: "Offer not found." }, 404);
  } catch (err) {
    if (err && err.name === "MissingDatabaseConnectionError") return json({ error: "The database is not connected to this site yet." }, 503);
    console.error("dell-offers-card error:", err && err.message ? err.message : err);
    return json({ error: "Something went wrong saving the picture." }, 500);
  }
};

export default createCardHandler(() => getDatabase());
